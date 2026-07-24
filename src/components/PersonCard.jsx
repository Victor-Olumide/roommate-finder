import { Link } from "react-router-dom";

export default function PersonCard({
  name = "Full Name",
  hostel = "Male Hall 1",
  room = "A55",
  image = "",
}) {
  return (
    <Link
      to={`/room/${encodeURIComponent(hostel)}/${encodeURIComponent(room)}`}
      className="block w-full max-w-[150px] bg-white rounded-xl shadow-md hover:shadow-xl border border-gray-100 transition-all duration-300 overflow-hidden group"
    >
      {/* Profile Image */}
      <div className="aspect-square w-full overflow-hidden bg-neutral-200 flex items-center justify-center">
        {image ? (
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <span className="text-3xl font-bold text-gray-400 group-hover:scale-105 transition-transform duration-300 select-none">
            {name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      {/* Details */}
      <div className="flex flex-col gap-1.5 p-3">
        <h1 className="text-sm sm:text-base font-bold text-gray-800 leading-tight truncate">
          {name}
        </h1>
        <div className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-500">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3.5 w-3.5 shrink-0 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="truncate">{hostel}, Room {room}</span>
        </div>
      </div>
    </Link>
  );
}
