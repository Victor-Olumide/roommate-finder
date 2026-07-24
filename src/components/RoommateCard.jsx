import { useState, useEffect } from "react";
import { RiWhatsappFill } from "react-icons/ri";

function Modal({ entry, onClose }) {
  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const { name, hostel, room, phone, whatsapp, bio, image } = entry;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-all"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Profile image */}
        <div className="w-full h-56 bg-neutral-100 overflow-hidden rounded-t-2xl flex items-center justify-center">
          {image ? (
            <img src={image} alt={name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-6xl font-bold text-gray-300 select-none">
              {name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        {/* Details */}
        <div className="p-6 space-y-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{name}</h2>
            <p className="text-sm text-gray-500 mt-0.5">{hostel}, Room {room}</p>
          </div>

          {bio && (
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{bio}</p>
            </div>
          )}

          <div className="flex flex-col gap-3 pt-2 border-t border-gray-100">
            {phone && (
              <a
                href={`tel:${phone}`}
                className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all group"
              >
                <div className="w-9 h-9 flex items-center justify-center bg-blue-100 rounded-lg shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Phone</p>
                  <p className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">{phone}</p>
                </div>
              </a>
            )}

            {whatsapp && (
              <a
                href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3 bg-green-50 rounded-xl hover:bg-green-100 transition-all group"
              >
                <div className="w-9 h-9 flex items-center justify-center bg-green-100 rounded-lg shrink-0">
                  <RiWhatsappFill className="text-xl text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">WhatsApp</p>
                  <p className="text-sm font-medium text-gray-700 group-hover:text-green-600 transition-colors">{whatsapp}</p>
                </div>
              </a>
            )}

            {!phone && !whatsapp && (
              <p className="text-sm text-gray-400 text-center py-2">No contact info provided</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RoommateCard({
  name = "FullName",
  hostel = "Male Hall 1",
  room = "A55",
  phone = "",
  whatsapp = "",
  bio = "",
  image = "",
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const entry = { name, hostel, room, phone, whatsapp, bio, image };

  return (
    <>
      <div
        onClick={() => setModalOpen(true)}
        className="flex flex-col sm:flex-row gap-4 max-w-xl w-full bg-white p-4 rounded-xl shadow-md hover:shadow-xl border border-gray-100 transition-all duration-300 cursor-pointer group"
      >
        {/* Profile Image */}
        <div className="bg-neutral-200 w-full sm:w-44 h-48 sm:h-44 shrink-0 rounded-xl overflow-hidden">
          {image ? (
            <img
              src={image}
              alt={name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl font-bold">
              {name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-col gap-2 w-full sm:w-2/3">
          <div className="flex items-start justify-between gap-2">
            <h1 className="text-lg sm:text-xl font-bold text-gray-800 leading-tight">{name}</h1>
            {/* "Tap to expand" hint */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-300 group-hover:text-blue-400 shrink-0 mt-1 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </div>

          <p className="text-sm text-gray-500">{hostel}, Room {room}</p>

          {bio && (
            <p className="text-gray-500 text-sm leading-relaxed line-clamp-2">{bio}</p>
          )}

          {bio && bio.length > 80 && (
            <span className="text-xs text-blue-500 font-medium">Tap to read more…</span>
          )}

          {/* Phone & WhatsApp */}
          <div
            className="flex flex-row items-center justify-between gap-3 mt-auto pt-3 border-t border-gray-100"
            onClick={(e) => e.stopPropagation()} // let links work without opening modal
          >
            {phone && (
              <div className="flex items-center gap-2 text-gray-600 text-sm font-medium">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>{phone}</span>
              </div>
            )}
            {whatsapp && (
              <a
                href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-all duration-200 active:scale-95"
              >
                <RiWhatsappFill className="text-lg" />
                <span>WhatsApp</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {modalOpen && <Modal entry={entry} onClose={() => setModalOpen(false)} />}
    </>
  );
}
