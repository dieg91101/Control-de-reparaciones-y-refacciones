import { useState, useEffect } from 'react'
import api from '../api'

function Repuestos() {
    const [repuestos, setRepuestos] = useState([])
    const [form, setForm] = useState({ nombre_pieza: '', stock_disponible: '', precio_unitario: ''})
    const [editando, setEditando] = useState(null)
    const [error, setError] = useState('')
    
    useEffect(() => {
        cargarRepuestos()
    }, [])

    const cargarRepuestos = async () => {
        const res = await api.get('/repuestos/')
        setRepuestos(res.data)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        try {
            await api.post('/repuestos/', form)
            setForm({ nombre_pieza: '', stock_disponible: '', precio_unitario: ''})
            cargarRepuestos()
        } catch (err) {
            setError('Error al guardar el repuesto.')
        }
    }

    const guardarEdicion = async (id) => {
        try {
            await api.patch(`/repuestos/${id}/`, { stock_disponible: editando.stock_disponible })
            setEditando(null)
            cargarRepuestos()
        } catch (err) {
            setError('Error al actualizar el stock.')
        }
    }

    const eliminar = async (id) => {
        if (confirm('¿Eliminar este repuesto?')) {
            await api.delete(`/repuestos/${id}/`)
            cargarRepuestos()
        }
    }

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h2>Inventario de Repuestos</h2>

            <form onSubmit={handleSubmit} style={{ background: '#f5f5f5', padding: '20px', borderRadius: '8px', marginBottom: '24px' }}>
                <h3 style={{ marginTop: 0 }}>Nuevo repuesto</h3>
                {error && <p style={{ color: 'red' }}>{error}</p>}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <input
                        placeholder="Nombre de la pieza"
                        value={form.nombre_pieza}
                        onChange={e => setForm({ ...form, nombre_pieza: e.target.value })}
                        required
                        style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc'}}
                    />
                    <input
                        placeholder="Stock disponible"
                        type="number"
                        min="0"
                        value={form.stock_disponible}
                        onChange={e => setForm({ ...form, stock_disponible: e.target.value})}
                        required
                        style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                    <input
                        placeholder="Precio unitario"
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.precio_unitario}
                        onChange={e => setForm({ ...form, precio_unitario: e.target.value })}
                        required
                        style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                    <button type="submit" style={{ padding: '10px', background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                        Guardar Repuesto
                    </button>
                </div>
            </form>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ background: '#1a1a2e', color: '#fff' }}>
                        <th style={{ padding: '10px', textAlign: 'left' }}>Pieza</th>
                        <th style={{ padding: '10px', textAlign: 'left' }}>Stock</th>
                        <th style={{ padding: '10px', textAlign: 'left' }}>Precio unitario</th>
                        <th style={{ padding: '10px', textAlign: 'left' }}>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {repuestos.map(r => (
                        <tr key={r.id} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '10px' }}>{r.nombre_pieza}</td>
                            <td style={{ padding: '10px' }}>
                                {editando?.id === r.id ? (
                                    <input
                                        type="number"
                                        min="0"
                                        value={editando.stock_disponible}
                                        onChange={e => setEditando({ ...editando, stock_disponible: e.target.value })}
                                        style={{ width: '70px', padding: '4px', borderRadius: '4px', border: '1px solid #ccc' }}
                                    />
                                ) : (
                                    <span style={{
                                        background: r.stock_disponible === 0 ? '#e74c3c' : r.stock_disponible < 5 ? '#f39c12' : '#27ae60',
                                        color: '#fff',
                                        padding: '2px 10px',
                                        borderRadius: '12px',
                                        fontSize: '13px'
                                    }}>
                                        {r.stock_disponible}
                                    </span>
                                )}
                            </td>
                            <td style={{ padding: '10px' }}>${parseFloat(r.precio_unitario).toFixed(2)}</td>
                            <td style={{ padding: '10px', display: 'flex', gap: '6px' }}>
                                {editando?.id === r.id ? (
                                    <>
                                        <button
                                            onClick={() => guardarEdicion(r.id)}
                                            style={{ background: '#27ae60', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}
                                        >
                                            Guardar
                                        </button>
                                        <button
                                            onClick={() => setEditando(null)}
                                            style={{ background: '#888', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}
                                        >
                                            Cancelar
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => setEditando({ id: r.id, stock_disponible: r.stock_disponible })}
                                            style={{ background: '#f39c12', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}
                                        >
                                            Editar stock
                                        </button>
                                        <button
                                            onClick={() => eliminar(r.id)}
                                            style={{ background: '#e74c3c', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}
                                        >
                                            Eliminar
                                        </button>
                                    </>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {repuestos.length === 0 && (
                <p style={{ textAlign: 'center', color: '#999', marginTop: '20px' }}>No hay repuestos en inventario.</p>
            )}
        </div>
    )
}

export default Repuestos