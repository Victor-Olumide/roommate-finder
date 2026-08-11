import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import RoommateCard from "../components/RoommateCard";
import { GoArrowLeft } from "react-icons/go";
import { HiShare, HiCheck, HiPencilSquare, HiTrash, HiUserGroup, HiPlus, HiLockClosed } from "react-icons/hi2";
import {
  collection, query, where,
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
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(getSavedEntries().filter((e) => (e.id || e._id) !== id))
  );
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
  const [isMemberOfRoom, setIsMemberOfRoom] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [copied, setCopied] = useState(false);

  const rawHostel = decodeURIComponent(hostel || "");
  const canonicalHostel = normalizeHostelName(rawHostel);
  const decodedNumber = decodeURIComponent(number || "").trim().toUpperCase();

  // 1. Track Auth State
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => setCurrentUser(user));
    return () => unsub();
  }, []);

  // 2. Real-time Firestore Listener for Room Entries
  useEffect(() => {
    setLoading(true);
    setError(false);

    // Query room entries matching hostel and room number
    const q = query(
      collection(db, "entries"),
      where("hostelLower", "==", canonicalHostel.toLowerCase()),
      where("roomLower", "==", decodedNumber.toLowerCase())
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const docsData = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        
        // Sort newest first client-side (prevents Firestore composite index errors)
        docsData.sort((a, b) => {
          const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return tB - tA;
        });

        setEntries(docsData);
        setLoading(false);
      },
      (err) => {
        console.error("Firestore room details error:", err);
        setError(true);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [canonicalHostel, decodedNumber]);

  // 3. Evaluate Room Membership & Ownership
  useEffect(() => {
    if (loading) return;

    const saved = getSavedEntries();
    const localIds = new Set(saved.map((e) => e.id || e._id));

    // Check if user has an entry in this room via Auth UID OR LocalStorage
    const userIsMember = entries.some((entry) => {
      const isOwnerByUid = currentUser && entry.ownerUid === currentUser.uid;
      const isOwnerByLocal = localIds.has(entry.id || entry._id);
      return isOwnerByUid || isOwnerByLocal;
    });

    setIsMemberOfRoom(userIsMember);

    // Track owned entry IDs for rendering "Your Listing" badge / edit buttons
    const ownedIds = new Set(localIds);
    entries.forEach((e) => {
      if (currentUser && e.ownerUid === currentUser.uid) {
        ownedIds.add(e.id || e._id);
      }
    });
    setMyEntryIds(ownedIds);
  }, [entries, currentUser, loading]);

  // 4. Delete Entry Handler
  const handleDelete = async (id) => {
    if (!currentUser) {
      showToast("error", "You must be signed in to delete an entry.");
      return;
    }
    setDeletingId(id);

    try {
      const docRef = doc(db, "entries", id);
      const snapshot = await getDoc(docRef);

      if (!snapshot.exists()) {
        showToast("error", "Entry not found.");
        return;
      }

      if (snapshot.data().ownerUid !== currentUser.uid) {
        showToast("error", "You don't have permission to delete this entry.");
        return;
      }

      await deleteDoc(docRef);
      removeSavedEntry(id);

      setMyEntryIds((prev) => {
        const updated = new Set(prev);
        updated.delete(id);
        return updated;
      });

      setConfirmDeleteId(null);
      showToast("success", "Your entry has been removed.");
    } catch (err) {
      console.error("Delete error:", err);
      showToast("error", "Could not delete entry. Try again.");
    } finally {
      setDeletingId(null);
    }
  };

  // 5. Share Page URL Handler
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

        {/* Navigation & Header */}
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
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              {copied ? (
                <><HiCheck className="text-emerald-600 text-sm" /><span className="text-emerald-600">Copied!</span></>
              ) : (
                <><HiShare className="text-sm text-slate-500" /><span>Share</span></>
              )}
            </button>
            <Link 
              to={`/?hostel=${encodeURIComponent(canonicalHostel)}&room=${encodeURIComponent(decodedNumber)}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all text-xs font-bold shadow-sm"
            >
              <HiPlus className="text-sm" /> Add My Details
            </Link>
          </div>
        </div>

        {/* Loading Skeleton State */}
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

        {/* Empty Room State (When zero entries exist in this room) */}
        {!loading && !error && entries.length === 0 && (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200/80 p-8 shadow-xs max-w-xl mx-auto my-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center mx-auto mb-3">
              <HiUserGroup className="text-2xl" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No occupants registered in this room yet</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Are you assigned to {canonicalHostel}, Room {decodedNumber}? Be the first to let your roommates find you!
            </p>
            <Link 
              to={`/?hostel=${encodeURIComponent(canonicalHostel)}&room=${encodeURIComponent(decodedNumber)}`} 
              className="mt-5 inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all text-xs font-bold shadow-sm"
            >
              <HiPlus className="text-sm" /> Add My Details
            </Link>
          </div>
        )}

        {/* PRIVACY LOCK: Room has occupants, but visiting user is NOT registered in this room */}
        {!loading && !error && entries.length > 0 && !isMemberOfRoom && (
          <div className="text-center py-16 bg-white/90 backdrop-blur-xl rounded-3xl border border-slate-200/80 p-8 shadow-sm max-w-xl mx-auto my-4 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-100/80 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto shadow-xs">
              <HiLockClosed className="text-3xl" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">Room Details Are Locked</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                To protect student privacy, roommate details for <strong className="text-slate-800">{canonicalHostel}, Room {decodedNumber}</strong> are only visible to students assigned to this room.
              </p>
            </div>
            <div className="pt-2">
              <Link 
                to={`/?hostel=${encodeURIComponent(canonicalHostel)}&room=${encodeURIComponent(decodedNumber)}`} 
                className="inline-flex items-center gap-1.5 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl transition-all text-xs font-bold shadow-md shadow-blue-500/20 active:scale-95"
              >
                <HiPlus className="text-sm" /> Add Your Details To Unlock
              </Link>
            </div>
          </div>
        )}

        {/* UNLOCKED: Display Roommates Grid */}
        {!loading && !error && entries.length > 0 && isMemberOfRoom && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start pt-2">
            {entries.map((entry) => {
              const entryId = entry.id || entry._id;
              const isOwner = myEntryIds.has(entryId);
              return (
                <div key={entryId} className="flex flex-col gap-2">
                  <RoommateCard
                    name={entry.name}
                    hostel={entry.hostel}
                    room={entry.room}
                    department={entry.department}
                    level={entry.level}
                    phone={entry.phone}
                    whatsapp={entry.whatsapp}
                    bio={entry.bio}
                    image={entry.image}
                  />
                  {isOwner && (
                    <div className="flex items-center justify-between px-4 py-2 bg-blue-50/80 rounded-2xl border border-blue-200/80 shadow-xs">
                      <span className="text-[11px] font-bold text-blue-700 px-2.5 py-0.5 rounded-full bg-blue-100">
                        Your Listing
                      </span>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => navigate(`/?edit=${entryId}`)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-blue-600 bg-white border border-blue-200 rounded-xl hover:bg-blue-50 transition-all shadow-xs cursor-pointer"
                        >
                          <HiPencilSquare className="text-sm" /><span>Edit</span>
                        </button>
                        {confirmDeleteId === entryId ? (
                          <div className="flex gap-1.5">
                            <button 
                              onClick={() => handleDelete(entryId)} 
                              disabled={deletingId === entryId}
                              className="px-3 py-1.5 text-xs font-bold bg-rose-600 text-white rounded-xl hover:bg-rose-700 disabled:opacity-50 transition-all shadow-xs cursor-pointer"
                            >
                              {deletingId === entryId ? "Deleting…" : "Confirm"}
                            </button>
                            <button 
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-3 py-1.5 text-xs font-semibold bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition-all cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => setConfirmDeleteId(entryId)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-rose-600 bg-white border border-rose-200 rounded-xl hover:bg-rose-50 transition-all shadow-xs cursor-pointer"
                          >
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