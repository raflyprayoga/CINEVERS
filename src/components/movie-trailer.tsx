"use client";
import { useEffect,useState } from "react";
import { Play,X } from "lucide-react";
import type { Movie } from "@/types/movie";

type TrailerResponse={videos?:{results?:Array<{key:string;site:string;type:string;official?:boolean}>}};

export function MovieTrailerButton({movie}:{movie:Movie}){
  const [open,setOpen]=useState(false);
  const [key,setKey]=useState("");
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");

  useEffect(()=>{
    if(!open)return;
    const previousOverflow=document.body.style.overflow;
    document.body.style.overflow="hidden";
    const onKeyDown=(event:KeyboardEvent)=>{if(event.key==="Escape")setOpen(false)};
    window.addEventListener("keydown",onKeyDown);
    return()=>{document.body.style.overflow=previousOverflow;window.removeEventListener("keydown",onKeyDown)};
  },[open]);

  async function showTrailer(){
    setOpen(true);setKey("");setError("");setLoading(true);
    try{
      const type=movie.media_type==="tv"?"tv":"movie";
      const response=await fetch(`/api/movies/${movie.id}?type=${type}`);
      if(!response.ok)throw new Error("Trailer gagal dimuat. Coba lagi.");
      const data=await response.json() as TrailerResponse;
      const youtube=(data.videos?.results??[]).filter(video=>video.site==="YouTube");
      const trailer=youtube.find(video=>video.type==="Trailer"&&video.official)??youtube.find(video=>video.type==="Trailer")??youtube.find(video=>video.type==="Teaser");
      if(!trailer)throw new Error("Trailer tidak tersedia untuk judul ini.");
      setKey(trailer.key);
    }catch(cause){setError(cause instanceof Error?cause.message:"Trailer tidak bisa dimuat.")}
    finally{setLoading(false)}
  }

  return <>
    <button type="button" title={`Putar trailer ${movie.title}`} aria-label={`Putar trailer ${movie.title}`} onClick={()=>void showTrailer()} className="absolute left-2 top-2 z-10 grid h-9 w-9 place-items-center rounded-full border border-white/20 bg-black/65 text-white opacity-100 shadow-lg backdrop-blur transition hover:scale-105 hover:bg-[#e50945] sm:opacity-0 sm:group-hover:opacity-100"><Play size={15} fill="currentColor"/></button>
    {open&&<div role="presentation" onMouseDown={event=>{if(event.target===event.currentTarget)setOpen(false)}} className="fixed inset-0 z-[90] grid place-items-center bg-black/85 p-4 backdrop-blur-sm">
      <section role="dialog" aria-modal="true" aria-label={`Trailer ${movie.title}`} className="relative w-full max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-[#101116] shadow-2xl">
        <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-5"><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#e50945]">Official preview</p><h2 className="truncate text-sm font-bold sm:text-base">{movie.title} — Trailer</h2></div><button type="button" onClick={()=>setOpen(false)} aria-label="Tutup trailer" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"><X size={18}/></button></div>
        <div className="relative aspect-video bg-black">{key?<iframe className="absolute inset-0 h-full w-full" src={`https://www.youtube-nocookie.com/embed/${key}?autoplay=1&rel=0`} title={`${movie.title} trailer`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen/>:<div className="absolute inset-0 grid place-items-center px-6 text-center text-sm text-zinc-300">{loading?<span className="animate-pulse">Memuat trailer…</span>:error}</div>}</div>
        <p className="px-4 py-3 text-xs text-zinc-500 sm:px-5">Trailer adalah cuplikan resmi, bukan film penuh.</p>
      </section>
    </div>}
  </>;
}
