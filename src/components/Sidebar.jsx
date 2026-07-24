import { GiHamburgerMenu } from "react-icons/gi";
import { IoClose } from "react-icons/io5";
import { RiWhatsappFill } from "react-icons/ri";


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

    <div className={`fixed top-0 left-0 h-screen w-97 bg-white text-blue-800 p-6 transform ${isOpen ? "translate-x-0" : "-translate-x-full"} transition-transform duration-300 ease-in-out z-50 my-18 flex flex-col min-h-screen overflow-y-auto`}>
        
        <ul className="flex flex-col gap-2 space-y-4 h-1/3">
          <a href="/"><li className="hover:text-blue-200 cursor-pointer">Home</li></a>
            <a href="/rooms"><li className="hover:text-blue-200 cursor-pointer">Rooms</li></a>
            <a href="/roommate"><li className="hover:text-blue-200 cursor-pointer">All Details</li></a>
        </ul>

        <div className="bg-blue-100 text-left p-4 mt-10 rounded-lg flex-flex-col gap-2">
          Contact Developer
          <a href="https://wa.me/+2349026023588" target="_blank" rel="noopener noreferrer">
            <h2 className="text-green-500 cursor-pointer flex flex-row gap-1 items-center"> 
              <RiWhatsappFill className="text-2xl" />
              <p>WhatsApp</p>
            </h2>
          </a>
        </div>
    </div>
    </div>
    </>
  );
}
