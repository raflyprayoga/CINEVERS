export type Movie = {
  id: number; title: string; overview: string; poster_path: string | null; backdrop_path: string | null;
  release_date?: string; first_air_date?: string; vote_average?: number; genre_ids?: number[];
  media_type?: "movie" | "tv"; runtime?: number; genres?: { id: number; name: string }[];
};
export const imageUrl = (path: string | null | undefined, size = "w500") => path ? `https://image.tmdb.org/t/p/${size}${path}` : "https://images.unsplash.com/photo-1489599849927-2ee91addy9b?auto=format&fit=crop&w=500&q=80";
