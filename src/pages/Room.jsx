import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { API } from "../api";

export default function Room() {
  const [searchQuery, setSearchQuery] = useState("");
  const [allRooms, setAllRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEntries = async () => {
      try {
        const res = await fetch(`${API}/entries`);
        const json = await res.json();
        if (json.success) {
          const roomMap = new Map();
          json.data.forEach((entry) => {
            // Normalise to lowercase so "Male Hall 1" and "male hall 1" merge
            const key = `${entry.hostel.toLowerCase()}||${entry.room.toLowerCase()}`;
            if (!roomMap.has(key)) {
              // Store the first-seen display values (preserves whatever casing was submitted first)
              roomMap.set(key, {
                hostel: entry.hostel,
                room: entry.room,
                occupants: 0,
              });
            }
            roomMap.get(key).occupants++;
          });
          setAllRooms(Array.from(roomMap.values()));
        }
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEntries();
    const interval = setInterval(fetchEntries, 5000);
    return () => clearInterval(interval);
  }, []);

  const filtered = allRooms.filter(
    (room) =>
      room.room.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.hostel.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group by lowercase key but display using the stored hostel name
  const grouped = filtered.reduce((acc, room) => {
    const key = room.hostel.toLowerCase();
    if (!acc[key]) acc[key] = { displayName: room.hostel, rooms: [] };
    acc[key].rooms.push(room);
    return acc;
  }, {});

  return (
    <div className="min-h-screen md:p-8 p-5 bg-gray-50">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
          Find Your Roommates
        </h1>
        <p className="text-gray-500 text-sm md:text-base mb-4">
          Select your hostel and room to see who you'll be staying with.
        </p>

        {/* Search */}
        <div className="relative w-full">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by hostel or room number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-700"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
                <div className="bg-gray-200 h-20" />
                <div className="p-4 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {!loading && (
        <>
          {searchQuery && (
            <p className="text-sm text-gray-500 max-w-4xl mx-auto mb-4">
              {filtered.length} room{filtered.length !== 1 ? "s" : ""} found for "
              <span className="font-medium">{searchQuery}</span>"
            </p>
          )}

          {Object.keys(grouped).length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="text-lg font-medium">
                {searchQuery ? "No rooms match your search" : "No rooms yet"}
              </p>
              <p className="text-sm mt-1">
                {searchQuery ? "Try a different search term" : "Be the first to add your details!"}
              </p>
            </div>
          ) : (
            Object.entries(grouped).map(([key, { displayName, rooms }]) => (
              <section key={key} className="max-w-5xl mx-auto mb-10">
                <div className="flex items-center gap-3 mb-5">
                  <div className="h-8 w-1 bg-blue-600 rounded-full" />
                  <h2 className="text-xl md:text-2xl font-bold text-gray-800">{displayName}</h2>
                  <span className="text-sm text-gray-400 font-medium">
                    ({rooms.length} room{rooms.length !== 1 ? "s" : ""})
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {rooms.map((room, idx) => (
                    <Link
                      key={`${room.hostel}-${room.room}-${idx}`}
                      to={`/room/${encodeURIComponent(room.hostel)}/${room.room}`}
                      className="block bg-white rounded-xl shadow-md hover:shadow-xl border border-gray-100 transition-all duration-300 overflow-hidden group"
                    >
                      <div className="bg-blue-600 p-4 text-white">
                        <p className="text-xs font-medium uppercase tracking-wider opacity-75">Room</p>
                        <p className="text-2xl font-bold">{room.room}</p>
                      </div>
                      <div className="p-4 flex flex-col gap-2">
                        <p className="text-sm text-gray-500 truncate">{room.hostel}</p>
                        <div className="flex items-center gap-2 text-sm">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          <span className="text-gray-600 font-medium">
                            {room.occupants} {room.occupants === 1 ? "person" : "people"}
                          </span>
                        </div>
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          <span className="text-blue-600 text-sm font-medium group-hover:underline inline-flex items-center gap-1">
                            See who's in this room
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
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
        </>
      )}
    </div>
  );
}
