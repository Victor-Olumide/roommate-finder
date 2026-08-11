import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { GiHamburgerMenu } from "react-icons/gi";
import { IoClose } from "react-icons/io5";
import { RiWhatsappFill } from "react-icons/ri";
import { HiHome, HiHomeModern, HiShieldCheck } from "react-icons/hi2";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  // Close sidebar on scroll or route change
  useEffect(() => {
    const handleScroll = () => {
      if (isOpen) setIsOpen(false);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isOpen]);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const closeSidebar = () => setIsOpen(false);

  return (
    <>
      {/* Toggle Button */}
      <button 
        aria-label="Toggle Navigation Menu"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-slate-700 hover:text-blue-600 transition-colors focus:outline-none rounded-xl hover:bg-slate-100/80 active:scale-95"
      >
        {isOpen ? (
          <IoClose className="text-2xl font-bold" />
        ) : (
          <GiHamburgerMenu className="text-2xl font-bold" />
        )}
      </button>

      {/* Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-xs transition-opacity duration-300"
          onClick={closeSidebar}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 left-0 h-screen w-full sm:w-80 bg-white/95 backdrop-blur-2xl text-slate-800 p-6 transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-in-out z-50 flex flex-col justify-between shadow-2xl border-r border-slate-200/80 overflow-y-auto font-sans`}
      >
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-5 border-b border-slate-200/80 mb-6">
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-base text-slate-900 tracking-tight">Navigation</h2>
            </div>
            <button 
              onClick={closeSidebar}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
            >
              <IoClose className="text-2xl" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav>
            <ul className="flex flex-col space-y-2 font-medium text-sm">
              <li>
                <Link
                  to="/"
                  onClick={closeSidebar}
                  className={`flex items-center gap-3 py-3 px-4 rounded-2xl transition-all ${
                    location.pathname === "/"
                      ? "bg-blue-50 text-blue-700 font-bold border border-blue-200/80 shadow-xs"
                      : "text-slate-700 hover:bg-slate-100/80 hover:text-blue-600"
                  }`}
                >
                  <span>Home</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/rooms"
                  onClick={closeSidebar}
                  className={`flex items-center gap-3 py-3 px-4 rounded-2xl transition-all ${
                    location.pathname.startsWith("/room")
                      ? "bg-blue-50 text-blue-700 font-bold border border-blue-200/80 shadow-xs"
                      : "text-slate-700 hover:bg-slate-100/80 hover:text-blue-600"
                  }`}
                >
                  <span>Rooms</span>
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        {/* Footer Contact Card */}
        <div className="mt-auto pt-6 border-t border-slate-200/80 space-y-3">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-200/80 p-4 rounded-2xl space-y-2 shadow-xs">
            <p className="text-[10px] font-extrabold text-blue-900 uppercase tracking-wider">
              Need Support?
            </p>
            <a
              href="https://wa.me/2349026023588?text=Hi%20VODESIGN,%20I%20have%20a%20question%20about%20the%20ABUAD%20Roommate%20Finder"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-bold text-xs transition-colors"
            >
              <RiWhatsappFill className="text-xl shrink-0" />
              <span>Contact Developer</span>
            </a>
          </div>
          
          <p className="text-[11px] font-semibold text-slate-400 text-center">
            Built by VODESIGN
          </p>
        </div>
      </div>
    </>
  );
}