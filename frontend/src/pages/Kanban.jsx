import { useState, useEffect } from 'react'
import api from '../api'

const COLUMNAS = ['RECIBIDO', 'DIAGNOSTICO', 'REPARACION', 'LISTO']
const COLORES = {
    RECIBIDO: '#3498db',
    DIAGNOSTICO: '#f39c12',
    REPARACION: '#9b59b6',
    LISTO: '#27ae60'
}
const ETIQUETAS = {
    RECIBIDO: 'Recibido',
    DIAGNOSTICO: 'Diagnóstico',
    REPARACION: 'Reparación',
    LISTO: 'Listo'
}

function Kanban() {
    const [ordenes, setOrdenes] = useState([])
    const [clientes, setClientes] = useState([])
    const [repuestos, setRepuestos] = useState([])
    const [mostrarForm, setMostrarForm] = useState(false)
    const [form, setForm] = useState({ cliente: '', descripcion_falla: '', costo_mano_obra: '' })
    const [error, setError] = useState('')
    const [modalObs, setModalObs] = useState(null)
    const [obsTexto, setObsTexto] = useState('')
    const [modalPiezas, setModalPiezas] = useState(null)
    const [piezasSeleccionadas, setPiezasSeleccionadas] = useState([{ repuesto: '', cantidad: 1 }])
    const [modalPago, setModalPago] = useState(null)
    const [metodoPago, setMetodoPago] = useState('EFECTIVO')

    useEffect(() => {
        cargarDatos()
    }, [])

    const cargarDatos = async () => {
        const [o, c, r] = await Promise.all([
            api.get('/ordenes/'),
            api.get('/clientes/'),
            api.get('/repuestos/')
        ])
        setOrdenes(o.data)
        setClientes(c.data)
        setRepuestos(r.data)
    }

    const crearOrden = async (e) => {
        e.preventDefault()
        setError('')
        try {
            await api.post('/ordenes/', {
                cliente: form.cliente,
                descripcion_falla: form.descripcion_falla,
                costo_mano_obra: form.costo_mano_obra || 0
            })
            setForm({ cliente: '', descripcion_falla: '', costo_mano_obra: '' })
            setMostrarForm(false)
            cargarDatos()
        } catch (err) {
            setError('Error al crear orden.')
        }
    }

    const cambiarEstado = (orden, nuevoEstado) => {
        if (nuevoEstado === 'DIAGNOSTICO') {
            setObsTexto(orden.notas || '')
            setModalObs({ orden, nuevoEstado })
            return
        }
        if (nuevoEstado === 'REPARACION') {
            setPiezasSeleccionadas([{ repuesto: '', cantidad: 1 }])
            setModalPiezas({ orden, nuevoEstado })
            return
        }
        ejecutarCambioEstado(orden.id, nuevoEstado, {})
    }

    const ejecutarCambioEstado = async (id, nuevoEstado, extra) => {
        try {
            await api.patch(`/ordenes/${id}/cambiar_estado/`, { estado: nuevoEstado, ...extra })
            cargarDatos()
        } catch (err) {
            alert(err.response?.data?.error || 'Error al cambiar estado.')
        }
    }

    const confirmarObservaciones = async () => {
        const { orden, nuevoEstado } = modalObs
        setModalObs(null)
        await ejecutarCambioEstado(orden.id, nuevoEstado, { observaciones: obsTexto })
    }

    const agregarFila = () => setPiezasSeleccionadas([...piezasSeleccionadas, { repuesto: '', cantidad: 1 }])

    const actualizarFila = (i, campo, valor) => {
        const nuevas = [...piezasSeleccionadas]
        nuevas[i][campo] = valor
        setPiezasSeleccionadas(nuevas)
    }

    const eliminarFila = (i) => {
        setPiezasSeleccionadas(piezasSeleccionadas.filter((_, idx) => idx !== i))
    }

    const confirmarPiezas = async () => {
        const { orden, nuevoEstado } = modalPiezas
        const validas = piezasSeleccionadas.filter(p => p.repuesto && p.cantidad > 0)
        setModalPiezas(null)
        console.log('Piezas a guardar: ', validas)
        for (const p of validas) {
            try {
                const res = await api.post('/detalles/', {
                    orden: orden.id,
                    repuesto: p.repuesto,
                    cantidad_usada: p.cantidad
                })
                console.log('Detalle guardado: ', res.data)
            }catch (err){
                console.error('Error al guardar detalle: ', err.response?.data)
                alert('Error al guardar pieza: ' + JSON.stringify(err.response?.data))
            }
        }
        await ejecutarCambioEstado(orden.id, nuevoEstado, {})
    }

    const pagarOrden = async (id) => {
       setMetodoPago('EFECTIVO')
       setModalPago({ id })
    }

    const confirmarPago = async () => {
        const { id } = modalPago
        setModalPago(null)
        try {
            await api.post(`/ordenes/${id}/pagar/`, { metodo_pago: metodoPago })
            cargarDatos()
        }catch (err){
            alert('Error al procesar pago.')
        }
    }

    const ordenesPorEstado = (estado) => ordenes.filter(o => o.estado === estado && !o.pagado)


    return (
        <div>
            {/* Modal Observaciones */}
            {modalObs && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, minHeight: '100vh', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '100px', zIndex: 100 }}>
                    <div style={{ background: '#fff', borderRadius: '8px', padding: '24px', width: '400px' }}>
                        <h3 style={{ marginTop: 0 }}>Observaciones del diagnóstico</h3>
                        <p style={{ color: '#666', fontSize: '13px' }}>Orden #{modalObs.orden.numero_orden} — {modalObs.orden.cliente_nombre}</p>
                        <textarea
                            value={obsTexto}
                            onChange={e => setObsTexto(e.target.value)}
                            placeholder="Escribe las observaciones..."
                            rows={4}
                            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', resize: 'vertical', boxSizing: 'border-box' }}
                        />
                        <div style={{ display: 'flex', gap: '8px', marginTop: '12px', justifyContent: 'flex-end' }}>
                            <button onClick={() => setModalObs(null)} style={{ padding: '8px 16px', borderRadius: '4px', border: '1px solid #ccc', cursor: 'pointer', background: '#fff' }}>
                                Cancelar
                            </button>
                            <button onClick={confirmarObservaciones} style={{ padding: '8px 16px', borderRadius: '4px', border: 'none', background: '#f39c12', color: '#fff', cursor: 'pointer' }}>
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Piezas */}
            {modalPiezas && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, minHeight: '100vh', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '100px', zIndex: 100 }}>
                    <div style={{ background: '#fff', borderRadius: '8px', padding: '24px', width: '480px' }}>
                        <h3 style={{ marginTop: 0 }}>Piezas usadas en reparación</h3>
                        <p style={{ color: '#666', fontSize: '13px' }}>Orden #{modalPiezas.orden.id} — {modalPiezas.orden.cliente_nombre}</p>

                        {piezasSeleccionadas.map((fila, i) => (
                            <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                                <select
                                    value={fila.repuesto}
                                    onChange={e => actualizarFila(i, 'repuesto', e.target.value)}
                                    style={{ flex: 1, padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }}
                                >
                                    <option value="">Selecciona pieza</option>
                                    {repuestos.map(r => (
                                        <option key={r.id} value={r.id}>{r.nombre_pieza} (stock: {r.stock_disponible})</option>
                                    ))}
                                </select>
                                <input
                                    type="number"
                                    min="1"
                                    value={fila.cantidad}
                                    onChange={e => actualizarFila(i, 'cantidad', parseInt(e.target.value))}
                                    style={{ width: '60px', padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }}
                                />
                                <button onClick={() => eliminarFila(i)} style={{ background: '#e74c3c', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer' }}>✕</button>
                            </div>
                        ))}

                        <button onClick={agregarFila} style={{ background: '#3613ff', border: '1px solid #ccc', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', marginBottom: '12px' }}>
                            + Agregar pieza
                        </button>

                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button onClick={() => setModalPiezas(null)} style={{ padding: '8px 16px', borderRadius: '4px', border: '1px solid #ccc', cursor: 'pointer', background: '#ff0000' }}>
                                Cancelar
                            </button>
                            <button onClick={confirmarPiezas} style={{ padding: '8px 16px', borderRadius: '4px', border: 'none', background: '#9b59b6', color: '#fff', cursor: 'pointer' }}>
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal pago */}
            {modalPago && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, minHeight: '100vh', background: 'rgba(0,0,0,0,0.5)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '100px', zIndex: 100 }}>
                    <div style={{ background: '#fff', borderRadius: '8px', padding: '24px', width: '360px' }}>
                        <h3 style={{ marginTop: 0 }}>Confirmar pago</h3>
                        <p style={{ color: '#666', fontSize: '13px' }}>Selecciona el método de pago para cerrar la orden.</p>

                        <label style={{ fontSize: '13px', fontWeight: 'bold', display: 'block', marginTop: '6px' }}>
                            Método de pago
                        </label>
                        <select
                            value={metodoPago}
                            onChange={e => setMetodoPago(e.target.value)}
                            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', marginBottom: '16px', boxSizing: 'border' }}
                        >
                            <option value="EFECTIVO">Efectivo</option>
                            <option value="TARJETA">Tarjeta</option>
                            <option value="TRANSFERENCIA">Transferencia</option>
                        </select>

                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setModalPago(null)}
                                style={{ padding: '8px 16px', borderRadius: '4px', border: '1px solid #ccc', cursor: 'pointer', background: '#ff0000' }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmarPago}
                                style={{ padding: '8px 16px', borderRadius: '4px', border: '1px solid #ccc', cursor: 'pointer', background: '#51ff00'}}
                            >
                                Confirmar pago
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0 }}>Tablero de Reparaciones</h2>
                <button
                    onClick={() => setMostrarForm(!mostrarForm)}
                    style={{ background: '#1a1a2e', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer' }}
                >
                    {mostrarForm ? 'Cancelar' : '+ Nueva orden'}
                </button>
            </div>

            {mostrarForm && (
                <form onSubmit={crearOrden} style={{ background: '#f5f5f5', padding: '20px', borderRadius: '8px', marginBottom: '24px', maxWidth: '500px' }}>
                    <h3 style={{ marginTop: 0 }}>Nueva orden de servicio</h3>
                    {error && <p style={{ color: 'red' }}>{error}</p>}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <select
                            value={form.cliente}
                            onChange={e => setForm({ ...form, cliente: e.target.value })}
                            required
                            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                        >
                            <option value="">Selecciona un cliente</option>
                            {clientes.map(c => (
                                <option key={c.id} value={c.id}>{c.nombre}</option>
                            ))}
                        </select>
                        <textarea
                            placeholder="Descripción de la falla"
                            value={form.descripcion_falla}
                            onChange={e => setForm({ ...form, descripcion_falla: e.target.value })}
                            required
                            rows={3}
                            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', resize: 'vertical' }}
                        />
                        <input
                            placeholder="Costo mano de obra"
                            type="number"
                            min="0"
                            step="0.01"
                            value={form.costo_mano_obra}
                            onChange={e => setForm({ ...form, costo_mano_obra: e.target.value })}
                            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                        />
                        <button type="submit" style={{ padding: '10px', background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                            Crear orden
                        </button>
                    </div>
                </form>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                {COLUMNAS.map(col => (
                    <div key={col} style={{ background: '#f0f0f0', borderRadius: '8px', padding: '12px', minHeight: '500px' }}>
                        <div style={{ background: COLORES[col], color: '#fff', padding: '8px 12px', borderRadius: '6px', marginBottom: '12px', textAlign: 'center', fontWeight: 'bold' }}>
                            {ETIQUETAS[col]} ({ordenesPorEstado(col).length})
                        </div>

                        {ordenesPorEstado(col).map(orden => (
                            <div key={orden.id} style={{ background: '#fff', borderRadius: '6px', padding: '12px', marginBottom: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
                                <p style={{ margin: '0 0 4px', fontWeight: 'bold', fontSize: '14px' }}>
                                    #{orden.numero_orden} — {orden.cliente_nombre}
                                </p>
                                <p style={{ margin: '0 0 6px', fontSize: '13px', color: '#666' }}>
                                    {orden.descripcion_falla}
                                </p>
                                <p style={{ margin: '0 0 6px', fontSize: '12px', color: '#aaa' }}>
                                    {new Date(orden.fecha_ingreso).toLocaleDateString('es-MX', {
                                        day: '2-digit', month: 'short', year: 'numeric'
                                    })}
                                </p>
                                {orden.notas && (
                                    <p style={{ margin: '0 0 6px', fontSize: '12px', color: '#888', fontStyle: 'italic', borderLeft: '3px solid #f39c12', paddingLeft: '8px' }}>
                                        {orden.notas}
                                    </p>
                                )}
                                {orden.estado === 'LISTO' && (
                                    <div style={{ margin: '0 0 8px', background: '#f9f9f9', borderRadius: '4px', padding: '8px', fontSize: '12px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666', marginBottom: '4px' }}>
                                            <span>Mano de obra:</span>
                                            <span>${parseFloat(orden.costo_mano_obra).toFixed(2)}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666', marginBottom: '4px' }}>
                                            <span>Total por las piezas:</span>
                                            <span>${(parseFloat(orden.total_pagar) - parseFloat(orden.costo_mano_obra)).toFixed(2)}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', color: '#27ae60', borderTop: '1px solid #eee', paddingTop: '4px' }}>
                                            <span>Total:</span>
                                            <span>${parseFloat(orden.total_pagar).toFixed(2)}</span>
                                        </div>
                                    </div>
                                )}
                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                    {COLUMNAS.indexOf(col) > 0 && orden.estado !== 'LISTO' && (
                                        <button
                                            onClick={() => cambiarEstado(orden, COLUMNAS[COLUMNAS.indexOf(col) - 1])}
                                            style={{ background: '#95a5a6', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                                        >
                                            ← Atrás
                                        </button>
                                    )}
                                    {COLUMNAS.indexOf(col) < COLUMNAS.length - 1 && (
                                        <button
                                            onClick={() => cambiarEstado(orden, COLUMNAS[COLUMNAS.indexOf(col) + 1])}
                                            style={{ background: COLORES[COLUMNAS[COLUMNAS.indexOf(col) + 1]], color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                                        >
                                            Avanzar →
                                        </button>
                                    )}
                                    {orden.estado === 'LISTO' && (
                                        <button
                                            onClick={() => pagarOrden(orden.id)}
                                            style={{ background: '#27ae60', color: '#fff', border: 'none', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                                        >
                                            💰 Pagar
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}

                        {ordenesPorEstado(col).length === 0 && (
                            <p style={{ textAlign: 'center', color: '#aaa', fontSize: '13px', marginTop: '20px' }}>Sin órdenes</p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}

export default Kanban