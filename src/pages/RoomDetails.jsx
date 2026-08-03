import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import RoommateCard from "../components/RoommateCard";
import { GoArrowLeft } from "react-icons/go";
import { HiShare, HiCheck, HiPencilSquare, HiTrash } from "react-icons/hi2";
import {
  collection, query, where, orderBy,
  onSnapshot, doc, getDoc, deleteDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "../firebase";
import Toast, { useToast } from "../components/Toast";

const STORAGE_KEY = "findroom_entries";

function getSavedEntries() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
}
function removeSavedEntry(id) {
  localStorage.setItem(STORAGE_KEY,
    JSON.stringify(getSavedEntries().filter((e) => (e.id || e._id) !== id)));
}

export default function RoomDetails() {
  const { hostel, number } = useParams();
  const navigate = useNavigate();
  const [toast, showToast, clearToast] = useToast();

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [myEntryIds, setMyEntryIds] = useState(new Set());
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [copied, setCopied] = useState(false);

  const decodedHostel = decodeURIComponent(hostel || "");
  const decodedNumber = decodeURIComponent(number || "");

  // Track anonymous user
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => setCurrentUser(user));
    return () => unsub();
  }, []);

  // Load owned entry IDs from localStorage
  useEffect(() => {
    setMyEntryIds(new Set(getSavedEntries().map((e) => e.id || e._id)));
  }, []);

  // Real-time listener for this room's entries
  useEffect(() => {
    setLoading(true);
    setError(false);
    const q = query(
      collection(db, "entries"),
      where("hostelLower", "==", decodedHostel.toLowerCase()),
      where("roomLower", "==", decodedNumber.toLowerCase()),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setEntries(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.error("Firestore error:", err);
        setError(true);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [decodedHostel, decodedNumber]);

  const handleDelete = async (id) => {
    if (!currentUser) { showToast("error", "You must be signed in to delete an entry."); return; }
    setDeletingId(id);
    try {
      const docRef = doc(db, "entries", id);
      const snapshot = await getDoc(docRef);
      if (!snapshot.exists()) { showToast("error", "Entry not found."); return; }
      if (snapshot.data().ownerUid !== currentUser.uid) {
        showToast("error", "You don't have permission to delete this entry.");
        return;
      }
      await deleteDoc(docRef);
      removeSavedEntry(id);
      setMyEntryIds((prev) => { const s = new Set(prev); s.delete(id); return s; });
      setConfirmDeleteId(null);
      showToast("success", "Your entry has been removed.");
    } catch { showToast("error", "Could not delete entry. Try again."); }
    finally { setDeletingId(null); }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${decodedHostel} - Room ${decodedNumber}`,
        text: `Check out who is staying in ${decodedHostel}, Room ${decodedNumber}!`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="min-h-screen mx-auto md:px-14 px-4 md:py-8 max-w-6xl mb-8">
      <Toast toast={toast} onDismiss={clearToast} />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 my-6">
        <div>
          <Link to="/rooms" className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-blue-600 hover:underline mb-1">
            <GoArrowLeft className="text-base" /><span>Back to all rooms</span>
          </Link>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
            {decodedHostel} • Room {decodedNumber}
          </h1>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto">
          <button onClick={handleShare}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-all active:scale-95 flex-1 sm:flex-none">
            {copied ? (
              <><HiCheck className="text-green-600 text-sm" /><span className="text-green-600">Link Copied!</span></>
            ) : (
              <><HiShare className="text-sm text-gray-500" /><span>Share Room</span></>
            )}
          </button>
          <Link to="/"
            className="inline-flex items-center justify-center gap-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all text-xs font-bold shadow-xs active:scale-95 flex-1 sm:flex-none">
            + Add My Details
          </Link>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
          {[0, 1].map((i) => (
            <div key={i} className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4 flex gap-4 animate-pulse">
              <div className="w-40 h-40 rounded-xl bg-gray-200 shrink-0" />
              <div className="flex-1 space-y-3 py-2">
                <div className="h-4 bg-gray-200 rounded-md w-2/3" />
                <div className="h-3 bg-gray-100 rounded-md w-1/2" />
                <div className="h-3 bg-gray-100 rounded-md w-full" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="text-center py-16 bg-white rounded-2xl border border-red-100 p-6 my-4">
          <p className="text-sm font-bold text-red-700">Could not load room data. Check your connection.</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && entries.length === 0 && (
        <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 p-8 shadow-2xs my-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h3 className="text-base font-bold text-gray-800">No occupants registered in this room yet</h3>
          <p className="text-xs text-gray-500 mt-1">Are you assigned to {decodedHostel}, Room {decodedNumber}? Be the first!</p>
          <Link to="/" className="mt-5 inline-block px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all text-xs font-bold shadow-xs active:scale-95">
            Add My Details
          </Link>
        </div>
      )}

      {/* Entries */}
      {!loading && !error && entries.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {entries.map((entry) => {
            const entryId = entry.id || entry._id;
            const isOwner = myEntryIds.has(entryId);
            return (
              <div key={entryId} className="flex flex-col gap-2">
                <RoommateCard
                  name={entry.name} hostel={entry.hostel} room={entry.room}
                  phone={entry.phone} whatsapp={entry.whatsapp} bio={entry.bio} image={entry.image}
                  department={entry.department} level={entry.level}
                />
                {isOwner && (
                  <div className="flex items-center justify-between px-2 py-1 bg-blue-50/60 rounded-xl border border-blue-100/80">
                    <span className="text-[11px] font-bold text-blue-700 px-2 py-0.5 rounded-full bg-blue-100/80">Your Listing</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => navigate(`/?edit=${entryId}`)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-blue-600 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition-all">
                        <HiPencilSquare className="text-sm" /><span>Edit</span>
                      </button>
                      {confirmDeleteId === entryId ? (
                        <div className="flex gap-1.5">
                          <button onClick={() => handleDelete(entryId)} disabled={deletingId === entryId}
                            className="px-3 py-1.5 text-xs font-bold bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-all">
                            {deletingId === entryId ? "Deleting…" : "Confirm"}
                          </button>
                          <button onClick={() => setConfirmDeleteId(null)}
                            className="px-2.5 py-1.5 text-xs font-semibold bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all">
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmDeleteId(entryId)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-all">
                          <HiTrash className="text-sm" /><span>Delete</span>
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
