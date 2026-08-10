import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import RoommateCard from "../components/RoommateCard";
import { GoArrowLeft } from "react-icons/go";
import { HiShare, HiCheck, HiPencilSquare, HiTrash, HiUserGroup, HiPlus } from "react-icons/hi2";
import {
  collection, query, where, orderBy,
  onSnapshot, doc, getDoc, deleteDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "../firebase";
import Toast, { useToast } from "../components/Toast";
import { normalizeHostelName } from "../utils/hostelData";

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

  const rawHostel = decodeURIComponent(hostel || "");
  const canonicalHostel = normalizeHostelName(rawHostel);
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

  // Real-time listener for this room's entries (normalized hostel query)
  useEffect(() => {
    setLoading(true);
    setError(false);
    const q = query(
      collection(db, "entries"),
      where("hostelLower", "==", canonicalHostel.toLowerCase()),
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
  }, [canonicalHostel, decodedNumber]);

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
        title: `${canonicalHostel} - Room ${decodedNumber}`,
        text: `Check out who is staying in ${canonicalHostel}, Room ${decodedNumber}!`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/60 via-slate-50 to-white text-slate-800 p-4 sm:p-6 md:p-10 font-sans">
      <Toast toast={toast} onDismiss={clearToast} />

      <div className="max-w-6xl mx-auto space-y-6">

        {/* Minimal Navigation & Header */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 pb-4 border-b border-slate-200/80">
          <div>
            <Link 
              to="/rooms" 
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors mb-2"
            >
              <GoArrowLeft className="text-sm" />
              <span>All rooms</span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {canonicalHostel} <span className="text-slate-300 font-normal">/</span> Room {decodedNumber}
            </h1>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button 
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-bold transition-all shadow-xs"
            >
              {copied ? (
                <><HiCheck className="text-emerald-600 text-sm" /><span className="text-emerald-600">Copied!</span></>
              ) : (
                <><HiShare className="text-sm text-slate-500" /><span>Share</span></>
              )}
            </button>
            <Link 
              to="/"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all text-xs font-bold shadow-sm"
            >
              <HiPlus className="text-sm" /> Add Details
            </Link>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
            {[0, 1].map((i) => (
              <div key={i} className="bg-white rounded-3xl border border-slate-200/80 p-5 flex gap-4 animate-pulse shadow-xs">
                <div className="w-36 h-36 rounded-2xl bg-slate-200 shrink-0" />
                <div className="flex-1 space-y-3 py-2">
                  <div className="h-4 bg-slate-200 rounded-md w-2/3" />
                  <div className="h-3 bg-slate-100 rounded-md w-1/2" />
                  <div className="h-3 bg-slate-100 rounded-md w-full" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="text-center py-12 bg-white rounded-3xl border border-rose-200 p-8 shadow-xs">
            <p className="text-sm font-bold text-rose-600">Could not load room data. Check your connection and try again.</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && entries.length === 0 && (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200/80 p-8 shadow-xs max-w-xl mx-auto my-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center mx-auto mb-3">
              <HiUserGroup className="text-2xl" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No occupants registered in this room yet</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Are you assigned to {canonicalHostel}, Room {decodedNumber}? Be the first to let your roommates find you!
            </p>
            <Link to="/" className="mt-5 inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all text-xs font-bold shadow-sm">
              <HiPlus className="text-sm" /> Add My Details
            </Link>
          </div>
        )}

        {/* Entries Grid */}
        {!loading && !error && entries.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start pt-2">
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
                    <div className="flex items-center justify-between px-4 py-2 bg-blue-50/80 rounded-2xl border border-blue-200/80 shadow-xs">
                      <span className="text-[11px] font-bold text-blue-700 px-2.5 py-0.5 rounded-full bg-blue-100">
                        Your Listing
                      </span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => navigate(`/?edit=${entryId}`)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-blue-600 bg-white border border-blue-200 rounded-xl hover:bg-blue-50 transition-all shadow-xs">
                          <HiPencilSquare className="text-sm" /><span>Edit</span>
                        </button>
                        {confirmDeleteId === entryId ? (
                          <div className="flex gap-1.5">
                            <button onClick={() => handleDelete(entryId)} disabled={deletingId === entryId}
                              className="px-3 py-1.5 text-xs font-bold bg-rose-600 text-white rounded-xl hover:bg-rose-700 disabled:opacity-50 transition-all shadow-xs">
                              {deletingId === entryId ? "Deleting…" : "Confirm"}
                            </button>
                            <button onClick={() => setConfirmDeleteId(null)}
                              className="px-3 py-1.5 text-xs font-semibold bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition-all">
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => setConfirmDeleteId(entryId)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-rose-600 bg-white border border-rose-200 rounded-xl hover:bg-rose-50 transition-all shadow-xs">
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
    </div>
  );
}