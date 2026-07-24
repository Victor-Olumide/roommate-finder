
// import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <>
    <div className="bg-blue-800 w-screen text-xs md:text-lg flex items-center justify-center gap-2 p-4 text-white">
    <h1>Built with love - VODESIGN</h1>
    <div className="bg-red-600 p-0.3 rounded-full">
    <img src="/VO.png" alt="ABUAD" width={30} /></div>
    {/* <Link to="/admin" className="ml-4 text-blue-300 hover:text-white text-xs opacity-50 hover:opacity-100 transition-all">Admin</Link> */}
    </div>
    </>
  )
}
