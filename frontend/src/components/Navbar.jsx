import { Link } from 'react-router-dom'

function Navbar() {
    return (
        <nav style={{
            background: '#1a1a2e',
            padding: '12px 24px',
            display: 'flex',
            gap: '24px',
            alignItems: 'center'
        }}>
            <span style={{ color: '#fff', fontWeight: 'bold', marginRight: '16px'}}>
                TallerApp
            </span>
            <Link to="/dashboard" style={{ color: '#ccc', textDecoration: 'none' }}>Dashboard</Link>
            <Link to="/" style={{ color: '#ccc', textDecoration: 'none' }}>Tablero</Link>
            <Link to="/clientes" style={{ color: '#ccc', textDecoration: 'none' }}>Clientes</Link>
            <Link to="/repuestos" style={{ color: '#ccc', textDecoration: 'none' }}>Repuestos</Link>
        </nav>
    )
}

export default Navbar