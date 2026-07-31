﻿import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { HiDocumentArrowUp, HiCheckCircle } from "react-icons/hi2";
import { API } from "../api";
import { parseAllocationPdf } from "../utils/parsePdf";

const STORAGE_KEY = "findroom_entries";

// Common ABUAD Hostels for auto-suggestions
const ABUAD_HOSTELS = [
  "ABUAD Male Hostel 1",
  "ABUAD Male Hostel 2",
  "ABUAD Male Hostel 3",
  "ABUAD Male Hostel 4",
  "ABUAD Male Hostel 5",
  "ABUAD Male Hostel 6",
  "ABUAD New Female Hostel 1",
  "ABUAD Female Hostel",
];

// ── localStorage helpers ──────────────────────────────────────────────────────
function getSavedEntries() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}
function saveEntry(entry) {
  const entries = getSavedEntries().filter((e) => (e.id || e._id) !== (entry.id || entry._id));
  entries.unshift(entry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}
function removeSavedEntry(id) {
  const entries = getSavedEntries().filter((e) => (e.id || e._id) !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

// ── Blank form state ──────────────────────────────────────────────────────────
const blankForm = {
  hostel: "",
  room: "",
  wing: "",
  floor: "",
  name: "",
  department: "",
  level: "",
  roomCapacity: 4,
  phone: "",
  whatsapp: "",
  bio: "",
};

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();

  // search
  const [searchHostel, setSearchHostel] = useState("");
  const [searchRoom, setSearchRoom] = useState("");

  // submit / edit form
  const [form, setForm] = useState(blankForm);
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [parsingPdf, setParsingPdf] = useState(false);
  const [pdfSuccess, setPdfSuccess] = useState(false);
  const [formError, setFormError] = useState("");

  // my entries panel
  const [myEntries, setMyEntries] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [showMyEntries, setShowMyEntries] = useState(false);

  useEffect(() => {
    setMyEntries(getSavedEntries());
  }, []);

  // Handle edit query params (?edit=<id>)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const editId = params.get("edit");
    if (!editId) return;

    const saved = getSavedEntries().find((e) => (e.id || e._id) === editId);
    if (saved) {
      startEdit(saved);
      navigate("/", { replace: true });
    }
  }, [location.search]);

  // ── PDF Auto-Fill Upload Handler ──────────────────────────────────────────
  const handlePdfUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setFormError("Please upload a valid ABUAD PDF allocation slip.");
      return;
    }

    setParsingPdf(true);
    setFormError("");

    try {
      const parsed = await parseAllocationPdf(file);

      setForm((f) => ({
        ...f,
        name: parsed.name || f.name,
        department: parsed.department || f.department,
        level: parsed.level || f.level,
        hostel: parsed.hostel || f.hostel,
        wing: parsed.wing || f.wing,
        floor: parsed.floor || f.floor,
        room: parsed.room || f.room,
        roomCapacity: parsed.roomCapacity || f.roomCapacity,
      }));

      setPdfSuccess(true);
    } catch (err) {
      console.error("PDF Read Error:", err);
      setFormError("Could not auto-read allocation PDF. Please fill manually.");
    } finally {
      setParsingPdf(false);
    }
  };

  // ── Image handler with 2MB size cap ────────────────────────────────────────
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setFormError("Profile image must be smaller than 2MB.");
      return;
    }
    setFormError("");
    setProfileImage(file);

    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  // ── Search ────────────────────────────────────────────────────────────────
  const handleSearch = () => {
    if (!searchHostel && !searchRoom) return;
    navigate(
      `/room/${encodeURIComponent(searchHostel.trim())}/${encodeURIComponent(
        searchRoom.trim().toUpperCase()
      )}`
    );
  };

  // ── Start editing an existing entry ──────────────────────────────────────
  const startEdit = (entry) => {
    setEditingId(entry.id || entry._id);
    setForm({
      hostel: entry.hostel || "",
      room: entry.room || "",
      wing: entry.wing || "",
      floor: entry.floor || "",
      name: entry.name || "",
      department: entry.department || "",
      level: entry.level || "",
      roomCapacity: entry.roomCapacity || 4,
      phone: entry.phone || "",
      whatsapp: entry.whatsapp || "",
      bio: entry.bio || "",
    });
    setImagePreview(entry.image || null);
    setProfileImage(null);
    setFormError("");
    setPdfSuccess(false);
    setShowMyEntries(false);

    setTimeout(() => {
      document
        .getElementById("entry-form")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(blankForm);
    setProfileImage(null);
    setImagePreview(null);
    setFormError("");
    setPdfSuccess(false);
  };

  // ── Submit (create or update) ─────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!form.hostel || !form.room || !form.name) {
      setFormError("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);

    const cleanedHostel = form.hostel.trim();
    const cleanedRoom = form.room.trim().toUpperCase();

    try {
      if (editingId) {
        // ── Edit existing entry ──
        const saved = getSavedEntries().find((e) => (e.id || e._id) === editingId);
        if (!saved) {
          setFormError("Could not find saved entry in browser storage.");
          setSubmitting(false);
          return;
        }

        const res = await fetch(`${API}/entries/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            editToken: saved.editToken,
            name: form.name.trim(),
            department: form.department.trim(),
            level: form.level.trim(),
            wing: form.wing.trim(),
            floor: form.floor.trim(),
            roomCapacity: Number(form.roomCapacity) || 4,
            phone: form.phone.trim(),
            whatsapp: form.whatsapp.trim(),
            bio: form.bio.trim(),
            image: imagePreview || "",
          }),
        });
        const json = await res.json();

        if (!json.success) {
          setFormError(json.message || "Update failed.");
          setSubmitting(false);
          return;
        }

        saveEntry({ ...saved, ...json.data, editToken: saved.editToken });
        setMyEntries(getSavedEntries());
        cancelEdit();

        navigate(
          `/room/${encodeURIComponent(json.data.hostel)}/${encodeURIComponent(
            json.data.room
          )}`
        );
      } else {
        // ── Create new entry ──
        const res = await fetch(`${API}/entries`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            hostel: cleanedHostel,
            room: cleanedRoom,
            wing: form.wing.trim(),
            floor: form.floor.trim(),
            name: form.name.trim(),
            department: form.department.trim(),
            level: form.level.trim(),
            roomCapacity: Number(form.roomCapacity) || 4,
            phone: form.phone.trim(),
            whatsapp: form.whatsapp.trim(),
            bio: form.bio.trim(),
            image: imagePreview || "",
          }),
        });
        const json = await res.json();

        if (!json.success) {
          setFormError(json.message || "Submission failed.");
          setSubmitting(false);
          return;
        }

        saveEntry({ ...json.data, editToken: json.editToken });
        setMyEntries(getSavedEntries());

        navigate(
          `/room/${encodeURIComponent(json.data.hostel)}/${encodeURIComponent(
            json.data.room
          )}`
        );
      }
    } catch (err) {
      console.error("Submit error:", err);
      setFormError("Network error. Please check your connection.");
    }

    setSubmitting(false);
  };

  // ── Delete own entry ──────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    const saved = getSavedEntries().find((e) => (e.id || e._id) === id);
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
        setMyEntries(getSavedEntries());
        if (editingId === id) cancelEdit();
      } else {
        alert(json.message || "Delete failed.");
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("Network error. Could not delete.");
    }
    setDeletingId(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="bg-[url('/bgv.png')] p-4 md:p-10 min-h-screen bg-cover bg-center flex flex-col items-center justify-center">
        <div className="max-w-4xl mx-auto w-full space-y-8">

          {/* ── Hero ── */}
          <div className="text-center space-y-4 pt-4">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 drop-shadow-sm leading-tight tracking-tight">
              Know Your ABUAD Roommates<br className="hidden sm:inline" /> Before Resumption
            </h1>
            <p className="text-sm md:text-base text-gray-700 max-w-xl mx-auto font-medium">
              Got your hostel allocation? Upload your allocation slip PDF or enter room details to connect early.
            </p>
            <div className="flex flex-wrap justify-center gap-2.5 text-xs sm:text-sm">
              <Link
                to="/rooms"
                className="px-4 py-2 bg-white/90 backdrop-blur-sm rounded-full border border-gray-200 text-gray-700 hover:bg-white hover:shadow-sm transition-all font-semibold"
              >
                Browse all rooms
              </Link>
              <Link
                to="/roommate"
                className="px-4 py-2 bg-white/90 backdrop-blur-sm rounded-full border border-gray-200 text-gray-700 hover:bg-white hover:shadow-sm transition-all font-semibold"
              >
                View all students
              </Link>
              {myEntries.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowMyEntries((v) => !v)}
                  className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-full hover:bg-blue-700 shadow-sm transition-all"
                >
                  My entries ({myEntries.length})
                </button>
              )}
            </div>
          </div>

          {/* ── My Entries Panel ── */}
          {showMyEntries && myEntries.length > 0 && (
            <div className="bg-white/95 backdrop-blur-md p-5 rounded-2xl shadow-xl border border-gray-100">
              <h2 className="text-lg font-bold text-gray-800 mb-3">Your Saved Entries</h2>
              <div className="space-y-2.5">
                {myEntries.map((entry) => {
                  const id = entry.id || entry._id;
                  return (
                    <div
                      key={id}
                      className="flex items-center gap-3 p-3 rounded-xl border border-gray-200/80 bg-gray-50/50"
                    >
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-200 shrink-0 flex items-center justify-center text-gray-500 font-bold text-sm">
                        {entry.image ? (
                          <img src={entry.image} alt={entry.name} className="w-full h-full object-cover" />
                        ) : (
                          entry.name?.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 text-sm truncate">{entry.name}</p>
                        <p className="text-xs text-gray-500 truncate">
                          {entry.hostel}, Room {entry.room}
                        </p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => startEdit(entry)}
                          className="px-3 py-1 text-xs bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all font-semibold"
                        >
                          Edit
                        </button>
                        {deletingId === id ? (
                          <span className="px-2 py-1 text-xs text-gray-400">Deleting…</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Remove "${entry.name}" from ${entry.hostel}, Room ${entry.room}?`))
                                handleDelete(id);
                            }}
                            className="px-3 py-1 text-xs bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-all font-semibold"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Search Bar ── */}
          <div className="bg-white/95 backdrop-blur-md p-5 sm:p-7 rounded-2xl shadow-xl border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-1 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Find Your Roommates
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mb-4">
              Enter your hostel name and room number to check for assigned roommates.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                list="hostel-list"
                placeholder="Hostel (e.g. ABUAD Male Hostel 1)"
                value={searchHostel}
                onChange={(e) => setSearchHostel(e.target.value)}
                className="flex-1 p-3.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
              <input
                type="text"
                placeholder="Room (e.g. D29)"
                value={searchRoom}
                onChange={(e) => setSearchRoom(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1 sm:w-32 p-3.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all uppercase"
              />
              <button
                type="button"
                onClick={handleSearch}
                disabled={!searchHostel && !searchRoom}
                className="px-6 py-3.5 bg-blue-600 text-white font-semibold text-sm rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md"
              >
                Search
              </button>
            </div>
          </div>

          {/* ── Submit / Edit Form ── */}
          <div
            id="entry-form"
            className="bg-white/95 backdrop-blur-md p-5 sm:p-7 rounded-2xl shadow-xl border border-gray-100 scroll-mt-20"
          >
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                {editingId ? "Edit Your Details" : "Add Your Details"}
              </h2>
              {editingId && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="text-xs text-gray-500 hover:text-gray-700 px-2.5 py-1 rounded-lg hover:bg-gray-100 transition-all font-semibold"
                >
                  Cancel edit
                </button>
              )}
            </div>

            <p className="text-xs sm:text-sm text-gray-500 mb-5">
              {editingId
                ? "Update your profile details below."
                : "Upload your ABUAD allocation slip PDF to auto-fill, or enter details manually."}
            </p>

            {/* ── PDF Upload Box (Only shown when creating new entry) ── */}
            {!editingId && (
              <div className="mb-6">
                <label className="cursor-pointer flex flex-col items-center justify-center p-5 border-2 border-dashed border-blue-200 hover:border-blue-500 rounded-2xl bg-blue-50/50 hover:bg-blue-50 transition-all">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handlePdfUpload}
                    className="hidden"
                  />
                  {parsingPdf ? (
                    <p className="text-xs font-bold text-blue-600 animate-pulse">
                      Reading Allocation Slip PDF...
                    </p>
                  ) : pdfSuccess ? (
                    <div className="flex items-center gap-2 text-green-600 font-bold text-xs">
                      <HiCheckCircle className="text-lg" />
                      <span>Details Auto-Filled from Allocation Slip!</span>
                    </div>
                  ) : (
                    <div className="text-center">
                      <HiDocumentArrowUp className="text-3xl text-blue-500 mx-auto mb-1" />
                      <p className="text-xs font-bold text-gray-800">
                        Upload ABUAD Room Allocation PDF
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        Automatically reads Hostel, Room, Wing, Level, and Capacity
                      </p>
                    </div>
                  )}
                </label>
              </div>
            )}

            {formError && (
              <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs sm:text-sm font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
              <datalist id="hostel-list">
                {ABUAD_HOSTELS.map((h) => (
                  <option key={h} value={h} />
                ))}
              </datalist>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-gray-700">
                  Hostel Name <span className="text-red-500">*</span>
                </span>
                <input
                  type="text"
                  list="hostel-list"
                  placeholder="e.g. ABUAD Male Hostel 1"
                  value={form.hostel}
                  onChange={(e) => setForm((f) => ({ ...f, hostel: e.target.value }))}
                  disabled={!!editingId}
                  className="p-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all disabled:bg-gray-100 disabled:text-gray-400"
                  required
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-gray-700">
                  Room Number <span className="text-red-500">*</span>
                </span>
                <input
                  type="text"
                  placeholder="e.g. D29"
                  value={form.room}
                  onChange={(e) => setForm((f) => ({ ...f, room: e.target.value }))}
                  disabled={!!editingId}
                  className="p-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all disabled:bg-gray-100 disabled:text-gray-400 uppercase"
                  required
                />
              </label>

              <label className="flex flex-col gap-1 sm:col-span-2">
                <span className="text-xs font-semibold text-gray-700">
                  Full Name <span className="text-red-500">*</span>
                </span>
                <input
                  type="text"
                  placeholder="Your full name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="p-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  required
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-gray-700">Department / Course</span>
                <input
                  type="text"
                  placeholder="e.g. Computer Engineering"
                  value={form.department}
                  onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
                  className="p-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-gray-700">Level</span>
                <input
                  type="text"
                  placeholder="e.g. 300"
                  value={form.level}
                  onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))}
                  className="p-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </label>

              {/* Profile Image */}
              <label className="flex flex-col gap-1 sm:col-span-2">
                <span className="text-xs font-semibold text-gray-700">
                  Profile Photo <span className="text-gray-400 font-normal">(Optional, max 2MB)</span>
                </span>
                <div className="flex items-center gap-4">
                  <label className="cursor-pointer">
                    <div className="flex items-center gap-2 px-3.5 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all text-xs font-medium text-gray-600">
                      Choose Image
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                  {imagePreview && (
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-gray-200 shrink-0">
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => { setProfileImage(null); setImagePreview(null); }}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-gray-700">Phone Number</span>
                <input
                  type="tel"
                  placeholder="08012345678"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className="p-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-gray-700">WhatsApp Number</span>
                <input
                  type="tel"
                  placeholder="08012345678"
                  value={form.whatsapp}
                  onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))}
                  className="p-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </label>

              <label className="flex flex-col gap-1 sm:col-span-2">
                <span className="text-xs font-semibold text-gray-700">Note for Roommates</span>
                <textarea
                  placeholder="Introduce yourself, mention lifestyle preferences, or leave a note..."
                  rows={3}
                  value={form.bio}
                  onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                  className="p-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-y"
                />
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="sm:col-span-2 py-3.5 px-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold text-sm rounded-xl shadow-md transition-all disabled:opacity-50"
              >
                {submitting
                  ? "Saving..."
                  : editingId
                  ? "Save Changes"
                  : "Submit Details"}
              </button>
            </form>
          </div>

        </div>
      </main>
    </div>
  );
}