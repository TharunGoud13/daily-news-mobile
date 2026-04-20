import { NewsArticle } from "@/types/news";

// --- Utility helpers (minimal, no dependencies) ---
function stripHTML(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&#x27;/g, "'")
    .replace(/&#\d+;/g, (m) => String.fromCharCode(parseInt(m.slice(2, -1))))
    .trim();
}

function extractTag(xml: string, tag: string): string {
  const cdata = xml.match(
    new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`)
  );
  if (cdata) return cdata[1].trim();
  const regular = xml.match(new RegExp(`<${tag}[^>]*>([^<]*)<\\/${tag}>`));
  return regular ? regular[1].trim() : "";
}

function extractLink(xml: string): string {
  const m =
    xml.match(/<link[^>]+rel=["']alternate["'][^>]+href=["']([^"']+)["']/) ||
    xml.match(/<link[^>]+href=["']([^"']+)["']/) ||
    xml.match(/<link>([^<]+)<\/link>/);
  return m ? m[1].trim() : "";
}

function parseRSS(
  xml: string,
  feedName: string,
  sourceType: NewsArticle["source"],
  limit = 8
): NewsArticle[] {
  const articles: NewsArticle[] = [];
  const itemRegex = /<(?:item|entry)>([\s\S]*?)<\/(?:item|entry)>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null && articles.length < limit) {
    const block = match[1];
    const title = stripHTML(extractTag(block, "title"));
    const link = extractLink(block);
    if (!title || !link) continue;

    const desc = stripHTML(
      extractTag(block, "description") ||
        extractTag(block, "summary") ||
        extractTag(block, "content")
    ).slice(0, 200);
    const date =
      extractTag(block, "pubDate") ||
      extractTag(block, "updated") ||
      extractTag(block, "published");
    const author =
      extractTag(block, "dc:creator") ||
      extractTag(block, "author") ||
      extractTag(block, "name") ||
      feedName;
    const imgMatch = block.match(
      /url=["'](https?:\/\/[^"'\s]+\.(?:jpg|jpeg|png|webp|gif)[^"']*)/i
    );

    articles.push({
      id: `${sourceType}-${simpleHash(link)}`,
      title,
      description: desc,
      url: link,
      source: sourceType,
      sourceName: feedName,
      author: stripHTML(author) || feedName,
      publishedAt: date ? new Date(date).toISOString() : new Date().toISOString(),
      tags: [],
      score: 0,
      commentsCount: 0,
      imageUrl: imgMatch?.[1],
    });
  }
  return articles;
}

// Lightweight hash to avoid btoa issues in RN
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(36);
}

async function fetchWithTimeout(url: string, ms = 6000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "DailyNewsApp/1.0" },
    });
    return res;
  } finally {
    clearTimeout(id);
  }
}

async function fetchRSS(
  url: string,
  name: string,
  source: NewsArticle["source"],
  limit = 8
): Promise<NewsArticle[]> {
  try {
    const res = await fetchWithTimeout(url);
    if (!res.ok) return [];
    return parseRSS(await res.text(), name, source, limit);
  } catch {
    return [];
  }
}

// ===== SOURCE FETCHERS (all free, no API keys) =====

export async function fetchHackerNews(): Promise<NewsArticle[]> {
  try {
    const terms = "AI OR LLM OR React OR frontend OR Rust OR Python OR MCP";
    const res = await fetchWithTimeout(
      `https://hn.algolia.com/api/v1/search_by_date?query=${encodeURIComponent(terms)}&tags=story&hitsPerPage=30`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.hits || []).map((h: any) => ({
      id: `hn-${h.objectID}`,
      title: h.title || "",
      description: "",
      url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
      source: "hackernews" as const,
      sourceName: "Hacker News",
      author: h.author || "unknown",
      publishedAt: h.created_at,
      tags: (h._tags || []).slice(0, 2),
      score: h.points || 0,
      commentsCount: h.num_comments || 0,
    }));
  } catch {
    return [];
  }
}

export async function fetchDevTo(): Promise<NewsArticle[]> {
  const tags = ["ai", "react", "javascript", "webdev", "python", "rust", "mobile"];
  try {
    const results = await Promise.allSettled(
      tags.map(async (tag) => {
        const res = await fetchWithTimeout(
          `https://dev.to/api/articles?tag=${tag}&per_page=6&top=1`
        );
        if (!res.ok) return [];
        const articles = await res.json();
        return articles.map((a: any) => ({
          id: `devto-${a.id}`,
          title: a.title,
          description: (a.description || "").slice(0, 150),
          url: a.url,
          source: "devto" as const,
          sourceName: "Dev.to",
          author: a.user?.name || "unknown",
          publishedAt: a.published_at,
          tags: (a.tag_list || []).slice(0, 3),
          score: a.positive_reactions_count || 0,
          commentsCount: a.comments_count || 0,
          imageUrl: a.cover_image || a.social_image || undefined,
        }));
      })
    );
    return results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
  } catch {
    return [];
  }
}

export async function fetchTechNews(): Promise<NewsArticle[]> {
  const feeds = [
    { url: "https://venturebeat.com/category/ai/feed/", name: "VentureBeat" },
    { url: "https://techcrunch.com/category/artificial-intelligence/feed/", name: "TechCrunch" },
    { url: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml", name: "The Verge" },
    { url: "https://arstechnica.com/ai/feed/", name: "Ars Technica" },
  ];
  const results = await Promise.allSettled(
    feeds.map((f) => fetchRSS(f.url, f.name, "technews", 6))
  );
  return results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
}

export async function fetchAIOfficial(): Promise<NewsArticle[]> {
  const feeds = [
    { url: "https://openai.com/blog/rss.xml", name: "OpenAI" },
    { url: "https://blog.google/technology/ai/rss/", name: "Google AI" },
    { url: "https://www.wired.com/feed/tag/ai/latest/rss", name: "WIRED AI" },
    { url: "https://www.technologyreview.com/feed/", name: "MIT Tech Review" },
  ];
  const results = await Promise.allSettled(
    feeds.map((f) => fetchRSS(f.url, f.name, "aiofficial", 6))
  );
  return results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
}

export async function fetchGNews(): Promise<NewsArticle[]> {
  // Free public RSS feeds for general tech/AI news (no API key needed)
  const feeds = [
    { url: "https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGRqTVhZU0FtVnVHZ0pWVXlnQVAB", name: "Google News AI" },
    { url: "https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNR1ptTnpFU0FtVnVHZ0pWVXlnQVAB", name: "Google News Tech" },
  ];
  const results = await Promise.allSettled(
    feeds.map((f) => fetchRSS(f.url, f.name, "gnews", 10))
  );
  return results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
}

export async function fetchProductHunt(): Promise<NewsArticle[]> {
  return fetchRSS(
    "https://www.producthunt.com/feed?category=undefined",
    "Product Hunt",
    "producthunt",
    8
  );
}

export async function fetchGitHubTrending(): Promise<NewsArticle[]> {
  return fetchRSS(
    "https://mshibanami.github.io/GitHubTrendingRSS/daily/all-languages.xml",
    "GitHub Trending",
    "github",
    10
  );
}

export async function fetchReddit(): Promise<NewsArticle[]> {
  const subs = ["programming", "MachineLearning", "reactjs", "webdev"];
  try {
    const results = await Promise.allSettled(
      subs.map(async (sub) => {
        const res = await fetchWithTimeout(
          `https://www.reddit.com/r/${sub}/hot.json?limit=8`
        );
        if (!res.ok) return [];
        const data = await res.json();
        return (data.data?.children || [])
          .filter((c: any) => !c.data.is_self && c.data.url)
          .slice(0, 5)
          .map((c: any) => ({
            id: `reddit-${c.data.id}`,
            title: c.data.title,
            description: "",
            url: c.data.url,
            source: "reddit" as const,
            sourceName: `r/${c.data.subreddit}`,
            author: c.data.author || "unknown",
            publishedAt: new Date(c.data.created_utc * 1000).toISOString(),
            tags: [c.data.subreddit],
            score: c.data.score || 0,
            commentsCount: c.data.num_comments || 0,
            imageUrl: c.data.thumbnail?.startsWith("http") ? c.data.thumbnail : undefined,
          }));
      })
    );
    return results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
  } catch {
    return [];
  }
}

// ===== MAIN AGGREGATOR =====

function deduplicate(articles: NewsArticle[]): NewsArticle[] {
  const seen = new Set<string>();
  return articles.filter((a) => {
    const key = a.title.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 50);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const FETCHERS: { key: string; fn: () => Promise<NewsArticle[]> }[] = [
  { key: "hackernews", fn: fetchHackerNews },
  { key: "devto", fn: fetchDevTo },
  { key: "gnews", fn: fetchGNews },
  { key: "technews", fn: fetchTechNews },
  { key: "aiofficial", fn: fetchAIOfficial },
  { key: "producthunt", fn: fetchProductHunt },
  { key: "github", fn: fetchGitHubTrending },
  { key: "reddit", fn: fetchReddit },
];

export async function fetchAllNews(sourceFilter?: string): Promise<NewsArticle[]> {
  const active =
    sourceFilter && sourceFilter !== "all"
      ? FETCHERS.filter((f) => f.key === sourceFilter)
      : FETCHERS;

  const results = await Promise.allSettled(active.map((f) => f.fn()));
  let articles = results.flatMap((r) =>
    r.status === "fulfilled" ? r.value : []
  );

  articles = deduplicate(articles);
  articles.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
  return articles;
}
