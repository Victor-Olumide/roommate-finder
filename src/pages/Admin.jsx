import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API } from "../api";

const blankEdit = { name: "", phone: "", whatsapp: "", bio: "", image: "" };

export default function Admin() {
  const navigate = useNavigate();

  // auth
  const [password, setPassword] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  // data
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);

  // inline edit
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(blankEdit);
  const [editImagePreview, setEditImagePreview] = useState(null);
  const [saving, setSaving] = useState(false);

  // delete
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // toast
  const [toast, setToast] = useState(null);
  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Fetch entries ───────────────────────────────────────────────────────────
  const fetchEntries = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/entries`);
      const json = await res.json();
      if (json.success) setEntries(json.data);
    } catch {
      showToast("error", "Could not load entries");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authenticated) return;
    fetchEntries();
    const interval = setInterval(fetchEntries, 8000);
    return () => clearInterval(interval);
  }, [authenticated]);

  // ── Login ───────────────────────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      const res = await fetch(`${API}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const json = await res.json();
      if (json.success) {
        setAdminPassword(password);
        setAuthenticated(true);
        setPassword("");
      } else {
        showToast("error", "Incorrect password");
      }
    } catch {
      showToast("error", "Could not reach the server");
    }
    setAuthLoading(false);
  };

  const handleLogout = () => {
    setAuthenticated(false);
    setAdminPassword("");
    setEntries([]);
    setEditingId(null);
  };

  // ── Start editing ───────────────────────────────────────────────────────────
  const startEdit = (entry) => {
    setEditingId(entry.id);
    setEditForm({
      name: entry.name || "",
      phone: entry.phone || "",
      whatsapp: entry.whatsapp || "",
      bio: entry.bio || "",
      image: entry.image || "",
    });
    setEditImagePreview(entry.image || null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(blankEdit);
    setEditImagePreview(null);
  };

  const handleEditImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setEditImagePreview(reader.result);
      setEditForm((f) => ({ ...f, image: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  // ── Save edit ───────────────────────────────────────────────────────────────
  const handleSaveEdit = async (id) => {
    setSaving(true);
    try {
      const res = await fetch(`${API}/entries/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminPassword, ...editForm }),
      });
      const json = await res.json();
      if (json.success) {
        setEntries((prev) =>
          prev.map((e) => (e.id === id ? { ...e, ...json.data } : e))
        );
        cancelEdit();
        showToast("success", "Entry updated");
      } else {
        showToast("error", json.message || "Update failed");
      }
    } catch {
      showToast("error", "Network error");
    }
    setSaving(false);
  };

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API}/entries/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminPassword }),
      });
      const json = await res.json();
      if (json.success) {
        setEntries((prev) => prev.filter((e) => e.id !== id));
        setDeleteConfirm(null);
        if (editingId === id) cancelEdit();
        showToast("success", "Entry deleted");
      } else {
        showToast("error", json.message || "Delete failed");
      }
    } catch {
      showToast("error", "Network error");
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("Delete ALL entries? This cannot be undone.")) return;
    try {
      const res = await fetch(`${API}/entries`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminPassword }),
      });
      const json = await res.json();
      if (json.success) {
        setEntries([]);
        cancelEdit();
        showToast("success", "All entries deleted");
      } else {
        showToast("error", json.message || "Failed to clear");
      }
    } catch {
      showToast("error", "Network error");
    }
  };

  // ── Toast ───────────────────────────────────────────────────────────────────
  const Toast = () =>
    toast ? (
      <div
        className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium transition-all duration-300 ${
          toast.type === "success" ? "bg-green-500" : "bg-red-500"
        }`}
      >
        {toast.message}
      </div>
    ) : null;

  // ── Login screen ─────────────────────────────────────────────────────────────
  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-5">
        <Toast />
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Admin Access</h1>
            <p className="text-sm text-gray-500 mt-1">Enter the admin password to manage entries</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              placeholder="Enter admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              autoFocus
            />
            <button
              type="submit"
              disabled={!password || authLoading}
              className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all"
            >
              {authLoading ? "Checking…" : "Login"}
            </button>
          </form>
          <button onClick={() => navigate("/")} className="w-full mt-3 text-sm text-gray-500 hover:text-gray-700 text-center">
            ← Back to home
          </button>
        </div>
      </div>
    );
  }

  // ── Dashboard ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 md:p-8 p-5">
      <Toast />

      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Admin Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">
              {entries.length} {entries.length === 1 ? "entry" : "entries"} total
            </p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <button onClick={handleLogout} className="px-4 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all">
              Logout
            </button>
            {entries.length > 0 && (
              <button onClick={handleClearAll} className="px-4 py-2 text-sm text-red-600 bg-white border border-red-200 rounded-xl hover:bg-red-50 transition-all">
                Clear All
              </button>
            )}
            <button onClick={() => navigate("/")} className="px-4 py-2 text-sm text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition-all">
              ← Home
            </button>
          </div>
        </div>

        {/* Loading skeleton */}
        {loading && entries.length === 0 && (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 flex gap-4 animate-pulse">
                <div className="w-16 h-16 rounded-xl bg-gray-200 shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-3 bg-gray-100 rounded w-1/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && entries.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-lg font-medium">No entries yet</p>
            <p className="text-sm mt-1">Students haven't submitted any details yet.</p>
          </div>
        )}

        {entries.length > 0 && (
          <div className="space-y-4">
            {entries.map((entry) => (
              <div key={entry.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">

                {/* ── Entry row ── */}
                <div className="p-4 md:p-5 flex flex-col md:flex-row gap-4 md:items-center">
                  {/* Avatar */}
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl overflow-hidden bg-neutral-200 shrink-0 mx-auto md:mx-0 flex items-center justify-center">
                    {entry.image ? (
                      <img src={entry.image} alt={entry.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl font-bold text-gray-400">{entry.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 text-center md:text-left min-w-0">
                    <h3 className="text-base font-bold text-gray-800">{entry.name}</h3>
                    <p className="text-sm text-gray-500">{entry.hostel}, Room {entry.room}</p>
                    <div className="flex flex-wrap justify-center md:justify-start gap-x-4 gap-y-1 mt-1 text-xs text-gray-400">
                      {entry.phone && <span>📞 {entry.phone}</span>}
                      {entry.whatsapp && <span>💬 {entry.whatsapp}</span>}
                      {entry.bio && (
                        <span className="italic max-w-xs truncate">"{entry.bio}"</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-300 mt-1">{entry.createdAt}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-center md:justify-end gap-2 shrink-0">
                    {editingId === entry.id ? (
                      <button
                        onClick={cancelEdit}
                        className="px-3 py-1.5 text-xs text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all"
                      >
                        Cancel
                      </button>
                    ) : (
                      <button
                        onClick={() => startEdit(entry)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-all"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </button>
                    )}

                    {deleteConfirm === entry.id ? (
                      <div className="flex gap-1.5">
                        <button onClick={() => handleDelete(entry.id)} className="px-3 py-1.5 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600">
                          Confirm
                        </button>
                        <button onClick={() => setDeleteConfirm(null)} className="px-3 py-1.5 text-xs bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300">
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(entry.id)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-500 bg-red-50 rounded-lg hover:bg-red-100 transition-all"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </button>
                    )}
                  </div>
                </div>

                {/* ── Inline edit panel — expands below the row ── */}
                {editingId === entry.id && (
                  <div className="border-t border-gray-100 bg-gray-50 p-4 md:p-6">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
                      Editing — {entry.hostel}, Room {entry.room}
                    </p>

                    <div className="grid gap-4 md:grid-cols-2">
                      {/* Name */}
                      <label className="flex flex-col gap-1 md:col-span-2">
                        <span className="text-xs font-medium text-gray-600">Full name</span>
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                          className="p-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                        />
                      </label>

                      {/* Phone */}
                      <label className="flex flex-col gap-1">
                        <span className="text-xs font-medium text-gray-600">Phone</span>
                        <input
                          type="tel"
                          value={editForm.phone}
                          onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                          placeholder="08012345678"
                          className="p-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                        />
                      </label>

                      {/* WhatsApp */}
                      <label className="flex flex-col gap-1">
                        <span className="text-xs font-medium text-gray-600">WhatsApp</span>
                        <input
                          type="tel"
                          value={editForm.whatsapp}
                          onChange={(e) => setEditForm((f) => ({ ...f, whatsapp: e.target.value }))}
                          placeholder="08012345678"
                          className="p-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                        />
                      </label>

                      {/* Bio */}
                      <label className="flex flex-col gap-1 md:col-span-2">
                        <span className="text-xs font-medium text-gray-600">Note / Bio</span>
                        <textarea
                          rows={3}
                          value={editForm.bio}
                          onChange={(e) => setEditForm((f) => ({ ...f, bio: e.target.value }))}
                          placeholder="Bio or note…"
                          className="p-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-vertical bg-white"
                        />
                      </label>

                      {/* Photo */}
                      <label className="flex flex-col gap-1 md:col-span-2">
                        <span className="text-xs font-medium text-gray-600">Profile photo</span>
                        <div className="flex items-center gap-4">
                          <label className="cursor-pointer">
                            <div className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-xl hover:bg-white transition-all text-sm text-gray-500">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              Change photo
                            </div>
                            <input type="file" accept="image/*" onChange={handleEditImageChange} className="hidden" />
                          </label>
                          {editImagePreview && (
                            <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-gray-200 shrink-0">
                              <img src={editImagePreview} alt="preview" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => { setEditImagePreview(null); setEditForm((f) => ({ ...f, image: "" })); }}
                                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs hover:bg-red-600"
                              >✕</button>
                            </div>
                          )}
                        </div>
                      </label>
                    </div>

                    {/* Save / Cancel */}
                    <div className="flex gap-3 mt-5">
                      <button
                        onClick={() => handleSaveEdit(entry.id)}
                        disabled={saving || !editForm.name.trim()}
                        className="px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        {saving ? "Saving…" : "Save Changes"}
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-6 py-2.5 bg-white border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
