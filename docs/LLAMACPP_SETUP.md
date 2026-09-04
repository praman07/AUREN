# AUREN — llama.cpp (`llama-server`) Setup Guide

This guide explains how to configure and run `llama.cpp` (`llama-server`) as an alternative conversational LLM backend alongside Ollama for controlled A/B performance and latency comparisons.

---

## 1. Prerequisites & Manual Installation

`llama.cpp` is **not** bundled or automatically installed by AUREN. You must download or build `llama-server` separately:

- **Official Binaries / Release Page**: [llama.cpp GitHub Releases](https://github.com/ggerganov/llama.cpp/releases)
- **Windows Pre-built Executable**: Download `llama-<version>-bin-win-cuda-x64.zip` (for NVIDIA GPUs) or `llama-<version>-bin-win-avx2-x64.zip` (for CPU).

---

## 2. Required GGUF Models

To perform valid A/B comparison with AUREN's default Ollama setups, obtain the equivalent GGUF model files:

| Execution Mode | Ollama Baseline Tag | Required GGUF Model File |
| :--- | :--- | :--- |
| **DEEP (Default)** | `qwen2.5:14b` | `qwen2.5-14b-instruct-q4_k_m.gguf` |
| **FAST** | `qwen3.5:9b-q4_K_M` | `qwen3.5-9b-instruct-q4_k_m.gguf` (or `qwen2.5-7b-instruct-q4_k_m.gguf`) |

> **Note**: Do not automatically rename GGUF files. Set `LLAMACPP_MODEL` in `.env` if using custom file identifiers.

---

## 3. Starting `llama-server`

Run `llama-server` on your host or GPU instance.

### Example Startup Command (Windows / Linux)

```bash
# Start llama-server on port 8080 with 4096 context length and GPU offloading
llama-server \
  -m C:/models/qwen2.5-14b-instruct-q4_k_m.gguf \
  --port 8080 \
  --host 127.0.0.1 \
  -c 4096 \
  -ngl 99 \
  --alias qwen2.5:14b
```

### Expected Server Endpoint
- OpenAI-compatible chat endpoint: `http://127.0.0.1:8080/v1/chat/completions`

---

## 4. Switching AUREN Configuration

### To switch from Ollama → llama.cpp:

In `server/.env`:

```env
# Switch conversational backend to llama.cpp
LLM_PROVIDER=llamacpp
LLM_BASE_URL=http://127.0.0.1:8080

# Keep embeddings on Ollama (MANDATORY)
EMBEDDING_PROVIDER=ollama
OLLAMA_EMBEDDING_URL=http://127.0.0.1:11434
```

Restart the server:
```bash
npm run dev
```

### To switch back from llama.cpp → Ollama:

In `server/.env`:

```env
LLM_PROVIDER=ollama
LLM_BASE_URL=http://127.0.0.1:11434
```

Restart the server:
```bash
npm run dev
```

---

## 5. Notes & Verification Checklist

- **Stateless Isolation**: Requests remain completely isolated and request-scoped across backends.
- **Fail-Fast**: If `LLM_PROVIDER=llamacpp` is active and `llama-server` is not running at `LLM_BASE_URL`, AUREN will fail clearly without falling back to Ollama.
- **Embeddings**: `EMBEDDING_PROVIDER` remains `ollama` using `qwen3-embedding:8b`. Document embeddings are never routed to `llama.cpp`.
