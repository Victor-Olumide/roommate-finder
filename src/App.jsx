import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import Footer from './components/Footer'
import Navbar from './components/Navbar'
import Room from './pages/Room'
import NotFound from './pages/NotFound'
import Roommate from './pages/Roommate'
import RoomDetails from './pages/RoomDetails'
import AdminDashboard from './pages/AdminDashboard'
import AdminLogin from './pages/AdminLogin'

function ProtectedAdminRoute({ children }) {
  const token = sessionStorage.getItem("admin_token");
  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
}

export default function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path='/rooms' element={<Room />} />
            <Route path='/room/:hostel/:number' element={<RoomDetails />} />
            <Route path='/roommate' element={<Roommate />} />

            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedAdminRoute>
                  <AdminDashboard />
                </ProtectedAdminRoute>
              }
            />
            {/* Redirect from legacy /admin route */}
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

            <Route path='*' element={<NotFound />} />
          </Routes>
        </main>
      </div>
      <Footer />
    </Router>
  )
}