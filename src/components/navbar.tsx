"use client";
import Link from "next/link";
import { useState } from "react";
import { Clapperboard, Search, Menu, X, UserRound } from "lucide-react";
export function Navbar() {
  const [open,setOpen]=useState(false);
  return <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[.06] bg-[#08090d]/85 backdrop-blur-xl">
    <div className="mx-auto flex h-[72px] max-w-[1500px] items-center gap-8 px-5 md:px-10">
      <Link href="/" className="flex shrink-0 items-center gap-2.5"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#e50945] shadow-[0_6px_25px_#e5094540]"><Clapperboard size={19}/></span><span className="text-[20px] font-black tracking-[-.06em]">CINE<span className="text-[#e50945]">VERSE</span></span></Link>
      <nav className={`${open?"absolute left-0 right-0 top-[72px] flex flex-col border-b border-white/10 bg-[#0d0e13] px-6 py-5":"hidden"} gap-6 text-sm text-zinc-400 md:static md:flex md:flex-row md:items-center md:border-0 md:bg-transparent md:p-0`}>
        <Link className="text-white" href="/">Home</Link><Link className="hover:text-white" href="/movies">Movies</Link><Link className="hover:text-white" href="/series">Series</Link><Link className="hover:text-white" href="/my-list">My List</Link>
      </nav>
      <div className="ml-auto flex items-center gap-4"><Link href="/search" aria-label="Search" className="text-zinc-300 hover:text-white"><Search size={20}/></Link><Link href="/profile" aria-label="Profile" className="hidden rounded-full border border-white/10 bg-white/5 p-2 text-zinc-200 hover:bg-white/10 sm:block"><UserRound size={17}/></Link><Link href="/login" className="hidden rounded-full bg-white px-4 py-2 text-xs font-semibold text-black hover:bg-zinc-200 sm:block">Sign in</Link><button className="md:hidden" onClick={()=>setOpen(!open)} aria-label="Toggle menu">{open?<X/>:<Menu/>}</button></div>
    </div>
  </header>;
}
