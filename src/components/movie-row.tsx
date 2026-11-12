"use client";
import { useEffect,useRef,useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { BookmarkPlus,ChevronLeft,ChevronRight,Star } from "lucide-react";
import type { Movie } from "@/types/movie";
import { imageUrl } from "@/types/movie";
import { notifyWatchlistAdded,notifyWatchlistError,notifyWatchlistExists,requestWatchlistAdd } from "@/lib/user-data";

export function MovieRow({ title,movies,label }:{title:string;movies:Movie[];label?:string}){
  const router=useRouter();
  const rail=useRef<HTMLDivElement>(null);
  const [canGoLeft,setCanGoLeft]=useState(false);
  const [canGoRight,setCanGoRight]=useState(false);
  useEffect(()=>{
    const element=rail.current;if(!element)return;
    const update=()=>{setCanGoLeft(element.scrollLeft>4);setCanGoRight(element.scrollLeft+element.clientWidth<element.scrollWidth-4)};
    update();element.addEventListener("scroll",update,{passive:true});window.addEventListener("resize",update);
    return()=>{element.removeEventListener("scroll",update);window.removeEventListener("resize",update)};
  },[movies.length]);
  const move=(direction:-1|1)=>{const element=rail.current;if(element)element.scrollBy({left:direction*(element.clientWidth*.8),behavior:"smooth"})};
  async function addToList(movie:Movie){try{const result=await requestWatchlistAdd(movie);if(result==="signed-out"){router.push("/login?next=%2Fmy-list");return}if(result==="exists"){notifyWatchlistExists(movie.title);return}window.dispatchEvent(new Event("cineverse-list-change"));notifyWatchlistAdded(movie.title)}catch(error){notifyWatchlistError(error)}}
  return <section className="mb-10">
    <div className="mb-4 px-5 md:px-10"><p className="mb-1 text-[10px] font-bold uppercase tracking-[.22em] text-[#e50945]">{label??"Cinevers picks"}</p><h2 className="text-xl font-bold tracking-tight md:text-2xl">{title}</h2></div>
    <div className="relative">
    <div ref={rail} className="no-scrollbar flex gap-3 overflow-x-auto scroll-smooth px-5 pb-3 md:gap-4 md:px-10">
      {movies.map((movie,i)=><motion.div key={`${movie.media_type??"movie"}-${movie.id}`} initial={{opacity:0,y:10}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:Math.min(i*.04,.2)}} className="group relative w-[145px] shrink-0 md:w-[190px]">
        <Link href={`/movies/${movie.id}${movie.media_type==="tv"?"?type=tv":""}`}><div className="poster relative aspect-[2/3] overflow-hidden rounded-xl bg-[#171922]"><img loading="lazy" src={imageUrl(movie.poster_path)} alt={movie.title} className="h-full w-full object-cover"/><div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-70"/><div className="absolute bottom-3 left-3 right-3"><div className="flex items-center gap-1 text-[11px] font-semibold"><Star size={12} className="fill-amber-400 text-amber-400"/>{movie.vote_average?.toFixed(1)??"—"}<span className="ml-auto text-zinc-300">{(movie.release_date??movie.first_air_date??"").slice(0,4)}</span></div><h3 className="mt-1 line-clamp-1 text-sm font-semibold">{movie.title}</h3></div></div></Link>
        <button title="Add to My List" onClick={()=>void addToList(movie)} className="absolute right-2 top-2 rounded-full border border-white/15 bg-black/55 p-2 opacity-0 backdrop-blur transition group-hover:opacity-100 hover:bg-[#e50945]" aria-label={`Add ${movie.title} to My List`}><BookmarkPlus size={15}/></button>
      </motion.div>)}
    </div>
    <button type="button" aria-label={`Scroll ${title} left`} disabled={!canGoLeft} onClick={()=>move(-1)} className="absolute left-2 top-1/2 z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border-2 border-[#e50945] bg-black/80 text-white shadow-[0_0_18px_#e5094530] backdrop-blur transition hover:bg-[#e50945] disabled:cursor-default disabled:opacity-35"><ChevronLeft size={22}/></button>
    <button type="button" aria-label={`Scroll ${title} right`} disabled={!canGoRight} onClick={()=>move(1)} className="absolute right-2 top-1/2 z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border-2 border-[#e50945] bg-black/80 text-white shadow-[0_0_18px_#e5094530] backdrop-blur transition hover:bg-[#e50945] disabled:cursor-default disabled:opacity-35"><ChevronRight size={22}/></button>
    </div>
  </section>;
}
