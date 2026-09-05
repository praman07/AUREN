import base64
import json
import urllib.request

# 1. CHAT SMOKE TEST
chat_url = "http://127.0.0.1:8083/v1/chat/completions"
chat_models_url = "http://127.0.0.1:8083/v1/models"

chat_model_id = ""
try:
    with urllib.request.urlopen(chat_models_url) as resp:
        mdata = json.loads(resp.read().decode("utf-8"))
        chat_model_id = mdata["data"][0]["id"]
except Exception as e:
    chat_model_id = f"error: {e}"

chat_payload = {
    "messages": [{"role": "user", "content": "Reply with exactly: CHAT_OK"}],
    "temperature": 0.0,
    "max_tokens": 100
}

chat_req = urllib.request.Request(chat_url, data=json.dumps(chat_payload).encode("utf-8"), headers={"Content-Type": "application/json"})
chat_response_text = ""
chat_status = "FAIL"

try:
    with urllib.request.urlopen(chat_req) as resp:
        cdata = json.loads(resp.read().decode("utf-8"))
        content = cdata["choices"][0]["message"].get("content", "")
        reasoning = cdata["choices"][0]["message"].get("reasoning_content", "")
        chat_response_text = content.strip() or reasoning.strip()
        if "CHAT_OK" in content or "CHAT_OK" in chat_response_text:
            chat_status = "PASS"
except Exception as e:
    chat_response_text = f"Error: {e}"

# 2. EMBEDDING SMOKE TEST
embed_url = "http://127.0.0.1:8081/v1/embeddings"
embed_models_url = "http://127.0.0.1:8081/v1/models"

embed_model_id = ""
try:
    with urllib.request.urlopen(embed_models_url) as resp:
        mdata = json.loads(resp.read().decode("utf-8"))
        embed_model_id = mdata["data"][0]["id"]
except Exception as e:
    embed_model_id = f"error: {e}"

embed_payload = {
    "input": "AUREN enterprise knowledge assistant test"
}

embed_req = urllib.request.Request(embed_url, data=json.dumps(embed_payload).encode("utf-8"), headers={"Content-Type": "application/json"})
embed_dim = 0
embed_status = "FAIL"

try:
    with urllib.request.urlopen(embed_req) as resp:
        edata = json.loads(resp.read().decode("utf-8"))
        emb = edata["data"][0]["embedding"]
        if isinstance(emb, list) and len(emb) > 0 and isinstance(emb[0], (int, float)):
            embed_dim = len(emb)
            embed_status = "PASS"
except Exception as e:
    embed_model_id += f" (Error: {e})"

# 3. VISION SMOKE TEST
vision_health_url = "http://127.0.0.1:8082/health"
vision_models_url = "http://127.0.0.1:8082/v1/models"
vision_chat_url = "http://127.0.0.1:8082/v1/chat/completions"

vision_health = "FAIL"
try:
    with urllib.request.urlopen(vision_health_url) as resp:
        if resp.status == 200:
            vision_health = "PASS"
except Exception:
    pass

vision_model_id = ""
try:
    with urllib.request.urlopen(vision_models_url) as resp:
        mdata = json.loads(resp.read().decode("utf-8"))
        vision_model_id = mdata["data"][0]["id"]
except Exception as e:
    vision_model_id = f"error: {e}"

# Load test image
with open("server/models/test_vision.png", "rb") as f:
    img_b64 = base64.b64encode(f.read()).decode("utf-8")

vision_payload = {
    "model": "qwen2.5-vl-7b-instruct-q4_k_m.gguf",
    "messages": [
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "What text is visible in this image? Reply with only the text."
                },
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/png;base64,{img_b64}"
                    }
                }
            ]
        }
    ],
    "temperature": 0.0,
    "max_tokens": 50
}

vision_req = urllib.request.Request(vision_chat_url, data=json.dumps(vision_payload).encode("utf-8"), headers={"Content-Type": "application/json"})
vision_response_text = ""
vision_status = "FAIL"
image_understanding = "FAIL"

try:
    with urllib.request.urlopen(vision_req) as resp:
        vdata = json.loads(resp.read().decode("utf-8"))
        vision_response_text = vdata["choices"][0]["message"].get("content", "").strip()
        if "AUREN VISION TEST" in vision_response_text:
            image_understanding = "PASS"
            vision_status = "PASS"
except Exception as e:
    vision_response_text = f"Error: {e}"

# Check mmproj loaded from log
mmproj_loaded = "NO"
try:
    with open("server/logs/llama_vision.log", "r", encoding="utf-8", errors="ignore") as f:
        log_content = f.read()
        if "loaded multimodal model" in log_content:
            mmproj_loaded = "YES"
except Exception:
    pass

all_three = "PASS" if (chat_status == "PASS" and embed_status == "PASS" and vision_status == "PASS") else "FAIL"

print("\n=== SMOKE TEST RESULTS ===")
print(f"CHAT: {chat_status}")
print(f"  Model: {chat_model_id}")
print(f"  Port: 8083")
print(f"  Response: {chat_response_text}")
print()
print(f"EMBEDDING: {embed_status}")
print(f"  Model: {embed_model_id}")
print(f"  Port: 8081")
print(f"  Dimension: {embed_dim}")
print()
print(f"VISION: {vision_status}")
print(f"  Model: {vision_model_id}")
print(f"  Port: 8082")
print(f"  mmproj loaded: {mmproj_loaded}")
print(f"  Image understanding: {image_understanding}")
print(f"  Response: {vision_response_text}")
print()
print(f"ALL THREE: {all_three}")
