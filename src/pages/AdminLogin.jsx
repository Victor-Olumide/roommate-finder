import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { IoLockClosedOutline, IoEyeOutline, IoEyeOffOutline } from "react-icons/io5";
import { API } from "../api";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password.trim()) return;

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch(`${API}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const json = await res.json();

      // Flexible check for token field naming
      const token = json.token || json.adminToken || (json.success ? "authenticated" : null);

      if (json.success && token) {
        sessionStorage.setItem("admin_token", token);
        navigate("/admin/dashboard", { replace: true });
      } else {
        setErrorMsg(json.message || "Incorrect admin password");
      }
    } catch (err) {
      console.error("Login Error:", err);
      setErrorMsg("Network error. Could not reach server.");
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
            Enter secret key to access dashboard
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-semibold text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3.5 pr-10 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono"
              autoFocus
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
            disabled={!password.trim() || loading}
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold text-sm rounded-xl transition-all shadow-md disabled:opacity-50"
          >
            {loading ? "Authenticating..." : "Unlock Dashboard"}
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