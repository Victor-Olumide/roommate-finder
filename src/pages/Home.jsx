import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { HiDocumentArrowUp, HiCheckCircle, HiSparkles, HiMagnifyingGlass, HiUserGroup, HiShieldCheck, HiPencilSquare, HiTrash, HiXMark } from "react-icons/hi2";
import { FcGoogle } from "react-icons/fc";
import {
    collection, addDoc, doc, getDoc,
    updateDoc, deleteDoc, serverTimestamp,
    query, where, getDocs, limit,
} from "firebase/firestore";
import {
    signInAnonymously, onAuthStateChanged,
    GoogleAuthProvider, linkWithPopup,
} from "firebase/auth";
import { db, auth } from "../firebase";
import { parseAllocationPdf } from "../utils/parsePdf";
import { compressImage } from "../utils/compressImage";
import Toast, { useToast } from "../components/Toast";
import { ABUAD_HOSTELS, normalizeHostelName } from "../utils/hostelData";

const STORAGE_KEY = "findroom_entries";

function getSavedEntries() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
}
function saveEntry(entry) {
    const all = getSavedEntries().filter((e) => (e.id || e._id) !== (entry.id || entry._id));
    all.unshift(entry);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}
function removeSavedEntry(id) {
    localStorage.setItem(STORAGE_KEY,
        JSON.stringify(getSavedEntries().filter((e) => (e.id || e._id) !== id)));
}

const blankForm = {
    hostel: "", room: "", wing: "", floor: "", name: "",
    department: "", level: "", roomCapacity: 4, phone: "", whatsapp: "", bio: "",
};

export default function Home() {
    const navigate = useNavigate();
    const location = useLocation();
    const [toast, showToast, clearToast] = useToast();

    const [currentUser, setCurrentUser] = useState(null);
    const [isLinkedToGoogle, setIsLinkedToGoogle] = useState(false);
    const [linkingGoogle, setLinkingGoogle] = useState(false);

    const [searchHostel, setSearchHostel] = useState("");
    const [searchRoom, setSearchRoom] = useState("");

    const [form, setForm] = useState(blankForm);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [parsingPdf, setParsingPdf] = useState(false);
    const [pdfSuccess, setPdfSuccess] = useState(false);
    const [formError, setFormError] = useState("");

    const [myEntries, setMyEntries] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [showMyEntries, setShowMyEntries] = useState(false);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (user) => {
            if (user) {
                setCurrentUser(user);
                setIsLinkedToGoogle(user.providerData.some((p) => p.providerId === "google.com"));
            } else {
                signInAnonymously(auth).catch((err) => console.error("Anonymous auth failure:", err));
            }
        });
        return () => unsub();
    }, []);

    useEffect(() => { setMyEntries(getSavedEntries()); }, []);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const editId = params.get("edit");
        if (!editId) return;
        const saved = getSavedEntries().find((e) => (e.id || e._id) === editId);
        if (saved) { startEdit(saved); navigate("/", { replace: true }); }
    }, [location.search]);

    const handleLinkGoogle = async () => {
        if (!currentUser || isLinkedToGoogle) return;
        setLinkingGoogle(true);
        try {
            await linkWithPopup(currentUser, new GoogleAuthProvider());
            setIsLinkedToGoogle(true);
            showToast("success", "Account linked to Google — your entries are now permanent.");
        } catch (err) {
            if (err.code !== "auth/popup-closed-by-user")
                showToast("error", "Could not link Google account. Try again.");
        } finally { setLinkingGoogle(false); }
    };

    const handlePdfUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.type !== "application/pdf") { setFormError("Please upload a valid ABUAD PDF allocation slip."); return; }
        setParsingPdf(true); setFormError("");
        try {
            const parsed = await parseAllocationPdf(file);
            setForm((f) => ({
                ...f,
                name: parsed.name || f.name, department: parsed.department || f.department,
                level: parsed.level || f.level, hostel: parsed.hostel || f.hostel,
                wing: parsed.wing || f.wing, floor: parsed.floor || f.floor,
                room: parsed.room || f.room, roomCapacity: parsed.roomCapacity || f.roomCapacity,
            }));
            setPdfSuccess(true);
        } catch { setFormError("Could not auto-read allocation PDF. Please fill manually."); }
        finally { setParsingPdf(false); }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { setFormError("Profile image must be smaller than 5MB."); return; }
        setFormError("");
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const handleSearch = () => {
        if (!searchHostel && !searchRoom) return;
        const canonicalHostel = normalizeHostelName(searchHostel);
        navigate(`/room/${encodeURIComponent(canonicalHostel.trim())}/${encodeURIComponent(searchRoom.trim().toUpperCase())}`);
    };

    const startEdit = (entry) => {
        setEditingId(entry.id || entry._id);
        setForm({
            hostel: entry.hostel || "", room: entry.room || "", wing: entry.wing || "",
            floor: entry.floor || "", name: entry.name || "", department: entry.department || "",
            level: entry.level || "", roomCapacity: entry.roomCapacity || 4,
            phone: entry.phone || "", whatsapp: entry.whatsapp || "", bio: entry.bio || "",
        });
        setImagePreview(entry.image || null);
        setImageFile(null);
        setFormError(""); setPdfSuccess(false); setShowMyEntries(false);
        setTimeout(() => document.getElementById("entry-form")?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    };

    const cancelEdit = () => {
        setEditingId(null); setForm(blankForm);
        setImageFile(null); setImagePreview(null);
        setFormError(""); setPdfSuccess(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError("");
        if (!form.hostel || !form.room || !form.name) { setFormError("Please fill in all required fields."); return; }
        if (!currentUser) { setFormError("Initializing connection. Please try again."); return; }

        setSubmitting(true);
        const cleanedHostel = normalizeHostelName(form.hostel);
        const cleanedRoom = form.room.trim().toUpperCase();

        try {
            let imageUrl = imagePreview || "";
            if (imageFile) {
                imageUrl = await compressImage(imageFile);
            }

            if (editingId) {
                const updatePayload = {
                    name: form.name.trim(), department: form.department.trim(),
                    level: form.level.trim(), wing: form.wing.trim(), floor: form.floor.trim(),
                    roomCapacity: Number(form.roomCapacity) || 4,
                    phone: form.phone.trim(), whatsapp: form.whatsapp.trim(), bio: form.bio.trim(),
                    image: imageUrl, nameLower: form.name.trim().toLowerCase(),
                    updatedAt: serverTimestamp(),
                };
                await updateDoc(doc(db, "entries", editingId), updatePayload);
                saveEntry({ id: editingId, hostel: cleanedHostel, room: cleanedRoom, ...updatePayload });
                setMyEntries(getSavedEntries());
                cancelEdit();
                navigate(`/room/${encodeURIComponent(cleanedHostel)}/${encodeURIComponent(cleanedRoom)}`);
            } else {
                const dupSnap = await getDocs(query(
                    collection(db, "entries"),
                    where("ownerUid", "==", currentUser.uid),
                    where("hostelLower", "==", cleanedHostel.toLowerCase()),
                    where("roomLower", "==", cleanedRoom.toLowerCase()),
                    limit(1)
                ));
                if (!dupSnap.empty) {
                    setFormError("You've already added an entry for this room. Use 'My entries' to edit it.");
                    setSubmitting(false); return;
                }

                const newDocPayload = {
                    hostel: cleanedHostel, room: cleanedRoom,
                    wing: form.wing.trim(), floor: form.floor.trim(),
                    name: form.name.trim(), department: form.department.trim(),
                    level: form.level.trim(), roomCapacity: Number(form.roomCapacity) || 4,
                    phone: form.phone.trim(), whatsapp: form.whatsapp.trim(), bio: form.bio.trim(),
                    image: imageUrl, ownerUid: currentUser.uid,
                    createdAt: serverTimestamp(),
                    hostelLower: cleanedHostel.toLowerCase(),
                    roomLower: cleanedRoom.toLowerCase(),
                    nameLower: form.name.trim().toLowerCase(),
                };
                const docRef = await addDoc(collection(db, "entries"), newDocPayload);
                saveEntry({ id: docRef.id, ...newDocPayload });
                setMyEntries(getSavedEntries());
                navigate(`/room/${encodeURIComponent(cleanedHostel)}/${encodeURIComponent(cleanedRoom)}`);
            }
        } catch (err) {
            console.error("Firestore submit error:", err);
            setFormError("Database error. Please check your connection.");
        } finally { setSubmitting(false); }
    };

    const handleDelete = async (id) => {
        setDeletingId(id);
        try {
            const docRef = doc(db, "entries", id);
            const snapshot = await getDoc(docRef);
            if (snapshot.exists()) {
                if (currentUser && snapshot.data().ownerUid === currentUser.uid) {
                    await deleteDoc(docRef);
                } else {
                    showToast("error", "You don't have permission to delete this entry.");
                    return;
                }
            }
            removeSavedEntry(id);
            setMyEntries(getSavedEntries());
            if (editingId === id) cancelEdit();
        } catch { showToast("error", "Could not delete entry."); }
        finally { setDeletingId(null); }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50/60 via-slate-50 to-white text-slate-800 relative overflow-hidden font-sans">
            <Toast toast={toast} onDismiss={clearToast} />

            {/* Subtle Light Flares */}
            <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-200/40 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-1/3 -right-40 w-96 h-96 bg-indigo-200/40 rounded-full blur-3xl pointer-events-none" />

            <main className="p-4 sm:p-6 md:p-12 min-h-screen flex flex-col items-center justify-center relative z-10">
                <div className="max-w-4xl mx-auto w-full space-y-8">

                    {/* Hero Header */}
                    <div className="text-center space-y-5 pt-4">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100/80 border border-blue-200 text-blue-700 text-xs font-semibold shadow-sm">
                            <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                            <HiSparkles className="text-blue-600 text-sm" />
                            Official ABUAD Roommate Finder
                        </div>

                        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.1] text-slate-900">
                            Know Your Roommates <br />
                            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 bg-clip-text text-transparent">
                                Before Resumption
                            </span>
                        </h1>

                        <p className="text-sm md:text-base text-slate-600 max-w-xl mx-auto font-normal leading-relaxed">
                            Upload your official ABUAD hostel allocation slip PDF or search directly to connect with assigned roommates early.
                        </p>

                        <div className="flex flex-wrap justify-center gap-3 pt-1 text-xs sm:text-sm">
                            <Link to="/rooms" className="px-5 py-2.5 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 text-slate-700 transition-all font-semibold hover:border-slate-300 shadow-sm">
                                Browse all rooms
                            </Link>
                            <Link to="/roommate" className="px-5 py-2.5 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 text-slate-700 transition-all font-semibold hover:border-slate-300 shadow-sm">
                                View all students
                            </Link>
                            {myEntries.length > 0 && (
                                <button type="button" onClick={() => setShowMyEntries((v) => !v)}
                                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl shadow-md shadow-blue-500/20 transition-all">
                                    My entries ({myEntries.length})
                                </button>
                            )}
                        </div>

                        {/* Google Auth Link Banner */}
                        {currentUser?.isAnonymous && !isLinkedToGoogle && myEntries.length > 0 && (
                            <div className="mx-auto max-w-md bg-amber-50/90 border border-amber-200 rounded-2xl px-4 py-3 flex items-center gap-3 text-left shadow-sm backdrop-blur-md">
                                <FcGoogle className="text-2xl shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-amber-900 flex items-center gap-1">
                                        <HiShieldCheck className="text-amber-600 text-sm" /> Protect your entries
                                    </p>
                                    <p className="text-[11px] text-amber-800/80">Link Google to preserve edit access if browser data clears.</p>
                                </div>
                                <button onClick={handleLinkGoogle} disabled={linkingGoogle}
                                    className="shrink-0 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50 shadow-sm">
                                    {linkingGoogle ? "Linking…" : "Link Account"}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Saved Entries Panel */}
                    {showMyEntries && myEntries.length > 0 && (
                        <div className="bg-white/90 backdrop-blur-xl p-6 rounded-3xl border border-slate-200/80 shadow-xl space-y-3">
                            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Your Saved Profiles</h2>
                            <div className="space-y-2.5">
                                {myEntries.map((entry) => {
                                    const id = entry.id || entry._id;
                                    return (
                                        <div key={id} className="flex items-center gap-3 p-3.5 rounded-2xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition-all">
                                            <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-200 shrink-0 flex items-center justify-center text-slate-600 font-bold text-sm border border-slate-300">
                                                {entry.image ? <img src={entry.image} alt={entry.name} className="w-full h-full object-cover" /> : entry.name?.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-slate-900 text-sm truncate">{entry.name}</p>
                                                <p className="text-xs text-slate-500 truncate">{entry.hostel}, Room {entry.room}</p>
                                            </div>
                                            <div className="flex gap-2 shrink-0">
                                                <button type="button" onClick={() => startEdit(entry)}
                                                    className="p-2 text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 rounded-xl transition-all font-semibold flex items-center gap-1">
                                                    <HiPencilSquare className="text-sm" /> Edit
                                                </button>
                                                {deletingId === id ? (
                                                    <span className="p-2 text-xs text-slate-400">Deleting…</span>
                                                ) : (
                                                    <button type="button"
                                                        onClick={() => { if (window.confirm(`Remove "${entry.name}" from ${entry.hostel}, Room ${entry.room}?`)) handleDelete(id); }}
                                                        className="p-2 text-xs bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl transition-all font-semibold flex items-center gap-1">
                                                        <HiTrash className="text-sm" /> Delete
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Search Section */}
                    <div className="bg-white/80 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/50 relative">
                        <div className="mb-5">
                            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                <HiMagnifyingGlass className="text-blue-600 text-2xl" />
                                Find Your Roommates
                            </h2>
                            <p className="text-xs sm:text-sm text-slate-500">Enter your hostel name (e.g., Jamaica, Wema, MH 1) and room number.</p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <input type="text" list="hostel-list" placeholder="Hostel (e.g. Jamaica, Wema, MH 1)"
                                value={searchHostel} onChange={(e) => setSearchHostel(e.target.value)}
                                className="flex-1 p-3.5 text-sm bg-slate-50/80 border border-slate-200 text-slate-900 placeholder-slate-400 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
                            <input type="text" placeholder="Room (e.g. D29)"
                                value={searchRoom} onChange={(e) => setSearchRoom(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                className="sm:w-36 p-3.5 text-sm bg-slate-50/80 border border-slate-200 text-slate-900 placeholder-slate-400 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all uppercase" />
                            <button type="button" onClick={handleSearch} disabled={!searchHostel && !searchRoom}
                                className="px-7 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-blue-500/25 disabled:opacity-40 transition-all shrink-0">
                                Search Room
                            </button>
                        </div>
                    </div>

                    {/* Main Form Section */}
                    <div id="entry-form" className="bg-white/80 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/50 scroll-mt-20">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                <HiUserGroup className="text-indigo-600 text-2xl" />
                                {editingId ? "Edit Profile Details" : "Add Your Details"}
                            </h2>
                            {editingId && (
                                <button type="button" onClick={cancelEdit}
                                    className="text-xs text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 transition-all font-medium flex items-center gap-1">
                                    <HiXMark className="text-sm" /> Cancel edit
                                </button>
                            )}
                        </div>
                        <p className="text-xs sm:text-sm text-slate-500 mb-6">
                            {editingId ? "Update your details below." : "Upload your ABUAD allocation slip PDF to auto-fill, or enter details manually."}
                        </p>

                        {/* PDF Upload Box */}
                        {!editingId && (
                            <div className="mb-6">
                                <label className="group relative cursor-pointer flex flex-col items-center justify-center p-6 border-2 border-dashed border-blue-200 hover:border-blue-500 rounded-2xl bg-gradient-to-b from-blue-50/50 to-white hover:from-blue-50 transition-all duration-300 shadow-sm">
                                    <input type="file" accept=".pdf" onChange={handlePdfUpload} className="hidden" />
                                    {parsingPdf ? (
                                        <div className="flex items-center gap-2 text-blue-600 font-bold text-xs animate-pulse">
                                            <HiDocumentArrowUp className="text-2xl animate-bounce" />
                                            Reading Allocation Slip PDF...
                                        </div>
                                    ) : pdfSuccess ? (
                                        <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs">
                                            <HiCheckCircle className="text-xl" />
                                            <span>Details Auto-Filled from Allocation Slip!</span>
                                        </div>
                                    ) : (
                                        <div className="text-center space-y-1">
                                            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                                                <HiDocumentArrowUp className="text-2xl" />
                                            </div>
                                            <p className="text-xs sm:text-sm font-bold text-slate-800">Upload ABUAD Room Allocation PDF</p>
                                            <p className="text-[11px] text-slate-400">Auto-extracts Hostel, Room, Wing, Level, and Capacity</p>
                                        </div>
                                    )}
                                </label>
                            </div>
                        )}

                        {formError && (
                            <div className="mb-6 px-4 py-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs sm:text-sm font-semibold">{formError}</div>
                        )}

                        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
                            <datalist id="hostel-list">{ABUAD_HOSTELS.map((h) => <option key={h} value={h} />)}</datalist>

                            <label className="flex flex-col gap-1.5">
                                <span className="text-xs font-semibold text-slate-700">Hostel Name <span className="text-rose-500">*</span></span>
                                <input type="text" list="hostel-list" placeholder="e.g. Jamaica, Wema, Male Hall 1"
                                    value={form.hostel} onChange={(e) => setForm((f) => ({ ...f, hostel: e.target.value }))}
                                    disabled={!!editingId} required
                                    className="p-3.5 text-sm bg-slate-50/80 border border-slate-200 text-slate-900 placeholder-slate-400 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all disabled:opacity-50" />
                            </label>

                            <label className="flex flex-col gap-1.5">
                                <span className="text-xs font-semibold text-slate-700">Room Number <span className="text-rose-500">*</span></span>
                                <input type="text" placeholder="e.g. D29"
                                    value={form.room} onChange={(e) => setForm((f) => ({ ...f, room: e.target.value }))}
                                    disabled={!!editingId} required
                                    className="p-3.5 text-sm bg-slate-50/80 border border-slate-200 text-slate-900 placeholder-slate-400 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all uppercase disabled:opacity-50" />
                            </label>

                            <label className="flex flex-col gap-1.5 sm:col-span-2">
                                <span className="text-xs font-semibold text-slate-700">Full Name <span className="text-rose-500">*</span></span>
                                <input type="text" placeholder="Your full name"
                                    value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required
                                    className="p-3.5 text-sm bg-slate-50/80 border border-slate-200 text-slate-900 placeholder-slate-400 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
                            </label>

                            <label className="flex flex-col gap-1.5">
                                <span className="text-xs font-semibold text-slate-700">Department / Course</span>
                                <input type="text" placeholder="e.g. Computer Engineering"
                                    value={form.department} onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
                                    className="p-3.5 text-sm bg-slate-50/80 border border-slate-200 text-slate-900 placeholder-slate-400 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
                            </label>

                            <label className="flex flex-col gap-1.5">
                                <span className="text-xs font-semibold text-slate-700">Level</span>
                                <input type="text" placeholder="e.g. 300"
                                    value={form.level} onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))}
                                    className="p-3.5 text-sm bg-slate-50/80 border border-slate-200 text-slate-900 placeholder-slate-400 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
                            </label>

                            {/* Profile Photo Uploader */}
                            <label className="flex flex-col gap-1.5 sm:col-span-2">
                                <span className="text-xs font-semibold text-slate-700">Profile Photo <span className="text-slate-400 font-normal">(Optional, max 5MB)</span></span>
                                <div className="flex items-center gap-4">
                                    <label className="cursor-pointer">
                                        <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-2xl text-xs font-semibold text-slate-700 transition-all shadow-sm">
                                            Choose Image
                                        </div>
                                        <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                                    </label>
                                    {imagePreview && (
                                        <div className="relative w-12 h-12 rounded-2xl overflow-hidden border border-slate-200 shrink-0">
                                            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                            <button type="button"
                                                onClick={() => { setImageFile(null); setImagePreview(null); }}
                                                className="absolute top-0 right-0 bg-rose-500 text-white p-0.5 rounded-bl-lg text-[10px]">✕</button>
                                        </div>
                                    )}
                                </div>
                            </label>

                            <label className="flex flex-col gap-1.5">
                                <span className="text-xs font-semibold text-slate-700">Phone Number</span>
                                <input type="tel" placeholder="08012345678"
                                    value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                                    className="p-3.5 text-sm bg-slate-50/80 border border-slate-200 text-slate-900 placeholder-slate-400 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
                            </label>

                            <label className="flex flex-col gap-1.5">
                                <span className="text-xs font-semibold text-slate-700">WhatsApp Number</span>
                                <input type="tel" placeholder="08012345678"
                                    value={form.whatsapp} onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))}
                                    className="p-3.5 text-sm bg-slate-50/80 border border-slate-200 text-slate-900 placeholder-slate-400 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
                            </label>

                            <label className="flex flex-col gap-1.5 sm:col-span-2">
                                <span className="text-xs font-semibold text-slate-700">Note for Roommates</span>
                                <textarea placeholder="Introduce yourself, mention lifestyle preferences, or leave a note..."
                                    rows={3} value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                                    className="p-3.5 text-sm bg-slate-50/80 border border-slate-200 text-slate-900 placeholder-slate-400 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-y" />
                            </label>

                            <button type="submit" disabled={submitting}
                                className="sm:col-span-2 mt-2 py-4 px-6 bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm rounded-2xl shadow-xl shadow-blue-500/25 hover:shadow-blue-500/35 transition-all disabled:opacity-40">
                                {submitting ? "Saving Profile…" : editingId ? "Save Changes" : "Submit Details"}
                            </button>
                        </form>
                    </div>

                    {/* Social Proof Counter
                    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-200/80 max-w-lg mx-auto text-center">
                        <div>
                            <p className="text-lg font-black text-slate-900">20+</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hostels Covered</p>
                        </div>
                        <div>
                            <p className="text-lg font-black text-blue-600">100%</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Free & Instant</p>
                        </div>
                        <div>
                            <p className="text-lg font-black text-slate-900">PDF</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Auto-Parser</p>
                        </div>
                    </div> */}

                </div>
            </main>
        </div>
    );
}