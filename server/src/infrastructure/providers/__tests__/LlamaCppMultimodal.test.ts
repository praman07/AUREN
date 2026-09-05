import { LlamaCppEmbeddingProvider } from '../adapters/embedding/LlamaCppEmbeddingProvider';
import { LlamaCppVisionProvider } from '../adapters/vision/LlamaCppVisionProvider';
import { LlamaCppChatProvider } from '../adapters/chat/LlamaCppChatProvider';
import { ProviderFactory } from '../registry/ProviderFactory';
import { AIGateway } from '../../gateway/AIGateway';
import { AICapability } from '../../gateway/types';

describe('LlamaCpp Multimodal Architecture Suite', () => {

  describe('LlamaCppEmbeddingProvider', () => {
    it('should initialize with correct default dimension of 1024 for Qwen3-0.6B', () => {
      const provider = new LlamaCppEmbeddingProvider('http://127.0.0.1:8081', 'Qwen3-Embedding-0.6B-Q8_0.gguf', 1024);
      expect(provider.getDimensions()).toBe(1024);
    });

    it('should allow custom dimension override', () => {
      const provider = new LlamaCppEmbeddingProvider('http://127.0.0.1:8081', 'Qwen3-Embedding-8B-Q4_K_M.gguf', 4096);
      expect(provider.getDimensions()).toBe(4096);
    });
  });

  describe('LlamaCppVisionProvider', () => {
    it('should construct instance without throwing', () => {
      const provider = new LlamaCppVisionProvider(
        'http://127.0.0.1:8082',
        'qwen2.5-vl-7b-instruct-q4_k_m.gguf',
        'mmproj-Qwen2.5-VL-7B-Instruct-f16.gguf'
      );
      expect(provider).toBeDefined();
    });
  });

  describe('ProviderFactory Integration', () => {
    let factory: ProviderFactory;

    beforeEach(() => {
      factory = new ProviderFactory();
    });

    it('should instantiate LlamaCppEmbeddingProvider via getEmbeddingProvider', () => {
      const provider = factory.getEmbeddingProvider('llamacpp');
      expect(provider).toBeInstanceOf(LlamaCppEmbeddingProvider);
      expect(provider.getDimensions()).toBeDefined();
    });

    it('should instantiate LlamaCppVisionProvider via getVisionProvider', () => {
      const provider = factory.getVisionProvider('llamacpp');
      expect(provider).toBeInstanceOf(LlamaCppVisionProvider);
    });

    it('should instantiate LlamaCppChatProvider via getChatProvider', () => {
      const provider = factory.getChatProvider('llamacpp');
      expect(provider).toBeInstanceOf(LlamaCppChatProvider);
    });
  });

  describe('LlamaCppChatProvider FAST vs DEEP Model Selection', () => {
    it('should select FAST model config when requested', () => {
      process.env.LLAMACPP_MODEL_FAST = 'Qwen3-8B-Q4_K_M.gguf';
      const provider = new LlamaCppChatProvider();
      const config = provider.getModelConfig({ modelName: 'FAST' });
      expect(config.model).toBe('Qwen3-8B-Q4_K_M.gguf');
    });

    it('should select DEEP model config when requested', () => {
      process.env.LLAMACPP_MODEL_DEEP = 'Qwen2.5-14B-Instruct-Q4_K_M.gguf';
      const provider = new LlamaCppChatProvider();
      const config = provider.getModelConfig({ modelName: 'DEEP' });
      expect(config.model).toBe('Qwen2.5-14B-Instruct-Q4_K_M.gguf');
    });
  });

  describe('AIGateway Vision & Embedding Delegation', () => {
    let gateway: AIGateway;

    beforeEach(() => {
      gateway = new AIGateway();
    });

    it('should have embed and analyzeImage methods defined', () => {
      expect(typeof gateway.embed).toBe('function');
      expect(typeof gateway.analyzeImage).toBe('function');
    });
  });
});
