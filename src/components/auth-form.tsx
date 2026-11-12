"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { flushPendingWatchlist } from "@/lib/user-data";
import { ArrowLeft } from "lucide-react";

export function AuthForm({mode}:{mode:"login"|"register"|"forgot"}) {
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [name,setName]=useState("");
  const [message,setMessage]=useState("");
  const [busy,setBusy]=useState(false);
  const router=useRouter();

  async function submit(event:React.FormEvent){
    event.preventDefault();setBusy(true);setMessage("");
    const supabase=createClient();
    if(!supabase){setMessage("Add your Supabase URL and anon key to .env.local to enable accounts.");setBusy(false);return;}
    try{
      if(mode==="register"){
        const {data,error}=await supabase.auth.signUp({email,password,options:{data:{username:name,display_name:name}}});
        if(error)throw error;
        if(data.session){window.dispatchEvent(new CustomEvent("cineverse-toast",{detail:"Akun berhasil dibuat dan kamu sudah masuk."}));router.push("/my-list");router.refresh();void flushPendingWatchlist().catch(()=>{});}
        else setMessage("Check your email to confirm your account.");
      }else if(mode==="forgot"){
        const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:`${location.origin}/reset-password`});
        if(error)throw error;
        setMessage("Password reset link sent. Check your inbox.");
      }else{
        const {error}=await supabase.auth.signInWithPassword({email,password});
        if(error)throw error;
        const next=new URLSearchParams(location.search).get("next");
        window.dispatchEvent(new CustomEvent("cineverse-toast",{detail:"Berhasil masuk ke akun Cineverse."}));
        router.push(next||"/");router.refresh();
        // Account authentication is independent from optional profile/watchlist
        // tables. Never leave a successful login on this form if DB setup is pending.
        void flushPendingWatchlist().catch(()=>{});
      }
    }catch(err){setMessage(err instanceof Error?err.message:"Something went wrong. Please try again.");}
    finally{setBusy(false);}
  }

  return <main className="grid min-h-screen place-items-center px-5"><Link href="/" className="absolute left-6 top-6 inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white"><ArrowLeft size={16}/><span className="brand-wordmark text-[11px] text-white">CINE<span className="text-[#e50945]">VERSE</span></span></Link><div className="w-full max-w-md rounded-2xl border border-white/[.08] bg-[#12141b] p-7 shadow-2xl md:p-10"><div className="mb-7 flex items-center gap-3"><Image src="/cineverse-mark.png" alt="Cineverse" width={48} height={48} className="h-12 w-12 rounded-full object-cover"/><div><h1 className="text-2xl font-black">{mode==="login"?"Welcome back":mode==="register"?"Join Cineverse":"Reset password"}</h1><p className="mt-1 text-sm text-zinc-400">Your cinema, everywhere.</p></div></div><form onSubmit={submit} className="space-y-4">{mode==="register"&&<label className="block text-xs font-medium text-zinc-300">Display name<input required value={name} onChange={e=>setName(e.target.value)} className="mt-2 w-full rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:border-[#e50945]"/></label>}<label className="block text-xs font-medium text-zinc-300">Email<input required type="email" value={email} onChange={e=>setEmail(e.target.value)} className="mt-2 w-full rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:border-[#e50945]"/></label>{mode!=="forgot"&&<label className="block text-xs font-medium text-zinc-300">Password<input required minLength={8} type="password" value={password} onChange={e=>setPassword(e.target.value)} className="mt-2 w-full rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:border-[#e50945]"/></label>}<button disabled={busy} className="w-full rounded-lg bg-[#e50945] py-3 text-sm font-bold transition hover:bg-[#f51c58] disabled:opacity-50">{busy?"Please wait…":mode==="login"?"Sign in":mode==="register"?"Create account":"Send reset link"}</button></form>{message&&<p role="status" className="mt-4 rounded-lg bg-white/5 p-3 text-sm text-zinc-300">{message}</p>}<div className="mt-6 flex flex-wrap justify-between gap-3 text-xs text-zinc-400">{mode==="login"?<><Link href="/forgot-password" className="hover:text-white">Forgot password?</Link><Link href="/register" className="hover:text-white">Create an account</Link></>:<Link href="/login" className="hover:text-white">Already have an account? Sign in</Link>}</div></div></main>;
}
