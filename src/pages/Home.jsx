import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { 
    HiDocumentArrowUp, HiCheckCircle, HiSparkles, HiMagnifyingGlass, 
    HiUserGroup, HiShieldCheck, HiXMark, HiLockClosed, HiHome, HiIdentification 
} from "react-icons/hi2";
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
import { parseAllocationImage } from "../utils/parseImage";
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

const blankForm = {
    hostel: "", room: "", roomSpace: "", matricNo: "", wing: "", floor: "", name: "",
    department: "", level: "", gender: "", roomCapacity: 4, phone: "", whatsapp: "", bio: "",
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
    const [isDocumentVerified, setIsDocumentVerified] = useState(false);
    const [formError, setFormError] = useState("");

    const [myEntries, setMyEntries] = useState([]);
    const [editingId, setEditingId] = useState(null);

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

    // Sync local state with Firestore truth on auth/mount
    useEffect(() => {
        if (!currentUser) return;

        const syncWithServer = async () => {
            try {
                const q = query(
                    collection(db, "entries"),
                    where("ownerUid", "==", currentUser.uid),
                    limit(1)
                );
                const snap = await getDocs(q);

                if (snap.empty) {
                    localStorage.removeItem(STORAGE_KEY);
                    setMyEntries([]);
                } else {
                    const serverEntry = { id: snap.docs[0].id, ...snap.docs[0].data() };
                    localStorage.setItem(STORAGE_KEY, JSON.stringify([serverEntry]));
                    setMyEntries([serverEntry]);
                }
            } catch (err) {
                console.error("Error syncing user entry from server:", err);
            }
        };

        syncWithServer();
    }, [currentUser]);

    useEffect(() => { setMyEntries(getSavedEntries()); }, []);

    // Handle ?edit= OR ?hostel= & ?room= pre-fill query params
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const editId = params.get("edit");
        const hostelParam = params.get("hostel");
        const roomParam = params.get("room");

        if (editId) {
            const saved = getSavedEntries().find((e) => (e.id || e._id) === editId);
            if (saved) { startEdit(saved); navigate("/", { replace: true }); }
        } else if (hostelParam || roomParam) {
            setForm((f) => ({
                ...f,
                hostel: hostelParam ? normalizeHostelName(hostelParam) : f.hostel,
                room: roomParam ? roomParam.trim().toUpperCase() : f.room,
            }));
            setTimeout(() => document.getElementById("entry-form")?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
        }
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

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const isPdf = file.type === "application/pdf";
        const isImage = file.type.startsWith("image/");

        if (!isPdf && !isImage) {
            setFormError("Please upload a valid ABUAD PDF slip or screenshot image (PNG, JPG).");
            return;
        }

        setParsingPdf(true);
        setFormError("");

        try {
            let parsed;
            // 1. Route strictly based on file type
            if (isPdf) {
                parsed = await parseAllocationPdf(file);
            } else {
                parsed = await parseAllocationImage(file);
            }

            // 2. Strict Verification Gate: STOP execution here if not verified!
            if (!parsed || !parsed.isVerified) {
                setFormError("Could not verify ABUAD allocation document. Please upload an official portal slip or screenshot.");
                setParsingPdf(false);
                return; // <-- THIS RETURN IS CRITICAL. It stops fake files from unlocking the form.
            }

            // 3. Populate details safely
            setForm((f) => ({
                ...f,
                name: parsed.name || "",
                matricNo: parsed.matricNo || "",
                department: parsed.department || "",
                level: parsed.level || "",
                gender: parsed.gender || "",
                hostel: parsed.hostel ? normalizeHostelName(parsed.hostel) : "",
                room: parsed.room ? parsed.room.trim().toUpperCase() : "",
                roomSpace: parsed.roomSpace ? parsed.roomSpace.trim().toUpperCase() : "",
                wing: parsed.wing || "",
                floor: parsed.floor || "",
                roomCapacity: parsed.roomCapacity || 4,
            }));

            setPdfSuccess(true);
            setIsDocumentVerified(true); // Now this only triggers if the strict gate passes!

            if (parsed.hostel && parsed.room) {
                showToast("success", `Details extracted: ${parsed.name} (${parsed.room})`);
            } else {
                showToast("success", `Document verified for ${parsed.name || "Student"}! Please fill in your room details.`);
            }
        } catch (err) {
            console.error("Document parsing error:", err);
            setFormError("Could not verify allocation document. Please try again.");
        } finally {
            setParsingPdf(false);
        }
    };

    const handleResetScan = () => {
        setForm((f) => ({ ...f, hostel: "", room: "", roomSpace: "", matricNo: "" }));
        setIsDocumentVerified(false);
        setPdfSuccess(false);
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
            hostel: entry.hostel || "", room: entry.room || "", roomSpace: entry.roomSpace || "",
            matricNo: entry.matricNo || "", wing: entry.wing || "", floor: entry.floor || "",
            name: entry.name || "", department: entry.department || "", level: entry.level || "",
            gender: entry.gender || "", roomCapacity: entry.roomCapacity || 4,
            phone: entry.phone || "", whatsapp: entry.whatsapp || "", bio: entry.bio || "",
        });
        setImagePreview(entry.image || null);
        setImageFile(null);
        setFormError(""); setPdfSuccess(false); setIsDocumentVerified(true);
        setTimeout(() => document.getElementById("entry-form")?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    };

    const cancelEdit = () => {
        setEditingId(null); setForm(blankForm);
        setImageFile(null); setImagePreview(null);
        setFormError(""); setPdfSuccess(false); setIsDocumentVerified(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError("");

        if (!currentUser) { 
            setFormError("Initializing connection. Please try again."); 
            return; 
        }

        if (!editingId && !isDocumentVerified) {
            setFormError("Please upload your official ABUAD Allocation PDF or Screenshot above to verify your room.");
            return;
        }

        if (!form.hostel || !form.room || !form.name) { 
            setFormError("Please fill in all required fields."); 
            return; 
        }

        setSubmitting(true);
        
        const cleanedHostel = normalizeHostelName(form.hostel);

        if (!ABUAD_HOSTELS.includes(cleanedHostel)) {
            setFormError("Please select a valid ABUAD hostel from the dropdown list.");
            setSubmitting(false);
            return;
        }

        const derivedGender = cleanedHostel.includes("Female") ? "Female" : 
                              cleanedHostel.includes("Male") ? "Male" : "";

        const cleanedRoom = form.room.trim().toUpperCase();
        const cleanedBed = (form.roomSpace || "").trim().toUpperCase();

        try {
            let imageUrl = imagePreview || "";
            if (imageFile) {
                imageUrl = await compressImage(imageFile);
            }

            if (editingId) {
                const updatePayload = {
                    name: form.name.trim(),
                    department: form.department.trim(),
                    level: form.level.trim(),
                    roomSpace: cleanedBed,
                    matricNo: (form.matricNo || "").trim(),
                    wing: form.wing.trim(),
                    floor: form.floor.trim(),
                    gender: derivedGender,
                    roomCapacity: Number(form.roomCapacity) || 4,
                    phone: form.phone.trim(),
                    whatsapp: form.whatsapp.trim(),
                    bio: form.bio.trim(),
                    image: imageUrl,
                    nameLower: form.name.trim().toLowerCase(),
                    updatedAt: serverTimestamp(),
                };
                await updateDoc(doc(db, "entries", editingId), updatePayload);
                saveEntry({ id: editingId, hostel: cleanedHostel, room: cleanedRoom, ...updatePayload });
                setMyEntries(getSavedEntries());
                cancelEdit();
                navigate(`/room/${encodeURIComponent(cleanedHostel)}/${encodeURIComponent(cleanedRoom)}`);
            } else {
                const liveCheckSnap = await getDocs(query(
                    collection(db, "entries"),
                    where("ownerUid", "==", currentUser.uid),
                    limit(1)
                ));

                if (!liveCheckSnap.empty) {
                    const activeDoc = { id: liveCheckSnap.docs[0].id, ...liveCheckSnap.docs[0].data() };
                    saveEntry(activeDoc);
                    setMyEntries([activeDoc]);
                    setFormError("You already have an active room entry on the server. Use 'My Room' above to view or edit it.");
                    setSubmitting(false);
                    return;
                }

                localStorage.removeItem(STORAGE_KEY);

                const newDocPayload = {
                    hostel: cleanedHostel,
                    room: cleanedRoom,
                    roomSpace: cleanedBed,
                    matricNo: (form.matricNo || "").trim(),
                    wing: form.wing.trim(),
                    floor: form.floor.trim(),
                    gender: derivedGender,
                    name: form.name.trim(),
                    department: form.department.trim(),
                    level: form.level.trim(),
                    roomCapacity: Number(form.roomCapacity) || 4,
                    phone: form.phone.trim(),
                    whatsapp: form.whatsapp.trim(),
                    bio: form.bio.trim(),
                    image: imageUrl,
                    ownerUid: currentUser.uid,
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
        } finally { 
            setSubmitting(false); 
        }
    };

    const latestEntry = myEntries[0];

    return (
        <>
            <div id="root" translate="no"></div>
            <div className="min-h-screen bg-gradient-to-b from-blue-50/60 via-slate-50 to-white text-slate-800 relative overflow-hidden font-sans">
                <Toast toast={toast} onDismiss={clearToast} />

                {/* Ambient Flares */}
                <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-200/40 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute top-1/3 -right-40 w-96 h-96 bg-indigo-200/40 rounded-full blur-3xl pointer-events-none" />

                <main className="p-4 sm:p-6 md:p-12 min-h-screen flex flex-col items-center justify-center relative z-10">
                    <div className="max-w-4xl mx-auto w-full space-y-8">

                        {/* Hero Header */}
                        <div className="text-center space-y-5 pt-4">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100/80 border border-blue-200 text-blue-700 text-xs font-semibold shadow-xs">
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
                                Upload your official ABUAD hostel allocation PDF slip or portal screenshot to verify and unlock your assigned room.
                            </p>

                            {/* Privacy Notice Pill */}
                            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-800 text-xs font-medium max-w-md mx-auto">
                                <HiLockClosed className="text-amber-600 shrink-0 text-sm" />
                                <span>Roommate details are private & only visible to verified co-occupants of each room.</span>
                            </div>

                            <div className="flex flex-wrap justify-center gap-3 pt-2 text-xs sm:text-sm">
                                {latestEntry && (
                                    <Link
                                        to={`/room/${encodeURIComponent(normalizeHostelName(latestEntry.hostel))}/${encodeURIComponent((latestEntry.room || "").trim().toUpperCase())}`}
                                        className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-md shadow-blue-500/25 transition-all flex items-center gap-1.5"
                                    >
                                        <HiHome className="text-base" /> My Room ({latestEntry.room})
                                    </Link>
                                )}

                                <Link to="/rooms" className="px-5 py-2.5 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 text-slate-700 transition-all font-semibold hover:border-slate-300 shadow-xs">
                                    Browse all rooms
                                </Link>
                            </div>

                            {/* Google Auth Link Banner */}
                            {currentUser?.isAnonymous && !isLinkedToGoogle && myEntries.length > 0 && (
                                <div className="mx-auto max-w-md bg-amber-50/90 border border-amber-200 rounded-2xl px-4 py-3 flex items-center gap-3 text-left shadow-xs backdrop-blur-md">
                                    <FcGoogle className="text-2xl shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-amber-900 flex items-center gap-1">
                                            <HiShieldCheck className="text-amber-600 text-sm" /> Protect your entries
                                        </p>
                                        <p className="text-[11px] text-amber-800/80">Link Google to preserve edit access if browser data clears.</p>
                                    </div>
                                    <button onClick={handleLinkGoogle} disabled={linkingGoogle}
                                        className="shrink-0 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50 shadow-xs">
                                        {linkingGoogle ? "Linking…" : "Link Account"}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Search Section */}
                        <div className="bg-white/80 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/50 relative">
                            <div className="mb-5">
                                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                    <HiMagnifyingGlass className="text-blue-600 text-2xl" />
                                    Search Room
                                </h2>
                                <p className="text-xs sm:text-sm text-slate-500">Enter a hostel name and room number.</p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3">
                                <input type="text" list="hostel-list" placeholder="Hostel (e.g. Jamaica, Wema, Male Hall 1)"
                                    value={searchHostel} onChange={(e) => setSearchHostel(e.target.value)}
                                    className="flex-1 p-3.5 text-sm bg-slate-50/80 border border-slate-200 text-slate-900 placeholder-slate-400 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
                                <input type="text" placeholder="Room (e.g. D107)"
                                    value={searchRoom} onChange={(e) => setSearchRoom(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                    className="sm:w-36 p-3.5 text-sm bg-slate-50/80 border border-slate-200 text-slate-900 placeholder-slate-400 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all uppercase" />
                                <button type="button" onClick={handleSearch} disabled={!searchHostel && !searchRoom}
                                    className="px-7 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-blue-500/25 disabled:opacity-40 transition-all shrink-0">
                                    Go to Room
                                </button>
                            </div>
                        </div>

                        {/* Main Form Section */}
                        <div id="entry-form" className="bg-white/80 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/50 scroll-mt-20">
                            <div className="flex items-center justify-between mb-2">
                                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                    <HiUserGroup className="text-indigo-600 text-2xl" />
                                    {editingId ? "Edit Profile Details" : "Add Your Details To Unlock Your Room"}
                                </h2>
                                {editingId && (
                                    <button type="button" onClick={cancelEdit}
                                        className="text-xs text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 transition-all font-medium flex items-center gap-1">
                                        <HiXMark className="text-sm" /> Cancel edit
                                    </button>
                                )}
                            </div>
                            <p className="text-xs sm:text-sm text-slate-500 mb-6">
                                {editingId ? "Update your details below." : "Upload your official ABUAD allocation PDF slip or portal screenshot image to verify and set your room."}
                            </p>

                            {/* PDF & Screenshot Upload Box */}
                            {!editingId && (
                                <div className="mb-6">
                                    <label className="group relative cursor-pointer flex flex-col items-center justify-center p-6 border-2 border-dashed border-blue-200 hover:border-blue-500 rounded-2xl bg-gradient-to-b from-blue-50/50 to-white hover:from-blue-50 transition-all duration-300 shadow-xs">
                                        <input
                                            type="file"
                                            accept=".pdf, image/png, image/jpeg, image/jpg, image/webp"
                                            onChange={handleFileUpload}
                                            className="hidden"
                                        />
                                        {parsingPdf ? (
                                            <div className="flex items-center gap-2 text-blue-600 font-bold text-xs animate-pulse">
                                                <HiDocumentArrowUp className="text-2xl animate-bounce" />
                                                Scanning Allocation Document / Screenshot...
                                            </div>
                                        ) : pdfSuccess ? (
                                            <div className="flex flex-col items-center gap-1.5 text-center">
                                                <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                                                    <HiCheckCircle className="text-2xl" />
                                                    <span>Slip Verified & Auto-Filled!</span>
                                                </div>
                                                <p className="text-xs text-slate-500">
                                                    {form.name} • {form.hostel} ({form.room}{form.roomSpace ? ` - Bed ${form.roomSpace}` : ""})
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="text-center space-y-1">
                                                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                                                    <HiDocumentArrowUp className="text-2xl" />
                                                </div>
                                                <p className="text-xs sm:text-sm font-bold text-slate-800">
                                                    Upload Room Allocation PDF or Screenshot
                                                </p>
                                                <p className="text-[11px] text-slate-400">
                                                    Supports official PDF allocation slips, PNG, and JPG screenshots
                                                </p>
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

                                {/* Locked Hostel Input */}
                                <label className="flex flex-col gap-1.5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-semibold text-slate-700">
                                            Hostel Name <span className="text-rose-500">*</span>
                                        </span>
                                        {!isDocumentVerified && !editingId && (
                                            <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                                                Upload Slip Above
                                            </span>
                                        )}
                                    </div>
                                    <input
                                        type="text"
                                        list="hostel-list"
                                        placeholder={isDocumentVerified ? "" : "Upload allocation document above"}
                                        value={form.hostel}
                                        onChange={(e) => setForm((f) => ({ ...f, hostel: e.target.value }))}
                                        disabled={!isDocumentVerified && !editingId}
                                        required
                                        className="p-3.5 text-sm bg-slate-50/80 border border-slate-200 text-slate-900 placeholder-slate-400 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-100"
                                    />
                                </label>

                                {/* Locked Room Input */}
                                <label className="flex flex-col gap-1.5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-semibold text-slate-700">
                                            Room Number <span className="text-rose-500">*</span>
                                        </span>
                                        {isDocumentVerified && !editingId && (
                                            <button
                                                type="button"
                                                onClick={handleResetScan}
                                                className="text-[10px] text-blue-600 hover:underline font-bold"
                                            >
                                                Re-scan slip
                                            </button>
                                        )}
                                    </div>
                                    <input
                                        type="text"
                                        placeholder={isDocumentVerified ? "" : "Upload allocation document above"}
                                        value={form.room}
                                        onChange={(e) => setForm((f) => ({ ...f, room: e.target.value }))}
                                        disabled={!isDocumentVerified && !editingId}
                                        required
                                        className="p-3.5 text-sm bg-slate-50/80 border border-slate-200 text-slate-900 placeholder-slate-400 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all uppercase disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-100"
                                    />
                                </label>

                                {/* Bed Space Selector */}
                                <div className="sm:col-span-2 flex flex-col gap-1.5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-semibold text-slate-700">
                                            Assigned Bed Space <span className="text-slate-400 font-normal">(e.g. Bed A, B, C, D)</span>
                                        </span>
                                        {form.roomSpace && (
                                            <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                                                Bed {form.roomSpace} Selected
                                            </span>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-4 gap-2">
                                        {["A", "B", "C", "D"].map((bed) => (
                                            <button
                                                key={bed}
                                                type="button"
                                                onClick={() => setForm((f) => ({ ...f, roomSpace: bed }))}
                                                className={`py-2.5 rounded-xl font-bold text-xs border transition-all ${
                                                    form.roomSpace === bed
                                                        ? "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20"
                                                        : "bg-slate-50/80 text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-white"
                                                }`}
                                            >
                                                Bed {bed}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Full Name */}
                                <label className="flex flex-col gap-1.5 sm:col-span-2">
                                    <span className="text-xs font-semibold text-slate-700">Full Name <span className="text-rose-500">*</span></span>
                                    <input type="text" placeholder="Your full name"
                                        value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required
                                        className="p-3.5 text-sm bg-slate-50/80 border border-slate-200 text-slate-900 placeholder-slate-400 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
                                </label>

                                {/* Matric No & Department */}
                                <label className="flex flex-col gap-1.5">
                                    <span className="text-xs font-semibold text-slate-700">Matric No</span>
                                    <input type="text" placeholder="Your Matric Number"
                                        value={form.matricNo} onChange={(e) => setForm((f) => ({ ...f, matricNo: e.target.value }))}
                                        className="p-3.5 text-sm bg-slate-50/80 border border-slate-200 text-slate-900 placeholder-slate-400 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all uppercase" />
                                </label>

                                <label className="flex flex-col gap-1.5">
                                    <span className="text-xs font-semibold text-slate-700">Department / Course</span>
                                    <input type="text" placeholder="e.g. Computer Science"
                                        value={form.department} onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
                                        className="p-3.5 text-sm bg-slate-50/80 border border-slate-200 text-slate-900 placeholder-slate-400 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
                                </label>

                                {/* Level & Capacity */}
                                <label className="flex flex-col gap-1.5">
                                    <span className="text-xs font-semibold text-slate-700">Level</span>
                                    <input type="text" placeholder="e.g. 100"
                                        value={form.level} onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))}
                                        className="p-3.5 text-sm bg-slate-50/80 border border-slate-200 text-slate-900 placeholder-slate-400 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
                                </label>

                                <label className="flex flex-col gap-1.5">
                                    <span className="text-xs font-semibold text-slate-700">Room Capacity</span>
                                    <select
                                        value={form.roomCapacity}
                                        onChange={(e) => setForm((f) => ({ ...f, roomCapacity: Number(e.target.value) }))}
                                        className="p-3.5 text-sm bg-slate-50/80 border border-slate-200 text-slate-900 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                    >
                                        <option value={1}>1-Person Room</option>
                                        <option value={2}>2-Person Room</option>
                                        <option value={3}>3-Person Room</option>
                                        <option value={4}>4-Person Room</option>
                                    </select>
                                </label>

                                {/* Profile Photo Uploader */}
                                <label className="flex flex-col gap-1.5 sm:col-span-2">
                                    <span className="text-xs font-semibold text-slate-700">Profile Photo <span className="text-slate-400 font-normal">(Optional, max 5MB)</span></span>
                                    <div className="flex items-center gap-4">
                                        <label className="cursor-pointer">
                                            <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-2xl text-xs font-semibold text-slate-700 transition-all shadow-xs">
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
                                    {submitting ? "Saving Profile…" : editingId ? "Save Changes" : "Submit & Unlock Room"}
                                </button>
                            </form>
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}