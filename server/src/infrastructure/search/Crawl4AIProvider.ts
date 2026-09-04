/**
 * Crawl4AIProvider — Deep webpage content extraction
 *
 * Primary mode: HTTP calls to Crawl4AI REST service (when CRAWL4AI_URL is set)
 * Fallback mode: Direct Node.js HTTP fetch + HTML stripping (when Crawl4AI is offline)
 *
 * Environment vars:
 *   CRAWL4AI_URL          — URL of running Crawl4AI service (e.g. http://localhost:11235)
 *   WEB_CRAWL_TIMEOUT_MS  — per-URL crawl timeout in ms (default: 12000)
 *   WEB_MAX_CONTENT_CHARS — max extracted chars per page (default: 6000)
 */

import { extractMainTextFromHtml, fetchWithRetry } from './WebSearchProvider';

export interface CrawlResult {
  url: string;
  title: string;
  content: string;
  success: boolean;
  contentLength: number;
  source: 'crawl4ai' | 'direct_fetch' | 'snippet';
  error?: string;
}

const BINARY_EXTS = /\.(pdf|zip|gz|exe|apk|dmg|pkg|png|jpg|jpeg|gif|mp4|mp3|wav|svg|woff|woff2|ttf|eot|ico|webp)$/i;
const DEFAULT_TIMEOUT_MS = 12000;
const DEFAULT_MAX_CONTENT = 6000;

function getCrawl4AIURL(): string | null {
  return process.env.CRAWL4AI_URL?.trim() || null;
}

function getTimeoutMs(): number {
  return parseInt(process.env.WEB_CRAWL_TIMEOUT_MS || '') || DEFAULT_TIMEOUT_MS;
}

function getMaxContent(): number {
  return parseInt(process.env.WEB_MAX_CONTENT_CHARS || '') || DEFAULT_MAX_CONTENT;
}

function truncateContent(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars) + `\n...[content truncated at ${maxChars} chars]`;
}

/**
 * Crawl a URL via Crawl4AI REST API with retries
 */
async function crawlViaCrawl4AI(url: string, crawl4aiUrl: string, timeoutMs: number): Promise<{ content: string; title: string } | null> {
  try {
    const endpoint = `${crawl4aiUrl.replace(/\/$/, '')}/crawl`;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const token = process.env.CRAWL4AI_API_TOKEN?.trim();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetchWithRetry(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        urls: [url],
        word_count_threshold: 20,
        excluded_tags: ['nav', 'header', 'footer', 'aside', 'form', 'script', 'style', 'button', 'menu'],
        remove_overlay_elements: true,
        only_text: false,
      }),
      signal: AbortSignal.timeout(timeoutMs),
    }, 2, 400);

    if (!response.ok) return null;
    const data: any = await response.json();
    const result = data?.results?.[0] || data?.result;
    if (!result?.success) return null;

    const content = result.markdown_v2?.raw_markdown || result.markdown || result.cleaned_html || '';
    const title = result.metadata?.title || url;
    return content.length > 30 ? { content, title } : null;
  } catch {
    return null;
  }
}

/**
 * Crawl a URL via direct Node.js HTTP fetch + HTML stripping
 * Used when Crawl4AI service is unavailable
 */
async function crawlDirect(url: string, timeoutMs: number): Promise<{ content: string; title: string } | null> {
  try {
    const response = await fetchWithRetry(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
      },
      signal: AbortSignal.timeout(timeoutMs),
      redirect: 'follow',
    }, 1, 300);

    if (!response.ok) return null;

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('text/plain') && !contentType.includes('application/xhtml+xml')) {
      return null;
    }

    const html = await response.text();
    if (!html || html.length < 100) return null;

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : url;

    const content = extractMainTextFromHtml(html);
    return content.length > 50 ? { content, title } : null;
  } catch {
    return null;
  }
}

/**
 * Crawl a batch of URLs and extract their content.
 * Tries Crawl4AI service first, falls back to direct HTTP, and finally falls back to search snippet if provided.
 */
export async function crawlUrls(
  urls: string[],
  options?: { maxContent?: number; snippets?: Record<string, string>; timeoutMs?: number }
): Promise<CrawlResult[]> {
  const crawl4aiUrl = getCrawl4AIURL();
  const timeoutMs = options?.timeoutMs ?? getTimeoutMs();
  const maxContent = options?.maxContent ?? getMaxContent();

  // Deduplicate
  const uniqueUrls = [...new Set(urls.filter(u => {
    if (!u || !u.startsWith('http')) return false;
    if (BINARY_EXTS.test(u)) return false;
    return true;
  }))];

  console.log(`[Crawl4AIProvider] Crawling ${uniqueUrls.length} URLs (mode: ${crawl4aiUrl ? 'crawl4ai' : 'direct_fetch'}, timeout: ${timeoutMs}ms)`);

  const results: CrawlResult[] = await Promise.all(
    uniqueUrls.map(async (url): Promise<CrawlResult> => {
      try {
        // Try Crawl4AI service first
        if (crawl4aiUrl) {
          const r = await crawlViaCrawl4AI(url, crawl4aiUrl, timeoutMs);
          if (r) {
            const content = truncateContent(r.content, maxContent);
            console.log(`[Crawl4AIProvider] ✓ crawl4ai extracted ${content.length} chars from ${url}`);
            return { url, title: r.title, content, success: true, contentLength: content.length, source: 'crawl4ai' };
          }
        }

        // Fallback: direct HTTP fetch
        const r = await crawlDirect(url, timeoutMs);
        if (r) {
          const content = truncateContent(r.content, maxContent);
          console.log(`[Crawl4AIProvider] ✓ direct_fetch extracted ${content.length} chars from ${url}`);
          return { url, title: r.title, content, success: true, contentLength: content.length, source: 'direct_fetch' };
        }

        // Fallback: snippet from search provider
        const snippet = options?.snippets?.[url];
        if (snippet && snippet.length > 10) {
          console.log(`[Crawl4AIProvider] ⚠ Fallback to snippet for ${url} (${snippet.length} chars)`);
          return { url, title: url, content: snippet, success: true, contentLength: snippet.length, source: 'snippet' };
        }

        console.log(`[Crawl4AIProvider] ✗ Failed to extract content from ${url}`);
        return { url, title: url, content: '', success: false, contentLength: 0, source: 'direct_fetch', error: 'No extractable content' };
      } catch (err: any) {
        // Fallback to snippet on error
        const snippet = options?.snippets?.[url];
        if (snippet && snippet.length > 10) {
          console.log(`[Crawl4AIProvider] ⚠ Fallback to snippet after crawl error on ${url}`);
          return { url, title: url, content: snippet, success: true, contentLength: snippet.length, source: 'snippet' };
        }
        console.log(`[Crawl4AIProvider] ✗ Error crawling ${url}: ${err.message}`);
        return { url, title: url, content: '', success: false, contentLength: 0, source: 'direct_fetch', error: err.message };
      }
    })
  );

  const successCount = results.filter(r => r.success).length;
  console.log(`[Crawl4AIProvider] Crawl complete: ${successCount}/${uniqueUrls.length} URLs successfully extracted`);

  return results;
}
