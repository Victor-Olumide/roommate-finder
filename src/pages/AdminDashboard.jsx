import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  HiMagnifyingGlass, HiArrowRightOnRectangle, HiArrowLeft, 
  HiTrash, HiPlus, HiXMark, HiShieldCheck,
  HiBuildingOffice, HiIdentification, HiPhone,
  HiChatBubbleLeftEllipsis, HiInbox, HiFunnel
} from "react-icons/hi2";
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
  const [filterEndingWithLetter, setFilterEndingWithLetter] = useState(false);
  const [filterWithSpace, setFilterWithSpace] = useState(false);
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
    const confirmation = window.prompt(
      "CRITICAL WARNING: You are about to delete ALL student records.\n\nType 'NUKE DATABASE' (all caps) to confirm:"
    );

    if (confirmation !== "NUKE DATABASE") {
      showToast("error", "Action cancelled. Database is safe.");
      return;
    }

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

      const derivedGender = cleanedHostel.includes("Female") ? "Female" : 
                            cleanedHostel.includes("Male") ? "Male" : "";

      await addDoc(collection(db, "entries"), {
        hostel: cleanedHostel,
        room: cleanedRoom,
        name: cleanedName,
        phone: addForm.phone.trim(),
        whatsapp: addForm.whatsapp.trim(),
        bio: addForm.bio.trim(),
        gender: derivedGender,
        department: "",
        level: "",
        roomCapacity: 4,
        roomSpace: "",
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
    const roomStr = (e.room || "").trim();
    
    // 1. Room ending with letter filter check
    if (filterEndingWithLetter) {
      const endsWithLetter = /[a-zA-Z]$/.test(roomStr);
      if (!endsWithLetter) return false;
    }

    // 2. Room with space filter check (e.g. "A 101")
    if (filterWithSpace) {
      const hasSpace = /\s/.test(roomStr);
      if (!hasSpace) return false;
    }

    // 3. Search query check
    if (!q) return true;
    return (
      e.name?.toLowerCase().includes(q) ||
      e.hostel?.toLowerCase().includes(q) ||
      roomStr.toLowerCase().includes(q) ||
      e.matricNo?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/60 via-slate-50 to-white text-slate-800 p-4 sm:p-6 md:p-10 font-sans">
      <Toast toast={toast} onDismiss={clearToast} />

      <div className="max-w-6xl mx-auto space-y-6">

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-2">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100/80 text-blue-700 text-xs font-semibold mb-1 shadow-xs">
              <HiShieldCheck className="text-sm text-blue-600" /> Authorized Personnel Only
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Control Panel
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => navigate("/")}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-xs transition-all">
              <HiArrowLeft className="text-sm" /><span>Public App</span>
            </button>
            <button onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all">
              <HiArrowRightOnRectangle className="text-sm" /><span>Logout</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <AdminStats entries={entries} />

        {/* Command Toolbar */}
        <div className="bg-white/80 backdrop-blur-xl p-4 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-sm">
            <HiMagnifyingGlass className="h-5 w-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search name, hostel, room, or matric..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full p-3.5 pl-11 text-sm bg-white/90 border border-slate-200/80 rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 placeholder-slate-400 transition-all shadow-xs"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <HiXMark className="h-5 w-5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap w-full md:w-auto gap-2 items-center">
            {/* Filter: Rooms Ending with Letter */}
            <button
              type="button"
              onClick={() => setFilterEndingWithLetter((prev) => !prev)}
              className={`px-3.5 py-2.5 text-xs font-bold rounded-xl transition-all border flex items-center gap-1.5 shrink-0 ${
                filterEndingWithLetter
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <HiFunnel className="text-sm" />
              <span>Ends with Letter</span>
              {filterEndingWithLetter && (
                <span className="bg-white/20 text-white px-1.5 py-0.5 rounded text-[9px] font-extrabold">
                  Active
                </span>
              )}
            </button>

            {/* Filter: Rooms with Space */}
            <button
              type="button"
              onClick={() => setFilterWithSpace((prev) => !prev)}
              className={`px-3.5 py-2.5 text-xs font-bold rounded-xl transition-all border flex items-center gap-1.5 shrink-0 ${
                filterWithSpace
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <HiFunnel className="text-sm" />
              <span>With Space</span>
              {filterWithSpace && (
                <span className="bg-white/20 text-white px-1.5 py-0.5 rounded text-[9px] font-extrabold">
                  Active
                </span>
              )}
            </button>

            <button onClick={() => setShowAddForm((v) => !v)}
              className="inline-flex justify-center items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-all">
              {showAddForm ? <HiXMark className="text-base" /> : <HiPlus className="text-base" />}
              <span>{showAddForm ? "Cancel" : "Manual Entry"}</span>
            </button>
            
            {entries.length > 0 && (
              <button onClick={handleClearAll}
                className="inline-flex justify-center items-center gap-1.5 px-3.5 py-2.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all">
                <HiTrash className="text-base" /><span>Clear All</span>
              </button>
            )}
          </div>
        </div>

        {/* Add Entry Form */}
        {showAddForm && (
          <form onSubmit={handleAddEntry} className="bg-white/90 backdrop-blur-xl rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-6 relative overflow-hidden">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Create Manual Entry</p>
              <h3 className="text-lg font-bold text-slate-900">Inject Record</h3>
            </div>
            
            <datalist id="admin-hostel-list">{ABUAD_HOSTELS.map((h) => <option key={h} value={h} />)}</datalist>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-bold text-slate-700">Hostel <span className="text-rose-500">*</span></span>
                <div className="relative">
                  <HiBuildingOffice className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" list="admin-hostel-list" value={addForm.hostel} onChange={(e) => setAddForm((f) => ({ ...f, hostel: e.target.value }))} required
                    placeholder="e.g. Jamaica, Wema"
                    className="w-full p-3.5 pl-10 text-sm bg-slate-50/80 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900" />
                </div>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-bold text-slate-700">Room <span className="text-rose-500">*</span></span>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">#</div>
                  <input type="text" value={addForm.room} onChange={(e) => setAddForm((f) => ({ ...f, room: e.target.value }))} required
                    placeholder="e.g. D29"
                    className="w-full p-3.5 pl-9 text-sm bg-slate-50/80 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all uppercase text-slate-900" />
                </div>
              </label>

              <label className="flex flex-col gap-1.5 sm:col-span-2">
                <span className="text-xs font-bold text-slate-700">Full Name <span className="text-rose-500">*</span></span>
                <div className="relative">
                  <HiIdentification className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
                  <input type="text" value={addForm.name} onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))} required
                    placeholder="Student full name"
                    className="w-full p-3.5 pl-10 text-sm bg-slate-50/80 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900" />
                </div>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-bold text-slate-700">Phone</span>
                <div className="relative">
                  <HiPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="tel" value={addForm.phone} onChange={(e) => setAddForm((f) => ({ ...f, phone: e.target.value }))}
                    placeholder="08012345678"
                    className="w-full p-3.5 pl-10 text-sm bg-slate-50/80 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900" />
                </div>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-bold text-slate-700">WhatsApp</span>
                <div className="relative">
                  <HiChatBubbleLeftEllipsis className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="tel" value={addForm.whatsapp} onChange={(e) => setAddForm((f) => ({ ...f, whatsapp: e.target.value }))}
                    placeholder="08012345678"
                    className="w-full p-3.5 pl-10 text-sm bg-slate-50/80 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900" />
                </div>
              </label>

              <label className="flex flex-col gap-1.5 sm:col-span-2">
                <span className="text-xs font-bold text-slate-700">Bio / Note</span>
                <textarea rows={2} value={addForm.bio} onChange={(e) => setAddForm((f) => ({ ...f, bio: e.target.value }))}
                  placeholder="Optional admin note..."
                  className="p-3.5 text-sm bg-slate-50/80 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-y text-slate-900" />
              </label>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100/50 mt-4">
              <button type="submit" disabled={adding}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all disabled:opacity-50">
                {adding ? "Saving…" : "Save Record"}
              </button>
            </div>
          </form>
        )}

        {/* Entries List Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
          <h2 className="text-lg font-extrabold text-slate-900">Database Records</h2>
          <span className="px-3 py-1 bg-white border border-slate-200 text-slate-600 rounded-full text-xs font-bold shadow-xs">
            Showing {filteredEntries.length} {filteredEntries.length === 1 ? 'result' : 'results'}
          </span>
        </div>

        {/* Entries List */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white/80 p-4 rounded-2xl border border-slate-200/60 animate-pulse h-20" />
            ))}
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="text-center py-20 bg-white/80 backdrop-blur-xl rounded-3xl border border-slate-200/80 shadow-sm">
            <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <HiInbox className="text-3xl" />
            </div>
            <p className="text-base font-bold text-slate-900">No records found</p>
            <p className="text-xs text-slate-500 mt-1">Try adjusting your search criteria or active filters.</p>
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