import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { collection, query, onSnapshot } from "firebase/firestore";
import { signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { 
  HiMagnifyingGlass, HiXMark, HiHomeModern, 
  HiArrowRight, HiUserGroup, HiSparkles 
} from "react-icons/hi2";
import { db, auth } from "../firebase";
import { normalizeHostelName } from "../utils/hostelData";

export default function Rooms() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all"); // "all" | "female" | "male"
  const [allEntries, setAllEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // 1. Ensure the user is authenticated (Anonymous or Google) before querying
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        signInAnonymously(auth).catch((err) => console.error("Auth error:", err));
      }
    });
    return () => unsub();
  }, []);

  // 2. Subscribe to Firestore ONLY after auth is confirmed
  useEffect(() => {
    if (!user) return; // Don't query until Firebase gives us a secure token

    setLoading(true);
    const q = query(collection(db, "entries"));
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        // Client-side sort: newest entries first
        docs.sort((a, b) => {
          const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return tB - tA;
        });
        setAllEntries(docs);
        setLoading(false);
      },
      (err) => {
        console.error("Firestore room list error:", err);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [user]); // Re-run when the user object is ready

  // Aggregate room map (Hostel + Room unique grouping with normalization)
  const allRooms = useMemo(() => {
    const roomMap = new Map();

    allEntries.forEach((entry) => {
      if (!entry.hostel || !entry.room) return;
      const canonicalHostel = normalizeHostelName(entry.hostel);
      const cleanRoom = entry.room.trim().toUpperCase();
      const key = `${canonicalHostel.toLowerCase()}||${cleanRoom.toLowerCase()}`;

      if (!roomMap.has(key)) {
        roomMap.set(key, {
          hostel: canonicalHostel,
          room: cleanRoom,
          occupants: 0,
          capacity: entry.roomCapacity || 4,
          isFemale: canonicalHostel.toLowerCase().includes("female"),
        });
      }
      roomMap.get(key).occupants++;
    });

    return Array.from(roomMap.values());
  }, [allEntries]);

  // Filter rooms by active tab & search query
  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return allRooms.filter((room) => {
      // 1. Gender category tab filter
      if (activeFilter === "female" && !room.isFemale) return false;
      if (activeFilter === "male" && room.isFemale) return false;

      // 2. Search query filter
      if (!q) return true;
      return (
        room.room.toLowerCase().includes(q) ||
        room.hostel.toLowerCase().includes(q)
      );
    });
  }, [allRooms, searchQuery, activeFilter]);

  // Group rooms by normalized hostel & sort rooms alphanumerically
  const grouped = useMemo(() => {
    const groups = filtered.reduce((acc, room) => {
      const key = room.hostel.toLowerCase().trim();
      if (!acc[key]) acc[key] = { displayName: room.hostel, rooms: [] };
      acc[key].rooms.push(room);
      return acc;
    }, {});

    // Sort rooms inside each hostel (e.g. A101 before D107)
    Object.values(groups).forEach((g) => {
      g.rooms.sort((a, b) =>
        a.room.localeCompare(b.room, undefined, { numeric: true, sensitivity: "base" })
      );
    });

    return groups;
  }, [filtered]);

  const totalRegisteredOccupants = allEntries.length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/60 via-slate-50 to-white text-slate-800 p-4 sm:p-6 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 pb-2">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100/80 border border-blue-200 text-blue-700 text-xs font-semibold shadow-xs mb-3">
              <HiHomeModern className="text-blue-600 text-sm" />
              Registered Rooms
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
              Explore All Hostels & Rooms
            </h1>
            <p className="text-slate-600 text-xs sm:text-sm font-normal">
              Select any room to see verified co-occupants or claim an open bed space.
            </p>
          </div>

          {/* Quick Stats Pill */}
          {!loading && (
            <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs shrink-0">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-base">
                <HiUserGroup />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Verified Occupants</p>
                <p className="text-sm font-bold text-slate-900">{totalRegisteredOccupants} Students</p>
              </div>
            </div>
          )}
        </div>

        {/* Controls: Search + Filter Tabs */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Search Input */}
          <div className="relative w-full max-w-md">
            <HiMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search hostel or room (e.g. Wema, D107, Jamaica)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-10 py-3 text-sm rounded-2xl border border-slate-200/80 bg-white shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 placeholder-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors"
                aria-label="Clear search"
              >
                <HiXMark className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Category Filter Tabs */}
          <div className="inline-flex p-1 bg-slate-200/60 rounded-2xl border border-slate-200 text-xs font-bold shrink-0">
            <button
              onClick={() => setActiveFilter("all")}
              className={`px-4 py-2 rounded-xl transition-all ${
                activeFilter === "all"
                  ? "bg-white text-blue-700 shadow-sm border border-slate-200/60"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All Hostels
            </button>
            <button
              onClick={() => setActiveFilter("female")}
              className={`px-4 py-2 rounded-xl transition-all ${
                activeFilter === "female"
                  ? "bg-white text-blue-700 shadow-sm border border-slate-200/60"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Female Hostels
            </button>
            <button
              onClick={() => setActiveFilter("male")}
              className={`px-4 py-2 rounded-xl transition-all ${
                activeFilter === "male"
                  ? "bg-white text-blue-700 shadow-sm border border-slate-200/60"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Male Hostels
            </button>
          </div>
        </div>

        {/* Loading Skeleton */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-3xl border border-slate-200/60 overflow-hidden shadow-xs animate-pulse"
              >
                <div className="bg-slate-200 h-20" />
                <div className="p-4 space-y-2">
                  <div className="h-3.5 bg-slate-200 rounded-md w-3/4" />
                  <div className="h-3 bg-slate-100 rounded-md w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Results */}
        {!loading && (
          <div className="space-y-10">
            {searchQuery && (
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Found <span className="font-bold text-slate-900">{filtered.length}</span> room{filtered.length !== 1 ? "s" : ""}{" "}
                matching "<span className="text-blue-600">{searchQuery}</span>"
              </p>
            )}

            {Object.keys(grouped).length === 0 ? (
              <div className="text-center py-16 bg-white/80 backdrop-blur-xl rounded-3xl border border-slate-200/80 p-8 shadow-sm">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center mx-auto mb-3">
                  <HiUserGroup className="text-3xl" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {searchQuery ? "No rooms match your search" : "No registered rooms in this section"}
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  {searchQuery
                    ? "Try searching by room number (e.g. D107) or hostel nickname like Jamaica or Wema."
                    : "Upload your allocation slip from the homepage to be the first in your room!"}
                </p>
                <Link
                  to="/"
                  className="mt-4 inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all text-xs font-bold shadow-sm"
                >
                  <HiSparkles /> Upload Allocation Slip
                </Link>
              </div>
            ) : (
              Object.entries(grouped).map(([key, { displayName, rooms }]) => (
                <section key={key} className="space-y-4">
                  {/* Hostel Header */}
                  <div className="flex items-center gap-3 border-b border-slate-200/80 pb-3">
                    <div className="h-6 w-1.5 bg-blue-600 rounded-full shrink-0" />
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                      {displayName}
                    </h2>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      {rooms.length} {rooms.length === 1 ? "room" : "rooms"} registered
                    </span>
                  </div>

                  {/* Rooms Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {rooms.map((room, idx) => {
                      const isFull = room.occupants >= room.capacity;
                      const spotsLeft = room.capacity - room.occupants;

                      return (
                        <Link
                          key={`${room.hostel}-${room.room}-${idx}`}
                          to={`/room/${encodeURIComponent(room.hostel)}/${encodeURIComponent(
                            room.room
                          )}`}
                          className="block bg-white rounded-3xl border border-slate-200/80 hover:border-blue-300 shadow-xs hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 overflow-hidden group hover:-translate-y-1"
                        >
                          <div className="bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 p-4 text-white flex items-center justify-between">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">Room</p>
                              <p className="text-2xl font-black">{room.room}</p>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-semibold bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full inline-block">
                                {room.occupants} / {room.capacity}
                              </span>
                              <p className="text-[10px] opacity-80 mt-1 font-medium">
                                {isFull ? "Full" : `${spotsLeft} spot${spotsLeft !== 1 ? "s" : ""} left`}
                              </p>
                            </div>
                          </div>

                          <div className="p-4 flex flex-col justify-between gap-3">
                            <p className="text-xs font-medium text-slate-500 truncate">
                              {room.hostel}
                            </p>

                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                              <span className="text-blue-600 text-xs font-bold group-hover:underline inline-flex items-center gap-1">
                                View roommates
                                <HiArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                              </span>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}