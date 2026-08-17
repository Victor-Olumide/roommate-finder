import { useState, useEffect } from "react";
import { FaPhone, FaGraduationCap, FaLayerGroup } from "react-icons/fa6";
import { RiWhatsappFill } from "react-icons/ri";

function formatWhatsAppUrl(number) {
  if (!number) return "";
  let cleaned = number.replace(/[^0-9]/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "234" + cleaned.slice(1);
  }
  return `https://wa.me/${cleaned}`;
}

function Modal({ entry, onClose }) {
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const { name, hostel, room, department, level, phone, whatsapp, bio, image } = entry;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md transition-all duration-300 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-slate-900/20 hover:bg-slate-900/40 backdrop-blur-md text-white transition-all cursor-pointer"
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

        {/* Profile Image */}
        <div className="w-full h-64 bg-slate-100 overflow-hidden rounded-t-3xl flex items-center justify-center relative">
          {image ? (
            <img src={image} alt={name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-500 font-black text-7xl select-none">
              {name?.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Modal Content */}
        <div className="p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{name}</h2>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mt-2 border border-blue-100">
              {hostel} • Room {room}
            </div>
          </div>

          {/* Department & Level Badges */}
          {(department || level) && (
            <div className="grid grid-cols-2 gap-3 pt-1">
              {department && (
                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-blue-600 shadow-sm shrink-0">
                    <FaGraduationCap className="text-lg" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Department</p>
                    <p className="text-xs font-bold text-slate-800 truncate">{department}</p>
                  </div>
                </div>
              )}

              {level && (
                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
                    <FaLayerGroup className="text-lg" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Level</p>
                    <p className="text-xs font-bold text-slate-800">{level} Level</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Bio / Note */}
          {bio && (
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Note from Roommate
              </p>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap font-medium">{bio}</p>
            </div>
          )}

          {/* Contact Details */}
          <div className="flex flex-col gap-3 pt-4 border-t border-slate-100">
            {phone && (
              <a
                href={`tel:${phone}`}
                className="flex items-center gap-4 px-5 py-4 bg-blue-50/60 rounded-2xl hover:bg-blue-50 transition-all border border-transparent hover:border-blue-100 group"
              >
                <div className="w-12 h-12 flex items-center justify-center bg-blue-600 text-white rounded-xl shrink-0 shadow-sm shadow-blue-500/20 group-hover:scale-105 transition-transform">
                  <FaPhone className="text-lg" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400">Call Phone</p>
                  <p className="text-sm font-black text-slate-800 group-hover:text-blue-600 transition-colors">
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
                className="flex items-center gap-4 px-5 py-4 bg-emerald-50/60 rounded-2xl hover:bg-emerald-50 transition-all border border-transparent hover:border-emerald-100 group"
              >
                <div className="w-12 h-12 flex items-center justify-center bg-emerald-500 text-white rounded-xl shrink-0 shadow-sm shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                  <RiWhatsappFill className="text-2xl" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400">Message on WhatsApp</p>
                  <p className="text-sm font-black text-slate-800 group-hover:text-emerald-600 transition-colors">
                    {whatsapp}
                  </p>
                </div>
              </a>
            )}

            {!phone && !whatsapp && (
              <p className="text-sm font-bold text-slate-400 text-center py-4 bg-slate-50 rounded-2xl border border-slate-100">
                No direct contact details provided.
              </p>
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
  department = "",
  level = "",
  phone = "",
  whatsapp = "",
  bio = "",
  image = "",
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const entry = { name, hostel, room, department, level, phone, whatsapp, bio, image };

  return (
    <>
      <div
        onClick={() => setModalOpen(true)}
        className="flex flex-col sm:flex-row gap-4 w-full bg-white p-4 rounded-3xl shadow-xs hover:shadow-xl border border-slate-200/80 hover:border-blue-200 transition-all duration-300 cursor-pointer group"
      >
        {/* Profile Image */}
        <div className="bg-slate-100 w-full sm:w-36 h-48 sm:h-36 shrink-0 rounded-2xl overflow-hidden relative">
          {image ? (
            <img
              src={image}
              alt={name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-500 text-4xl font-black">
              {name?.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-col justify-between w-full min-w-0">
          <div className="space-y-1.5">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors leading-tight truncate">
                {name}
              </h3>
              <div className="w-7 h-7 rounded-full bg-slate-50 flex items-center justify-center shrink-0 group-hover:bg-blue-50 transition-colors mt-0.5">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3.5 w-3.5 text-slate-400 group-hover:text-blue-500 transition-colors"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                  />
                </svg>
              </div>
            </div>

            <p className="text-xs font-bold text-slate-500">
              {department && <span className="mr-1">{department}</span>}
              {level && <span>({level}L)</span>}
            </p>

            {bio && (
              <p className="text-slate-500 text-xs leading-relaxed line-clamp-2 pt-1 font-medium">
                {bio}
              </p>
            )}
          </div>

          {/* Phone & WhatsApp Quick Actions */}
          <div
            className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            {phone && (
              <a
                href={`tel:${phone}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-100/50 text-blue-700 text-xs font-bold rounded-xl transition-all duration-200 active:scale-95"
              >
                <FaPhone className="text-[10px]" />
                <span>Call</span>
              </a>
            )}
            {whatsapp && (
              <a
                href={formatWhatsAppUrl(whatsapp)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100/50 text-emerald-700 text-xs font-bold rounded-xl transition-all duration-200 active:scale-95"
              >
                <RiWhatsappFill className="text-xs" />
                <span>WhatsApp</span>
              </a>
            )}

            {!phone && !whatsapp && (
              <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-md">
                No contact info
              </span>
            )}
          </div>
        </div>
      </div>

      {modalOpen && <Modal entry={entry} onClose={() => setModalOpen(false)} />}
    </>
  );
}