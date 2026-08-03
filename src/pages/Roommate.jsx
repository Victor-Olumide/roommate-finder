import { useState, useEffect, useMemo } from "react";
import PersonCard from "../components/PersonCard";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

export default function Roommate() {
  const [searchQuery, setSearchQuery] = useState("");
  const [allRoommates, setAllRoommates] = useState([]);
  const [loading, setLoading] = useState(true);

  // Subscribe to Firestore entries in real-time
  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, "entries"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setAllRoommates(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.error("Firestore error:", err);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Filter by name, hostel, or room number
  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return allRoommates;

    return allRoommates.filter(
      (person) =>
        person.name?.toLowerCase().includes(q) ||
        person.hostel?.toLowerCase().includes(q) ||
        person.room?.toLowerCase().includes(q)
    );
  }, [allRoommates, searchQuery]);

  // Group filtered entries by hostel
  const grouped = useMemo(() => {
    return filtered.reduce((acc, person) => {
      if (!person.hostel) return acc;
      const key = person.hostel.toLowerCase().trim();
      if (!acc[key]) {
        acc[key] = { displayName: person.hostel, people: [] };
      }
      acc[key].people.push(person);
      return acc;
    }, {});
  }, [filtered]);

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8 bg-gray-50">
      {/* Header & Search */}
      <div className="max-w-5xl mx-auto mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">
          All Assigned Roommates
        </h1>
        <p className="text-gray-600 text-xs sm:text-sm mb-5">
          View all students who have registered their hostel and room allocations.
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
            placeholder="Search by name, hostel, or room (e.g. A55)..."
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

      {/* Loading Skeleton Grid */}
      {loading && (
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="w-full bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-xs animate-pulse"
              >
                <div className="aspect-square bg-gray-200" />
                <div className="p-3 space-y-2">
                  <div className="h-3.5 bg-gray-200 rounded-md w-3/4" />
                  <div className="h-3 bg-gray-100 rounded-md w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Results */}
      {!loading && (
        <div className="max-w-5xl mx-auto space-y-10">
          {searchQuery && (
            <p className="text-xs sm:text-sm text-gray-500 font-medium">
              Found {filtered.length} student{filtered.length !== 1 ? "s" : ""}{" "}
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
                {searchQuery ? "No roommates found" : "No submissions yet"}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {searchQuery
                  ? "Try checking for typos or search by hostel/room number instead."
                  : "Be the first to submit your room details from the homepage!"}
              </p>
            </div>
          ) : (
            Object.entries(grouped).map(([key, { displayName, people }]) => (
              <section key={key} className="space-y-4">
                {/* Section Header */}
                <div className="flex items-center gap-2.5 border-b border-gray-200/60 pb-3">
                  <div className="h-5 w-1.5 bg-blue-600 rounded-full shrink-0" />
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                    {displayName}
                  </h2>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                    {people.length} {people.length === 1 ? "student" : "students"}
                  </span>
                </div>

                {/* Grid Container */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                  {people.map((person, idx) => (
                    <PersonCard
                      key={person.id || person._id || `${person.name}-${idx}`}
                      name={person.name}
                      hostel={person.hostel}
                      room={person.room}
                      image={person.image}
                    />
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