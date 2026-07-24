import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import RoommateCard from "../components/RoommateCard";
import { API } from "../api";

const STORAGE_KEY = "findroom_entries";

function getSavedEntries() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}
function removeSavedEntry(id) {
  const entries = getSavedEntries().filter((e) => e.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export default function RoomDetails() {
  const { hostel, number } = useParams();
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myEntryIds, setMyEntryIds] = useState(new Set());
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const decodedHostel = decodeURIComponent(hostel);

  // Load which entries belong to this user
  useEffect(() => {
    const saved = getSavedEntries();
    setMyEntryIds(new Set(saved.map((e) => e.id)));
  }, []);

  useEffect(() => {
    const fetchEntries = async () => {
      try {
        const res = await fetch(
          `${API}/entries?hostel=${encodeURIComponent(decodedHostel)}&room=${encodeURIComponent(number)}`
        );
        const json = await res.json();
        if (json.success) setEntries(json.data);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEntries();
    const interval = setInterval(fetchEntries, 5000);
    return () => clearInterval(interval);
  }, [hostel, number]);

  const handleDelete = async (id) => {
    const saved = getSavedEntries().find((e) => e.id === id);
    if (!saved) return;
    setDeletingId(id);
    try {
      const res = await fetch(`${API}/entries/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ editToken: saved.editToken }),
      });
      const json = await res.json();
      if (json.success) {
        removeSavedEntry(id);
        setMyEntryIds((prev) => { const s = new Set(prev); s.delete(id); return s; });
        setEntries((prev) => prev.filter((e) => e.id !== id));
        setConfirmDeleteId(null);
      } else {
        alert(json.message || "Delete failed.");
      }
    } catch {
      alert("Network error. Could not delete.");
    }
    setDeletingId(null);
  };

  return (
    <div className="min-h-screen mx-auto md:px-14 px-4 md:py-8 max-w-6xl mb-4">
      {/* Header */}
      <div className="flex flex-row justify-between items-center gap-4 my-4">
        <div>
          <Link to="/rooms" className="text-sm text-blue-600 hover:underline mb-1 inline-block">
            ← Back to rooms
          </Link>
          <h1 className="text-lg font-extrabold text-gray-800 drop-shadow-lg">
            {decodedHostel}, Room {number}
          </h1>
        </div>
        <Link
          to="/"
          className="bg-blue-800 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shrink-0 text-sm"
        >
          + Add My Details
        </Link>
      </div>

      {/* Loading skeleton */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-md border border-gray-100 p-4 flex gap-4 animate-pulse">
              <div className="w-44 h-44 rounded-xl bg-gray-200 shrink-0" />
              <div className="flex-1 space-y-3 py-2">
                <div className="h-4 bg-gray-200 rounded w-2/3" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
                <div className="h-3 bg-gray-100 rounded w-full" />
                <div className="h-3 bg-gray-100 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-lg font-medium">No one in this room yet</p>
          <p className="text-sm mt-1">Be the first to add your details!</p>
          <Link
            to="/"
            className="mt-4 inline-block px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all text-sm font-medium"
          >
            Add My Details
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {entries.map((entry) => {
            const isOwner = myEntryIds.has(entry.id);
            return (
              <div key={entry.id} className="flex flex-col gap-2">
                <RoommateCard
                  name={entry.name}
                  hostel={entry.hostel}
                  room={entry.room}
                  phone={entry.phone}
                  whatsapp={entry.whatsapp}
                  bio={entry.bio}
                  image={entry.image}
                />

                {/* Edit / Delete — only shown for the owner */}
                {isOwner && (
                  <div className="flex items-center gap-2 px-1">
                    <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-full">
                      Your entry
                    </span>
                    <div className="flex gap-2 ml-auto">
                      {/* Edit navigates to home with ?edit=<id> so the form pre-fills */}
                      <button
                        onClick={() => navigate(`/?edit=${entry.id}`)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 transition-all"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </button>

                      {confirmDeleteId === entry.id ? (
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleDelete(entry.id)}
                            disabled={deletingId === entry.id}
                            className="px-3 py-1.5 text-xs font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-all"
                          >
                            {deletingId === entry.id ? "Deleting…" : "Confirm"}
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(entry.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition-all"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
