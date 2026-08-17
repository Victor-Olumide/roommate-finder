import { useMemo } from "react";
import { HiUsers, HiBuildingOffice2, HiBuildingStorefront, HiPhoto } from "react-icons/hi2";

export default function AdminStats({ entries = [] }) {
  const stats = useMemo(() => {
    const totalEntries = entries.length;

    const uniqueHostels = new Set(
      entries.map((e) => e.hostel?.trim().toLowerCase()).filter(Boolean)
    ).size;

    const uniqueRooms = new Set(
      entries
        .map((e) => `${e.hostel?.trim().toLowerCase()}||${e.room?.trim().toLowerCase()}`)
        .filter((val) => !val.endsWith("||"))
    ).size;

    const withImages = entries.filter((e) => Boolean(e.image)).length;

    return { totalEntries, uniqueHostels, uniqueRooms, withImages };
  }, [entries]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
      {/* Total Submissions */}
      <div className="bg-white/90 backdrop-blur-sm p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
          <HiUsers className="text-xl" />
        </div>
        <div>
          <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Total Students
          </p>
          <p className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
            {stats.totalEntries}
          </p>
        </div>
      </div>

      {/* Active Hostels */}
      <div className="bg-white/90 backdrop-blur-sm p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
          <HiBuildingOffice2 className="text-xl" />
        </div>
        <div>
          <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Active Hostels
          </p>
          <p className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
            {stats.uniqueHostels}
          </p>
        </div>
      </div>

      {/* Occupied Rooms */}
      <div className="bg-white/90 backdrop-blur-sm p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
          <HiBuildingStorefront className="text-xl" />
        </div>
        <div>
          <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Occupied Rooms
          </p>
          <p className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
            {stats.uniqueRooms}
          </p>
        </div>
      </div>

      {/* Photos Uploaded */}
      <div className="bg-white/90 backdrop-blur-sm p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
          <HiPhoto className="text-xl" />
        </div>
        <div>
          <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Photos Uploaded
          </p>
          <p className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
            {stats.withImages}
          </p>
        </div>
      </div>
    </div>
  );
}