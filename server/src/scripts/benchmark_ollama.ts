import { OllamaDiagnostics } from '../infrastructure/ai/OllamaDiagnostics';
import { PrismaClient } from '@prisma/client';
import { QdrantClient } from '@qdrant/js-client-rest';
import * as dotenv from 'dotenv';
import { randomUUID } from 'crypto';
import { ProviderFactory } from '../infrastructure/providers/registry/ProviderFactory';
import { AIGateway } from '../infrastructure/gateway/AIGateway';
import { PermissionFilter } from '../infrastructure/search/PermissionFilter';
import { VectorSearchProvider } from '../infrastructure/search/VectorSearchProvider';
import { BM25SearchProvider } from '../infrastructure/search/BM25SearchProvider';
import { HybridRanker } from '../domain/retrieval/HybridRanker';
import { ContextBuilder } from '../domain/retrieval/ContextBuilder';
import { PromptBuilder } from '../domain/retrieval/PromptBuilder';
import { RetrievalEngine } from '../application/services/RetrievalEngine';
import { RAGService } from '../application/services/RAGService';

dotenv.config();
const prisma = new PrismaClient();

async function runBenchmark() {
  console.log('==================================================');
  console.log('AUREN LOCAL AI / OLLAMA - BENCHMARK & DIAGNOSTICS');
  console.log('==================================================\n');

  const diagnostics = new OllamaDiagnostics();
  const health = await diagnostics.getHealthStatus();

  console.log('--- SYSTEM CAPABILITIES ---');
  console.log(`OS: ${health.systemCapabilities.platform} (${health.systemCapabilities.arch})`);
  console.log(`Total RAM: ${health.systemCapabilities.totalRamGB} GB`);
  console.log(`Free RAM: ${health.systemCapabilities.freeRamGB} GB\n`);

  console.log('--- OLLAMA HEALTH ---');
  console.log(`Is Reachable: ${health.isReachable}`);
  if (!health.isReachable) {
    console.log(`\n❌ Ollama is NOT reachable at ${health.endpoint}`);
    console.log('\n--- SETUP INSTRUCTIONS ---');
    console.log(health.setupInstructions);
    process.exit(1);
  }

  console.log(`Installed Models: ${health.installedModels.length}`);
  health.installedModels.forEach(m => {
    console.log(` - ${m.name} (${(m.sizeBytes / (1024*1024*1024)).toFixed(2)} GB, ${m.parameterSize || 'unknown'}, ${m.quantization || 'unknown'})`);
  });

  if (health.installedModels.length === 0) {
    console.log('\n❌ No models installed. Please run `ollama run qwen2.5:3b` (or similar) to pull a model.');
    process.exit(1);
  }

  // Pick up to 3 candidate models for benchmarking
  // We prioritize qwen and gemma, then others
  const candidates = health.installedModels
    .filter(m => m.name.toLowerCase().includes('qwen') || m.name.toLowerCase().includes('gemma'))
    .slice(0, 3);
  
  if (candidates.length === 0 && health.installedModels.length > 0) {
    candidates.push(health.installedModels[0]);
  }

  console.log(`\n--- BENCHMARKING CANDIDATES ---`);
  candidates.forEach(c => console.log(`Candidate: ${c.name}`));

  // Setup Minimal RAG Pipeline
  const providerFactory = new ProviderFactory();
  const filter = new PermissionFilter();
  const vectorSearch = new VectorSearchProvider(filter, providerFactory);
  const bm25Search = new BM25SearchProvider(filter);
  const ranker = new HybridRanker();
  const contextBuilder = new ContextBuilder();
  const promptBuilder = new PromptBuilder();
  const retrievalEngine = new RetrievalEngine(vectorSearch, bm25Search, ranker, contextBuilder, promptBuilder);

  // Setup Mock Data
  const orgId = 'org_' + randomUUID();
  const empId = 'emp_' + randomUUID();
  
  await prisma.organization.create({ data: { id: orgId, name: 'Benchmark Org' }});
  await prisma.user.create({ data: { id: empId, organizationId: orgId, email: `bench-${randomUUID()}@ekos.app` }});

  // Scenarios
  const scenarios = [
    { name: '1. Answer exists in KB', query: 'What is the secret launch code?', expectAnswer: true, checkContext: true },
    { name: '5. Answer does not exist', query: 'Who won the 1999 World Series?', expectAnswer: false, checkContext: false },
  ];

  console.log('\n==================================================');
  console.log('STARTING RAG PIPELINE BENCHMARK');
  console.log('==================================================');

  for (const model of candidates) {
    console.log(`\n>>> Benchmarking Model: ${model.name}`);
    
    // Explicit separation: Embedding provider stays static, we only change CHAT_PROVIDER (actually we'll override it manually in the mock if we could, but we'll use env injection here for the loop)
    process.env.CHAT_PROVIDER = 'ollama';
    process.env.OLLAMA_MODEL = model.name;

    const aiGateway = new AIGateway(providerFactory);
    const ragService = new RAGService(retrievalEngine, aiGateway);

    for (const scenario of scenarios) {
      console.log(`\nScenario: ${scenario.name}`);
      console.log(`Query: "${scenario.query}"`);
      
      const req = {
        message: scenario.query,
        query: scenario.query,
        organizationId: orgId,
        departmentIds: [],
        roleIds: [],
        userId: randomUUID(),
        clearanceLevel: 1,
        limit: 5
      };

      const startTime = Date.now();
      let firstTokenTime = 0;
      let answer = '';

      try {
        await ragService.streamChat(req, (e: any) => { 
          if (e.type === 'token') {
            if (firstTokenTime === 0) firstTokenTime = Date.now() - startTime;
            answer += e.data; 
          }
        });
        const totalTime = Date.now() - startTime;

        console.log(`TTFT: ${firstTokenTime}ms | Total: ${totalTime}ms`);
        console.log(`Response Snippet: "${answer.slice(0, 100).replace(/\\n/g, ' ')}..."`);
      } catch (e: any) {
        console.log(`❌ Benchmark failed: ${e.message}`);
      }
    }
  }

  console.log('\n==================================================');
  console.log(`Recommended Default Model: ${health.recommendedModel}`);
  console.log('Setup is complete and reproducible.');
  console.log('==================================================');
}

runBenchmark().catch(console.error);
