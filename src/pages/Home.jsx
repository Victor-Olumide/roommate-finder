export default function Home() {
  return (
    <>
      <div className="min-h-screen overflow-x-hidden">
        <main className="bg-[url('/bgv.png')] p-10 min-h-screen bg-cover bg-center flex flex-col items-center justify-center">
      <div className="max-w-4xl mx-auto w-full">
        <h1 className="text-4xl font-bold mb-12 text-gray-800 text-center drop-shadow-md">Roommate Finder</h1>
        
        {/* Search Section */}
        <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-2xl mb-12">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800">Search Roommates</h2>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <input
              type="text"
              id="searchHostel"
              placeholder="Hostel name (e.g., Male Hall 5)"
              className="flex-1 p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
            />
            <input
              type="text"
              id="searchRoom"
              placeholder="Room number (e.g., A13)"
              className="flex-1 p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
            />
            <button
              className="px-8 py-4 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
            >
              Search
            </button>
            <button
              type="button"
              
              className="px-8 py-4 bg-gray-500 text-white font-semibold rounded-xl hover:bg-gray-600 disabled:opacity-50 transition-all shadow-md hover:shadow-lg"
              
            >
              Clear
            </button>
          </div>


          
        </div>

        {/* Upload Section */}
        <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-2xl">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800">Upload Your Details</h2>
          <form className="grid gap-6 md:grid-cols-2">

            <label htmlFor="hostel" className="flex-1">
              <span className="block text-sm font-medium text-gray-700 mb-1">Hostel name *</span>
              <input
                id="hostel"
                type="text"
                placeholder="e.g., Male Hall 5"
                className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                required
              />
            </label>
            <label htmlFor="room" className="flex-1">
              <span className="block text-sm font-medium text-gray-700 mb-1">Room number *</span>
              <input
                id="room"
                type="text"
                placeholder="e.g., A13"
                className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                required
              />
            </label>
            <label htmlFor="name" className="md:col-span-2">
              <span className="block text-sm font-medium text-gray-700 mb-1">Your name *</span>
              <input
                id="name"
                type="text"
                placeholder="Full name"
                value={name}
                className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                required
              />
            </label>
            <label htmlFor="phone" className="flex-1">
              <span className="block text-sm font-medium text-gray-700 mb-1">Phone (optional)</span>
              <input
                id="phone"
                type="tel"
                placeholder="+234567890"
                className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
              />
            </label>
            <label htmlFor="whatsapp" className="flex-1">
              <span className="block text-sm font-medium text-gray-700 mb-1">WhatsApp (optional)</span>
              <input
                id="whatsapp"
                type="tel"
                placeholder="+234567890"
                className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
              />
            </label>
            <label htmlFor="bio" className="md:col-span-2">
              <span className="block text-sm font-medium text-gray-700 mb-2">Note (optional)</span>
              <textarea
                id="bio"
                placeholder="Leave a note for your roommate..."
                rows={3}
                className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm resize-vertical"
              />
            </label>
            <button
              type="submit"
              className="md:col-span-2 px-12 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white font-bold rounded-xl hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl text-lg"
            >
            Upload My Details
            </button>
          </form>
        </div>
      </div>
    </main>
      </div>
    </>
  );
}
