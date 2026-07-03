import { useState, useEffect } from 'react'
import api from '../api'

function StatCard({ titulo, valor, color, subtitulo }) {
    return (
        <div style={{
            background: '#fff',
            borderRadius: '10px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            borderTop: `4px solid ${color}`
        }}>
            <p style={{ margin: '0 0 8px', fontSize: '13px', color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {titulo}
            </p>
            <p style={{ margin: '0', fontSize: '32px', fontWeight: 'bold', color }}>
                {valor}
            </p>
            {subtitulo && (
                <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#bbb' }}>{subtitulo}</p>
            )}
        </div>
    )
}

function Dashboard() {
    const [datos, setDatos] = useState(null)
    const [cargando, setCargando] = useState(true)
    const [error, setError] = useState(false)

    useEffect(() => {
        api.get('/dashboard/')
            .then(res => setDatos(res.data))
            .catch(() => setError(true))
            .finally(() => setCargando(false))
    }, [])

    if (cargando) return <p style={{ color: '#999', textAlign: 'center', marginTop: '60px' }}>Cargando dashboard...</p>
    if (error || !datos) return <p style={{ color: 'red', textAlign: 'center' }}>Error al cargar datos.</p>

    const maxUso = datos.piezas_mas_usadas[0]?.total_usado || 1

    return (
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
            <h2 style={{ marginBottom: '24px' }}>Dashboard</h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
                <StatCard
                    titulo="Reparaciones activas"
                    valor={datos.activas}
                    color="#3498db"
                    subtitulo="En proceso actualmente"
                />
                <StatCard
                    titulo="Listas para entregar"
                    valor={datos.terminadas}
                    color="#27ae60"
                    subtitulo="Esperando pago"
                />
                <StatCard
                    titulo="Ingresos del mes"
                    valor={`$${datos.ingresos_mes.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
                    color="#9b59b6"
                    subtitulo="Solo órdenes pagadas"
                />
            </div>

            <div style={{ background: '#fff', borderRadius: '10px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                <h3 style={{ margin: '0 0 20px', fontSize: '15px', color: '#333' }}>Piezas más utilizadas</h3>

                {datos.piezas_mas_usadas.length === 0 ? (
                    <p style={{ color: '#bbb', textAlign: 'center' }}>Sin datos aún</p>
                ) : (
                    datos.piezas_mas_usadas.map((pieza, i) => (
                        <div key={i} style={{ marginBottom: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <span style={{ fontSize: '13px', color: '#444' }}>{pieza.repuesto__nombre_pieza}</span>
                                <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#666' }}>{pieza.total_usado} usos</span>
                            </div>
                            <div style={{ background: '#f0f0f0', borderRadius: '4px', height: '8px' }}>
                                <div style={{
                                    background: '#9b59b6',
                                    height: '8px',
                                    borderRadius: '4px',
                                    width: `${(pieza.total_usado / maxUso) * 100}%`,
                                    transition: 'width 0.4s ease'
                                }} />
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}

export default Dashboard