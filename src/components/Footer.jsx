export default function Footer() {
  return (
    <footer className="w-full bg-blue-800 text-white py-6 px-4">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left text-xs md:text-sm">
        
        {/* Creator Info */}
        <div className="flex items-center gap-2">
          <div className="bg-red-600 p-0.5 rounded-full flex items-center justify-center shrink-0">
            <img 
              src="/VO.png" 
              alt="VO Design Logo" 
              width={32} 
              height={32} 
              className="rounded-full object-cover"
            />
          </div>
          <div>
            <p className="font-semibold text-white">Built by VODESIGN</p>
            <p className="text-blue-200 text-xs">ABUAD Roommate Finder</p>
          </div>
        </div>

        {/* Quick Links / Actions */}
        <div className="flex items-center gap-4 text-xs">
          <a 
            href="https://wa.me/2349026023588" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:underline text-blue-200 hover:text-white transition-colors"
          >
            Feedback / Report Bug
          </a>
          <span>•</span>
          <a 
            href="https://instagram.com/official_victor_olumide" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:underline text-blue-200 hover:text-white transition-colors"
          >
            Developer Instagram
          </a>
        </div>

      </div>
    </footer>
  );
}