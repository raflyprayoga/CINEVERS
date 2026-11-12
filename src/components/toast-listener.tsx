"use client";
import { useEffect,useState } from "react";
import { CheckCircle2,CircleAlert } from "lucide-react";

export function ToastListener(){
  const [message,setMessage]=useState("");
  useEffect(()=>{
    let timeout:ReturnType<typeof setTimeout>;
    const show=(event:Event)=>{const detail=(event as CustomEvent<string>).detail;setMessage(detail);clearTimeout(timeout);timeout=setTimeout(()=>setMessage(""),4500)};
    window.addEventListener("cineverse-toast",show);
    return()=>{window.removeEventListener("cineverse-toast",show);clearTimeout(timeout)};
  },[]);
  if(!message)return null;
  const success=/ditambahkan|dihapus|sudah ada|berhasil masuk|berhasil dibuat/i.test(message);
  return <div role={success?"status":"alert"} className={`fixed bottom-5 left-1/2 z-[100] flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-start gap-2 break-words rounded-xl border bg-[#17141a]/95 px-4 py-3 text-xs text-white shadow-2xl backdrop-blur sm:text-sm ${success?"border-emerald-500/40":"border-red-500/30"}`}>{success?<CheckCircle2 size={17} className="mt-0.5 shrink-0 text-emerald-400"/>:<CircleAlert size={17} className="mt-0.5 shrink-0 text-[#e50945]"/>}<span>{message}</span></div>;
}
