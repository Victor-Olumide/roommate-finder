import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { GiHamburgerMenu } from "react-icons/gi";
import { IoClose } from "react-icons/io5";
import { RiWhatsappFill } from "react-icons/ri";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);

  // Close sidebar on window scroll
  useEffect(() => {
    const handleScroll = () => {
      if (isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isOpen]);

  const closeSidebar = () => setIsOpen(false);

  return (
    <>
      {/* Toggle Button */}
      <button 
        aria-label="Toggle Navigation Menu"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-blue-800 hover:text-blue-600 transition-colors focus:outline-none"
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
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs transition-opacity"
          onClick={closeSidebar}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 left-0 h-screen w-full sm:w-80 bg-white text-blue-900 p-6 transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-in-out z-50 flex flex-col justify-between shadow-2xl overflow-y-auto`}
      >
        <div>
          {/* Header & Close Button */}
          <div className="flex items-center justify-between pb-6 border-b border-gray-100 mb-6">
            <h2 className="font-bold text-lg text-blue-800">Menu</h2>
            <button 
              onClick={closeSidebar}
              className="p-1 text-gray-500 hover:text-blue-800 transition-colors"
            >
              <IoClose className="text-2xl" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav>
            <ul className="flex flex-col space-y-4 font-medium text-base">
              <li>
                <Link
                  to="/"
                  onClick={closeSidebar}
                  className="block py-2 px-3 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-all"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/rooms"
                  onClick={closeSidebar}
                  className="block py-2 px-3 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-all"
                >
                  Rooms
                </Link>
              </li>
              <li>
                <Link
                  to="/roommate"
                  onClick={closeSidebar}
                  className="block py-2 px-3 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-all"
                >
                  All Details
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        {/* Footer Contact Card inside Drawer */}
        <div className="mt-auto pt-6">
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex flex-col gap-2">
            <p className="text-xs font-semibold text-blue-900 uppercase tracking-wider">
              Need Help?
            </p>
            <a
              href="https://wa.me/2349026023588?text=Hi%20VODESIGN,%20I%20have%20a%20question%20about%20the%20ABUAD%20Roommate%20Finder"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-green-600 hover:text-green-700 font-medium text-sm transition-colors"
            >
              <RiWhatsappFill className="text-2xl" />
              <span>Contact Developer</span>
            </a>
          </div>
          
          <p className="text-xs text-gray-400 text-center mt-4">
            Built by VODESIGN
          </p>
        </div>
      </div>
    </>
  );
}