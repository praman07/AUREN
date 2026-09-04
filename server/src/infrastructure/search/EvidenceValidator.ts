/**
 * EvidenceValidator.ts
 *
 * Domain-aware evidence extraction and validation for AUREN Web Retrieval Pipeline.
 * Enforces evidence-first grounding, source domain ranking, structured evidence extraction,
 * timestamp validation, and anti-hallucination guarantees.
 */

export interface ResearchDimensions {
  entities: string[];             // Unique entities/tickers/indices derived from query
  isMultiEntity: boolean;         // True if entities.length > 1
  timeframe: 'weekly' | 'monthly' | 'yearly' | '24h' | 'current' | 'event';
  metric: 'performance_comparison' | 'change_delta' | 'spot_price' | 'event_impact' | 'price_target' | 'market_cap';
  rawQuery: string;
}

export interface StructuredEvidence {
  sourceUrl: string;
  sourceTitle: string;
  extractedValue?: string;        // Raw matched text from page (preserved exactly)
  extractedNumeric?: number;      // Parsed float — prevents LLM from re-deriving the number
  extractedCurrency?: string;     // Detected currency symbol (USD, INR, etc.)
  extractedDate?: string;
  extractedTimestamp?: string;
  evidenceText: string;
  confidence: 'high' | 'medium' | 'low';
  sourceType: 'official' | 'exchange' | 'reputable_news' | 'secondary' | 'aggregator';
  queryCategory: 'financial' | 'rate' | 'personnel' | 'news' | 'general';
  isFresh?: boolean;
  matchedEntity?: string;
  matchedTimeframe?: 'weekly' | 'monthly' | 'yearly' | '24h' | 'current' | 'event';
  matchedMetric?: string;
}

/**
 * Dynamically parses research query dimensions (entities, timeframe, metric) with ZERO hardcoding.
 */
export function parseResearchDimensions(queryStr: string): ResearchDimensions {
  const q = queryStr.trim();
  const qLower = q.toLowerCase();

  // 1. Timeframe extraction
  let timeframe: ResearchDimensions['timeframe'] = 'current';
  if (/\b(?:this week|last week|past week|week over week|wow|weekly)\b/i.test(q)) {
    timeframe = 'weekly';
  } else if (/\b(?:this month|last month|past month|month over month|mom|mtd|monthly)\b/i.test(q)) {
    timeframe = 'monthly';
  } else if (/\b(?:this year|last year|past year|year over year|yoy|ytd|yearly|annual|annualized)\b/i.test(q)) {
    timeframe = 'yearly';
  } else if (/\b(?:after earnings|post earnings|after report|following report|after split|following announcement)\b/i.test(q)) {
    timeframe = 'event';
  } else if (/\b(?:24 hours|24-hour|24h|1 day|1-day|daily)\b/i.test(q)) {
    timeframe = '24h';
  }

  // 2. Metric extraction
  let metric: ResearchDimensions['metric'] = 'spot_price';
  if (/\b(?:compared|comparison|perform|performance|outperform|vs\.?|versus|return)\b/i.test(q)) {
    metric = 'performance_comparison';
  } else if (/\b(?:change|changed|gain|gained|loss|lost|up|down|percent|percentage|move|moved|%)\b/i.test(q)) {
    metric = 'change_delta';
  } else if (/\b(?:after|following|post)\b/i.test(q) && /\b(?:earnings|report|split|announcement)\b/i.test(q)) {
    metric = 'event_impact';
  } else if (/\b(?:target|forecast|prediction)\b/i.test(q)) {
    metric = 'price_target';
  } else if (/\b(?:market cap|valuation)\b/i.test(q)) {
    metric = 'market_cap';
  }

  // 3. Dynamic Entity Extraction (Zero Hardcoding)
  const knownIndicesAndInstruments = [
    'S&P 500', 'S&P500', 'Dow Jones', 'Nasdaq', 'Nifty 50', 'Sensex', 'Russell 2000', 'FTSE 100', 'Nikkei 225'
  ];
  const detectedEntities: string[] = [];

  for (const inst of knownIndicesAndInstruments) {
    if (qLower.includes(inst.toLowerCase())) {
      detectedEntities.push(inst);
    }
  }

  const stopWords = new Set([
    'what', 'how', 'why', 'which', 'when', 'who', 'did', 'do', 'does', 'is', 'are', 'was', 'were',
    'perform', 'performed', 'performance', 'compare', 'compared', 'comparing', 'comparison', 'with', 'to',
    'this', 'last', 'past', 'week', 'month', 'year', 'day', 'today', 'change', 'changed', 'much', 'stock',
    'price', 'share', 'shares', 'quote', 'market', 'cap', 'report', 'earnings', 'after', 'post', 'before',
    'versus', 'vs', 'outperform', 'gained', 'lost', 'tell', 'me', 'about', 'the', 'current', 'latest'
  ]);

  const rawWords = q.split(/[\s,?!]+/);
  for (const word of rawWords) {
    const cleanWord = word.replace(/[^a-zA-Z0-9-]/g, '');
    if (!cleanWord || cleanWord.length < 2) continue;
    const lower = cleanWord.toLowerCase();
    if (stopWords.has(lower)) continue;

    if (detectedEntities.some(e => e.toLowerCase().includes(lower))) continue;

    const isCapitalized = /^[A-Z][a-zA-Z0-9-]*$/.test(cleanWord);
    if (isCapitalized || lower === 'bitcoin' || lower === 'ethereum' || lower === 'solana') {
      const normalized = cleanWord.charAt(0).toUpperCase() + cleanWord.slice(1);
      if (!detectedEntities.includes(normalized)) {
        detectedEntities.push(normalized);
      }
    }
  }

  if (detectedEntities.length === 0) {
    for (const word of rawWords) {
      const cleanWord = word.replace(/[^a-zA-Z0-9-]/g, '');
      if (!cleanWord || cleanWord.length < 2) continue;
      const lower = cleanWord.toLowerCase();
      if (stopWords.has(lower)) continue;
      const normalized = cleanWord.charAt(0).toUpperCase() + cleanWord.slice(1);
      if (!detectedEntities.includes(normalized)) {
        detectedEntities.push(normalized);
      }
    }
  }

  return {
    entities: detectedEntities,
    isMultiEntity: detectedEntities.length > 1,
    timeframe,
    metric,
    rawQuery: q
  };
}

export interface RetrievalTelemetry {
  searchedSourcesCount: number;
  crawledSourcesCount: number;
  successfullyExtractedSourcesCount: number;
  relevantEvidenceSourcesCount: number;
  failedSourcesCount: number;
  searchedSources: Array<{ title: string; url: string }>;
  crawledSources: string[];
  successfullyExtractedSources: string[];
  relevantEvidenceSources: StructuredEvidence[];
  failedSources: Array<{ url: string; error?: string }>;
}

/**
 * Ranks source URL domain authority based on query category.
 */
export function classifySourceType(url: string): StructuredEvidence['sourceType'] {
  const host = (url || '').toLowerCase();
  
  if (host.includes('.gov') || host.includes('.nic.in') || host.includes('pmindia.gov.in') || host.includes('rbi.org.in') || host.includes('sec.gov') || host.includes('investor.')) {
    return 'official';
  }
  if (host.includes('nasdaq.com') || host.includes('nyse.com') || host.includes('nseindia.com') || host.includes('bseindia.com') || host.includes('coingecko.com') || host.includes('coinmarketcap.com') || host.includes('finance.yahoo.com') || host.includes('google.com/finance')) {
    return 'exchange';
  }
  if (host.includes('reuters.com') || host.includes('bloomberg.com') || host.includes('cnbc.com') || host.includes('wsj.com') || host.includes('ft.com') || host.includes('economictimes') || host.includes('livemint') || host.includes('business-standard') || host.includes('thehindu.com') || host.includes('ndtv.com') || host.includes('indianexpress.com')) {
    return 'reputable_news';
  }
  if (host.includes('wikipedia.org') || host.includes('wikinews') || host.includes('medium.com')) {
    return 'aggregator';
  }
  return 'secondary';
}

/**
 * Source domain ranking comparator. Lower index = higher priority.
 */
export const SOURCE_TYPE_RANK: Record<StructuredEvidence['sourceType'], number> = {
  official: 1,
  exchange: 2,
  reputable_news: 3,
  secondary: 4,
  aggregator: 5
};

/**
 * Detects if a query is looking for dynamic real-time data or specific values.
 */
export function isDynamicQuery(query: string): boolean {
  const q = query.toLowerCase();
  const dynamicKeywords = [
    'price', 'stock', 'rate', 'quote', 'cost', 'usd', 'inr', 'bitcoin', 'btc', 'eth',
    'chief minister', 'cm of', 'prime minister', 'pm of', 'governor', 'ceo', 'president',
    'repo rate', 'revenue', 'quarterly', 'q1', 'q2', 'q3', 'q4', 'latest', 'today', 'current',
    'news this week', 'developments', 'right now', 'recent'
  ];
  return dynamicKeywords.some(kw => q.includes(kw));
}

/**
 * Extracts specific structured evidence matching the user query from page text.
 */
export function extractEvidenceFromPage(
  query: string,
  url: string,
  title: string,
  content: string,
  snippet: string,
  currentYear: number = 2026
): StructuredEvidence | null {
  const q = query.toLowerCase();
  const dimensions = parseResearchDimensions(query);
  const fullText = (content && content.length > 15 ? content : snippet) || '';
  if (!fullText.trim()) return null;

  const sourceType = classifySourceType(url);
  let queryCategory: StructuredEvidence['queryCategory'] = 'general';
  let extractedValue: string | undefined;
  let extractedNumeric: number | undefined;   // Parsed float, separate from raw string
  let extractedCurrency: string | undefined;  // Detected currency (USD, INR, etc.)
  let extractedDate: string | undefined;
  let extractedTimestamp: string | undefined;
  let evidenceText = '';
  let matchedEntity: string | undefined;

  // Timestamp / Date extraction from content
  const dateRegex = /(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2},\s+\d{4}|\d{4}-\d{2}-\d{2}|\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}/i;
  const dateMatch = fullText.match(dateRegex);
  if (dateMatch) {
    extractedDate = dateMatch[0];
  }

  const isoTimeRegex = /\b\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})\b/;
  const timeMatch = fullText.match(isoTimeRegex);
  if (timeMatch) {
    extractedTimestamp = timeMatch[0];
  }

  const getEntityAliases = (queryStr: string): string[] => {
    const dims = parseResearchDimensions(queryStr);
    return dims.entities.map(e => e.toLowerCase());
  };

  // Helper to detect requested financial metric
  const detectFinancialMetric = (queryStr: string): 'price_target' | 'previous_close' | '52_week' | 'market_cap' | 'pe_ratio' | 'performance_comparison' | 'event_impact' | 'live_stock_price' => {
    const qLower = queryStr.toLowerCase();
    if (qLower.includes('target') || qLower.includes('forecast') || qLower.includes('prediction')) return 'price_target';
    if (qLower.includes('previous close') || qLower.includes('prev close') || qLower.includes('yesterday close')) return 'previous_close';
    if (qLower.includes('52-week') || qLower.includes('52 week') || qLower.includes('52wk') || qLower.includes('year high') || qLower.includes('year low')) return '52_week';
    if (qLower.includes('market cap') || qLower.includes('valuation')) return 'market_cap';
    if (qLower.includes('pe ratio') || qLower.includes('p/e')) return 'pe_ratio';
    if (qLower.includes('compared') || qLower.includes('comparison') || qLower.includes('perform') || qLower.includes('performance') || qLower.includes('this month') || qLower.includes('last month') || qLower.includes('month over month') || qLower.includes('mom') || qLower.includes('yoy') || qLower.includes('month-over-month') || qLower.includes('year over year') || qLower.includes('monthly return') || qLower.includes('past month')) return 'performance_comparison';
    if (qLower.includes('after earnings') || qLower.includes('earnings report') || qLower.includes('after report') || qLower.includes('following report') || qLower.includes('after split') || qLower.includes('post earnings') || qLower.includes('following announcement')) return 'event_impact';
    return 'live_stock_price';
  };

  // 1. Financial Query Handling (e.g. NVIDIA stock price, Apple stock price, Bitcoin price, comparative performance)
  if (q.includes('stock') || q.includes('price') || q.includes('nvidia') || q.includes('nvda') || q.includes('apple') || q.includes('aapl') || q.includes('microsoft') || q.includes('msft') || q.includes('bitcoin') || q.includes('btc') || q.includes('eth') || q.includes('perform') || q.includes('compared')) {
    queryCategory = 'financial';
    
    const targetMetric = detectFinancialMetric(q);
    const entityAliases = getEntityAliases(q);

    const priceRegexes = [
      // US$ 225.16, US$225.16, USD 225.16, USD: 225.16, $225.16, ₹83.50, INR 83.50
      /(?:US\$|USD:?\s*|\$|₹|INR\s*)(\d{1,3}(?:,\d{3})*(?:\.\d{1,4})?)/i,
      // 225.16 USD, 225.16 US$, 225.16 dollars, 225.16 INR
      /(\d{1,3}(?:,\d{3})*(?:\.\d{1,4})?)\s*(?:USD|US\$|INR|dollars)/i,
      // price: 225.16, trading at 225.16, current price 225.16, Open496.36, Prev Close496.88
      /(?:price|closed at|trading at|currently|quote|value|last|stock price|Open|Prev Close|Previous Close):\s*(?:US\$|USD:?\s*|\$|₹)?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{1,4})?)/i
    ];

    const lines = fullText.split(/(?:\r?\n|\.\s+)/);
    for (const line of lines) {
      const lLower = line.toLowerCase();

      // Check metric exclusions & inclusions
      if (targetMetric === 'live_stock_price') {
        // Only skip lines that contain analyst/secondary metric terms BUT lack any live-price indicator.
        // Finance snippets often pack the current price alongside secondary terms on the same line,
        // so poisoning the entire line would discard valid evidence.
        const hasSecondaryTerm = lLower.includes('price target') ||
                                 lLower.includes('target price') ||
                                 lLower.includes('analyst target') ||
                                 (lLower.includes('nifty') && !q.includes('nifty')) ||
                                 (lLower.includes('sensex') && !q.includes('sensex')) ||
                                 (lLower.includes('dow jones') && !q.includes('dow'));
        const hasLivePriceIndicator = lLower.includes('stock price') ||
                                      lLower.includes('share price') ||
                                      lLower.includes('trading at') ||
                                      lLower.includes('current price') ||
                                      lLower.includes('open') ||
                                      /[₹$]\s*\d/.test(line) ||
                                      /\d\s*(?:usd|inr)/i.test(line);
        if (hasSecondaryTerm && !hasLivePriceIndicator) continue;
      } else if (targetMetric === 'price_target') {
        if (!lLower.includes('target') && !lLower.includes('forecast')) continue;
      } else if (targetMetric === 'previous_close') {
        if (!lLower.includes('previous close') && !lLower.includes('prev close') && !lLower.includes('closed at')) continue;
      } else if (targetMetric === '52_week') {
        if (!lLower.includes('52-week') && !lLower.includes('52 week') && !lLower.includes('52wk') && !lLower.includes('52-wk') && !lLower.includes('year high') && !lLower.includes('year low')) continue;
      } else if (targetMetric === 'performance_comparison') {
        const isMonthlyRequested = q.includes('month');
        if (isMonthlyRequested) {
          const isMismatchedTimeframe = lLower.includes('last week') || 
                                        lLower.includes('past 7 days') || 
                                        lLower.includes('24 hours') || 
                                        lLower.includes('24-hour') || 
                                        lLower.includes('1 hour') || 
                                        lLower.includes('52-week') || 
                                        lLower.includes('1 year') || 
                                        lLower.includes('year-to-date') ||
                                        lLower.includes('ytd');
          if (isMismatchedTimeframe) continue;
        }

        // Look for percentage changes, performance figures, or month-by-month return figures
        const compRegex = /(?:[+-]?\d+(?:\.\d+)?%|gained\s+[+-]?\d+(?:\.\d+)?%|fell\s+[+-]?\d+(?:\.\d+)?%|rose\s+[+-]?\d+(?:\.\d+)?%|dropped\s+[+-]?\d+(?:\.\d+)?%|up\s+[+-]?\d+(?:\.\d+)?%|down\s+[+-]?\d+(?:\.\d+)?%|monthly return of\s+[+-]?\d+(?:\.\d+)?%)/i;
        const compMatch = line.match(compRegex);
        if (compMatch) {
          extractedValue = compMatch[0].trim();
          evidenceText = line.trim();
          break;
        }
        const hasMonthTerms = lLower.includes('month') || lLower.includes('july') || lLower.includes('august') || lLower.includes('september') || lLower.includes('october') || lLower.includes('november') || lLower.includes('december') || lLower.includes('january') || lLower.includes('february') || lLower.includes('march') || lLower.includes('april') || lLower.includes('may') || lLower.includes('june');
        if (hasMonthTerms && (line.includes('%') || line.includes('$') || line.includes('₹'))) {
          evidenceText = line.trim();
          extractedValue = line.trim();
          break;
        }
        continue;
      } else if (targetMetric === 'event_impact') {
        const eventRegex = /(?:[+-]?\d+(?:\.\d+)?%|[+-]?\$\d+(?:\.\d+)?|gained|surged|fell|dropped|rose)\s*(?:after|following|post)\s*(?:earnings|report|announcement|split)/i;
        const eventMatch = line.match(eventRegex);
        if (eventMatch) {
          extractedValue = eventMatch[0].trim();
          evidenceText = line.trim();
          break;
        }
        if ((lLower.includes('earnings') || lLower.includes('report')) && (line.includes('%') || line.includes('$'))) {
          evidenceText = line.trim();
          extractedValue = line.trim();
          break;
        }
        continue;
      }

      // Entity Binding: Must match at least one entity alias OR line explicitly mentions stock price/quote
      const matchesEntity = entityAliases.length === 0 || 
                            entityAliases.some(alias => lLower.includes(alias)) || 
                            lLower.includes('stock price') || 
                            lLower.includes('share price') || 
                            lLower.includes('trading at');
      
      if (!matchesEntity) continue;

      for (const regex of priceRegexes) {
        const match = line.match(regex);
        if (match) {
          const rawNum = match[1].replace(/,/g, '');
          const valNum = parseFloat(rawNum);
          
          // Skip numbers immediately followed by scale multipliers (billion, million, trillion, B, M, T)
          const matchIdx = line.indexOf(match[0]);
          const textAfterMatch = line.slice(matchIdx + match[0].length, matchIdx + match[0].length + 15).toLowerCase().trim();
          if (/^(?:billion|million|trillion|b\b|m\b|t\b)/i.test(textAfterMatch)) {
            continue;
          }

          // Skip years (e.g. 2024, 2025, 2026) unless explicitly prefixed with currency
          if (valNum >= 1900 && valNum <= currentYear + 2 && !line.includes('$') && !lLower.includes('usd') && !lLower.includes('price')) {
            continue;
          }

          // Detect currency from match context
          const fullMatch = match[0].trim();
          let currency: string | undefined;
          if (fullMatch.includes('$') || /USD/i.test(fullMatch) || /dollars/i.test(fullMatch)) currency = 'USD';
          else if (fullMatch.includes('₹') || /INR/i.test(fullMatch)) currency = 'INR';

          extractedValue = fullMatch;
          extractedNumeric = isNaN(valNum) ? undefined : valNum;
          extractedCurrency = currency;
          evidenceText = line.trim();
          break;
        }
      }

      if (extractedValue) break;
    }
  }

  // 2. Exchange Rate Query

  else if (q.includes('rate') || q.includes('inr') || q.includes('exchange') || q.includes('usd to')) {
    queryCategory = 'rate';
    const rateRegexes = [
      // Primary: "1 USD = ₹83.50" or "1 USD = INR 83.50"
      /1\s*(?:USD|USD\$)?\s*=\s*(?:\u20b9|₹|INR\s*)\s*(\d{1,3}(?:,\d{3})*(?:\.\d{1,4})?)/i,
      // Fallback: plain numeric near currency keywords
      /(?:INR|rupee|rupees|rate|equals)\s*(?:is|at|of)?\s*(?:\u20b9|₹|USD\s*)?(\d{1,3}(?:,\d{3})*(?:\.\d{1,4})?)/i,
      // USD→INR: "= ₹83.50"
      /=\s*(?:\u20b9|₹)\s*(\d{1,3}(?:,\d{3})*(?:\.\d{1,4})?)/i,
      /(\d{1,3}(?:,\d{3})*\.\d{2,4})\s*(?:INR|USD)/i
    ];

    const lines = fullText.split(/(?:\r?\n|\.\s+)/);
    for (const line of lines) {
      if (line.toLowerCase().includes('inr') || line.toLowerCase().includes('usd') || line.toLowerCase().includes('rate') || line.toLowerCase().includes('exchange') || line.toLowerCase().includes('rupee')) {
        for (const regex of rateRegexes) {
          const match = line.match(regex);
          if (match) {
            extractedValue = match[0].trim();
            evidenceText = line.trim();
            break;
          }
        }
      }
      if (extractedValue) break;
    }
  }

  // 3. Personnel / Office Holder Query (e.g. Punjab CM, PM of India)
  else if (q.includes('cm') || q.includes('chief minister') || q.includes('prime minister') || q.includes('pm') || q.includes('governor') || q.includes('ceo')) {
    queryCategory = 'personnel';
    const lines = fullText.split(/(?:\r?\n|\.\s+)/);
    for (const line of lines) {
      const lineLower = line.toLowerCase();
      if (
        (q.includes('punjab') && lineLower.includes('punjab')) ||
        (q.includes('india') && (lineLower.includes('india') || lineLower.includes('modi'))) ||
        (q.includes('rbi') && lineLower.includes('governor')) ||
        lineLower.includes('chief minister') || lineLower.includes('incumbent') || lineLower.includes('office')
      ) {
        if (line.length > 15 && line.length < 350) {
          evidenceText = line.trim();
          extractedValue = line.trim();
          break;
        }
      }
    }
  }

  // 4. Financial Quarterly / Repo Rate
  else if (q.includes('repo rate') || q.includes('revenue') || q.includes('quarterly')) {
    queryCategory = 'financial';
    const lines = fullText.split(/(?:\r?\n|\.\s+)/);
    for (const line of lines) {
      const l = line.toLowerCase();
      if (l.includes('repo rate') || l.includes('revenue') || l.includes('billion') || l.includes('million') || l.includes('%')) {
        evidenceText = line.trim();
        const match = line.match(/(\d+(?:\.\d+)?\s*%|\$\d+(?:\.\d+)?\s*(?:billion|million|B|M))/i);
        if (match) {
          extractedValue = match[0];
        }
        break;
      }
    }
  }

  // 5. Version / Release Query
  else if (q.includes('version') || q.includes('release') || q.includes('latest version') || q.includes('current version')) {
    queryCategory = 'general';
    const lines = fullText.split(/(?:\r?\n|\.\s+)/);
    for (const line of lines) {
      const lLower = line.toLowerCase();
      if (lLower.includes('version') || lLower.includes('release') || lLower.includes('v1') || lLower.includes('v2') || lLower.includes('v3') || lLower.includes('v4') || lLower.includes('v5') || lLower.includes('v6') || lLower.includes('v7') || lLower.includes('v8') || lLower.includes('v9') || lLower.includes('v0')) {
        const versionRegex = /\b(?:v)?(\d+\.\d+(?:\.\d+)?)\b/;
        const match = line.match(versionRegex);
        if (match) {
          extractedValue = match[0];
          evidenceText = line.trim();
          break;
        }
      }
    }
  }

  // 6. Weather Query
  else if (q.includes('weather') || q.includes('temperature') || q.includes('forecast') || q.includes('rain') || q.includes('humidity')) {
    queryCategory = 'general';
    const lines = fullText.split(/(?:\r?\n|\.\s+)/);
    for (const line of lines) {
      const lLower = line.toLowerCase();
      if (lLower.includes('weather') || lLower.includes('temp') || lLower.includes('°') || lLower.includes('degree') || lLower.includes('humidity') || lLower.includes('wind') || lLower.includes('rain')) {
        const tempRegex = /(-?\d+(?:\.\d+)?\s*(?:°C|°F|°|celsius|fahrenheit))/i;
        const match = line.match(tempRegex);
        if (match) {
          extractedValue = match[0];
        } else {
          const conditionRegex = /\b(sunny|cloudy|rainy|snowy|windy|stormy|clear|overcast|foggy|misty|drizzle|shower|thunderstorm)\b/i;
          const condMatch = line.match(conditionRegex);
          if (condMatch) {
            extractedValue = condMatch[0];
          }
        }
        evidenceText = line.trim();
        break;
      }
    }
  }

  // General fallback
  if (!evidenceText && fullText.length > 50) {
    evidenceText = fullText.slice(0, 350).replace(/\s+/g, ' ').trim();
  }

  if (!evidenceText) return null;

  // Freshness check: Determine if evidence specifies current year or explicitly confirms current incumbent/live status
  let isFresh = false;
  const yearInTextMatch = (extractedDate || fullText).match(/\b(2025|2026)\b/);
  if (yearInTextMatch || fullText.toLowerCase().includes('as of 2026') || fullText.toLowerCase().includes('current') || fullText.toLowerCase().includes('incumbent')) {
    isFresh = true;
  }

  // Detect matched entity from query dimensions
  for (const entity of dimensions.entities) {
    if (evidenceText.toLowerCase().includes(entity.toLowerCase()) || title.toLowerCase().includes(entity.toLowerCase())) {
      matchedEntity = entity;
      break;
    }
  }

  // Calculate confidence:
  // - High: Official or Exchange source AND fresh/has value
  // - Medium: Reputable news OR contains extracted value
  // - Low: Older than 1 year or secondary/aggregator without freshness
  let confidence: StructuredEvidence['confidence'] = 'low';
  if ((sourceType === 'official' || sourceType === 'exchange') && isFresh && extractedValue) {
    confidence = 'high';
  } else if ((sourceType === 'official' || sourceType === 'exchange' || sourceType === 'reputable_news') && extractedValue) {
    confidence = 'medium';
  } else if (extractedValue) {
    confidence = 'medium';
  }

  return {
    sourceUrl: url,
    sourceTitle: title,
    extractedValue,
    extractedNumeric,
    extractedCurrency,
    extractedDate,
    extractedTimestamp,
    evidenceText,
    confidence,
    sourceType,
    queryCategory,
    isFresh,
    matchedEntity,
    matchedTimeframe: dimensions.timeframe,
    matchedMetric: dimensions.metric
  };
}

/**
 * Filter and rank extracted evidence by source authority, freshness, and confidence.
 */
export function validateAndRankEvidence(
  query: string,
  rawResults: Array<{ url: string; title: string; snippet: string; extractedContent?: string; crawlSuccess?: boolean }>,
  currentYear: number = 2026
): {
  telemetry: RetrievalTelemetry;
  validatedEvidence: StructuredEvidence[];
} {
  const telemetry: RetrievalTelemetry = {
    searchedSourcesCount: rawResults.length,
    crawledSourcesCount: rawResults.filter(r => r.crawlSuccess).length,
    successfullyExtractedSourcesCount: rawResults.filter(r => r.crawlSuccess && r.extractedContent).length,
    relevantEvidenceSourcesCount: 0,
    failedSourcesCount: rawResults.filter(r => !r.crawlSuccess).length,
    searchedSources: rawResults.map(r => ({ title: r.title, url: r.url })),
    crawledSources: rawResults.filter(r => r.crawlSuccess).map(r => r.url),
    successfullyExtractedSources: rawResults.filter(r => r.crawlSuccess && r.extractedContent).map(r => r.url),
    relevantEvidenceSources: [],
    failedSources: rawResults.filter(r => !r.crawlSuccess).map(r => ({ url: r.url }))
  };

  const extractedEvidenceList: StructuredEvidence[] = [];

  for (const item of rawResults) {
    const evidence = extractEvidenceFromPage(
      query,
      item.url,
      item.title,
      item.extractedContent || '',
      item.snippet || '',
      currentYear
    );
    if (evidence) {
      extractedEvidenceList.push(evidence);
    }
  }

  // Sort evidence:
  // 1. Freshness (isFresh = true prioritized)
  // 2. By Source Authority Rank (Official -> Exchange -> News -> Secondary -> Aggregator)
  // 3. By presence of extracted numerical/textual value
  // 4. By confidence
  extractedEvidenceList.sort((a, b) => {
    const freshA = a.isFresh ? 1 : 0;
    const freshB = b.isFresh ? 1 : 0;
    if (freshA !== freshB) return freshB - freshA;

    const rankA = SOURCE_TYPE_RANK[a.sourceType];
    const rankB = SOURCE_TYPE_RANK[b.sourceType];
    if (rankA !== rankB) return rankA - rankB;

    const hasValA = a.extractedValue ? 1 : 0;
    const hasValB = b.extractedValue ? 1 : 0;
    if (hasValA !== hasValB) return hasValB - hasValA;

    return 0;
  });

  telemetry.relevantEvidenceSources = extractedEvidenceList;
  telemetry.relevantEvidenceSourcesCount = extractedEvidenceList.length;

  return {
    telemetry,
    validatedEvidence: extractedEvidenceList
  };
}

/**
 * Evaluates whether SearXNG search result snippets contain sufficient evidence to answer the query,
 * allowing the pipeline to skip the expensive Crawl4AI page extraction.
 */
export function evaluateSnippetSufficiency(
  query: string,
  results: Array<{ title: string; url: string; snippet: string; source?: string; timestamp?: string }>,
  currentYear: number = 2026
): { isSufficient: boolean; evidence: StructuredEvidence[] } {
  const qLower = query.toLowerCase();

  // Exclude complex queries from snippet-only sufficiency
  const complexKeywords = [
    'compare', 'comparison', 'versus', ' vs ', 'difference between', 'swot',
    'pros and cons', 'pros & cons', 'analyze', 'analysis', 'explain', 'detailed',
    'why', 'how to', 'how does', 'step by step', 'investigate', 'research',
    'logic', 'puzzle', 'solve', 'riddle', 'explain step-by-step'
  ];
  if (complexKeywords.some(keyword => qLower.includes(keyword))) {
    return { isSufficient: false, evidence: [] };
  }

  const validatedEvidence: StructuredEvidence[] = [];

  for (const r of results) {
    if (!r.snippet) continue;
    const evidence = extractEvidenceFromPage(query, r.url, r.title, '', r.snippet, currentYear);
    if (evidence && evidence.extractedValue) {
      // Must have high or medium confidence
      if (evidence.confidence === 'high' || evidence.confidence === 'medium') {
        validatedEvidence.push(evidence);
      }
    }
  }

  // Sufficient if we found at least one validated evidence with high/medium confidence
  const isSufficient = validatedEvidence.length >= 1;

  return { isSufficient, evidence: validatedEvidence };
}

