import { GiHamburgerMenu } from "react-icons/gi";
import { IoClose } from "react-icons/io5";

import { useState, useEffect } from "react";

export default function Sidebar() {
    
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isOpen]);

  return (
    <>
    <div className="overflow-x-hidden">
    { isOpen ? <IoClose className="text-2xl font-bold hover:text-blue-200"  onClick={() => setIsOpen(false)}/> :
    <GiHamburgerMenu className="text-2xl font-bold hover:text-blue-200" onClick={() => setIsOpen(!isOpen)} />  }

    {/* Backdrop overlay - tap outside to close */}
    {isOpen && (
      <div
        className="fixed inset-0 z-40 bg-transparent"
        onClick={() => setIsOpen(false)}
      />
    )}

    <div className={`fixed top-0 left-0 h-screen w-97 bg-white text-blue-800 p-6 transform ${isOpen ? "translate-x-0" : "-translate-x-full"} transition-transform duration-300 ease-in-out z-50 mt-18`}>
        
        <ul className="space-y-4">
          <a href="/"><li className="hover:text-blue-200 cursor-pointer">Home</li></a>
            <a href="/rooms"><li className="hover:text-blue-200 cursor-pointer">Rooms</li></a>
            <a href="/roommate"><li className="hover:text-blue-200 cursor-pointer">Roommate</li></a>
        </ul>
    </div>
    </div>
    </>
  );
}
