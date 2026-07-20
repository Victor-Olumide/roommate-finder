import { BrowserRouter as Router } from 'react-router-dom'
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Footer from './components/Footer'
import Navbar from './components/Navbar'
import Room from './pages/Room'
import NotFound from './pages/NotFound'
import Roommate from './pages/Roommate'
import RoomDetails from './pages/RoomDetails'

export default function App() {
  return (
    <div className='overflow-x-hidden'>
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path='/rooms' element={<Room />} />
        <Route path='/room/:hostel/:number' element={<RoomDetails />} />
        <Route path='/roommate' element={<Roommate />} />
        <Route path='*' element={<NotFound />} />
      </Routes>
      <Footer />
    </Router>
    </div>
  )
}
