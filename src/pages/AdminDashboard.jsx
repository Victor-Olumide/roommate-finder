import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { HiMagnifyingGlass, HiArrowRightOnRectangle, HiArrowLeft, HiTrash, HiPlus, HiXMark, HiShieldCheck } from "react-icons/hi2";
import { collection, query, orderBy, onSnapshot, getDocs, writeBatch, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

import AdminStats from "../components/AdminStats";
import AdminEntryRow from "../components/AdminEntryRow";
import Toast, { useToast } from "../components/Toast";
import { ABUAD_HOSTELS, normalizeHostelName } from "../utils/hostelData";

const blankEntry = { hostel: "", room: "", name: "", phone: "", whatsapp: "", bio: "" };

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [entries, setEntries] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [toast, showToast, clearToast] = useToast();

  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState(blankEntry);
  const [adding, setAdding] = useState(false);

  // Real-time Firestore listener
  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, "entries"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setEntries(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.error("Firestore error:", err);
        showToast("error", "Could not load entries");
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem("admin_token");
    navigate("/admin/login", { replace: true });
  };

  const handleClearAll = async () => {
    if (!window.confirm("Delete ALL entries? This action cannot be undone.")) return;
    try {
      const snap = await getDocs(collection(db, "entries"));
      const batch = writeBatch(db);
      snap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
      showToast("success", "All entries cleared");
    } catch (err) {
      console.error("Clear all error:", err);
      showToast("error", "Failed to clear entries");
    }
  };

  const handleAddEntry = async (e) => {
    e.preventDefault();
    if (!addForm.hostel.trim() || !addForm.room.trim() || !addForm.name.trim()) {
      showToast("error", "Hostel, Room, and Name are required");
      return;
    }
    setAdding(true);
    try {
      const cleanedHostel = normalizeHostelName(addForm.hostel);
      const cleanedRoom = addForm.room.trim().toUpperCase();
      const cleanedName = addForm.name.trim();

      await addDoc(collection(db, "entries"), {
        hostel: cleanedHostel,
        room: cleanedRoom,
        name: cleanedName,
        phone: addForm.phone.trim(),
        whatsapp: addForm.whatsapp.trim(),
        bio: addForm.bio.trim(),
        image: "",
        ownerUid: "admin",
        hostelLower: cleanedHostel.toLowerCase(),
        roomLower: cleanedRoom.toLowerCase(),
        nameLower: cleanedName.toLowerCase(),
        createdAt: serverTimestamp(),
      });

      setAddForm(blankEntry);
      setShowAddForm(false);
      showToast("success", "Entry added successfully");
    } catch (err) {
      console.error("Add entry error:", err);
      showToast("error", "Failed to add entry");
    } finally {
      setAdding(false);
    }
  };

  const filteredEntries = entries.filter((e) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      e.name?.toLowerCase().includes(q) ||
      e.hostel?.toLowerCase().includes(q) ||
      e.room?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/60 via-slate-50 to-white text-slate-800 p-4 sm:p-6 md:p-10 font-sans">
      <Toast toast={toast} onDismiss={clearToast} />

      <div className="max-w-6xl mx-auto space-y-6">

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-slate-200/80">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100/80 text-blue-700 text-xs font-semibold mb-1">
              <HiShieldCheck className="text-sm text-blue-600" /> Administrative Portal
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Admin Dashboard</h1>
          </div>

          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            <button onClick={() => navigate("/")}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-xs transition-all">
              <HiArrowLeft className="text-sm" /><span>Public App</span>
            </button>
            <button onClick={() => setShowAddForm((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-all">
              {showAddForm ? <HiXMark className="text-sm" /> : <HiPlus className="text-sm" />}
              <span>{showAddForm ? "Cancel" : "Add Entry"}</span>
            </button>
            {entries.length > 0 && (
              <button onClick={handleClearAll}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all">
                <HiTrash className="text-sm" /><span>Clear All</span>
              </button>
            )}
            <button onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all">
              <HiArrowRightOnRectangle className="text-sm" /><span>Logout</span>
            </button>
          </div>
        </div>

        {/* Add Entry Form */}
        {showAddForm && (
          <form onSubmit={handleAddEntry} className="bg-white/90 backdrop-blur-xl rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Create Manual Entry</p>
            <datalist id="admin-hostel-list">{ABUAD_HOSTELS.map((h) => <option key={h} value={h} />)}</datalist>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-slate-700">Hostel <span className="text-rose-500">*</span></span>
                <input type="text" list="admin-hostel-list" value={addForm.hostel} onChange={(e) => setAddForm((f) => ({ ...f, hostel: e.target.value }))} required
                  placeholder="e.g. Jamaica, Wema, MH 1"
                  className="p-3 text-xs bg-slate-50/80 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900" />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-slate-700">Room <span className="text-rose-500">*</span></span>
                <input type="text" value={addForm.room} onChange={(e) => setAddForm((f) => ({ ...f, room: e.target.value }))} required
                  placeholder="e.g. D29"
                  className="p-3 text-xs bg-slate-50/80 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all uppercase text-slate-900" />
              </label>

              <label className="flex flex-col gap-1.5 sm:col-span-2">
                <span className="text-xs font-semibold text-slate-700">Full Name <span className="text-rose-500">*</span></span>
                <input type="text" value={addForm.name} onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))} required
                  placeholder="Student full name"
                  className="p-3 text-xs bg-slate-50/80 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900" />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-slate-700">Phone</span>
                <input type="tel" value={addForm.phone} onChange={(e) => setAddForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="08012345678"
                  className="p-3 text-xs bg-slate-50/80 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900" />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-slate-700">WhatsApp</span>
                <input type="tel" value={addForm.whatsapp} onChange={(e) => setAddForm((f) => ({ ...f, whatsapp: e.target.value }))}
                  placeholder="08012345678"
                  className="p-3 text-xs bg-slate-50/80 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900" />
              </label>

              <label className="flex flex-col gap-1.5 sm:col-span-2">
                <span className="text-xs font-semibold text-slate-700">Bio / Note</span>
                <textarea rows={2} value={addForm.bio} onChange={(e) => setAddForm((f) => ({ ...f, bio: e.target.value }))}
                  className="p-3 text-xs bg-slate-50/80 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-y text-slate-900" />
              </label>
            </div>

            <div className="flex justify-end pt-2">
              <button type="submit" disabled={adding}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all disabled:opacity-50">
                {adding ? "Adding…" : "Add Entry"}
              </button>
            </div>
          </form>
        )}

        {/* Stats */}
        <AdminStats entries={entries} />

        {/* Search Bar */}
        <div className="relative">
          <HiMagnifyingGlass className="h-5 w-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by student name, hostel, or room number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full p-3.5 pl-11 text-sm bg-white/90 border border-slate-200/80 rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-xs text-slate-900 placeholder-slate-400 transition-all"
          />
        </div>

        {/* Entries List */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white p-4 rounded-2xl border border-slate-200/60 animate-pulse h-20" />
            ))}
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="text-center py-16 bg-white/80 backdrop-blur-xl rounded-3xl border border-slate-200/80 p-6">
            <p className="text-sm font-bold text-slate-800">No student records found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredEntries.map((entry) => (
              <AdminEntryRow
                key={entry.id || entry._id}
                entry={entry}
                showToast={showToast}
                onDelete={(deletedId) =>
                  setEntries((prev) => prev.filter((e) => (e.id || e._id) !== deletedId))
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}