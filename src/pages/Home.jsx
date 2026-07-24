﻿import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { API } from "../api";

const STORAGE_KEY = "findroom_entries";

// ── localStorage helpers ──────────────────────────────────────────────────────
function getSavedEntries() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}
function saveEntry(entry) {
  const entries = getSavedEntries().filter((e) => e.id !== entry.id);
  entries.unshift(entry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}
function removeSavedEntry(id) {
  const entries = getSavedEntries().filter((e) => e.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

// ── Blank form state ──────────────────────────────────────────────────────────
const blankForm = {
  hostel: "",
  room: "",
  name: "",
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
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  // my entries panel
  const [myEntries, setMyEntries] = useState([]);
  const [editingId, setEditingId] = useState(null); // which entry is being edited
  const [deletingId, setDeletingId] = useState(null);
  const [showMyEntries, setShowMyEntries] = useState(false);

  useEffect(() => {
    setMyEntries(getSavedEntries());
  }, []);

  // If navigated here with ?edit=<id>, auto-open the edit form for that entry
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const editId = params.get("edit");
    if (!editId) return;

    const saved = getSavedEntries().find((e) => e.id === editId);
    if (saved) {
      startEdit(saved);
      // Clean the query param from the URL without a full reload
      navigate("/", { replace: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  // ── Image handler ─────────────────────────────────────────────────────────
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setProfileImage(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  // ── Search ────────────────────────────────────────────────────────────────
  const handleSearch = () => {
    if (!searchHostel && !searchRoom) return;
    navigate(
      `/room/${encodeURIComponent(searchHostel)}/${encodeURIComponent(searchRoom)}`
    );
  };

  // ── Start editing an existing entry ──────────────────────────────────────
  const startEdit = (entry) => {
    setEditingId(entry.id);
    setForm({
      hostel: entry.hostel,
      room: entry.room,
      name: entry.name,
      phone: entry.phone || "",
      whatsapp: entry.whatsapp || "",
      bio: entry.bio || "",
    });
    setImagePreview(entry.image || null);
    setProfileImage(null);
    setFormError("");
    setFormSuccess("");
    setShowMyEntries(false);
    // scroll to form
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
    setFormSuccess("");
  };

  // ── Submit (create or update) ─────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!form.hostel || !form.room || !form.name) return;
    setSubmitting(true);

    try {
      if (editingId) {
        // ── Edit existing entry ──
        const saved = getSavedEntries().find((e) => e.id === editingId);
        if (!saved) {
          setFormError("Could not find your saved entry. Try again.");
          setSubmitting(false);
          return;
        }

        const res = await fetch(`${API}/entries/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            editToken: saved.editToken,
            name: form.name,
            phone: form.phone,
            whatsapp: form.whatsapp,
            bio: form.bio,
            image: imagePreview || "",
          }),
        });
        const json = await res.json();

        if (!json.success) {
          setFormError(json.message || "Update failed.");
          setSubmitting(false);
          return;
        }

        // Update localStorage
        saveEntry({ ...saved, ...json.data, editToken: saved.editToken });
        setMyEntries(getSavedEntries());
        cancelEdit();

        // Navigate to the room to show the updated entry
        navigate(
          `/room/${encodeURIComponent(json.data.hostel)}/${encodeURIComponent(json.data.room)}`
        );
      } else {
        // ── Create new entry ──
        const res = await fetch(`${API}/entries`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            hostel: form.hostel,
            room: form.room,
            name: form.name,
            phone: form.phone,
            whatsapp: form.whatsapp,
            bio: form.bio,
            image: imagePreview || "",
          }),
        });
        const json = await res.json();

        if (!json.success) {
          setFormError(json.message || "Submission failed.");
          setSubmitting(false);
          return;
        }

        // Persist id + editToken in localStorage so student can edit/delete later
        saveEntry({ ...json.data, editToken: json.editToken });
        setMyEntries(getSavedEntries());

        // Navigate straight to their room so they can see their entry
        navigate(
          `/room/${encodeURIComponent(json.data.hostel)}/${encodeURIComponent(json.data.room)}`
        );
      }
    } catch (err) {
      console.error("Submit error:", err);
      setFormError("Network error. Please check your connection and try again.");
    }

    setSubmitting(false);
  };

  // ── Delete own entry ──────────────────────────────────────────────────────
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

  const formTitle = editingId ? "Edit Your Details" : "Add Your Details";

  return (
    <div className="min-h-screen overflow-x-hidden">
      <main className="bg-[url('/bgv.png')] p-6 md:p-10 min-h-screen bg-cover bg-center flex flex-col items-center justify-center">
        <div className="max-w-4xl mx-auto w-full space-y-10">

          {/* ── Hero ── */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-800 drop-shadow-lg leading-tight">
              Know Your Roommates<br />Before Resumption
            </h1>
            <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto">
              Rooms have already been assigned. Upload your details or search for
              your room to see who you'll be staying with.
            </p>
            <div className="flex flex-wrap justify-center gap-3 text-sm text-gray-500">
              <Link
                to="/rooms"
                className="px-5 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-gray-200 hover:bg-white hover:shadow-md transition-all"
              >
                Browse all rooms
              </Link>
              <Link
                to="/roommate"
                className="px-5 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-gray-200 hover:bg-white hover:shadow-md transition-all"
              >
                View all students
              </Link>
              {myEntries.length > 0 && (
                <button
                  onClick={() => setShowMyEntries((v) => !v)}
                  className="px-5 py-2 bg-blue-600 text-white rounded-full border border-blue-600 hover:bg-blue-700 hover:shadow-md transition-all"
                >
                  My entries ({myEntries.length})
                </button>
              )}
            </div>
          </div>

          {/* ── My Entries Panel ── */}
          {showMyEntries && myEntries.length > 0 && (
            <div className="bg-white/90 backdrop-blur-md p-6 rounded-2xl shadow-2xl border border-white/20">
              <h2 className="text-xl font-bold text-gray-800 mb-4">My Submitted Entries</h2>
              <div className="space-y-3">
                {myEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center gap-4 p-3 rounded-xl border border-gray-100 bg-gray-50"
                  >
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-neutral-200 shrink-0 flex items-center justify-center text-gray-400 font-bold text-lg">
                      {entry.image ? (
                        <img src={entry.image} alt={entry.name} className="w-full h-full object-cover" />
                      ) : (
                        entry.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 truncate">{entry.name}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {entry.hostel}, Room {entry.room}
                      </p>
                    </div>
                    {/* Actions */}
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => startEdit(entry)}
                        className="px-3 py-1.5 text-xs bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all font-medium"
                      >
                        Edit
                      </button>
                      {deletingId === entry.id ? (
                        <span className="px-3 py-1.5 text-xs text-gray-400">Deleting…</span>
                      ) : (
                        <button
                          onClick={() => {
                            if (window.confirm(`Remove "${entry.name}" from ${entry.hostel}, Room ${entry.room}?`))
                              handleDelete(entry.id);
                          }}
                          className="px-3 py-1.5 text-xs bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-all font-medium"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Search ── */}
          <div className="bg-white/90 backdrop-blur-md p-6 md:p-8 rounded-2xl shadow-2xl border border-white/20">
            <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2">
              <svg className="w-6 h-6 text-blue-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Find Your Roommates
            </h2>
            <p className="text-sm text-gray-500 mb-5">
              Enter your hostel and room number to see who else has been assigned there.
            </p>
            <div className="flex flex-col md:flex-row gap-3">
              <input
                type="text"
                placeholder="Hostel name (e.g., Male Hall 1)"
                value={searchHostel}
                onChange={(e) => setSearchHostel(e.target.value)}
                className="flex-1 p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm outline-none transition-all"
              />
              <input
                type="text"
                placeholder="Room number (e.g., A55)"
                value={searchRoom}
                onChange={(e) => setSearchRoom(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1 p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm outline-none transition-all"
              />
              <button
                onClick={handleSearch}
                disabled={!searchHostel && !searchRoom}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
              >
                Search
              </button>
              <button
                onClick={() => { setSearchHostel(""); setSearchRoom(""); }}
                className="px-8 py-4 bg-gray-500 text-white font-semibold rounded-xl hover:bg-gray-600 transition-all shadow-md hover:shadow-lg"
              >
                Clear
              </button>
            </div>
          </div>

          {/* ── Submit / Edit Form ── */}
          <div
            id="entry-form"
            className="bg-white/90 backdrop-blur-md p-6 md:p-8 rounded-2xl shadow-2xl border border-white/20 scroll-mt-24"
          >
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                {editingId ? (
                  <svg className="w-6 h-6 text-blue-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-green-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                )}
                {formTitle}
              </h2>
              {editingId && (
                <button
                  onClick={cancelEdit}
                  className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1 rounded-lg hover:bg-gray-100 transition-all"
                >
                  Cancel edit
                </button>
              )}
            </div>

            <p className="text-sm text-gray-500 mb-5">
              {editingId
                ? "Update your info below. Hostel and room can't be changed — delete and re-add if needed."
                : "Already know your room assignment? Add your info so your roommates can find and connect with you before resumption."}
            </p>

            {/* Error / success banners */}
            {formError && (
              <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {formError}
              </div>
            )}
            {formSuccess && (
              <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {formSuccess}
              </div>
            )}

            <form onSubmit={handleSubmit} className="grid gap-5 md:grid-cols-2">
              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium text-gray-700">
                  Hostel name <span className="text-red-500">*</span>
                </span>
                <input
                  type="text"
                  placeholder="e.g., Male Hall 1"
                  value={form.hostel}
                  onChange={(e) => setForm((f) => ({ ...f, hostel: e.target.value }))}
                  disabled={!!editingId}
                  className="p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm outline-none transition-all disabled:bg-gray-50 disabled:text-gray-400"
                  required
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium text-gray-700">
                  Room number <span className="text-red-500">*</span>
                </span>
                <input
                  type="text"
                  placeholder="e.g., A55"
                  value={form.room}
                  onChange={(e) => setForm((f) => ({ ...f, room: e.target.value }))}
                  disabled={!!editingId}
                  className="p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm outline-none transition-all disabled:bg-gray-50 disabled:text-gray-400"
                  required
                />
              </label>

              <label className="flex flex-col gap-1 md:col-span-2">
                <span className="text-sm font-medium text-gray-700">
                  Full name <span className="text-red-500">*</span>
                </span>
                <input
                  type="text"
                  placeholder="Your full name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm outline-none transition-all"
                  required
                />
              </label>

              {/* Profile Image */}
              <label className="flex flex-col gap-1 md:col-span-2">
                <span className="text-sm font-medium text-gray-700">
                  Profile photo{" "}
                  <span className="text-gray-400 font-normal">(optional)</span>
                </span>
                <div className="flex items-center gap-4">
                  <label className="cursor-pointer">
                    <div className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm text-gray-600">
                        {profileImage ? profileImage.name : "Choose image"}
                      </span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                  {imagePreview && (
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-gray-200 shrink-0">
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => { setProfileImage(null); setImagePreview(null); }}
                        className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium text-gray-700">
                  Phone{" "}
                  <span className="text-gray-400 font-normal">(optional)</span>
                </span>
                <input
                  type="tel"
                  placeholder="08012345678"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className="p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm outline-none transition-all"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium text-gray-700">
                  WhatsApp{" "}
                  <span className="text-gray-400 font-normal">(optional)</span>
                </span>
                <input
                  type="tel"
                  placeholder="08012345678"
                  value={form.whatsapp}
                  onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))}
                  className="p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm outline-none transition-all"
                />
              </label>

              <label className="flex flex-col gap-1 md:col-span-2">
                <span className="text-sm font-medium text-gray-700">
                  Note for roommates{" "}
                  <span className="text-gray-400 font-normal">(optional)</span>
                </span>
                <textarea
                  placeholder="Say something — introduce yourself, share your contact, etc..."
                  rows={3}
                  value={form.bio}
                  onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                  className="p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm outline-none transition-all resize-vertical"
                />
              </label>

              <button
                type="submit"
                disabled={submitting}
                className={`md:col-span-2 px-12 py-4 text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl text-lg ${
                  editingId
                    ? "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                    : "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                }`}
              >
                {submitting
                  ? editingId
                    ? "Saving…"
                    : "Submitting…"
                  : editingId
                  ? "Save Changes"
                  : "Submit My Details"}
              </button>
            </form>
          </div>

        </div>
      </main>
    </div>
  );
}
