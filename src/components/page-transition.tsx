"use client";
import { AnimatePresence,motion,useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";

export function PageTransition({children}:{children:React.ReactNode}){
  const pathname=usePathname();
  const reduceMotion=useReducedMotion();
  const duration=reduceMotion?0:0.2;
  return <AnimatePresence mode="wait" initial={false}>
    <motion.div key={pathname} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration,ease:"easeOut"}}>
      {children}
    </motion.div>
  </AnimatePresence>;
}
