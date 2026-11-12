"use client";
import { useEffect,useRef,useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Star } from "lucide-react";
import type { Movie } from "@/types/movie";
import { imageUrl } from "@/types/movie";

type SearchResponse={results:Movie[]};
export function SearchPopout({onClose}:{onClose:()=>void}){
  const [query,setQuery]=useState("");const [category,setCategory]=useState<"movies"|"series">("movies");
  const [topTen,setTopTen]=useState<Movie[]>([]);const [loading,setLoading]=useState(true);const [error,setError]=useState(false);
  const input=useRef<HTMLInputElement>(null);const router=useRouter();
  useEffect(()=>{input.current?.focus();const onKey=(event:KeyboardEvent)=>{if(event.key==="Escape")onClose()};window.addEventListener("keydown",onKey);return()=>window.removeEventListener("keydown",onKey)},[onClose]);
  useEffect(()=>{let alive=true;setLoading(true);setError(false);fetch(`/api/movies?category=${category}&period=month&page=1`).then(response=>{if(!response.ok)throw new Error("Request failed");return response.json() as Promise<SearchResponse>}).then(data=>{if(alive)setTopTen((data.results??[]).slice(0,10))}).catch(()=>{if(alive){setTopTen([]);setError(true)}}).finally(()=>{if(alive)setLoading(false)});return()=>{alive=false}},[category]);
  function submit(event:React.FormEvent){event.preventDefault();const value=query.trim();if(!value)return;onClose();router.push(`/search?q=${encodeURIComponent(value)}`)}
  return <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-black/75 px-3 pb-8 pt-24 backdrop-blur-sm sm:px-6 sm:pt-28" onMouseDown={event=>{if(event.target===event.currentTarget)onClose()}}>
    <section role="dialog" aria-modal="true" aria-label="Search Cinevers" className="w-full max-w-5xl overflow-hidden rounded-2xl border border-[#e50945]/40 bg-[#101116] shadow-[0_24px_80px_rgba(0,0,0,.7)]">
      <form onSubmit={submit} className="flex items-center gap-3 border-b border-white/10 px-5 py-4 sm:px-7"><Search size={21} className="shrink-0 text-[#e50945]"/><input ref={input} value={query} onChange={event=>setQuery(event.target.value)} placeholder="Cari film atau serial…" className="min-w-0 flex-1 bg-transparent py-2 text-base text-white outline-none placeholder:text-zinc-500 sm:text-lg"/><button type="submit" className="hidden rounded-full bg-[#e50945] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#ff315e] sm:block">Cari</button><button type="button" onClick={onClose} aria-label="Tutup pencarian" className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10 text-zinc-400 hover:border-[#e50945] hover:text-white"><X size={19}/></button></form>
      <div className="p-5 sm:p-7"><div className="mb-5 flex flex-wrap items-end justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#e50945]">Sedang populer</p><h2 className="mt-1 text-xl font-bold sm:text-2xl">Top 10 Bulan Ini</h2></div><div className="flex rounded-full border border-white/10 bg-black/30 p-1"><button type="button" onClick={()=>setCategory("movies")} className={`rounded-full px-4 py-2 text-xs font-bold ${category==="movies"?"bg-[#e50945] text-white":"text-zinc-400 hover:text-white"}`}>Film</button><button type="button" onClick={()=>setCategory("series")} className={`rounded-full px-4 py-2 text-xs font-bold ${category==="series"?"bg-[#e50945] text-white":"text-zinc-400 hover:text-white"}`}>Series</button></div></div>
        {loading?<p className="py-12 text-center text-sm text-zinc-500">Memuat daftar populer…</p>:error?<p className="py-12 text-center text-sm text-zinc-500">Daftar bulanan belum bisa dimuat. Coba lagi sebentar.</p>:<div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 md:grid-cols-5">{topTen.map((movie,index)=><button key={movie.id} type="button" onClick={()=>{onClose();router.push(`/movies/${movie.id}${category==="series"?"?type=tv":""}`)}} className="group relative min-w-0 text-left"><div className="relative overflow-hidden rounded-xl bg-[#171922]"><img src={imageUrl(movie.poster_path)} alt={movie.title} loading="lazy" className="aspect-[2/3] w-full object-cover transition duration-300 group-hover:scale-[1.03]"/><span className="absolute left-2 top-2 rounded-md bg-black/75 px-2 py-1 text-sm font-black text-white">{String(index+1).padStart(2,"0")}</span><div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent px-3 pb-3 pt-8"><p className="line-clamp-1 text-xs font-semibold text-white">{movie.title}</p><p className="mt-1 flex items-center gap-1 text-[10px] text-zinc-300"><Star size={10} className="fill-amber-400 text-amber-400"/>{movie.vote_average?.toFixed(1)??"—"}</p></div></div></button>)}</div>}
        <p className="mt-5 text-center text-[10px] text-zinc-600">Peringkat berdasarkan tren TMDB bulan ini</p>
      </div>
    </section>
  </div>;
}
