import { useState } from "react";
import { FaPhone } from "react-icons/fa6";
import { RiWhatsappFill } from "react-icons/ri";
import { HiPencilSquare, HiTrash, HiXMark, HiCheck, HiPhoto } from "react-icons/hi2";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db, auth } from "../firebase";
import { compressImage } from "../utils/compressImage";

export default function AdminEntryRow({ entry, onDelete, showToast }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: entry.name || "",
    hostel: entry.hostel || "",
    room: entry.room || "",
    roomSpace: entry.roomSpace || "",
    roomCapacity: entry.roomCapacity || 4,
    matricNo: entry.matricNo || "",
    department: entry.department || "",
    level: entry.level || "",
    phone: entry.phone || "",
    whatsapp: entry.whatsapp || "",
    bio: entry.bio || "",
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(entry.image || "");

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast("error", "Profile photo must be smaller than 5MB");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.hostel.trim() || !form.room.trim()) {
      showToast("error", "Name, Hostel, and Room are required");
      return;
    }
    setSaving(true);
    try {
      const cleanedHostel = form.hostel.trim();
      const cleanedRoom = form.room.trim().toUpperCase();
      const cleanedName = form.name.trim();

      // Auto-extract gender strictly from the hostel name to prevent mismatches
      const derivedGender = cleanedHostel.includes("Female") ? "Female" : 
                            cleanedHostel.includes("Male") ? "Male" : "";

      // Compress new image to base64 if picked, else keep existing
      let imageUrl = entry.image || "";
      if (imageFile) {
        imageUrl = await compressImage(imageFile);
      }

      await updateDoc(doc(db, "entries", entry.id), {
        name: cleanedName,
        hostel: cleanedHostel,
        room: cleanedRoom,
        roomSpace: form.roomSpace.trim().toUpperCase(),
        roomCapacity: Number(form.roomCapacity) || 4,
        matricNo: form.matricNo.trim().toUpperCase(),
        department: form.department.trim(),
        level: form.level.trim(),
        gender: derivedGender, // <-- Automatically saved based on the hostel string
        phone: form.phone.trim(),
        whatsapp: form.whatsapp.trim(),
        bio: form.bio.trim(),
        image: imageUrl,
        hostelLower: cleanedHostel.toLowerCase(),
        roomLower: cleanedRoom.toLowerCase(),
        nameLower: cleanedName.toLowerCase(),
      });

      setImageFile(null);
      setIsEditing(false);
      showToast("success", "Entry updated successfully");
    } catch (err) {
      console.error("Update Error:", err);
      showToast("error", "Failed to update entry");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteDoc(doc(db, "entries", entry.id));
      onDelete(entry.id);
      showToast("success", "Entry removed from system");
    } catch (err) {
      console.error("Delete Error:", err);
      showToast("error", "Failed to delete entry");
    }
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden hover:shadow-md transition-all duration-300">
      {/* Default Row Display */}
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">

        {/* Student Avatar & Quick Details */}
        <div className="flex items-center gap-4 min-w-0 w-full sm:w-auto">
          <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center text-slate-400 font-bold text-lg border border-slate-200/50">
            {entry.image ? (
              <img src={entry.image} alt={entry.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-500 font-black text-xl select-none">
                {entry.name?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-slate-900 text-sm sm:text-base truncate">
              {entry.name} {entry.matricNo && <span className="text-slate-400 font-medium text-xs ml-1">({entry.matricNo})</span>}
            </h3>
            <p className="text-xs text-blue-600 font-bold truncate">
              {entry.hostel} • Room {entry.room} {entry.roomSpace && `(Bed ${entry.roomSpace})`}
            </p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1.5 font-medium">
              {entry.phone && (
                <span className="inline-flex items-center gap-1.5">
                  <FaPhone className="text-[10px] text-blue-500" /> {entry.phone}
                </span>
              )}
              {entry.whatsapp && (
                <span className="inline-flex items-center gap-1.5">
                  <RiWhatsappFill className="text-xs text-emerald-500" /> {entry.whatsapp}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all"
            >
              <HiPencilSquare className="text-sm" />
              <span>Edit</span>
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(false)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
            >
              <HiXMark className="text-sm" />
              <span>Cancel</span>
            </button>
          )}

          {isDeleting ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleDelete}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-all"
              >
                <HiCheck className="text-sm" />
                <span>Confirm</span>
              </button>
              <button
                onClick={() => setIsDeleting(false)}
                className="p-2 text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
              >
                <HiXMark className="text-base" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsDeleting(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-all"
            >
              <HiTrash className="text-sm" />
              <span>Delete</span>
            </button>
          )}
        </div>
      </div>

      {/* Expanded Edit Form Drawer */}
      {isEditing && (
        <div className="p-4 sm:p-6 bg-slate-50/50 border-t border-slate-100 space-y-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Edit Full Listing Information
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Core Identification */}
            <label className="flex flex-col gap-1.5 sm:col-span-2">
              <span className="text-xs font-bold text-slate-700">Student Full Name</span>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="p-3 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900" />
            </label>

            {/* Room Info */}
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-bold text-slate-700">Hostel Name</span>
              <input type="text" value={form.hostel} onChange={(e) => setForm({ ...form, hostel: e.target.value })}
                className="p-3 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900" />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-bold text-slate-700">Room Number</span>
              <input type="text" value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })}
                className="p-3 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all uppercase text-slate-900" />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-bold text-slate-700">Bed Space</span>
              <select value={form.roomSpace} onChange={(e) => setForm({ ...form, roomSpace: e.target.value })}
                className="p-3 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900">
                <option value="">Unassigned</option>
                <option value="A">Bed A</option>
                <option value="B">Bed B</option>
                <option value="C">Bed C</option>
                <option value="D">Bed D</option>
              </select>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-bold text-slate-700">Room Capacity</span>
              <select value={form.roomCapacity} onChange={(e) => setForm({ ...form, roomCapacity: Number(e.target.value) })}
                className="p-3 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900">
                <option value={1}>1 Person</option>
                <option value={2}>2 People</option>
                <option value={3}>3 People</option>
                <option value={4}>4 People</option>
              </select>
            </label>

            {/* Academic Info */}
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-bold text-slate-700">Matric No</span>
              <input type="text" value={form.matricNo} onChange={(e) => setForm({ ...form, matricNo: e.target.value })}
                placeholder="e.g. 22/ENG02/036"
                className="p-3 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all uppercase text-slate-900" />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-bold text-slate-700">Department</span>
              <input type="text" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="p-3 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900" />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-bold text-slate-700">Level</span>
              <input type="text" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}
                placeholder="e.g. 500"
                className="p-3 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900" />
            </label>

            {/* Contact Info */}
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-bold text-slate-700">Phone Number</span>
              <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="p-3 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900" />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-bold text-slate-700">WhatsApp Number</span>
              <input type="tel" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                className="p-3 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900" />
            </label>
          </div>

          <label className="flex flex-col gap-1.5 mt-4">
            <span className="text-xs font-bold text-slate-700">Bio / Roommate Note</span>
            <textarea rows={2} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })}
              className="p-3 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-y text-slate-900" />
          </label>

          {/* Photo Selection */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200/60 mt-4">
            <div className="flex items-center gap-3">
              <label className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 transition-all shadow-xs">
                <HiPhoto className="text-sm text-slate-500" />
                <span>Change Photo</span>
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </label>

              {imagePreview && (
                <div className="relative w-9 h-9 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview("");
                      setImageFile(null);
                    }}
                    className="absolute inset-0 bg-slate-900/40 text-white flex items-center justify-center text-xs opacity-0 hover:opacity-100 transition-opacity backdrop-blur-sm"
                  >
                    <HiXMark className="text-base" />
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}