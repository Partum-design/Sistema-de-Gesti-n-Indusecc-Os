import { useState, useEffect } from 'react'
import { toast } from '../../components/Toast'
import { getComplianceReport, getClause, updateClause } from '../../api/api'

const stateColor = { 'Completo': '#10b981', 'En revisión': '#f59e0b', 'En progreso': 'var(--red)' }

export default function SuperAdminNorma() {
  const [nodos, setNodos] = useState([])
  const [expanded, setExpanded] = useState({})
  const [loading, setLoading] = useState(true)
  const [overall, setOverall] = useState(0)

  useEffect(() => {
    loadCompliance()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadCompliance() {
    try {
      setLoading(true)
      const res = await getComplianceReport()
      if (res.data?.success && res.data?.data) {
        const report = res.data.data
        const data = report.data || report.clauses || report.norms || []
        
        // Transform data to nodos format
        const transformed = data.map(n => ({
          num: n.clauseNumber || n.num || n.id,
          title: n.clauseTitle || n.title || '',
          pct: n.completionPercentage || n.pct || 0,
          state: n.status || 'En progreso',
          subnodos: (n.subclauses || n.subnodos || []).map(s => ({
            num: s.clauseNumber || s.num,
            title: s.clauseTitle || s.title,
            pct: s.completionPercentage || s.pct || 0,
            _id: s._id
          })),
          _id: n._id
        }))
        
        setNodos(transformed)
        setOverall(report.overallPercentage || Math.round(transformed.reduce((s, n) => s + n.pct, 0) / transformed.length))
      }
    } catch (err) {
      toast(`Error cargando reporte: ${err.response?.data?.message || err.message}`, 'err')
      // Fallback to demo data
      setNodos(generateDemoData())
    } finally {
      setLoading(false)
    }
  }

  function generateDemoData() {
    return [
      {
        num: '4', title: 'Contexto de la organización', pct: 100, state: 'Completo',
        subnodos: [
          { num: '4.1', title: 'Comprensión de la organización', pct: 100 },
          { num: '4.2', title: 'Necesidades y expectativas', pct: 100 },
          { num: '4.3', title: 'Determinación del alcance', pct: 100 },
          { num: '4.4', title: 'SGC y sus procesos', pct: 100 },
        ]
      },
      {
        num: '5', title: 'Liderazgo', pct: 100, state: 'Completo',
        subnodos: [
          { num: '5.1', title: 'Liderazgo y compromiso', pct: 100 },
          { num: '5.2', title: 'Política', pct: 100 },
          { num: '5.3', title: 'Roles y autoridades', pct: 100 },
        ]
      },
      {
        num: '6', title: 'Planificación', pct: 82, state: 'En revisión',
        subnodos: [
          { num: '6.1', title: 'Acciones para riesgos', pct: 90 },
          { num: '6.2', title: 'Objetivos de calidad', pct: 80 },
          { num: '6.3', title: 'Planificación de cambios', pct: 75 },
        ]
      },
      {
        num: '7', title: 'Apoyo', pct: 45, state: 'En progreso',
        subnodos: [
          { num: '7.1', title: 'Recursos', pct: 60 },
          { num: '7.2', title: 'Competencia', pct: 40 },
          { num: '7.3', title: 'Toma de conciencia', pct: 30 },
          { num: '7.5', title: 'Información documentada', pct: 50 },
        ]
      },
      {
        num: '8', title: 'Operación', pct: 67, state: 'En progreso',
        subnodos: [
          { num: '8.1', title: 'Planificación operacional', pct: 80 },
          { num: '8.2', title: 'Requisitos de productos', pct: 70 },
          { num: '8.3', title: 'Diseño y desarrollo', pct: 60 },
          { num: '8.5', title: 'Producción del servicio', pct: 55 },
        ]
      },
      {
        num: '9', title: 'Evaluación del desempeño', pct: 30, state: 'En progreso',
        subnodos: [
          { num: '9.1', title: 'Seguimiento y medición', pct: 40 },
          { num: '9.2', title: 'Auditoría interna', pct: 20 },
          { num: '9.3', title: 'Revisión por dirección', pct: 30 },
        ]
      },
      {
        num: '10', title: 'Mejora', pct: 15, state: 'En progreso',
        subnodos: [
          { num: '10.1', title: 'Generalidades', pct: 20 },
          { num: '10.2', title: 'No conformidades', pct: 10 },
          { num: '10.3', title: 'Mejora continua', pct: 15 },
        ]
      },
    ]
  }

  const toggle = (num) => setExpanded(p => ({ ...p, [num]: !p[num] }))

  async function handleReporte() {
    try {
      const csv = 'Cláusula,Cumplimiento,Estado\n' + 
        nodos.map(n => `"${n.num}: ${n.title}",${n.pct}%,${n.state}`).join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ISO_9001_Reporte_${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      toast('Reporte exportado exitosamente', 'ok')
    } catch (err) {
      toast(`Error: ${err.message}`, 'err')
    }
  }

  async function handleEditClause(clauseId) {
    try {
      const newStatus = prompt('Nuevo estado (Completo, En revisión, En progreso):', 'En revisión')
      if (!newStatus) return
      const res = await updateClause(clauseId, { status: newStatus })
      if (res.data?.success) {
        toast(`Cláusula actualizada: ${newStatus}`, 'ok')
        await loadCompliance()
      } else {
        toast(res.data?.message || 'Error al actualizar', 'err')
      }
    } catch (err) {
      toast(`Error: ${err.response?.data?.message || err.message}`, 'err')
    }
  }

  return (
    <main className="page">
      <div className="ph">
        <div>
          <h1 className="ph-title">Nodos de la <em>Norma</em></h1>
          <p className="ph-sub">ISO 9001:2015 — Acceso total sin restricciones a todas las cláusulas</p>
        </div>
        <div className="ph-actions">
          <button className="btn btn-red" onClick={handleReporte}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            Reporte de Cumplimiento
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--ash)' }}>Cargando datos de cumplimiento...</div>
      ) : (
        <>
          {/* Overall */}
          <div style={{ padding: '1.5rem', background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 12, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap', boxShadow: '0 4px 12px rgba(0,0,0,.04)' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--red)', lineHeight: 1 }}>{overall}%</div>
              <div style={{ fontSize: '.78rem', color: 'var(--ash)', fontWeight: 600, marginTop: 4 }}>Cumplimiento Global</div>
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ height: 10, background: 'var(--border)', borderRadius: 10, overflow: 'hidden', marginBottom: 8 }}>
                <div style={{ height: '100%', width: `${overall}%`, background: 'var(--red)', borderRadius: 10, transition: 'width 1s' }} />
              </div>
              <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                {[{ label: 'Completos', val: nodos.filter(n => n.pct === 100).length, color: '#10b981' }, { label: 'En revisión', val: nodos.filter(n => n.state === 'En revisión').length, color: '#f59e0b' }, { label: 'En progreso', val: nodos.filter(n => n.state === 'En progreso').length, color: 'var(--red)' }].map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color }} />
                    <span style={{ fontSize: '.78rem', color: 'var(--ash)' }}>{s.label}: <strong style={{ color: s.color }}>{s.val}</strong></span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ padding: '10px 18px', background: 'var(--red)', borderRadius: 8, border: '1px solid var(--red-m)', fontSize: '.78rem', color: '#fff', fontWeight: 700, flexShrink: 0, boxShadow: '0 4px 10px rgba(123,30,34,.2)' }}>
              Acceso Sin Restricciones
            </div>
          </div>

          {/* Nodos */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.8rem' }}>
            {nodos.map(n => (
              <div key={n.num} className="card" style={{ border: `1px solid ${expanded[n.num] ? 'rgba(123,30,34,.2)' : 'var(--border)'}`, transition: 'all .2s' }}>
                <div onClick={() => toggle(n.num)}
                  style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.1rem 1.3rem', cursor: 'pointer' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--red)', border: '1px solid var(--red-m)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 6px rgba(123,30,34,.15)' }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#fff' }}>{n.num}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, color: 'var(--ink)', fontSize: '.9rem', marginBottom: 4 }}>{n.title}</div>
                    <div style={{ height: 4, background: 'var(--border)', borderRadius: 4, maxWidth: 300 }}>
                      <div style={{ height: '100%', width: `${n.pct}%`, background: n.pct === 100 ? '#10b981' : n.pct >= 75 ? '#f59e0b' : 'var(--red)', borderRadius: 4 }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                    <span style={{ fontSize: '.78rem', fontWeight: 700, color: stateColor[n.state] }}>{n.state}</span>
                    <span style={{ fontSize: '.88rem', fontWeight: 900, color: 'var(--red)' }}>{n.pct}%</span>
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" width="16" style={{ color: 'var(--red)', transform: expanded[n.num] ? 'rotate(90deg)' : 'none', transition: 'transform .2s' }}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                  </div>
                </div>

                {expanded[n.num] && (
                  <div style={{ borderTop: '1px solid var(--border)', padding: '1rem 1.3rem', display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
                    {n.subnodos.map(s => (
                      <div key={s.num} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '12px 14px', background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--border)', cursor: 'pointer', transition: 'all .2s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--white)'; e.currentTarget.style.borderColor = 'var(--gold)' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.borderColor = 'var(--border)' }}
                        onClick={() => handleEditClause(s._id || n._id)}>
                        <span style={{ fontSize: '.8rem', fontWeight: 900, color: 'var(--red)', width: 38, flexShrink: 0 }}>{s.num}</span>
                        <span style={{ flex: 1, fontSize: '.85rem', color: 'var(--ink)', fontWeight: 600 }}>{s.title}</span>
                        <div style={{ width: 80, height: 4, background: 'var(--border)', borderRadius: 4, flexShrink: 0 }}>
                          <div style={{ height: '100%', width: `${s.pct}%`, background: s.pct === 100 ? '#10b981' : s.pct >= 75 ? '#f59e0b' : '#ef4444', borderRadius: 4 }} />
                        </div>
                        <span style={{ fontSize: '.78rem', fontWeight: 700, color: s.pct === 100 ? '#10b981' : s.pct >= 75 ? '#f59e0b' : '#ef4444', width: 36, textAlign: 'right', flexShrink: 0 }}>{s.pct}%</span>
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" width="13" style={{ color: 'var(--red)', flexShrink: 0 }}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                      </div>
                    ))}
                    <div style={{ display: 'flex', gap: 8, marginTop: '.5rem' }}>
                      <button className="btn btn-out" style={{ fontSize: '.78rem', padding: '6px 14px', color: 'var(--red)' }}
                        onClick={() => handleEditClause(n._id)}>Editar</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  )
}
