import { z } from 'zod';
import * as dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  OLLAMA_API_URL: z.string().default('http://localhost:11434'),
  OLLAMA_MODEL: z.string().default('qwen2.5:14b'),
  QDRANT_URL: z.string().default('http://localhost:6333'),
  CLERK_SECRET_KEY: z.string().optional(),
  CLERK_PUBLISHABLE_KEY: z.string().optional(),
  DEV_AUTH_MOCK: z.string().optional(),
  // Future: DATABASE_URL, REDIS_URL, etc.
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
