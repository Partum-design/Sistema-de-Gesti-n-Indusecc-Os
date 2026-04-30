import { useState, useEffect } from 'react'
import { toast } from '../../components/Toast'
import { downloadCSV } from '../../utils/downloadHelpers'
import { getAuditLogs, purgeLogs } from '../../api/api'

const typeLabel = { ok: 'Éxito', blue: 'Info', err: 'Error / Alerta', warn: 'Advertencia', gold: 'Super Admin' }
const typeColor = { ok: '#10b981', blue: '#3b82f6', err: '#ef4444', warn: '#f59e0b', gold: 'var(--gold)' }

function getTypeFromStatus(status) {
  if (status === 'Éxito') return 'ok'
  if (status === 'Error') return 'err'
  if (status === 'Advertencia') return 'warn'
  return 'blue'
}

function formatLog(log) {
  return {
    id: log._id,
    user: log.user?.name || log.user || 'Sistema',
    role: log.user?.role || 'Sistema',
    action: log.description,
    module: log.module,
    time: new Date(log.createdAt).toLocaleString('es-MX'),
    ip: log.ipAddress || 'localhost',
    type: getTypeFromStatus(log.status),
  }
}

export default function SuperAdminAuditoriaLogs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('Todos')
  const [filterModule, setFilterModule] = useState('Todos')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    loadLogs()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  async function loadLogs() {
    try {
      setLoading(true)
      const res = await getAuditLogs({ page, limit: 12 })
      if (res.data?.success && res.data?.data) {
        const logsArr = res.data.data.logs || res.data.data || []
        const transformed = (Array.isArray(logsArr) ? logsArr : []).map(formatLog)
        setLogs(transformed)
        setTotal(res.data.data?.pagination?.total || res.data?.pagination?.total || transformed.length)
      }
    } catch (err) {
      toast(`Error cargando logs: ${err.response?.data?.message || err.message}`, 'err')
      setLogs([])
    } finally {
      setLoading(false)
    }
  }

  const filtered = logs.filter(l => {
    const q = search.toLowerCase()
    const matchQ = l.user.toLowerCase().includes(q) || l.action.toLowerCase().includes(q)
    const matchT = filterType === 'Todos' || l.type === filterType
    const matchM = filterModule === 'Todos' || l.module === filterModule
    return matchQ && matchT && matchM
  })

  const modules = ['Todos', ...new Set(logs.map(l => l.module))]
  const counts = {
    total: total,
    err: logs.filter(l => l.type === 'err').length,
    gold: logs.filter(l => l.type === 'gold').length,
    ok: logs.filter(l => l.type === 'ok').length
  }

  function exportAuditoriaLogCSV() {
    const rows = filtered.map(l => ({
      Usuario: l.user,
      Rol: l.role,
      Accion: l.action,
      Modulo: l.module,
      Fecha: l.time,
      IP: l.ip,
      Tipo: l.type
    }))
    downloadCSV(rows, `AuditoriaLogs_${new Date().toISOString().split('T')[0]}.csv`)
    toast('Log de auditoría exportado', 'ok')
  }

  async function handlePurgeLogs() {
    try {
      const daysOld = prompt('¿Logs anteriores a cuántos días?', '90')
      if (daysOld === null) return
      const res = await purgeLogs(parseInt(daysOld))
      if (res.data?.success) {
        toast(`${res.data?.data?.deletedCount || 0} logs purgados exitosamente`, 'ok')
        await loadLogs()
      } else {
        toast(res.data?.message || 'Error al purgar', 'err')
      }
    } catch (err) {
      toast(`Error: ${err.response?.data?.message || err.message}`, 'err')
    }
  }

  return (
    <main className="page">
      <div className="ph">
        <div>
          <h1 className="ph-title">Logs de <em>Auditoría</em></h1>
          <p className="ph-sub">Registro completo de quién hizo qué y cuándo en todo el sistema</p>
        </div>
        <div className="ph-actions">
          <button className="btn btn-out" onClick={exportAuditoriaLogCSV}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Exportar Log
          </button>
        </div>
      </div>

      <div className="sg sg-4" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: '1.5rem' }}>
        {[
          { num: counts.total || 0, lbl: 'Total Eventos', color: 'var(--ink)', bg: 'var(--white)', border: 'var(--ink)' },
          { num: counts.ok || 0, lbl: 'Exitosos', color: '#10b981', bg: 'var(--white)', border: '#10b981' },
          { num: counts.err || 0, lbl: 'Errores / Alertas', color: '#ef4444', bg: 'var(--white)', border: '#ef4444' },
          { num: counts.gold || 0, lbl: 'Acciones Super Admin', color: 'var(--gold)', bg: 'var(--white)', border: 'var(--gold)' },
        ].map((s, i) => (
          <div key={i} style={{ padding: '1.2rem', background: s.bg, border: `1px solid ${s.border}25`, borderTop: `4px solid ${s.border}`, borderRadius: 10, boxShadow: '0 4px 12px rgba(0,0,0,.04)' }}>
            <div style={{ fontSize: '2.2rem', fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.num}</div>
            <div style={{ fontSize: '.78rem', color: 'var(--ash)', fontWeight: 600, marginTop: 4, textTransform: 'uppercase', letterSpacing: '.05em' }}>{s.lbl}</div>
          </div>
        ))}
      </div>

      {/* Filters + Actions */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <div className="fsearch" style={{ flex: 1, minWidth: 200, maxWidth: 300 }}>
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" /></svg>
          <input placeholder="Buscar usuario o acción…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="finput" style={{ maxWidth: 160, padding: '7px 12px' }} value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="Todos">Todos los tipos</option>
          {Object.entries(typeLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select className="finput" style={{ maxWidth: 160, padding: '7px 12px' }} value={filterModule} onChange={e => setFilterModule(e.target.value)}>
          {modules.map(m => <option key={m} value={m}>{m === 'Todos' ? 'Todos los módulos' : m}</option>)}
        </select>
        <button className="btn btn-out" style={{ padding: '0 16px', fontSize: '.8rem', color: '#ef4444', fontWeight: 600 }} onClick={handlePurgeLogs}>
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" width="16"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          Purgar
        </button>
      </div>

      {/* Log table */}
      <div className="card" style={{ overflowX: 'auto' }}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--ash)' }}>Cargando logs...</div>
        ) : (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.82rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['', 'Tipo', 'Usuario', 'Módulo', 'Acción', 'IP', 'Fecha / Hora'].map((h, i) => (
                    <th key={i} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: 'var(--ash)', fontSize: '.72rem', letterSpacing: '.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--ash)' }}>Sin resultados</td></tr>
                )}
                {filtered.map(l => (
                  <tr key={l.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background .15s' }}>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: typeColor[l.type] }} />
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ fontSize: '.7rem', padding: '2px 8px', borderRadius: 10, background: `${typeColor[l.type]}18`, color: typeColor[l.type], fontWeight: 700, whiteSpace: 'nowrap' }}>{typeLabel[l.type]}</span>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ fontWeight: 700, color: 'var(--ink)', whiteSpace: 'nowrap' }}>{l.user}</div>
                      <div style={{ fontSize: '.69rem', color: 'var(--ash)' }}>{l.role}</div>
                    </td>
                    <td style={{ padding: '10px 12px', color: 'var(--ash)', whiteSpace: 'nowrap' }}>{l.module}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--ink)', maxWidth: 320 }}>{l.action}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--ash)', fontFamily: 'monospace', fontSize: '.78rem', whiteSpace: 'nowrap' }}>{l.ip}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--ash)', whiteSpace: 'nowrap', fontSize: '.78rem' }}>{l.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ padding: '.8rem 1.2rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '.75rem', color: 'var(--ash)' }}>Mostrando {filtered.length} de {total} eventos</span>
              <div style={{ display: 'flex', gap: '.5rem' }}>
                <button style={{ fontSize: '.75rem', color: 'var(--red)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 4 }}
                  onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" width="12"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
                  Anterior
                </button>
                <span style={{ fontSize: '.75rem', color: 'var(--ash)', padding: '4px 8px' }}>Página {page}</span>
                <button style={{ fontSize: '.75rem', color: 'var(--red)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 4 }}
                  onClick={() => setPage(page + 1)}>
                  Siguiente 
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" width="12"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
