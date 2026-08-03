import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { IoLockClosedOutline, IoEyeOutline, IoEyeOffOutline } from "react-icons/io5";
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

      // Store UID as the session token (used by ProtectedAdminRoute)
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl p-6 sm:p-8 border border-gray-100">

        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
            <IoLockClosedOutline className="text-2xl" />
          </div>
          <h1 className="text-xl font-black text-gray-900">Admin Portal</h1>
          <p className="text-xs text-gray-500 mt-1 font-medium">
            Sign in with your admin account
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-semibold text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            placeholder="Admin email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            autoFocus
            required
          />

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3.5 pr-10 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
            >
              {showPassword ? <IoEyeOffOutline className="text-lg" /> : <IoEyeOutline className="text-lg" />}
            </button>
          </div>

          <button
            type="submit"
            disabled={!email.trim() || !password.trim() || loading}
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold text-sm rounded-xl transition-all shadow-md disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => navigate("/")}
          className="w-full mt-5 text-xs font-semibold text-gray-400 hover:text-gray-600 text-center block"
        >
          ← Return to Public Website
        </button>
      </div>
    </div>
  );
}
