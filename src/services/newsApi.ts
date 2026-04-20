import { NewsArticle } from "@/types/news";

const GNEWS_API_KEY = process.env.EXPO_PUBLIC_GNEWS_API_KEY || "";

// --- Utility: HTML/Entity helpers ---
function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#8217;/g, "\u2019")
    .replace(/&#8216;/g, "\u2018")
    .replace(/&#8220;/g, "\u201C")
    .replace(/&#8221;/g, "\u201D")
    .replace(/&#8230;/g, "\u2026")
    .replace(/&#\d+;/g, (m) => String.fromCharCode(parseInt(m.slice(2, -1))));
}

function stripHTML(html: string): string {
  return decodeEntities(html.replace(/<[^>]*>/g, "")).trim();
}

function extractTag(xml: string, tag: string): string {
  const cdata = xml.match(
    new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`)
  );
  if (cdata) return cdata[1].trim();
  const regular = xml.match(new RegExp(`<${tag}[^>]*>([^<]*)<\\/${tag}>`));
  if (regular) return regular[1].trim();
  return "";
}

function extractLink(xml: string): string {
  const atomAlt = xml.match(
    /<link[^>]+rel=["']alternate["'][^>]+href=["']([^"']+)["']/
  );
  if (atomAlt) return atomAlt[1];
  const atomLink = xml.match(/<link[^>]+href=["']([^"']+)["']/);
  if (atomLink) return atomLink[1];
  const rssLink = xml.match(/<link>([^<]+)<\/link>/);
  if (rssLink) return rssLink[1].trim();
  return "";
}

function parseRSS(
  xml: string,
  feedName: string,
  sourceType: NewsArticle["source"]
): NewsArticle[] {
  const articles: NewsArticle[] = [];
  const itemRegex = /<(?:item|entry)>([\s\S]*?)<\/(?:item|entry)>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null && articles.length < 10) {
    const block = match[1];
    const title = stripHTML(extractTag(block, "title"));
    const link = extractLink(block);
    const desc = stripHTML(
      extractTag(block, "description") ||
        extractTag(block, "summary") ||
        extractTag(block, "content")
    ).slice(0, 300);
    const date =
      extractTag(block, "pubDate") ||
      extractTag(block, "updated") ||
      extractTag(block, "published");
    const author =
      extractTag(block, "dc:creator") ||
      extractTag(block, "name") ||
      extractTag(block, "author") ||
      feedName;

    // Try to extract image
    const imgMatch = block.match(
      /<media:content[^>]+url=["']([^"']+)["']|<enclosure[^>]+url=["']([^"']+)["']/
    );
    const imageUrl = imgMatch ? imgMatch[1] || imgMatch[2] : undefined;

    if (title && link) {
      articles.push({
        id: `${sourceType}-${btoa(link).slice(0, 40)}`,
        title,
        description: desc,
        url: link,
        source: sourceType,
        sourceName: feedName,
        author: stripHTML(author) || feedName,
        publishedAt: date
          ? new Date(date).toISOString()
          : new Date().toISOString(),
        tags: [],
        score: 0,
        commentsCount: 0,
        imageUrl,
      });
    }
  }
  return articles;
}

async function fetchRSSFeed(
  url: string,
  feedName: string,
  sourceType: NewsArticle["source"]
): Promise<NewsArticle[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "DailyNewsApp/1.0" },
    });
    clearTimeout(timeout);
    if (!res.ok) return [];
    const xml = await res.text();
    return parseRSS(xml, feedName, sourceType);
  } catch {
    console.warn(`Failed to fetch RSS: ${feedName}`);
    return [];
  }
}

// --- Hacker News ---
export async function fetchHackerNews(): Promise<NewsArticle[]> {
  try {
    const searchTerms = [
      "AI", "LLM", "GPT", "Claude", "React", "Next.js",
      "frontend", "machine learning", "MCP", "Rust", "Python",
    ];
    const query = searchTerms.join(" OR ");
    const res = await fetch(
      `https://hn.algolia.com/api/v1/search_by_date?query=${encodeURIComponent(query)}&tags=story&hitsPerPage=40`
    );
    if (!res.ok) return [];
    const data = await res.json();

    return (data.hits || []).map(
      (hit: {
        objectID: string;
        title: string;
        url: string;
        author: string;
        created_at: string;
        points: number;
        num_comments: number;
        _tags?: string[];
      }) => ({
        id: `hn-${hit.objectID}`,
        title: hit.title || "",
        description: "",
        url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
        source: "hackernews" as const,
        sourceName: "Hacker News",
        author: hit.author || "unknown",
        publishedAt: hit.created_at,
        tags: hit._tags || [],
        score: hit.points || 0,
        commentsCount: hit.num_comments || 0,
      })
    );
  } catch {
    console.warn("Failed to fetch HackerNews");
    return [];
  }
}

// --- Dev.to ---
export async function fetchDevTo(): Promise<NewsArticle[]> {
  const tags = [
    "ai", "react", "nextjs", "javascript", "webdev",
    "machinelearning", "python", "rust", "mobile", "devops",
  ];
  try {
    const allArticles: NewsArticle[] = [];
    const fetches = tags.map(async (tag) => {
      const res = await fetch(
        `https://dev.to/api/articles?tag=${tag}&per_page=8&top=1`
      );
      if (!res.ok) return [];
      const articles = await res.json();
      return articles.map(
        (a: {
          id: number;
          title: string;
          description: string;
          url: string;
          user: { name: string };
          published_at: string;
          tag_list: string[];
          positive_reactions_count: number;
          comments_count: number;
          cover_image: string | null;
          social_image: string | null;
          reading_time_minutes: number;
        }) => ({
          id: `devto-${a.id}`,
          title: a.title,
          description: a.description || "",
          url: a.url,
          source: "devto" as const,
          sourceName: "Dev.to",
          author: a.user?.name || "unknown",
          publishedAt: a.published_at,
          tags: a.tag_list || [],
          score: a.positive_reactions_count || 0,
          commentsCount: a.comments_count || 0,
          imageUrl: a.cover_image || a.social_image || undefined,
        })
      );
    });

    const results = await Promise.all(fetches);
    results.forEach((r) => allArticles.push(...r));
    return allArticles;
  } catch {
    console.warn("Failed to fetch Dev.to");
    return [];
  }
}

// --- GNews ---
export async function fetchGNews(): Promise<NewsArticle[]> {
  if (!GNEWS_API_KEY) {
    console.warn("GNEWS_API_KEY not set");
    return [];
  }

  const queries = [
    "artificial intelligence OR Claude AI OR ChatGPT OR LLM",
    "React OR Next.js OR frontend development",
    "Python OR Rust programming",
  ];

  try {
    const allArticles: NewsArticle[] = [];
    const fetches = queries.map(async (q) => {
      const res = await fetch(
        `https://gnews.io/api/v4/search?q=${encodeURIComponent(q)}&lang=en&max=10&sortby=publishedAt&apikey=${GNEWS_API_KEY}`
      );
      if (!res.ok) return [];
      const data = await res.json();
      return (data.articles || []).map(
        (a: {
          title: string;
          description: string;
          url: string;
          source: { name: string };
          publishedAt: string;
          image: string | null;
        }) => ({
          id: `gnews-${btoa(a.url).slice(0, 40)}`,
          title: a.title,
          description: a.description || "",
          url: a.url,
          source: "gnews" as const,
          sourceName: a.source?.name || "News",
          author: a.source?.name || "unknown",
          publishedAt: a.publishedAt,
          tags: [],
          score: 0,
          commentsCount: 0,
          imageUrl: a.image || undefined,
        })
      );
    });

    const results = await Promise.all(fetches);
    results.forEach((r) => allArticles.push(...r));
    return allArticles;
  } catch {
    console.warn("Failed to fetch GNews");
    return [];
  }
}

// --- Tech News RSS ---
const TECH_NEWS_FEEDS = [
  { url: "https://venturebeat.com/category/ai/feed/", name: "VentureBeat" },
  { url: "https://techcrunch.com/category/artificial-intelligence/feed/", name: "TechCrunch" },
  { url: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml", name: "The Verge" },
  { url: "https://arstechnica.com/ai/feed/", name: "Ars Technica" },
];

export async function fetchTechNews(): Promise<NewsArticle[]> {
  try {
    const fetches = TECH_NEWS_FEEDS.map((feed) =>
      fetchRSSFeed(feed.url, feed.name, "technews")
    );
    const results = await Promise.allSettled(fetches);
    const articles: NewsArticle[] = [];
    for (const r of results) {
      if (r.status === "fulfilled") articles.push(...r.value);
    }
    return articles;
  } catch {
    return [];
  }
}

// --- AI Official Blogs ---
const AI_OFFICIAL_FEEDS = [
  { url: "https://openai.com/blog/rss.xml", name: "OpenAI" },
  { url: "https://blog.google/technology/ai/rss/", name: "Google AI" },
  { url: "https://www.wired.com/feed/tag/ai/latest/rss", name: "WIRED AI" },
  { url: "https://www.technologyreview.com/feed/", name: "MIT Tech Review" },
];

export async function fetchAIOfficial(): Promise<NewsArticle[]> {
  try {
    const fetches = AI_OFFICIAL_FEEDS.map((feed) =>
      fetchRSSFeed(feed.url, feed.name, "aiofficial")
    );
    const results = await Promise.allSettled(fetches);
    const articles: NewsArticle[] = [];
    for (const r of results) {
      if (r.status === "fulfilled") articles.push(...r.value);
    }
    return articles;
  } catch {
    return [];
  }
}

// --- Product Hunt (daily top posts) ---
export async function fetchProductHunt(): Promise<NewsArticle[]> {
  try {
    const res = await fetch(
      "https://www.producthunt.com/feed?category=undefined"
    );
    if (!res.ok) return [];
    const xml = await res.text();
    return parseRSS(xml, "Product Hunt", "producthunt");
  } catch {
    return [];
  }
}

// --- GitHub Trending (via RSS bridge) ---
export async function fetchGitHubTrending(): Promise<NewsArticle[]> {
  try {
    const res = await fetch(
      "https://mshibanami.github.io/GitHubTrendingRSS/daily/all-languages.xml"
    );
    if (!res.ok) return [];
    const xml = await res.text();
    const articles = parseRSS(xml, "GitHub Trending", "github");
    return articles.map((a) => ({
      ...a,
      description: a.description.slice(0, 200),
    }));
  } catch {
    return [];
  }
}

// --- Reddit Programming ---
export async function fetchReddit(): Promise<NewsArticle[]> {
  const subreddits = ["programming", "MachineLearning", "reactjs", "webdev"];
  try {
    const allArticles: NewsArticle[] = [];
    const fetches = subreddits.map(async (sub) => {
      const res = await fetch(
        `https://www.reddit.com/r/${sub}/hot.json?limit=10`,
        { headers: { "User-Agent": "DailyNewsApp/1.0" } }
      );
      if (!res.ok) return [];
      const data = await res.json();
      return (data.data?.children || [])
        .filter((c: { data: { is_self: boolean } }) => !c.data.is_self)
        .map(
          (c: {
            data: {
              id: string;
              title: string;
              selftext: string;
              url: string;
              author: string;
              created_utc: number;
              score: number;
              num_comments: number;
              subreddit: string;
              thumbnail: string;
            };
          }) => ({
            id: `reddit-${c.data.id}`,
            title: c.data.title,
            description: c.data.selftext?.slice(0, 200) || "",
            url: c.data.url,
            source: "reddit" as const,
            sourceName: `r/${c.data.subreddit}`,
            author: c.data.author || "unknown",
            publishedAt: new Date(c.data.created_utc * 1000).toISOString(),
            tags: [c.data.subreddit],
            score: c.data.score || 0,
            commentsCount: c.data.num_comments || 0,
            imageUrl:
              c.data.thumbnail?.startsWith("http")
                ? c.data.thumbnail
                : undefined,
          })
        );
    });

    const results = await Promise.all(fetches);
    results.forEach((r) => allArticles.push(...r));
    return allArticles;
  } catch {
    return [];
  }
}

// --- Deduplicate ---
function deduplicateArticles(articles: NewsArticle[]): NewsArticle[] {
  const seen = new Set<string>();
  return articles.filter((article) => {
    const key = article.title
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .slice(0, 60);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// --- Main fetch all ---
export async function fetchAllNews(
  sourceFilter?: string
): Promise<NewsArticle[]> {
  const fetchers: { key: string; fn: () => Promise<NewsArticle[]> }[] = [
    { key: "hackernews", fn: fetchHackerNews },
    { key: "devto", fn: fetchDevTo },
    { key: "gnews", fn: fetchGNews },
    { key: "technews", fn: fetchTechNews },
    { key: "aiofficial", fn: fetchAIOfficial },
    { key: "producthunt", fn: fetchProductHunt },
    { key: "github", fn: fetchGitHubTrending },
    { key: "reddit", fn: fetchReddit },
  ];

  const activeFetchers =
    sourceFilter && sourceFilter !== "all"
      ? fetchers.filter((f) => f.key === sourceFilter)
      : fetchers;

  const results = await Promise.allSettled(activeFetchers.map((f) => f.fn()));
  let articles: NewsArticle[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") articles.push(...r.value);
  }

  articles = deduplicateArticles(articles);
  articles.sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  return articles;
}
