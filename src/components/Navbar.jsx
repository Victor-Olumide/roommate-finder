import Sidebar from "./Sidebar";

export default function Navbar() {
  return (
    <div className="bg-white shadow-lg w-screen overflow-x-hidden p-4 justify-between gap-6 text-blue-800 flex items-center flex-row lg:px-8">
        <Sidebar />

        <div className="flex flex-row items-center gap-2">
          <h1 className="font-bold">AFE BABALOLA UNIVERSITY</h1>
          <img src="/abuad.png" alt="ABUAD" width={30} />
        </div>
      </div>
  );
}
