import type { Movie } from "@/types/movie";
const BASE = "https://api.themoviedb.org/3";
export async function tmdb<T>(path: string, params: Record<string, string> = {}): Promise<T | null> {
  const key = process.env.TMDB_API_KEY;
  const accessToken = process.env.TMDB_ACCESS_TOKEN;
  if (!key && !accessToken) return null;
  const url = new URL(`${BASE}${path}`);
  // Prefer the v3 API key when present; the v4 token remains a server-side fallback.
  if (key) url.searchParams.set("api_key", key);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  try {
    const cache = { next: { revalidate: process.env.NODE_ENV === "development" ? 60 : 3600 } };
    let response = await fetch(url, {
      headers: !key && accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
      ...cache,
    });
    if (!response.ok && (response.status === 401 || response.status === 403) && key && accessToken) {
      const fallbackUrl = new URL(`${BASE}${path}`);
      Object.entries(params).forEach(([k, v]) => fallbackUrl.searchParams.set(k, v));
      response = await fetch(fallbackUrl, { headers: { Authorization: `Bearer ${accessToken}` }, ...cache });
    }
    if (!response.ok) {
      console.error(`TMDB request failed (${response.status}) for ${path}`);
      return null;
    }
    return await response.json() as T;
  } catch { return null; }
}
export async function getMovieRows(path: string, params: Record<string, string> = {}) {
  const data = await tmdb<{ results: Movie[]; total_pages?: number }>(path, { ...params, page: params.page ?? "1" });
  const results = data?.results ?? [];
  if (results.length >= 20 || !data?.total_pages || data.total_pages < 2) return results.slice(0, 20);
  const nextPage = await tmdb<{ results: Movie[] }>(path, { ...params, page: "2" });
  return [...results, ...(nextPage?.results ?? [])].slice(0, 20);
}
