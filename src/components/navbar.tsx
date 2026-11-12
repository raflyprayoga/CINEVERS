"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect,useState } from "react";
import type { User } from "@supabase/supabase-js";
import { Menu,Search,X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { SearchPopout } from "@/components/search-popout";
import { flushPendingWatchlist } from "@/lib/user-data";

const links=[
  {label:"Home",href:"/"},
  {label:"Movies",href:"/movies"},
  {label:"Series",href:"/series"},
  {label:"My List",href:"/my-list"},
];

export function Navbar(){
  const [open,setOpen]=useState(false);
  const [searchOpen,setSearchOpen]=useState(false);
  const [scrolled,setScrolled]=useState(false);
  const [accountName,setAccountName]=useState<string|null>(null);
  const pathname=usePathname();
  const active=(href:string)=>href==="/"?pathname==="/":pathname===href||pathname.startsWith(`${href}/`);
  useEffect(()=>{const update=()=>setScrolled(window.scrollY>24);update();window.addEventListener("scroll",update,{passive:true});return()=>window.removeEventListener("scroll",update)},[]);
  useEffect(()=>{
    const supabase=createClient();if(!supabase)return;
    const nameOf=(user:User|null)=>user?(user.user_metadata?.display_name??user.user_metadata?.username??user.email?.split("@")[0]??"Account"):null;
    // Subscribe before reading storage so a sign-in event cannot be overwritten
    // by a stale initial lookup.
    const {data:{subscription}}=supabase.auth.onAuthStateChange((event,session)=>{
      setAccountName(nameOf(session?.user??null));
      if(event==="SIGNED_IN")window.setTimeout(()=>void flushPendingWatchlist().catch(()=>{}),0);
    });
    void supabase.auth.getSession().then(({data})=>setAccountName(nameOf(data.session?.user??null)));
    return()=>subscription.unsubscribe();
  },[]);
  return <header className="fixed inset-x-0 top-4 z-50 px-3 sm:px-6">
    <div className={`relative mx-auto flex h-[76px] max-w-[1600px] items-center rounded-2xl border px-4 transition-all duration-300 sm:px-8 ${scrolled?"border-white/10 bg-[#09090d]/55 shadow-[0_10px_38px_rgba(0,0,0,.35)] backdrop-blur-2xl":"border-transparent bg-transparent shadow-none backdrop-blur-0"}`}>
      <Link href="/" aria-label="Cineverse home" className="flex shrink-0 items-center gap-2.5 text-white">
        <Image src="/cineverse-mark.png" alt="" width={52} height={52} priority className="h-12 w-12 rounded-full object-cover"/>
        <span className="brand-wordmark hidden text-[13px] text-white sm:block">CINE<span className="text-[#e50945]">VERSE</span></span>
      </Link>

      <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 md:flex">
        {links.map(link=><Link key={link.href} href={link.href} aria-current={active(link.href)?"page":undefined} className={`rounded-full px-5 py-3 text-xs font-bold uppercase tracking-[.13em] transition-colors ${active(link.href)?"text-[#ff315e]":"text-white/70 hover:bg-white/[.07] hover:text-white"}`}>{link.label}</Link>)}
      </nav>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <button type="button" onClick={()=>setSearchOpen(true)} aria-label="Search" className="grid h-10 w-10 place-items-center rounded-full text-white/75 transition hover:bg-white/10 hover:text-[#ff315e]"><Search size={19}/></button>
        <Link href={accountName?"/profile":"/login"} className="hidden max-w-52 truncate rounded-full bg-[#e50945] px-6 py-3 text-xs font-bold uppercase tracking-[.12em] text-white transition hover:bg-[#ff315e] sm:block">{accountName??"Sign in"}</Link>
        <button type="button" className="grid h-10 w-10 place-items-center rounded-full text-white md:hidden" onClick={()=>setOpen(!open)} aria-label={open?"Close navigation":"Open navigation"}>{open?<X size={22}/>:<Menu size={22}/>}</button>
      </div>
    </div>
    {open&&<nav className="mx-3 mt-2 flex flex-col gap-1 rounded-2xl border border-[#e50945]/25 bg-[#0d0d12]/[.98] p-2 shadow-xl backdrop-blur-xl md:hidden">
      {links.map(link=><Link key={link.href} href={link.href} onClick={()=>setOpen(false)} aria-current={active(link.href)?"page":undefined} className={`rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-[.12em] ${active(link.href)?"bg-[#e50945] text-white":"text-white/60 hover:bg-white/10 hover:text-white"}`}>{link.label}</Link>)}
      {accountName&&<Link href="/profile" onClick={()=>setOpen(false)} className="rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-[.12em] text-white/60 hover:bg-white/10 hover:text-white">Pengaturan akun · {accountName}</Link>}
      <Link href={accountName?"/profile":"/login"} onClick={()=>setOpen(false)} className="mt-1 truncate rounded-full bg-[#e50945] px-4 py-3 text-center text-xs font-bold uppercase tracking-[.12em] text-white">{accountName??"Sign in"}</Link>
    </nav>}
    {searchOpen&&<SearchPopout onClose={()=>setSearchOpen(false)}/>}
  </header>;
}
