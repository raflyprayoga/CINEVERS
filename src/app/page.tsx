import { ShieldCheck, MonitorPlay, Zap } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { MovieRow } from "@/components/movie-row";
import { FeaturedCarousel } from "@/components/featured-carousel";
import { getMovieRows } from "@/lib/tmdb";
import type { Movie } from "@/types/movie";
const fallback: Movie[] = [
 {id:603,title:"The Matrix",overview:"A computer hacker learns from mysterious rebels about the true nature of his reality and his role in the war against its controllers.",poster_path:"/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",backdrop_path:"/fNG7i7RqMErkcqhohV2a6cV1Ehy.jpg",release_date:"1999-03-31",vote_average:8.2,genre_ids:[28,878]},
 {id:157336,title:"Interstellar",overview:"As humanity's future on Earth is in jeopardy, a team of explorers travels beyond this galaxy to discover whether mankind has a future among the stars.",poster_path:"/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",backdrop_path:"/rAiYTfKGqDCRIIqo664sY9XZIvQ.jpg",release_date:"2014-11-05",vote_average:8.7,genre_ids:[12,18,878]},
 {id:155,title:"The Dark Knight",overview:"When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest tests of his ability to fight injustice.",poster_path:"/qJ2tW6WMUDux911r6m7haRef0WH.jpg",backdrop_path:"/hkBaDkMWbLaf8B1lsWsKX7Ew3Xq.jpg",release_date:"2008-07-16",vote_average:8.5,genre_ids:[18,28,80]},
 {id:27205,title:"Inception",overview:"A thief who steals corporate secrets through dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.",poster_path:"/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg",backdrop_path:"/s3TBrRGB1iav7gFOCNx3H31MoES.jpg",release_date:"2010-07-15",vote_average:8.4,genre_ids:[28,878,12]},
 {id:76341,title:"Mad Max: Fury Road",overview:"In a post-apocalyptic wasteland, a woman rebels against a tyrannical ruler in search for her homeland with the help of a group of female prisoners.",poster_path:"/8tZYtuWezp8JbcsvHYO0O46tFbo.jpg",backdrop_path:"/phUL4sT4o2G3M1Lo4p4q9hL8sUv.jpg",release_date:"2015-05-13",vote_average:8.1,genre_ids:[28,12,878]},
 {id:550,title:"Fight Club",overview:"An insomniac office worker and a soap maker form an underground fight club that evolves into something much more.",poster_path:"/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",backdrop_path:"/hZkgoQYus5vegHoetLkCJzb17zJ.jpg",release_date:"1999-10-15",vote_average:8.4,genre_ids:[18]},
 {id:98,title:"Gladiator",overview:"A former Roman General sets out to exact vengeance against the corrupt emperor who murdered his family.",poster_path:"/ty8TGRuvJLPUmAR1H1nRIsgwvim.jpg",backdrop_path:"/tyBkB8G9iPr4Zb4a6kzvZkZ7T5.jpg",release_date:"2000-05-04",vote_average:8.2,genre_ids:[28,18,12]}
];
function ensureFeatured(movies:Movie[]){
 const result=[...movies.slice(0,7)];const seen=new Set(result.map(movie=>movie.id));
 for(const movie of fallback){if(result.length>=7)break;if(!seen.has(movie.id)){result.push(movie);seen.add(movie.id)}}
 return result;
}
function ensureTwenty(movies:Movie[],genreId?:number){
 const result=[...movies.slice(0,20)];const seen=new Set(result.map(movie=>movie.id));
 const fallbacks=genreId?fallback.filter(movie=>movie.genre_ids?.includes(genreId)):fallback;
 for(const movie of fallbacks){if(result.length>=20)break;if(!seen.has(movie.id)){result.push(movie);seen.add(movie.id)}}
 return result;
}
const features = [[MonitorPlay,"Cinema, anywhere","A seamless experience on every screen."],[ShieldCheck,"Your own space","Build a watchlist that feels like you."],[Zap,"Find your next favorite","Thoughtful discovery, without the endless scroll."]] as const;
export default async function Home() {
 const [trending,popular,topRated,newest,tv,action,comedy,horror,romance,scifi] = await Promise.all([getMovieRows("/trending/movie/week"),getMovieRows("/movie/popular"),getMovieRows("/movie/top_rated"),getMovieRows("/movie/now_playing"),getMovieRows("/tv/popular"),getMovieRows("/discover/movie",{with_genres:"28"}),getMovieRows("/discover/movie",{with_genres:"35"}),getMovieRows("/discover/movie",{with_genres:"27"}),getMovieRows("/discover/movie",{with_genres:"10749"}),getMovieRows("/discover/movie",{with_genres:"878"})]);
 const tvTitles=tv.map(m=>({...m,title:(m as Movie & {name?:string}).name??m.title,media_type:"tv" as const}));
 const rows=[{title:"Trending this week",label:"Everyone’s talking",data:trending},{title:"Popular movies",label:"The crowd favorites",data:popular},{title:"Critically acclaimed",label:"Only the best",data:topRated},{title:"Fresh from the cinema",label:"Just landed",data:newest},{title:"Series worth staying in for",label:"Your next obsession",data:tvTitles},{title:"Action & adventure",label:"Big-screen energy",genreId:28,data:action},{title:"Comedy",label:"A little joy goes a long way",genreId:35,data:comedy},{title:"Horror",label:"For the brave",genreId:27,data:horror},{title:"Romance",label:"Stories with heart",genreId:10749,data:romance},{title:"Science fiction",label:"Beyond the ordinary",genreId:878,data:scifi}];
 return <main className="min-h-screen overflow-hidden"><Navbar/><FeaturedCarousel movies={ensureFeatured(trending)}/>
  <div className="relative z-10 -mt-6 pb-14">{rows.map(r=><MovieRow key={r.title} title={r.title} label={r.label} movies={ensureTwenty(r.data,r.genreId)}/>)}</div>
  <section className="border-t border-white/[.06] bg-[#0c0d12] px-5 py-16 md:px-10"><div className="mx-auto max-w-[1380px]"><div className="mb-8 text-center"><p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#e50945]">A better way to watch</p><h2 className="mt-2 text-3xl font-bold tracking-tight">Your stories. Your screen.</h2><p className="mt-2 text-sm text-zinc-400">The little things that make movie night feel special.</p></div><div className="grid gap-4 md:grid-cols-3">{features.map(([Icon,title,desc])=><div key={title} className="rounded-2xl border border-white/[.07] bg-[#12141b] p-6"><Icon className="text-[#e50945]" size={22}/><h3 className="mt-5 font-semibold">{title}</h3><p className="mt-2 text-sm text-zinc-400">{desc}</p></div>)}</div></div></section><footer className="flex flex-col items-center justify-between gap-3 px-6 py-8 text-xs text-zinc-500 md:flex-row md:px-10"><span>© 2026 Cineverse. Your cinema, everywhere.</span><span>Movie data powered by TMDB · Streaming links require authorized sources.</span></footer></main>;
}
