import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { API } from "../api";

export default function Room() {
  const [searchQuery, setSearchQuery] = useState("");
  const [allEntries, setAllEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch entries from API
  useEffect(() => {
    let isMounted = true;

    const fetchEntries = async (isInitial = false) => {
      if (isInitial) setLoading(true);
      try {
        const res = await fetch(`${API}/entries`);
        const json = await res.json();
        if (json.success && isMounted) {
          setAllEntries(json.data || []);
        }
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        if (isMounted && isInitial) setLoading(false);
      }
    };

    fetchEntries(true);
    const interval = setInterval(() => fetchEntries(false), 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Aggregate room map (Hostel + Room unique grouping)
  const allRooms = useMemo(() => {
    const roomMap = new Map();
    allEntries.forEach((entry) => {
      if (!entry.hostel || !entry.room) return;
      const key = `${entry.hostel.toLowerCase().trim()}||${entry.room.toLowerCase().trim()}`;
      if (!roomMap.has(key)) {
        roomMap.set(key, {
          hostel: entry.hostel,
          room: entry.room,
          occupants: 0,
        });
      }
      roomMap.get(key).occupants++;
    });
    return Array.from(roomMap.values());
  }, [allEntries]);

  // Filter rooms by search query
  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return allRooms;

    return allRooms.filter(
      (room) =>
        room.room.toLowerCase().includes(q) ||
        room.hostel.toLowerCase().includes(q)
    );
  }, [allRooms, searchQuery]);

  // Group rooms by hostel
  const grouped = useMemo(() => {
    return filtered.reduce((acc, room) => {
      const key = room.hostel.toLowerCase().trim();
      if (!acc[key]) acc[key] = { displayName: room.hostel, rooms: [] };
      acc[key].rooms.push(room);
      return acc;
    }, {});
  }, [filtered]);

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8 bg-gray-50">
      {/* Header */}
      <div className="max-w-5xl mx-auto mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">
          Find Your Roommates
        </h1>
        <p className="text-gray-600 text-xs sm:text-sm mb-5">
          Select your hostel and room number to see who you'll be staying with.
        </p>

        {/* Search Input */}
        <div className="relative w-full max-w-xl">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search by hostel or room number (e.g. A55)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-10 py-3 text-sm rounded-xl border border-gray-200 bg-white shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-gray-800 placeholder-gray-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-md"
              aria-label="Clear search"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden animate-pulse"
              >
                <div className="bg-gray-200 h-20" />
                <div className="p-4 space-y-2">
                  <div className="h-3.5 bg-gray-200 rounded-md w-3/4" />
                  <div className="h-3 bg-gray-100 rounded-md w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {!loading && (
        <div className="max-w-5xl mx-auto space-y-10">
          {searchQuery && (
            <p className="text-xs sm:text-sm text-gray-500 font-medium">
              Found {filtered.length} room{filtered.length !== 1 ? "s" : ""}{" "}
              matching "<span className="text-gray-800">{searchQuery}</span>"
            </p>
          )}

          {Object.keys(grouped).length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 p-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-14 w-14 mx-auto mb-3 text-gray-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <h3 className="text-base font-bold text-gray-800">
                {searchQuery ? "No rooms match your search" : "No registered rooms yet"}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {searchQuery
                  ? "Try checking your room number spelling."
                  : "Be the first to submit your room allocation from the homepage!"}
              </p>
            </div>
          ) : (
            Object.entries(grouped).map(([key, { displayName, rooms }]) => (
              <section key={key} className="space-y-4">
                {/* Hostel Header */}
                <div className="flex items-center gap-2.5 border-b border-gray-200/60 pb-3">
                  <div className="h-5 w-1.5 bg-blue-600 rounded-full shrink-0" />
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                    {displayName}
                  </h2>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                    {rooms.length} {rooms.length === 1 ? "room" : "rooms"} registered
                  </span>
                </div>

                {/* Rooms Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {rooms.map((room, idx) => (
                    <Link
                      key={`${room.hostel}-${room.room}-${idx}`}
                      to={`/room/${encodeURIComponent(room.hostel)}/${encodeURIComponent(
                        room.room
                      )}`}
                      className="block bg-white rounded-2xl shadow-xs hover:shadow-xl border border-gray-100 hover:border-blue-200 transition-all duration-300 overflow-hidden group hover:-translate-y-1 active:scale-98"
                    >
                      <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 text-white flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                            Room Number
                          </p>
                          <p className="text-2xl font-black">{room.room}</p>
                        </div>
                        <span className="text-xs font-semibold bg-white/20 backdrop-blur-xs px-2.5 py-1 rounded-full">
                          {room.occupants} {room.occupants === 1 ? "person" : "people"}
                        </span>
                      </div>

                      <div className="p-4 flex flex-col justify-between gap-3">
                        <p className="text-xs font-medium text-gray-500 truncate">
                          {room.hostel}
                        </p>

                        <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                          <span className="text-blue-600 text-xs font-bold group-hover:underline inline-flex items-center gap-1">
                            See roommates
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M13 7l5 5m0 0l-5 5m5-5H6"
                              />
                            </svg>
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      )}
    </div>
  );
}