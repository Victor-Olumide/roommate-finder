import { useState, useEffect, useMemo } from "react";
import PersonCard from "../components/PersonCard";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { HiMagnifyingGlass, HiXMark, HiUserGroup } from "react-icons/hi2";
import { db } from "../firebase";
import { normalizeHostelName } from "../utils/hostelData";

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

  // Group filtered entries by normalized hostel
  const grouped = useMemo(() => {
    return filtered.reduce((acc, person) => {
      if (!person.hostel) return acc;
      const canonical = normalizeHostelName(person.hostel);
      const key = canonical.toLowerCase().trim();
      if (!acc[key]) {
        acc[key] = { displayName: canonical, people: [] };
      }
      acc[key].people.push(person);
      return acc;
    }, {});
  }, [filtered]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/60 via-slate-50 to-white text-slate-800 p-4 sm:p-6 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header & Search */}
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100/80 border border-blue-200 text-blue-700 text-xs font-semibold shadow-xs mb-3">
            <HiUserGroup className="text-blue-600 text-sm" />
            Student Directory
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
            All Assigned Students
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm font-normal">
            View all students who have registered their hostel and room allocations.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full max-w-xl">
          <HiMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name, hostel, or room (e.g. Victor, Jamaica, D29)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-10 py-3.5 text-sm rounded-2xl border border-slate-200/80 bg-white/90 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 placeholder-slate-400"
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

        {/* Loading Skeleton Grid */}
        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="w-full bg-white rounded-3xl border border-slate-200/60 overflow-hidden shadow-xs animate-pulse"
              >
                <div className="aspect-square bg-slate-200" />
                <div className="p-3 space-y-2">
                  <div className="h-3.5 bg-slate-200 rounded-md w-3/4" />
                  <div className="h-3 bg-slate-100 rounded-md w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Main Results */}
        {!loading && (
          <div className="space-y-10">
            {searchQuery && (
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Found <span className="font-bold text-slate-900">{filtered.length}</span> student{filtered.length !== 1 ? "s" : ""}{" "}
                matching "<span className="text-blue-600">{searchQuery}</span>"
              </p>
            )}

            {Object.keys(grouped).length === 0 ? (
              <div className="text-center py-16 bg-white/80 backdrop-blur-xl rounded-3xl border border-slate-200/80 p-8 shadow-sm">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center mx-auto mb-3">
                  <HiUserGroup className="text-3xl" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {searchQuery ? "No roommates found" : "No submissions yet"}
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  {searchQuery
                    ? "Try checking for typos or searching by hostel nickname or room number."
                    : "Be the first to submit your room details from the homepage!"}
                </p>
              </div>
            ) : (
              Object.entries(grouped).map(([key, { displayName, people }]) => (
                <section key={key} className="space-y-4">
                  {/* Section Header */}
                  <div className="flex items-center gap-3 border-b border-slate-200/80 pb-3">
                    <div className="h-6 w-1.5 bg-blue-600 rounded-full shrink-0" />
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                      {displayName}
                    </h2>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
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
    </div>
  );
}