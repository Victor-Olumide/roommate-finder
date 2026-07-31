import { useState, useEffect } from "react";
import { FaPhone } from "react-icons/fa6";
import { RiWhatsappFill } from "react-icons/ri";

// Helper to format Nigerian WhatsApp numbers cleanly into international format
function formatWhatsAppUrl(number) {
  let cleaned = number.replace(/[^0-9]/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "234" + cleaned.slice(1);
  }
  return `https://wa.me/${cleaned}`;
}

function Modal({ entry, onClose }) {
  // Close on Escape key
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const { name, hostel, room, phone, whatsapp, bio, image } = entry;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/30 hover:bg-black/50 text-white transition-all cursor-pointer"
          aria-label="Close"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Profile image */}
        <div className="w-full h-64 bg-gray-100 overflow-hidden rounded-t-2xl flex items-center justify-center relative">
          {image ? (
            <img src={image} alt={name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-600 font-bold text-6xl select-none">
              {name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="p-6 space-y-5">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{name}</h2>
            <p className="text-sm font-medium text-blue-600 mt-1">
              {hostel} • Room {room}
            </p>
          </div>

          {bio && (
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                Note from Roommate
              </p>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{bio}</p>
            </div>
          )}

          <div className="flex flex-col gap-3 pt-3 border-t border-gray-100">
            {phone && (
              <a
                href={`tel:${phone}`}
                className="flex items-center gap-3 px-4 py-3 bg-blue-50/60 rounded-xl hover:bg-blue-100/60 transition-all group"
              >
                <div className="w-10 h-10 flex items-center justify-center bg-blue-600 text-white rounded-lg shrink-0">
                  <FaPhone className="text-base" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Call Phone</p>
                  <p className="text-sm font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                    {phone}
                  </p>
                </div>
              </a>
            )}

            {whatsapp && (
              <a
                href={formatWhatsAppUrl(whatsapp)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3 bg-green-50/60 rounded-xl hover:bg-green-100/60 transition-all group"
              >
                <div className="w-10 h-10 flex items-center justify-center bg-green-500 text-white rounded-lg shrink-0">
                  <RiWhatsappFill className="text-2xl" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Message on WhatsApp</p>
                  <p className="text-sm font-semibold text-gray-800 group-hover:text-green-600 transition-colors">
                    {whatsapp}
                  </p>
                </div>
              </a>
            )}

            {!phone && !whatsapp && (
              <p className="text-sm text-gray-400 text-center py-2">No direct contact details provided.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RoommateCard({
  name = "FullName",
  hostel = "Male Hostel 1",
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
        className="flex flex-col sm:flex-row gap-4 max-w-xl w-full bg-white p-4 rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 transition-all duration-300 cursor-pointer group"
      >
        {/* Profile Image */}
        <div className="bg-gray-100 w-full sm:w-40 h-48 sm:h-40 shrink-0 rounded-xl overflow-hidden relative">
          {image ? (
            <img
              src={image}
              alt={name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-500 text-4xl font-bold">
              {name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-col justify-between w-full">
          <div className="space-y-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors leading-tight">
                {name}
              </h3>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-gray-300 group-hover:text-blue-500 shrink-0 mt-1 transition-colors"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                />
              </svg>
            </div>

            <p className="text-xs sm:text-sm font-semibold text-blue-600">
              {hostel} • Room {room}
            </p>

            {bio && (
              <p className="text-gray-600 text-xs sm:text-sm leading-relaxed line-clamp-2 pt-1">
                {bio}
              </p>
            )}
          </div>

          {/* Phone & WhatsApp Quick Actions */}
          <div
            className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            {phone && (
              <a
                href={`tel:${phone}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white text-xs font-semibold rounded-lg transition-all duration-200 active:scale-95"
              >
                <FaPhone className="text-xs" />
                <span>Call</span>
              </a>
            )}
            {whatsapp && (
              <a
                href={formatWhatsAppUrl(whatsapp)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold rounded-lg transition-all duration-200 active:scale-95"
              >
                <RiWhatsappFill className="text-sm" />
                <span>WhatsApp</span>
              </a>
            )}

            {!phone && !whatsapp && (
              <span className="text-xs text-gray-400">No quick contact info</span>
            )}
          </div>
        </div>
      </div>

      {modalOpen && <Modal entry={entry} onClose={() => setModalOpen(false)} />}
    </>
  );
}