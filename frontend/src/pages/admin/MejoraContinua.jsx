import { useState, useEffect } from 'react'
import Papa from 'papaparse'
import { toast } from '../../components/Toast'
import Modal from '../../components/Modal'
import { getActions, createAction } from '../../api/api'


const acciones = [
  { code: 'AC-2026-001', description: 'Falta de extintores en área de almacén norte', type: 'Correctiva', origin: 'Auditoría Interna', responsible: 'J. Pérez', deadline: '2026-04-15', progress: 85, status: 'En Proceso' },
  { code: 'AP-2026-002', description: 'Riesgos de ergonomía en puestos administrativos', type: 'Preventiva', origin: 'Análisis de Riesgos', responsible: 'M. García', deadline: '2026-05-20', progress: 40, status: 'Iniciada' },
  { code: 'AC-2026-003', description: 'Error en registro de capacitación de personal nuevo', type: 'Correctiva', origin: 'Hallazgo Directo', responsible: 'L. Torres', deadline: '2026-03-10', progress: 100, status: 'Cerrada' },
  { code: 'AP-2026-004', description: 'Optimización de flujo documental en compras', type: 'Preventiva', origin: 'Sugerencia Empleado', responsible: 'R. Sastre', deadline: '2026-06-15', progress: 10, status: 'Iniciada' },
]

const oportunidades = [
  { cls: 'al-blue', icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" width="15"><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>, title: 'Automatizar alertas de vencimiento', sub: 'Notificaciones automáticas a responsables' },
  { cls: 'al-blue', icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" width="15"><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>, title: 'Integrar módulo de encuestas', sub: 'Satisfacción cliente post-servicio' },
  { cls: 'al-ok', icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" width="15"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>, title: 'Reducir tiempo de aprobación de docs.', sub: 'De 5 días a 2 días hábiles' },
]

const _eficacia = [
  { area: 'Calidad', pct: 90, color: '#16A34A', valColor: 'var(--ok)' },
  { area: 'Producción', pct: 75, color: 'var(--gold)', valColor: 'var(--gold-d)' },
  { area: 'Compras', pct: 55, color: '#F59E0B', valColor: 'var(--warn)' },
  { area: 'RRHH', pct: 68, color: '#3B82F6', valColor: 'var(--blue)' },
]

export default function MejoraContinua() {
  const [modal, setModal] = useState(null)
  const [activeFilter, setActiveFilter] = useState('Todas')
  const [isSaving, setIsSaving] = useState(false)
  const [accionesDB, setAccionesDB] = useState([])
  const [form, setForm] = useState({ code: '', type: 'Correctiva', description: '', origin: '', responsible: '', deadline: '', progress: 0 })
  const [hasLoaded, setHasLoaded] = useState(false)

  const loadData = async () => {
    try {
      const res = await getActions()
      setAccionesDB(res.data?.data || [])
      setHasLoaded(true)
    } catch (err) {
      console.error('Error loading actions:', err)
      setHasLoaded(true)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const exportarCSV = () => {
    const csv = Papa.unparse(acciones)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'acciones_mejora.csv')
    link.click()
    toast('Listado exportado correctamente', 'ok')
  }

  const handleGuardarAccion = async () => {
    try {
      if (!form.code || !form.description) return toast('Código y descripción requeridos', 'err')
      setIsSaving(true)
      await createAction(form)
      toast('Acción guardada correctamente', 'ok')
      setModal(null)
      loadData()
      setForm({ code: '', type: 'Correctiva', description: '', origin: '', responsible: '', deadline: '', progress: 0 })
    } catch (_err) {
      toast('Error al guardar acción', 'err')
    } finally {
      setIsSaving(false)
    }
  }

  // --- Cálculos Dinámicos ---
  const displayAcciones = (hasLoaded && accionesDB.length > 0) ? accionesDB : (hasLoaded && accionesDB.length === 0 ? [] : acciones)
  const filtered = displayAcciones.filter(a => activeFilter === 'Todas' || a.type === activeFilter.slice(0, -1))

  // 1. Estadísticas Superiores
  const counts = {
    abiertas: displayAcciones.filter(a => a.status !== 'Cerrada').length,
    vencidas: displayAcciones.filter(a => a.status !== 'Cerrada' && new Date(a.deadline) < new Date()).length,
    cerradas: displayAcciones.filter(a => a.status === 'Cerrada').length,
    total: displayAcciones.length
  }
  const pctCerradas = counts.total > 0 ? Math.round((counts.cerradas / counts.total) * 100) : 0

  const statsDinamicos = [
    { cls: 'sc-blue', icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>, trend: 'Total', trendCls: 'trend-n', num: counts.abiertas, lbl: 'Acciones Abiertas', bar: (counts.abiertas/counts.total)*100 || 0 },
    { cls: 'sc-warn', icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>, trend: 'Alerta', trendCls: 'trend-dn', num: counts.vencidas, lbl: 'Vencidas', bar: (counts.vencidas/counts.total)*100 || 0 },
    { cls: 'sc-ok', icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>, trend: <><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3" width="10" style={{marginRight:2}}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7"/></svg> {pctCerradas}%</>, trendCls: 'trend-up', num: counts.cerradas, lbl: 'Cerradas', bar: pctCerradas },
    { cls: 'sc-gold', icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>, trend: 'Nuevas', trendCls: 'trend-up', num: counts.total - counts.abiertas - counts.cerradas > 0 ? counts.total - counts.abiertas - counts.cerradas : 2, lbl: 'Oportunidades', bar: 45 },
  ]

  // 2. Eficacia por Origen/Área (Derivado de acciones)
  const orígenes = [...new Set(displayAcciones.map(a => a.origin).filter(Boolean))]
  const eficaciaDinamica = orígenes.map(orig => {
    const total = displayAcciones.filter(a => a.origin === orig).length
    const done = displayAcciones.filter(a => a.origin === orig && a.status === 'Cerrada').length
    const pct = Math.round((done / total) * 100)
    return {
      area: orig,
      pct,
      color: pct > 80 ? 'var(--ok)' : pct > 50 ? 'var(--gold)' : 'var(--warn)',
      valColor: pct > 80 ? 'var(--ok)' : pct > 50 ? 'var(--gold-d)' : 'var(--err)'
    }
  }).slice(0, 4)

  const filters = ['Todas', 'Correctivas', 'Preventivas']

  return (
    <main className="page">
      <div className="ph">
        <div>
          <h1 className="ph-title">Mejora <em>Continua</em></h1>
          <p className="ph-sub">Gestión de acciones correctivas, preventivas y oportunidades de mejora</p>
        </div>
        <div className="ph-actions">
          <button className="btn btn-out" onClick={exportarCSV}><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg> Exportar</button>
          <button className="btn btn-red" onClick={() => setModal('accion')}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
            Nueva Acción
          </button>
        </div>
      </div>

      <div className="sg">
        {statsDinamicos.map((s, i) => (
          <div key={i} className={`sc ${s.cls}`} style={{ cursor: 'pointer' }} onClick={() => toast(`Filtrando: ${s.lbl}...`, 'n')}>
            <div className="sc-top"><div className="sc-icon">{s.icon}</div><span className={`trend ${s.trendCls}`}>{s.trend}</span></div>
            <div className="sc-num">{s.num}</div>
            <div className="sc-lbl">{s.lbl}</div>
            <div className="sc-bar"><div className="sc-bar-f" style={{ width: `${s.bar}%` }} /></div>
          </div>
        ))}
      </div>

      <div className="mg">
        {/* Tabla de acciones */}
        <div className="card">
          <div className="card-hd">
            <div className="card-hd-l">
              <div className="card-ico ico-red"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg></div>
              <div><div className="card-title">Acciones Correctivas y Preventivas</div></div>
            </div>
            <div style={{ display: 'flex', gap: '.4rem' }}>
              {filters.map(f => (
                <button key={f} className={`filter-tab${activeFilter === f ? ' active' : ''}`} style={{ fontSize: '.72rem', padding: '5px 10px' }} onClick={() => setActiveFilter(f)}>{f}</button>
              ))}
            </div>
          </div>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>Código</th><th>Descripción</th><th>Tipo</th><th>Origen</th><th>Responsable</th><th>Plazo</th><th>Avance</th><th>Estado</th></tr></thead>
              <tbody>
                 {filtered.map((a, i) => (
                  <tr key={a._id || i}>
                    <td style={{ fontWeight: 700, fontSize: '.78rem', color: a.status === 'Cerrada' ? 'var(--ok)' : 'var(--red)' }}>{a.code}</td>
                    <td style={{ fontSize: '.82rem', fontWeight: 500, color: a.status === 'Cerrada' ? 'var(--ash)' : 'inherit' }}>{a.description}</td>
                    <td><span className={`badge ${a.type === 'Correctiva' ? 'b-err' : 'b-blue'}`}>{a.type}</span></td>
                    <td style={{ fontSize: '.78rem', color: 'var(--ash)' }}>{a.origin || '—'}</td>
                    <td style={{ fontSize: '.78rem' }}>{a.responsible || '—'}</td>
                    <td style={{ fontSize: '.78rem' }}>{a.deadline ? new Date(a.deadline).toLocaleDateString() : '—'}</td>
                    <td>
                      <div style={{ minWidth: 80 }}>
                        <div style={{ fontSize: '.72rem', fontWeight: 700, marginBottom: 3 }}>{a.progress || 0}%</div>
                        <div className="prog-wrap" style={{ height: 5 }}>
                          <div className="prog-fill" style={{ width: `${a.progress || 0}%`, background: (a.progress || 0) > 80 ? 'var(--ok)' : (a.progress || 0) > 50 ? 'var(--gold)' : 'var(--warn)' }} />
                        </div>
                      </div>
                    </td>
                    <td><span className={`badge ${a.status === 'Cerrada' ? 'b-ok' : a.status === 'En Proceso' ? 'b-warn' : 'b-gray'}`}>{a.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right */}
        <div className="col-r">
          <div className="card">
            <div className="card-hd">
              <div className="card-hd-l">
                <div className="card-ico ico-gold"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg></div>
                <div><div className="card-title">Oportunidades de Mejora</div><div className="card-sub">Sin acción asignada</div></div>
              </div>
            </div>
            <div className="al-list">
              {oportunidades.map((o, i) => (
                <div key={i} className={`al ${o.cls}`}>
                  <div className="al-ico">{o.icon}</div>
                  <div><div className="al-ttl">{o.title}</div><div className="al-sub">{o.sub}</div></div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-hd">
              <div className="card-hd-l">
                <div className="card-ico ico-ink"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg></div>
                <div><div className="card-title">Eficacia por Área</div></div>
              </div>
            </div>
            <div style={{ padding: '1rem' }}>
              {eficaciaDinamica.length === 0 ? (
                <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--ash)', fontSize: '.8rem' }}>Sin datos de origen</div>
               ) : eficaciaDinamica.map((e, i) => (
                <div key={i} style={{ marginBottom: '.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.78rem', marginBottom: '.3rem' }}>
                    <span>{e.area}</span>
                    <span style={{ fontWeight: 700, color: e.valColor }}>{e.pct}%</span>
                  </div>
                  <div className="prog-wrap"><div className="prog-fill" style={{ width: `${e.pct}%`, background: e.color }} /></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

       {modal === 'accion' && (
        <Modal 
          title="Nueva Acción" 
          onClose={() => setModal(null)}
          footer={<>
            <button className="btn btn-out" onClick={() => setModal(null)} disabled={isSaving}>Cancelar</button>
            <button className="btn btn-red" onClick={handleGuardarAccion} disabled={isSaving}>
              {isSaving ? 'Guardando...' : 'Guardar Acción'}
            </button>
          </>}
        >
          <div className="form-grid">
            <div className="form-group">
              <label className="lbl">Código</label>
              <input className="finput" placeholder="AC-2026-000" value={form.code} onChange={e => setForm({...form, code: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="lbl">Tipo</label>
              <select className="fselect" value={form.type} onChange={e => setForm({...form, type: e.target.value})}><option value="Correctiva">Correctiva</option><option value="Preventiva">Preventiva</option></select>
            </div>
            <div className="form-group full">
              <label className="lbl">Descripción</label>
              <textarea className="ftextarea" placeholder="Describe la acción..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="lbl">Origen</label>
              <input className="finput" placeholder="Ej. NC-2025-020" value={form.origin} onChange={e => setForm({...form, origin: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="lbl">Responsable</label>
              <input className="finput" placeholder="Nombre del responsable" value={form.responsible} onChange={e => setForm({...form, responsible: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="lbl">Plazo</label>
              <input className="finput" type="date" value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="lbl">Avance Inicial (%)</label>
              <input className="finput" type="number" value={form.progress} onChange={e => setForm({...form, progress: parseInt(e.target.value) || 0})} />
            </div>
          </div>
        </Modal>
      )}
    </main>
  )
}
