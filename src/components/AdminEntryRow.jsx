import { useState } from "react";
import { FaPhone } from "react-icons/fa6";
import { RiWhatsappFill } from "react-icons/ri";
import { HiPencilSquare, HiTrash, HiXMark, HiCheck, HiPhoto } from "react-icons/hi2";
import { API } from "../api";

export default function AdminEntryRow({ entry, token, onUpdate, onDelete, showToast }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: entry.name || "",
    hostel: entry.hostel || "",
    room: entry.room || "",
    phone: entry.phone || "",
    whatsapp: entry.whatsapp || "",
    bio: entry.bio || "",
    image: entry.image || "",
  });

  const [imagePreview, setImagePreview] = useState(entry.image || "");

  // Handle image pick with 2MB validation limit
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast("error", "Profile photo must be smaller than 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
      setForm((f) => ({ ...f, image: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.hostel.trim() || !form.room.trim()) {
      showToast("error", "Name, Hostel, and Room are required");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${API}/entries/${entry.id || entry._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          hostel: form.hostel.trim(),
          room: form.room.trim().toUpperCase(),
        }),
      });
      const json = await res.json();

      if (json.success) {
        onUpdate(json.data);
        setIsEditing(false);
        showToast("success", "Entry updated successfully");
      } else {
        showToast("error", json.message || "Update failed");
      }
    } catch (err) {
      console.error("Update Error:", err);
      showToast("error", "Network error while saving changes");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`${API}/entries/${entry.id || entry._id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const json = await res.json();

      if (json.success) {
        onDelete(entry.id || entry._id);
        showToast("success", "Entry removed from system");
      } else {
        showToast("error", json.message || "Delete failed");
      }
    } catch (err) {
      console.error("Delete Error:", err);
      showToast("error", "Network error while deleting entry");
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden transition-all">
      {/* Default Row Display */}
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        
        {/* Student Avatar & Quick Details */}
        <div className="flex items-center gap-4 min-w-0 w-full sm:w-auto">
          <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center text-gray-400 font-bold text-lg border border-gray-200/50">
            {entry.image ? (
              <img src={entry.image} alt={entry.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-blue-600 font-black">{entry.name?.charAt(0).toUpperCase()}</span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-gray-900 text-sm sm:text-base truncate">{entry.name}</h3>
            <p className="text-xs text-blue-600 font-bold truncate">
              {entry.hostel} • Room {entry.room}
            </p>
            
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-1">
              {entry.phone && (
                <span className="inline-flex items-center gap-1">
                  <FaPhone className="text-[10px] text-blue-500" /> {entry.phone}
                </span>
              )}
              {entry.whatsapp && (
                <span className="inline-flex items-center gap-1">
                  <RiWhatsappFill className="text-xs text-green-500" /> {entry.whatsapp}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <HiPencilSquare className="text-sm" />
              <span>Edit</span>
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(false)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <HiXMark className="text-sm" />
              <span>Cancel</span>
            </button>
          )}

          {isDeleting ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleDelete}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-xs transition-colors"
              >
                <HiCheck className="text-sm" />
                <span>Confirm</span>
              </button>
              <button
                onClick={() => setIsDeleting(false)}
                className="p-1.5 text-xs text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                <HiXMark className="text-sm" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsDeleting(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
            >
              <HiTrash className="text-sm" />
              <span>Delete</span>
            </button>
          )}
        </div>
      </div>

      {/* Expanded Edit Form Drawer */}
      {isEditing && (
        <div className="p-4 sm:p-6 bg-gray-50/80 border-t border-gray-100 space-y-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Edit Listing Information
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <label className="flex flex-col gap-1 sm:col-span-2">
              <span className="text-xs font-semibold text-gray-700">Student Full Name</span>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="p-2.5 text-xs bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-gray-700">Hostel Name</span>
              <input
                type="text"
                value={form.hostel}
                onChange={(e) => setForm({ ...form, hostel: e.target.value })}
                className="p-2.5 text-xs bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-gray-700">Room Number</span>
              <input
                type="text"
                value={form.room}
                onChange={(e) => setForm({ ...form, room: e.target.value })}
                className="p-2.5 text-xs bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 uppercase"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-gray-700">Phone Number</span>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="p-2.5 text-xs bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-gray-700">WhatsApp Number</span>
              <input
                type="tel"
                value={form.whatsapp}
                onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                className="p-2.5 text-xs bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-gray-700">Bio / Roommate Note</span>
            <textarea
              rows={2}
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              className="p-2.5 text-xs bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 resize-y"
            />
          </label>

          {/* Photo Selection */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-3">
              <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 hover:bg-gray-100 rounded-xl text-xs font-semibold text-gray-700 transition-colors">
                <HiPhoto className="text-sm text-gray-500" />
                <span>Change Photo</span>
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </label>

              {imagePreview && (
                <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-gray-200">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview("");
                      setForm((f) => ({ ...f, image: "" }));
                    }}
                    className="absolute inset-0 bg-black/40 text-white flex items-center justify-center text-xs opacity-0 hover:opacity-100 transition-opacity"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}