"use client";
import { useState } from "react";
import Link from "next/link";
import { ChevronLeft,ChevronRight,Info,Play,Sparkles,Star } from "lucide-react";
import type { Movie } from "@/types/movie";
import { imageUrl } from "@/types/movie";

export function FeaturedCarousel({movies}:{movies:Movie[]}){
  const [index,setIndex]=useState(0);
  const movie=movies[index];
  const change=(direction:-1|1)=>setIndex(current=>(current+direction+movies.length)%movies.length);
  const year=(movie.release_date??movie.first_air_date??"").slice(0,4);
  const genres=({28:"Action",12:"Adventure",16:"Animation",35:"Comedy",80:"Crime",99:"Documentary",18:"Drama",10751:"Family",14:"Fantasy",36:"History",27:"Horror",10402:"Music",9648:"Mystery",10749:"Romance",878:"Sci-Fi",10770:"TV Movie",53:"Thriller",10752:"War",37:"Western"} as Record<number,string>);
  const labels=(movie.genre_ids??[]).slice(0,2).map(id=>genres[id]).filter(Boolean).join(" · ");
  return <section className="relative flex min-h-[620px] items-end overflow-hidden pb-16 pt-32 md:min-h-[680px] md:pb-20">
    <img key={movie.id} src={imageUrl(movie.backdrop_path,"original")} alt="" className="absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-500"/>
    <div className="hero-shade absolute inset-0"/>
    <div className="relative z-10 mx-auto w-full max-w-[1500px] px-5 md:px-10">
      <div key={movie.id} className="max-w-2xl page-fade">
        <div className="mb-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[.2em] text-[#ff416f]"><Sparkles size={14}/> Editor’s spotlight <span className="mx-1 h-1 w-1 rounded-full bg-zinc-500"/> This week</div>
        <h1 className="max-w-xl text-5xl font-black leading-[.98] tracking-[-.06em] md:text-7xl">{movie.title}</h1>
        <div className="mt-5 flex items-center gap-3 text-sm text-zinc-200"><span className="flex items-center gap-1.5 text-amber-300"><Star size={14} className="fill-current"/>{movie.vote_average?.toFixed(1)??"—"}</span><span className="h-1 w-1 rounded-full bg-zinc-500"/>{year||"New"}{labels&&<><span className="h-1 w-1 rounded-full bg-zinc-500"/>{labels}</>}</div>
        <p className="mt-4 max-w-lg text-sm leading-6 text-zinc-300 md:text-base md:leading-7">{movie.overview}</p>
        <div className="mt-7 flex flex-wrap gap-3"><Link href={`/watch/${movie.id}${movie.media_type==="tv"?"?type=tv":""}`} className="flex items-center gap-2 rounded-lg bg-[#e50945] px-6 py-3 text-sm font-bold shadow-[0_10px_30px_#e5094545] transition hover:bg-[#f51c58]"><Play size={17} fill="currentColor"/> Watch now</Link><Link href={`/movies/${movie.id}${movie.media_type==="tv"?"?type=tv":""}`} className="flex items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-6 py-3 text-sm font-semibold backdrop-blur transition hover:bg-white/20"><Info size={17}/> More info</Link></div>
        <div className="mt-9 flex items-center gap-2 text-[11px] text-zinc-400"><span className="rounded border border-white/20 px-1.5 py-0.5 font-bold tracking-wider">4K</span><span className="rounded border border-white/20 px-1.5 py-0.5 font-bold">5.1</span> A premium pick for tonight</div>
      </div>
      <div className="absolute bottom-5 right-5 flex items-center gap-3 text-xs text-zinc-300 md:bottom-7 md:right-10">
        <button type="button" aria-label="Previous featured film" onClick={()=>change(-1)} className="grid h-10 w-10 place-items-center rounded-full border-2 border-[#e50945] bg-black/80 text-white shadow-[0_0_18px_#e5094530] backdrop-blur transition hover:bg-[#e50945]"><ChevronLeft size={19}/></button>
        <span aria-live="polite" className="text-xl font-black tracking-tight tabular-nums">{String(index+1).padStart(2,"0")}</span>
        <button type="button" aria-label="Next featured film" onClick={()=>change(1)} className="grid h-10 w-10 place-items-center rounded-full border-2 border-[#e50945] bg-black/80 text-white shadow-[0_0_18px_#e5094530] backdrop-blur transition hover:bg-[#e50945]"><ChevronRight size={19}/></button>
      </div>
    </div>
  </section>;
}
