export interface NewsArticle {
  id: string;
  title: string;
  description: string;
  url: string;
  source: Source;
  sourceName: string;
  author: string;
  publishedAt: string;
  tags: string[];
  score: number;
  commentsCount: number;
  imageUrl?: string;
}

export type Source =
  | "hackernews"
  | "devto"
  | "gnews"
  | "technews"
  | "aiofficial"
  | "producthunt"
  | "github"
  | "reddit";

export type Category =
  | "all"
  | "ai"
  | "frontend"
  | "react"
  | "nextjs"
  | "mcp"
  | "llm"
  | "mobile"
  | "backend"
  | "devops"
  | "python"
  | "rust";

export interface CategoryConfig {
  key: Category;
  label: string;
  icon: string;
  keywords: string[];
}

export const CATEGORIES: CategoryConfig[] = [
  { key: "all", label: "All", icon: "globe", keywords: [] },
  {
    key: "ai",
    label: "AI & ML",
    icon: "cpu",
    keywords: [
      "ai", "artificial intelligence", "machine learning", "gpt", "claude",
      "gemini", "llama", "openai", "anthropic", "deep learning", "neural",
    ],
  },
  {
    key: "llm",
    label: "LLMs",
    icon: "message-circle",
    keywords: [
      "llm", "large language model", "gpt", "claude", "gemini", "llama",
      "chatgpt", "transformer", "fine-tuning", "rag", "prompt",
    ],
  },
  {
    key: "mcp",
    label: "MCP & Tools",
    icon: "tool",
    keywords: [
      "mcp", "model context protocol", "ai tools", "ai agent", "copilot",
      "cursor", "claude code", "agentic", "function calling",
    ],
  },
  {
    key: "frontend",
    label: "Frontend",
    icon: "layout",
    keywords: [
      "frontend", "css", "html", "javascript", "typescript", "web development",
      "tailwind", "ui", "ux", "svelte", "vue", "angular",
    ],
  },
  {
    key: "react",
    label: "React",
    icon: "code",
    keywords: [
      "react", "reactjs", "react.js", "jsx", "hooks", "server components",
      "react server", "react native", "remix", "gatsby",
    ],
  },
  {
    key: "nextjs",
    label: "Next.js",
    icon: "triangle",
    keywords: ["nextjs", "next.js", "vercel", "app router", "server actions"],
  },
  {
    key: "mobile",
    label: "Mobile",
    icon: "smartphone",
    keywords: [
      "mobile", "ios", "android", "react native", "flutter", "swift",
      "kotlin", "expo", "app development",
    ],
  },
  {
    key: "backend",
    label: "Backend",
    icon: "server",
    keywords: [
      "backend", "api", "database", "node.js", "express", "fastapi",
      "graphql", "rest", "microservices", "serverless",
    ],
  },
  {
    key: "devops",
    label: "DevOps",
    icon: "git-branch",
    keywords: [
      "devops", "docker", "kubernetes", "ci/cd", "aws", "cloud",
      "terraform", "infrastructure", "deployment", "monitoring",
    ],
  },
  {
    key: "python",
    label: "Python",
    icon: "hash",
    keywords: [
      "python", "django", "flask", "fastapi", "pandas", "numpy",
      "pytorch", "tensorflow", "jupyter",
    ],
  },
  {
    key: "rust",
    label: "Rust",
    icon: "zap",
    keywords: [
      "rust", "cargo", "rustlang", "systems programming", "wasm",
      "webassembly", "tokio",
    ],
  },
];

export const SOURCES: { key: Source | "all"; label: string; icon: string; color: string }[] = [
  { key: "all", label: "All", icon: "layers", color: "#6366f1" },
  { key: "hackernews", label: "HN", icon: "trending-up", color: "#f97316" },
  { key: "devto", label: "Dev.to", icon: "edit-3", color: "#3b82f6" },
  { key: "gnews", label: "GNews", icon: "globe", color: "#10b981" },
  { key: "technews", label: "Tech", icon: "monitor", color: "#a855f7" },
  { key: "aiofficial", label: "AI", icon: "cpu", color: "#f43f5e" },
  { key: "producthunt", label: "PH", icon: "award", color: "#ea580c" },
  { key: "github", label: "GitHub", icon: "github", color: "#6b7280" },
  { key: "reddit", label: "Reddit", icon: "message-square", color: "#ef4444" },
];

export interface SavedArticle extends NewsArticle {
  saved_at: string;
  notes?: string;
}
