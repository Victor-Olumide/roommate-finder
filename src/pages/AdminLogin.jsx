import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { IoLockClosedOutline, IoEyeOutline, IoEyeOffOutline } from "react-icons/io5";
import { HiArrowLeft, HiShieldCheck } from "react-icons/hi2";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    setErrorMsg("");

    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);

      // Verify the signed-in user has admin role in Firestore
      const adminDoc = await getDoc(doc(db, "admins", cred.user.uid));
      if (!adminDoc.exists() || adminDoc.data().role !== "admin") {
        await auth.signOut();
        setErrorMsg("Your account does not have admin access.");
        return;
      }

      // Store UID as the session token
      sessionStorage.setItem("admin_token", cred.user.uid);
      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      console.error("Admin login error:", err);
      if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password" || err.code === "auth/user-not-found") {
        setErrorMsg("Incorrect email or password.");
      } else if (err.code === "auth/too-many-requests") {
        setErrorMsg("Too many attempts. Try again later.");
      } else {
        setErrorMsg("Login failed. Check your connection.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/60 via-slate-50 to-white text-slate-800 flex items-center justify-center p-4 sm:p-6 font-sans relative overflow-hidden">
      
      {/* Background Lights */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-40 w-96 h-96 bg-indigo-200/40 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm bg-white/90 backdrop-blur-xl rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/50 p-6 sm:p-8 relative z-10">

        {/* Portal Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-blue-100/80 text-blue-600 border border-blue-200 flex items-center justify-center mx-auto mb-3 shadow-xs">
            <IoLockClosedOutline className="text-xl" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-bold mb-2">
            <HiShieldCheck className="text-blue-600 text-xs" /> Admin Portal
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Sign In</h1>
          <p className="text-xs text-slate-500 mt-1 font-normal">
            Enter authorized credentials to manage listings.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-600 text-xs font-semibold text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Email</label>
            <input
              type="email"
              placeholder="admin email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3.5 text-xs bg-slate-50/80 border border-slate-200/80 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-900 placeholder-slate-400"
              autoFocus
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3.5 pr-10 text-xs bg-slate-50/80 border border-slate-200/80 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-900 placeholder-slate-400"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 transition-colors"
              >
                {showPassword ? <IoEyeOffOutline className="text-base" /> : <IoEyeOutline className="text-base" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={!email.trim() || !password.trim() || loading}
            className="w-full mt-2 py-3.5 bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-2xl shadow-lg shadow-blue-500/25 transition-all disabled:opacity-40"
          >
            {loading ? "Authenticating…" : "Sign In to Portal"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => navigate("/")}
          className="w-full mt-5 inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors"
        >
          <HiArrowLeft className="text-sm" /> Return to Public Website
        </button>
      </div>
    </div>
  );
}