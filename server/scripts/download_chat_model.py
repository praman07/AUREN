import os
import sys
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor

MODELS = [
    {
        "name": "qwen3.5-2b.gguf",
        "url": "https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/qwen2.5-1.5b-instruct-q4_k_m.gguf",
    }
]

DEST_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "models"))
CHUNK_SIZE = 16 * 1024 * 1024  # 16 MB per chunk
NUM_WORKERS = 8

def get_file_size(url):
    req = urllib.request.Request(url, headers={"User-Agent": "AUREN-Downloader"}, method="HEAD")
    with urllib.request.urlopen(req) as resp:
        return int(resp.headers.get("Content-Length", 0))

def download_chunk(url, start, end, filepath):
    req = urllib.request.Request(url, headers={
        "User-Agent": "AUREN-Downloader",
        "Range": f"bytes={start}-{end}"
    })
    with urllib.request.urlopen(req) as resp:
        data = resp.read()
    with open(filepath, "r+b") as f:
        f.seek(start)
        f.write(data)
    return len(data)

def download_file(item):
    filename = item["name"]
    url = item["url"]
    filepath = os.path.join(DEST_DIR, filename)

    total_size = get_file_size(url)
    print(f"\n[Download] Starting {filename} ({total_size / (1024*1024):.1f} MB)...", flush=True)

    if os.path.exists(filepath) and os.path.getsize(filepath) == total_size:
        print(f"[Download] {filename} already fully downloaded!", flush=True)
        return

    # Pre-allocate file
    with open(filepath, "wb") as f:
        f.truncate(total_size)

    ranges = []
    for start in range(0, total_size, CHUNK_SIZE):
        end = min(start + CHUNK_SIZE - 1, total_size - 1)
        ranges.append((start, end))

    t0 = time.time()
    downloaded = 0
    with ThreadPoolExecutor(max_workers=NUM_WORKERS) as executor:
        futures = [executor.submit(download_chunk, url, s, e, filepath) for s, e in ranges]
        for idx, fut in enumerate(futures):
            downloaded += fut.result()
            elapsed = time.time() - t0
            speed = downloaded / (1024 * 1024 * elapsed) if elapsed > 0 else 0
            pct = (downloaded / total_size) * 100
            print(f"\r  [{filename}] {downloaded / (1024*1024):.1f}/{total_size / (1024*1024):.1f} MB ({pct:.1f}%) - {speed:.2f} MB/s", end="", flush=True)

    t1 = time.time()
    print(f"\n[Download] {filename} completed in {t1-t0:.1f}s!", flush=True)

def main():
    os.makedirs(DEST_DIR, exist_ok=True)
    for m in MODELS:
        download_file(m)
    print("\nAll chat model files downloaded successfully!", flush=True)

if __name__ == "__main__":
    main()
