import { Link } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 w-full bg-white/70 backdrop-blur-xl border-b border-slate-200/60 shadow-sm px-4 py-3 sm:px-6 lg:px-8 text-blue-800 text-xs md:text-base flex items-center justify-between transition-all">
      {/* Sidebar Drawer Trigger */}
      <div className="flex items-center">
        <Sidebar />
      </div>

      <Link 
        to="/" 
        className="flex flex-row items-center gap-2 hover:opacity-90 transition-opacity"
      >
        
        <h1 className="font-bold text-xs sm:text-sm md:text-base tracking-wide text-right sm:text-left">
          AFE BABALOLA UNIVERSITY
        </h1>
        <img 
          src="/abuad.png" 
          alt="ABUAD Logo" 
          width={30} 
          height={30} 
          className="object-contain shrink-0" 
        />
      </Link>
    </header>
  );
}