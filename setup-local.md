# AUREN Local AI Setup

AUREN is designed to provide an enterprise-grade Knowledge OS that can run entirely on your local infrastructure. This ensures that your organizational knowledge remains private and secure without relying on external APIs.

## 1. Install Ollama

AUREN uses **Ollama** as the local generation engine for Retrieval-Augmented Generation (RAG).

**Windows:**
1. Download Ollama from [https://ollama.com/download/windows](https://ollama.com/download/windows)
2. Install the application.

**macOS:**
1. Download Ollama from [https://ollama.com/download/mac](https://ollama.com/download/mac)
2. Install the application.

**Linux:**
Run the following command in your terminal:
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

## 2. Pull Lightweight Models

Once Ollama is installed and running, open your terminal/command prompt and pull the recommended lightweight models. These models provide the best balance of instruction following, RAG comprehension, and speed on standard hardware.

```bash
ollama run qwen2.5:3b
ollama run gemma:2b
```

## 3. Run the Benchmark & Diagnostics

AUREN includes a built-in benchmark script that connects to your local Ollama instance, profiles your hardware, and tests the models against a real RAG pipeline to recommend the optimal configuration.

From the `server` directory, run:

```bash
npx ts-node src/scripts/benchmark_ollama.ts
```

This script will:
1. Detect your OS and RAM/VRAM availability.
2. Confirm Ollama is reachable.
3. List your installed models.
4. Execute real grounded semantic queries against the models.
5. Report the Time-to-First-Token (TTFT), total response time, and hallucination checks.

Once this passes, your local AUREN Knowledge Core is fully configured and ready for the MVP!
