import { Link } from "react-router-dom";
import { HiMapPin } from "react-icons/hi2";

export default function PersonCard({
  name = "Full Name",
  hostel = "Male Hostel 1",
  room = "A55",
  image = "",
}) {
  const initial = name ? name.charAt(0).toUpperCase() : "?";

  return (
    <Link
      to={`/room/${encodeURIComponent(hostel)}/${encodeURIComponent(room)}`}
      className="group block w-full max-w-[180px] overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl active:scale-95"
    >
      {/* Image / Avatar Container */}
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        {image ? (
          <img
            src={image}
            alt={name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-700">
            <span className="text-4xl font-black text-white select-none">
              {initial}
            </span>
          </div>
        )}

        {/* Room Badge Overlay */}
        <span className="absolute right-2.5 top-2.5 rounded-full bg-white/90 backdrop-blur-md px-2.5 py-0.5 text-[11px] font-bold text-gray-800 shadow-sm border border-gray-200/50">
          Room {room}
        </span>
      </div>

      {/* Details */}
      <div className="space-y-1 p-3">
        <h3 className="truncate text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
          {name}
        </h3>

        <div className="flex items-center gap-1 text-xs text-gray-500">
          <HiMapPin className="h-3.5 w-3.5 text-blue-500 shrink-0" />
          <span className="truncate font-medium">{hostel}</span>
        </div>
      </div>
    </Link>
  );
}