import { useState, useEffect } from 'react'
import api from '../api'

function Clientes() {
    const [clientes, setClientes] = useState([])
    const [form, setForm] = useState({ nombre: '', telefono: '', email: '' })
    const [error, setError] = useState('')
    const [busqueda, setBusqueda] = useState('')
    const [mostrarSugerencias, setMostrarSugerencias] = useState(false)
    const [sugerenciaActiva, setSugerenciaActiva] = useState(-1)

    useEffect(() => {
        cargarClientes()
    }, [])

    const cargarClientes = async () => {
        const res = await api.get('/clientes/')
        setClientes(res.data)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        try {
            await api.post('/clientes/', form)
            setForm({ nombre: '', telefono: '', email: '' })
            cargarClientes()
        } catch (err) {
            setError('Error al guardar. Verifica que el email no esté repetido')
        }
    }

    const eliminar = async (id) => {
        if (confirm('¿Eliminar este cliente?')) {
            await api.delete(`/clientes/${id}/`)
            cargarClientes()
        }
    }

    const clientesFiltrados = clientes.filter(c => {
        const q = busqueda.toLowerCase()
        return (
            c.nombre.toLowerCase().includes(q) ||
            (c.telefono && c.telefono.includes(q)) ||
            c.email.toLowerCase().includes(q)
        )
    })

    const resaltar = (texto) => {
    if (!texto) return ''
    if (!busqueda.trim()) return texto

    const q = busqueda.toLowerCase()
    const idx = texto.toLowerCase().indexOf(q)
    if (idx === -1) return texto

    const antes = texto.slice(0, idx)
    const coincide = texto.slice(idx, idx + busqueda.length)
    const despues = texto.slice(idx + busqueda.length)

    // Si alguna parte quedó vacía, evitamos renderizar nodos vacíos
    return (
        <span style={{ color: 'inherit' }}>
            {antes && <span>{antes}</span>}
            <mark style={{ background: '#fff3cd', padding: 0, borderRadius: '2px', color: 'inherit' }}>
                {coincide}
            </mark>
            {despues && <span>{despues}</span>}
        </span>
    )
}

    const sugerencias = busqueda
        ? clientes.filter(c => c.nombre.toLowerCase().includes(busqueda.toLowerCase()))
        : []

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h2>Clientes</h2>

            {/* Formulario nuevo cliente */}
            <form onSubmit={handleSubmit} style={{ background: '#f5f5f5', padding: '20px', borderRadius: '8px', marginBottom: '24px' }}>
                <h3 style={{ marginTop: 0 }}>Nuevo cliente</h3>
                {error && <p style={{ color: 'red' }}>{error}</p>}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <input
                        placeholder="Nombre completo"
                        value={form.nombre}
                        onChange={e => setForm({ ...form, nombre: e.target.value })}
                        required
                        style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                    <input
                        placeholder="Teléfono"
                        value={form.telefono}
                        onChange={e => setForm({ ...form, telefono: e.target.value })}
                        style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                    <input
                        placeholder="Email"
                        type="email"
                        value={form.email}
                        onChange={e => setForm({ ...form, email: e.target.value })}
                        required
                        style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                    <button type="submit" style={{ padding: '10px', background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                        Guardar cliente
                    </button>
                </div>
            </form>

            {/* Buscador con sugerencias */}
            <div style={{ position: 'relative', marginBottom: '16px' }}>
                <input
                    placeholder="Buscar por nombre, teléfono o email..."
                    value={busqueda}
                    onChange={e => { setBusqueda(e.target.value); setMostrarSugerencias(true) }}
                    onFocus={() => setMostrarSugerencias(true)}
                    onBlur={() => setTimeout(() => setMostrarSugerencias(false), 150)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box', fontSize: '14px' }}
                />
                {mostrarSugerencias && sugerencias.length > 0 && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #ddd', borderRadius: '6px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 10, marginTop: '4px' }}>
                        {sugerencias.map((c, i) => (
                            <div
                                key={c.id}
                                onMouseDown={() => { setBusqueda(c.nombre); setMostrarSugerencias(false) }}
                                onMouseEnter={e => setSugerenciaActiva(i)}
                                onMouseLeave={e => setSugerenciaActiva(-1)}
                                style={{
                                    padding: '10px 14px',
                                    cursor: 'pointer',
                                    borderBottom: '1px solid #f0f0f0',
                                    fontSize: '14px',
                                    background: sugerenciaActiva === i ? '#f5f5f5' : '#fff',
                                    color: '#000'
                                }}
                            >
                                <span style={{ fontWeight: 'bold' }}>{c.nombre}</span>
                                <span style={{ color: '#999', fontSize: '12px', marginLeft: '8px' }}>{c.email}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Tabla */}
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ background: '#1a1a2e', color: '#fff' }}>
                        <th style={{ padding: '10px', textAlign: 'left' }}>Nombre</th>
                        <th style={{ padding: '10px', textAlign: 'left' }}>Teléfono</th>
                        <th style={{ padding: '10px', textAlign: 'left' }}>Email</th>
                        <th style={{ padding: '10px', textAlign: 'left' }}>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {clientesFiltrados.map(c => (
                        <tr key={c.id} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '10px' }}>{resaltar(c.nombre)}</td>
                            <td style={{ padding: '10px' }}>{resaltar(c.telefono)}</td>
                            <td style={{ padding: '10px' }}>{resaltar(c.email)}</td>
                            <td style={{ padding: '10px' }}>
                                <button
                                    onClick={() => eliminar(c.id)}
                                    style={{ background: '#e74c3c', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}
                                >
                                    Eliminar
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {clientesFiltrados.length === 0 && (
                <p style={{ textAlign: 'center', color: '#999', marginTop: '20px' }}>
                    {busqueda ? `Sin resultados para "${busqueda}"` : 'No hay clientes registrados aún.'}
                </p>
            )}
        </div>
    )
}

export default Clientes