import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Kanban from './pages/Kanban'
import Clientes from './pages/Clientes'
import Repuestos from './pages/Repuestos'
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <div style={{ padding: '20px' }}>
        <Routes>
          <Route path="/" element={<Kanban />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/repuestos" element={<Repuestos />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App