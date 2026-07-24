import { useState, useEffect } from "react";
import PersonCard from "../components/PersonCard";
import { API } from "../api";

export default function Roommate() {
  const [searchQuery, setSearchQuery] = useState("");
  const [allRoommates, setAllRoommates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEntries = async () => {
      try {
        const res = await fetch(`${API}/entries`);
        const json = await res.json();
        if (json.success) {
          setAllRoommates(json.data);
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

  const filtered = allRoommates.filter((person) =>
    person.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const grouped = filtered.reduce((acc, person) => {
    // Normalise key so "Male Hall 1" and "male hall 1" merge into one section
    const key = person.hostel.toLowerCase();
    if (!acc[key]) acc[key] = { displayName: person.hostel, people: [] };
    acc[key].people.push(person);
    return acc;
  }, {});

  return (
    <div className="min-h-screen md:p-8 p-5 bg-gray-50">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
          All Assigned Roommates
        </h1>
        <p className="text-gray-500 text-sm md:text-base mb-4">
          View all students already assigned to rooms across hostels.
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
            placeholder="Search by name..."
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
          <div className="flex flex-wrap gap-4 justify-center md:justify-start">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="w-[150px] bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
                <div className="aspect-square bg-gray-200" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-full" />
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
              {filtered.length} result{filtered.length !== 1 ? "s" : ""} for "
              <span className="font-medium">{searchQuery}</span>"
            </p>
          )}

          {Object.keys(grouped).length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="text-lg font-medium">
                {searchQuery ? "No students match your search" : "No students yet"}
              </p>
              <p className="text-sm mt-1">
                {searchQuery ? "Try a different name" : "Be the first to add your details!"}
              </p>
            </div>
          ) : (
            Object.entries(grouped).map(([key, { displayName, people }]) => (
              <section key={key} className="max-w-5xl mx-auto mb-10">
                <div className="flex items-center gap-3 mb-5">
                  <div className="h-8 w-1 bg-blue-600 rounded-full" />
                  <h2 className="text-xl md:text-2xl font-bold text-gray-800">{displayName}</h2>
                  <span className="text-sm text-gray-400 font-medium">
                    ({people.length})
                  </span>
                </div>
                <div className="flex flex-wrap md:gap-6 gap-4 justify-center md:justify-start">
                  {people.map((person, idx) => (
                    <PersonCard
                      key={`${person.id || person.name}-${idx}`}
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
        </>
      )}
    </div>
  );
}
