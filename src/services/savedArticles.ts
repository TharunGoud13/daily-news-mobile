import { supabase } from "@/lib/supabase";
import { NewsArticle, SavedArticle } from "@/types/news";
import AsyncStorage from "@react-native-async-storage/async-storage";

const DEVICE_ID_KEY = "daily_news_device_id";

async function getDeviceId(): Promise<string> {
  let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

export async function saveArticle(article: NewsArticle): Promise<boolean> {
  try {
    const deviceId = await getDeviceId();
    const { error } = await supabase.from("saved_articles").upsert(
      {
        id: article.id,
        device_id: deviceId,
        title: article.title,
        description: article.description,
        url: article.url,
        source: article.source,
        source_name: article.sourceName,
        author: article.author,
        published_at: article.publishedAt,
        tags: article.tags,
        score: article.score,
        comments_count: article.commentsCount,
        image_url: article.imageUrl || null,
        saved_at: new Date().toISOString(),
      },
      { onConflict: "id,device_id" }
    );
    if (error) {
      console.error("Save article error:", error);
      return false;
    }
    return true;
  } catch (e) {
    console.error("Save article exception:", e);
    return false;
  }
}

export async function unsaveArticle(articleId: string): Promise<boolean> {
  try {
    const deviceId = await getDeviceId();
    const { error } = await supabase
      .from("saved_articles")
      .delete()
      .eq("id", articleId)
      .eq("device_id", deviceId);
    if (error) {
      console.error("Unsave article error:", error);
      return false;
    }
    return true;
  } catch (e) {
    console.error("Unsave article exception:", e);
    return false;
  }
}

export async function getSavedArticles(): Promise<SavedArticle[]> {
  try {
    const deviceId = await getDeviceId();
    const { data, error } = await supabase
      .from("saved_articles")
      .select("*")
      .eq("device_id", deviceId)
      .order("saved_at", { ascending: false });

    if (error) {
      console.error("Get saved articles error:", error);
      return [];
    }

    return (data || []).map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description || "",
      url: row.url,
      source: row.source,
      sourceName: row.source_name,
      author: row.author,
      publishedAt: row.published_at,
      tags: row.tags || [],
      score: row.score || 0,
      commentsCount: row.comments_count || 0,
      imageUrl: row.image_url || undefined,
      saved_at: row.saved_at,
      notes: row.notes,
    }));
  } catch (e) {
    console.error("Get saved articles exception:", e);
    return [];
  }
}

export async function isArticleSaved(articleId: string): Promise<boolean> {
  try {
    const deviceId = await getDeviceId();
    const { data, error } = await supabase
      .from("saved_articles")
      .select("id")
      .eq("id", articleId)
      .eq("device_id", deviceId)
      .limit(1);

    if (error) return false;
    return (data?.length || 0) > 0;
  } catch {
    return false;
  }
}

export async function getSavedArticleIds(): Promise<Set<string>> {
  try {
    const deviceId = await getDeviceId();
    const { data, error } = await supabase
      .from("saved_articles")
      .select("id")
      .eq("device_id", deviceId);

    if (error) return new Set();
    return new Set((data || []).map((row) => row.id));
  } catch {
    return new Set();
  }
}
