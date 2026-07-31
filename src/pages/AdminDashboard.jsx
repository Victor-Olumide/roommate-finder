import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { HiMagnifyingGlass, HiArrowRightOnRectangle, HiArrowLeft, HiTrash } from "react-icons/hi2";
import { API } from "../api";

import AdminStats from "../components/AdminStats";
import AdminEntryRow from "../components/AdminEntryRow";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const authToken = sessionStorage.getItem("admin_token");

  const [entries, setEntries] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchEntries = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const res = await fetch(`${API}/entries`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const json = await res.json();
      if (json.success) {
        setEntries(json.data || []);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      showToast("error", "Could not load entries");
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [authToken]);

  useEffect(() => {
    fetchEntries(true);
    const interval = setInterval(() => fetchEntries(false), 8000);
    return () => clearInterval(interval);
  }, [fetchEntries]);

  const handleLogout = () => {
    sessionStorage.removeItem("admin_token");
    navigate("/admin/login", { replace: true });
  };

  const handleClearAll = async () => {
    if (!window.confirm("Delete ALL entries? This action cannot be undone.")) return;
    try {
      const res = await fetch(`${API}/entries`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const json = await res.json();
      if (json.success) {
        setEntries([]);
        showToast("success", "Database cleared");
      } else {
        showToast("error", json.message || "Clear failed");
      }
    } catch {
      showToast("error", "Network error");
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
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl text-white text-xs font-bold shadow-xl ${
            toast.type === "success" ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="max-w-5xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900">Admin Dashboard</h1>
            <p className="text-xs font-medium text-gray-500 mt-0.5">
              ABUAD Roommate Finder Management
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
            <button
              onClick={() => navigate("/")}
              className="inline-flex items-center gap-1 px-3.5 py-2 text-xs font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl"
            >
              <HiArrowLeft className="text-sm" />
              <span>Public App</span>
            </button>

            {entries.length > 0 && (
              <button
                onClick={handleClearAll}
                className="inline-flex items-center gap-1 px-3.5 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl"
              >
                <HiTrash className="text-sm" />
                <span>Clear All</span>
              </button>
            )}

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1 px-3.5 py-2 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl"
            >
              <HiArrowRightOnRectangle className="text-sm" />
              <span>Logout</span>
            </button>
          </div>
        </div>

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
                token={authToken}
                showToast={showToast}
                onUpdate={(updated) =>
                  setEntries((prev) =>
                    prev.map((e) => ((e.id || e._id) === (updated.id || updated._id) ? updated : e))
                  )
                }
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