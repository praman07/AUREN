import { z } from 'zod';
import * as dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  CORS_ORIGIN: z.string().default('http://localhost:5174'),
  OLLAMA_API_URL: z.string().default('http://localhost:11434'),
  OLLAMA_MODEL: z.string().default('qwen2.5:14b'),
  OLLAMA_EMBEDDING_MODEL: z.string().default('qwen3-embedding:8b'),
  LLM_PROVIDER: z.string().default('ollama'),
  LLM_BASE_URL: z.string().optional(),
  LLAMACPP_BASE_URL: z.string().optional(),
  LLAMACPP_MODEL: z.string().optional(),
  LLAMACPP_MODEL_FAST: z.string().optional(),
  LLAMACPP_NUM_CTX: z.coerce.number().optional(),
  EMBEDDING_PROVIDER: z.string().default('ollama'),
  OLLAMA_EMBEDDING_URL: z.string().optional(),
  QDRANT_URL: z.string().default('http://localhost:6333'),
  SESSION_TTL_HOURS: z.coerce.number().default(168),
  CLERK_SECRET_KEY: z.string().optional(),
  CLERK_PUBLISHABLE_KEY: z.string().optional(),
  ENCRYPTION_KEY: z.string().optional(),
  DATABASE_URL: z.string().optional(),
  REDIS_URL: z.string().optional(),
  // Web search pipeline
  SEARXNG_URL: z.string().optional(),                          // e.g. http://localhost:8080
  CRAWL4AI_URL: z.string().optional(),                         // e.g. http://localhost:11235
  CRAWL4AI_API_TOKEN: z.string().optional(),

  WEB_SEARCH_RESULTS: z.coerce.number().default(8),            // # of search results
  WEB_MAX_CRAWL_URLS: z.coerce.number().default(4),            // # of URLs to crawl
  WEB_MAX_CONTENT_CHARS: z.coerce.number().default(6000),      // max chars per extracted page
  WEB_CRAWL_TIMEOUT_MS: z.coerce.number().default(12000),      // crawl timeout per URL
});

const parseEnv = () => {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error('❌ Invalid environment variables:', parsed.error.format());
    process.exit(1);
  }
  return parsed.data;
};

export const env = parseEnv();
