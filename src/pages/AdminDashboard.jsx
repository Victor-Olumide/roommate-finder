import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { HiMagnifyingGlass, HiArrowRightOnRectangle, HiArrowLeft, HiTrash, HiPlus, HiXMark } from "react-icons/hi2";
import { collection, query, orderBy, onSnapshot, getDocs, writeBatch, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

import AdminStats from "../components/AdminStats";
import AdminEntryRow from "../components/AdminEntryRow";
import Toast, { useToast } from "../components/Toast";

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

  // Real-time Firestore listener — no backend needed for reads
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
      const cleanedHostel = addForm.hostel.trim();
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
    <div className="min-h-screen bg-gray-50/50 p-4 sm:p-6 md:p-8">
      <Toast toast={toast} onDismiss={clearToast} />

      <div className="max-w-5xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900">Admin Dashboard</h1>
            <p className="text-xs font-medium text-gray-500 mt-0.5">ABUAD Roommate Finder Management</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
            <button onClick={() => navigate("/")}
              className="inline-flex items-center gap-1 px-3.5 py-2 text-xs font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl">
              <HiArrowLeft className="text-sm" /><span>Public App</span>
            </button>
            <button onClick={() => setShowAddForm((v) => !v)}
              className="inline-flex items-center gap-1 px-3.5 py-2 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl">
              {showAddForm ? <HiXMark className="text-sm" /> : <HiPlus className="text-sm" />}
              <span>{showAddForm ? "Cancel" : "Add Entry"}</span>
            </button>
            {entries.length > 0 && (
              <button onClick={handleClearAll}
                className="inline-flex items-center gap-1 px-3.5 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl">
                <HiTrash className="text-sm" /><span>Clear All</span>
              </button>
            )}
            <button onClick={handleLogout}
              className="inline-flex items-center gap-1 px-3.5 py-2 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl">
              <HiArrowRightOnRectangle className="text-sm" /><span>Logout</span>
            </button>
          </div>
        </div>

        {/* Add Entry Form */}
        {showAddForm && (
          <form onSubmit={handleAddEntry} className="bg-white rounded-2xl border border-blue-100 p-5 shadow-sm space-y-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">New Entry</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-gray-700">Hostel <span className="text-red-500">*</span></span>
                <input type="text" value={addForm.hostel} onChange={(e) => setAddForm((f) => ({ ...f, hostel: e.target.value }))} required
                  placeholder="e.g. ABUAD Male Hostel 1"
                  className="p-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-gray-700">Room <span className="text-red-500">*</span></span>
                <input type="text" value={addForm.room} onChange={(e) => setAddForm((f) => ({ ...f, room: e.target.value }))} required
                  placeholder="e.g. D29"
                  className="p-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 uppercase" />
              </label>
              <label className="flex flex-col gap-1 sm:col-span-2">
                <span className="text-xs font-semibold text-gray-700">Full Name <span className="text-red-500">*</span></span>
                <input type="text" value={addForm.name} onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))} required
                  placeholder="Student full name"
                  className="p-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-gray-700">Phone</span>
                <input type="tel" value={addForm.phone} onChange={(e) => setAddForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="08012345678"
                  className="p-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-gray-700">WhatsApp</span>
                <input type="tel" value={addForm.whatsapp} onChange={(e) => setAddForm((f) => ({ ...f, whatsapp: e.target.value }))}
                  placeholder="08012345678"
                  className="p-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
              </label>
              <label className="flex flex-col gap-1 sm:col-span-2">
                <span className="text-xs font-semibold text-gray-700">Bio / Note</span>
                <textarea rows={2} value={addForm.bio} onChange={(e) => setAddForm((f) => ({ ...f, bio: e.target.value }))}
                  className="p-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 resize-y" />
              </label>
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={adding}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors disabled:opacity-50">
                {adding ? "Adding…" : "Add Entry"}
              </button>
            </div>
          </form>
        )}

        {/* Stats */}
        <AdminStats entries={entries} />

        {/* Search Bar */}
        <div className="relative">
          <HiMagnifyingGlass className="h-5 w-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by student name, hostel, or room number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full p-3.5 pl-11 text-sm bg-white border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
          />
        </div>

        {/* Entries List */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white p-4 rounded-2xl border border-gray-100 animate-pulse h-20" />
            ))}
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 p-6">
            <p className="text-sm font-bold text-gray-800">No student records found</p>
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