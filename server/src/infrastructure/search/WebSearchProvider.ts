/**
 * WebSearchProvider — Self-hosted SearXNG pipeline
 *
 * AUREN uses a fully self-hosted, zero-cost, zero-external-API-key web search stack:
 *
 *   User Query → SearXNG (http://localhost:8080) → Crawl4AI (http://localhost:11235)
 *
 * There are NO fallbacks to public SearXNG instances, Brave Search, DuckDuckGo, or
 * any other external API. If the self-hosted SearXNG service is unavailable, the
 * pipeline reports a clear failure instead of silently degrading or hallucinating.
 *
 * Environment vars:
 *   SEARXNG_URL         — Required. Self-hosted SearXNG URL (default: http://localhost:8080)
 *   WEB_SEARCH_RESULTS  — Number of results to retrieve per query (default: 8)
 */

export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
  extractedContent?: string;
  timestamp?: string;
}

export interface IWebSearchProvider {
  search(query: string, maxResults?: number): Promise<WebSearchResult[]>;
}

/**
 * Strips HTML from a raw HTML string to extract readable plain text.
 * Used as a direct-fetch fallback when Crawl4AI service is unavailable.
 */
export function extractMainTextFromHtml(html: string): string {
  let cleaned = html;

  // Remove comments, scripts, styles, navigation, footer, etc.
  cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, '');
  cleaned = cleaned.replace(/<(script|style|noscript|svg|iframe|nav|header|footer|form|button|aside|menu|dialog)[^>]*>[\s\S]*?<\/\1>/gi, '');

  // Preserve headings
  cleaned = cleaned.replace(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi, '\n### $1\n');

  // Preserve block-level elements
  cleaned = cleaned.replace(/<(p|div|tr|li|blockquote|article|section)[^>]*>/gi, '\n');
  cleaned = cleaned.replace(/<br\s*\/?>/gi, '\n');

  // Strip remaining tags
  cleaned = cleaned.replace(/<[^>]+>/g, ' ');

  // Decode HTML entities
  cleaned = cleaned
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&#x27;|&#039;/gi, "'")
    .replace(/&dollar;/gi, '$')
    .replace(/&#(\d+);/gi, (_, code) => String.fromCharCode(parseInt(code)));

  // Collapse whitespace, filter trivial lines
  const lines = cleaned
    .split('\n')
    .map(line => line.replace(/\s+/g, ' ').trim())
    .filter(line => line.length > 25 || /^###/.test(line));

  return lines.join('\n').trim();
}

/**
 * Sanitize a user query for web search.
 * Only strips explicit "search the web for" style prefixes/suffixes.
 * Does NOT expand abbreviations or alter query intent.
 */
export function sanitizeSearchQuery(rawQuery: string): string {
  let q = rawQuery.trim();

  // Strip leading search-instruction prefixes (most specific first)
  q = q.replace(/^use(?: the)? web search(?:\s+and\s+give me the source)?(?:\s+for)?\s+/i, '');
  q = q.replace(/^use(?: the)? web(?:\s+to)?\s+(?:find|search(?:\s+for)?|look\s+up|check|get)\s+/i, '');
  q = q.replace(/^search(?:ing)?(?:\s+the)?\s+web(?:\s+for)?\s+/i, '');
  q = q.replace(/^look(?:\s+up)?\s+/i, '');
  q = q.replace(/^check\s+online(?:\s+for)?\s+/i, '');
  q = q.replace(/^find\s+online(?:\s+for)?\s+/i, '');

  // Strip prompt instructions like "Search the web, extract..." or ". Search the web."
  q = q.replace(/[\.\,\?]?\s*Search the web.*$/i, '');
  q = q.replace(/[\.\,\?]?\s*extract the actual latest price.*$/i, '');
  q = q.replace(/[\.\,\?]?\s*and give me the source.*$/i, '');
  q = q.replace(/[\.\,\?]?\s*and give evidence.*$/i, '');
  q = q.replace(/[\.\,\?]?\s*extract price.*$/i, '');

  // Strip trailing search-instruction suffixes
  q = q.replace(/\.\s+[Ss]earch(?:\s+the\s+web)?\s*\.?$/i, '');
  q = q.replace(/,?\s+[Ss]earch(?:\s+the\s+web)?\s*\.?$/i, '');
  q = q.replace(/\s+and (?:give|show|list) me (?:the )?sources?\s*\.?$/i, '');
  q = q.replace(/\s+use web search\s*\.?$/i, '');
  q = q.replace(/\s+use(?:ing)? (?:the )?web\s*\.?$/i, '');

  // Clean conversational filler prefix while keeping temporal keywords intact
  q = q.replace(/^(?:what|who|how much)\s+(?:is|was|are|does)\s+(?!current|latest|today|right now)/i, '');
  q = q.replace(/'s\b/g, '');

  return q.replace(/\s+/g, ' ').trim();
}

/**
 * Fetches a URL with automatic retry logic for transient server (5xx) and network errors.
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 2,
  backoffMs = 500
): Promise<Response> {
  let lastError: any;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`[fetchWithRetry] Retry attempt ${attempt}/${retries} for ${url} after ${backoffMs * attempt}ms delay...`);
        await new Promise(res => setTimeout(res, backoffMs * attempt));
      }
      const res = await fetch(url, options);
      if (res.status >= 500 && attempt < retries) {
        console.warn(`[fetchWithRetry] HTTP ${res.status} from ${url} (attempt ${attempt + 1}/${retries + 1})`);
        continue;
      }
      return res;
    } catch (err: any) {
      lastError = err;
      if (attempt < retries) {
        console.warn(`[fetchWithRetry] Network error "${err.message}" for ${url} (attempt ${attempt + 1}/${retries + 1})`);
      }
    }
  }
  throw lastError || new Error(`Fetch failed for ${url} after ${retries + 1} attempts`);
}

function domainFromUrl(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return 'web'; }
}

// ─── SearXNG Search Provider (self-hosted only) ───────────────────────────────

/**
 * Searches the self-hosted SearXNG instance.
 *
 * Returns an empty array + throws a descriptive ServiceUnavailableError when
 * SearXNG cannot be reached, so the pipeline can surface a clear failure message
 * rather than silently returning zero results.
 */
export class SearXNGSearchProvider implements IWebSearchProvider {
  private getSearxngUrl(): string {
    return (process.env.SEARXNG_URL || 'http://localhost:8080').replace(/\/$/, '');
  }

  private getMaxResults(): number {
    return parseInt(process.env.WEB_SEARCH_RESULTS || '') || 8;
  }

  async search(query: string, maxResults?: number): Promise<WebSearchResult[]> {
    const sanitized = sanitizeSearchQuery(query);
    const count = maxResults ?? this.getMaxResults();
    const baseUrl = this.getSearxngUrl();

    console.log(`[SearXNG] Search: "${sanitized}" (want ${count} results) via ${baseUrl}`);

    const searchUrl = `${baseUrl}/search?q=${encodeURIComponent(sanitized)}&format=json&language=en&safesearch=0`;

    let response: Response;
    try {
      response = await fetchWithRetry(searchUrl, {
        headers: {
          'User-Agent': 'AUREN-Research/1.0',
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(10000),
      }, 2, 500);
    } catch (err: any) {
      const msg = `SearXNG unreachable at ${baseUrl}: ${err.message}. Ensure "docker-compose up -d searxng" is running.`;
      console.error(`[SearXNG] ✗ ${msg}`);
      throw new Error(msg);
    }

    if (!response.ok) {
      const msg = `SearXNG at ${baseUrl} returned HTTP ${response.status}. Check that the container is healthy.`;
      console.error(`[SearXNG] ✗ ${msg}`);
      throw new Error(msg);
    }

    const ct = response.headers.get('content-type') || '';
    if (!ct.includes('application/json')) {
      const msg = `SearXNG at ${baseUrl} returned non-JSON (${ct}). The service may need SEARXNG_JSON_FORMAT=enabled in its settings.`;
      console.error(`[SearXNG] ✗ ${msg}`);
      throw new Error(msg);
    }

    let data: any;
    try {
      data = await response.json();
    } catch (err: any) {
      const msg = `SearXNG returned malformed JSON: ${err.message}`;
      console.error(`[SearXNG] ✗ ${msg}`);
      throw new Error(msg);
    }

    if (!Array.isArray(data.results) || data.results.length === 0) {
      console.log(`[SearXNG] ⚠ 0 results returned for: "${sanitized}"`);
      return [];
    }

    const results: WebSearchResult[] = data.results
      .slice(0, count)
      .map((r: any): WebSearchResult => ({
        title: (r.title || '').trim(),
        url: r.url,
        snippet: (r.content || r.snippet || r.title || '').trim(),
        source: domainFromUrl(r.url),
        timestamp: r.publishedDate,
      }))
      .filter((r: WebSearchResult) => r.url && r.title);

    console.log(`[SearXNG] ✓ ${results.length} results for: "${sanitized}"`);
    return results;
  }
}

// ─── Legacy aliases (keep backward-compat for any imports) ───────────────────
export class DuckDuckGoSearchProvider extends SearXNGSearchProvider {}
export class MultiSourceWebSearchProvider extends SearXNGSearchProvider {}
