// Central API base URL — set VITE_API_URL in .env for production
// In production (Vercel), defaults to your Render backend URL.
// In development (localhost), proxies through Vite to localhost:5000.
export const API =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? "https://room-finder-abuad.onrender.com" : "/api");
