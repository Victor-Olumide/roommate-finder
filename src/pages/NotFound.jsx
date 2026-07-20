export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center relative overflow-hidden bg-gray-50">
      {/* Continuous floating background shapes */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-24 h-24 bg-blue-200 rounded-full animate-float-slow animate-delay-2" />
        <div className="absolute top-1/3 right-1/4 w-16 h-16 bg-purple-200 rounded-full animate-float-medium" />
        <div className="absolute bottom-1/4 left-1/3 w-20 h-20 bg-teal-200 rounded-lg animate-float-reverse-slow animate-delay-4" />
        <div className="absolute top-1/2 left-1/2 w-14 h-14 bg-pink-200 rounded-full animate-float-fast animate-delay-6" />
        <div className="absolute top-1/5 right-1/3 w-32 h-32 bg-indigo-200 rounded-full animate-float-reverse-medium animate-delay-2 opacity-60" />
        <div className="absolute bottom-1/3 right-1/4 w-12 h-12 bg-yellow-200 rounded-lg animate-float-reverse-fast animate-delay-4" />
        <div className="absolute top-2/3 left-1/5 w-28 h-28 bg-green-200 rounded-full animate-float-slow opacity-50" />
        <div className="absolute bottom-1/5 right-1/5 w-10 h-10 bg-red-200 rounded-full animate-float-medium animate-delay-6" />
        <div className="absolute top-1/4 right-1/5 w-18 h-18 bg-orange-200 rotate-45 animate-float-reverse-slow animate-delay-4 opacity-70" />
        <div className="absolute bottom-1/2 right-1/3 w-24 h-24 bg-cyan-200 rounded-full animate-float-fast animate-delay-2 opacity-40" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center">
        <h1 className="text-8xl font-bold text-gray-300 mb-4">404</h1>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Page Not Found</h2>
        <p className="text-gray-600">
          GO TO <a href="/" className="text-blue-500 hover:underline font-medium">HOME</a>
        </p>
      </div>
    </div>
  )
}