import { useEffect, useState } from "react";
import { HiCheckCircle, HiXCircle, HiInformationCircle, HiXMark } from "react-icons/hi2";

const ICONS = {
  success: <HiCheckCircle className="text-xl text-green-500 shrink-0" />,
  error:   <HiXCircle    className="text-xl text-red-500   shrink-0" />,
  info:    <HiInformationCircle className="text-xl text-blue-500 shrink-0" />,
};
const BG = {
  success: "border-green-200",
  error:   "border-red-200",
  info:    "border-blue-200",
};

/**
 * Controlled toast — pass { type, message } or null to hide.
 * Auto-dismisses after `duration` ms (default 3500).
 */
export default function Toast({ toast, onDismiss, duration = 3500 }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!toast) { setVisible(false); return; }
    setVisible(true);
    const t = setTimeout(() => { setVisible(false); onDismiss?.(); }, duration);
    return () => clearTimeout(t);
  }, [toast, duration, onDismiss]);

  if (!toast || !visible) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 px-4 py-3 rounded-2xl border bg-white shadow-2xl text-sm font-semibold text-gray-800 ${BG[toast.type] || BG.info}`}
    >
      {ICONS[toast.type] || ICONS.info}
      <span>{toast.message}</span>
      <button
        onClick={() => { setVisible(false); onDismiss?.(); }}
        className="ml-1 text-gray-400 hover:text-gray-600"
        aria-label="Dismiss"
      >
        <HiXMark className="text-base" />
      </button>
    </div>
  );
}

/** Hook to manage toast state. Returns [toast, showToast, clearToast]. */
export function useToast() {
  const [toast, setToast] = useState(null);
  const showToast = (type, message) => setToast({ type, message });
  const clearToast = () => setToast(null);
  return [toast, showToast, clearToast];
}
