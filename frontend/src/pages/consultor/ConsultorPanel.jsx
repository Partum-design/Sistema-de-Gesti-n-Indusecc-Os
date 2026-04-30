import { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import Modal from '../../components/Modal'
import { toast } from '../../components/Toast'
import { AuthContext } from '../../context/AuthContext'
import {
  getCollaboratorIndicators,
  getComplianceByClause,
  getAudits,
  getFindings,
} from '../../api/api'

const CLAUSULAS_DEFAULT = [
  { lbl:'Cl. 4 — Contexto de la Organización', pct:0, color:'#16A34A', nc:'var(--ok)' },
  { lbl:'Cl. 5 — Liderazgo', pct:0, color:'#16A34A', nc:'var(--ok)' },
  { lbl:'Cl. 6 — Planificación', pct:0, color:'var(--gold)', nc:'var(--gold-d)' },
  { lbl:'Cl. 7 — Apoyo', pct:0, color:'var(--gold)', nc:'var(--gold-d)' },
  { lbl:'Cl. 8 — Operación', pct:0, color:'#F59E0B', nc:'var(--warn)' },
  { lbl:'Cl. 9 — Evaluación del Desempeño', pct:0, color:'var(--gold)', nc:'var(--gold-d)' },
  { lbl:'Cl. 10 — Mejora', pct:0, color:'#F59E0B', nc:'var(--warn)' },
]

export default function ConsultorPanel() {
  const navigate = useNavigate()
  const { logout, user } = useContext(AuthContext)
  const [modalPerfil, setModalPerfil] = useState(false)
  const [clausulas, setClausulas] = useState(CLAUSULAS_DEFAULT)
  const [kpis, setKpis] = useState(null)
  const [audits, setAudits] = useState([])
  const [findings, setFindings] = useState([])
  const [loading, setLoading] = useState(true)

  const userName = user?.name || user?.email?.split('@')[0] || 'Usuario'
  const userEmail = user?.email || 'usuario@indusecc.com'
  const userRole = user?.role || 'CONSULTOR'

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [indRes, clausRes, auditRes, findRes] = await Promise.allSettled([
          getCollaboratorIndicators(),
          getComplianceByClause(),
          getAudits(),
          getFindings(),
        ])

        if (indRes.status === 'fulfilled' && indRes.value.data?.data?.indicators) {
          setKpis(indRes.value.data.data.indicators)
        }

        if (clausRes.status === 'fulfilled' && clausRes.value.data?.data?.compliance) {
          const raw = clausRes.value.data.data.compliance
          setClausulas(raw.map(c => ({
            lbl: c.label,
            pct: c.compliance,
            color: c.color,
            nc: c.compliance >= 90 ? 'var(--ok)' : c.compliance >= 80 ? 'var(--gold-d)' : 'var(--warn)'
          })))
        }

        if (auditRes.status === 'fulfilled') {
          const list = auditRes.value.data?.data?.audits || []
          setAudits(list)
        }

        if (findRes.status === 'fulfilled') {
          const list = findRes.value.data?.data?.findings || findRes.value.data?.data || []
          setFindings(Array.isArray(list) ? list : [])
        }
      } catch (err) {
        console.error('[ConsultorPanel] Error cargando datos:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const downloadCsv = (rows, filename) => {
    const headers = Object.keys(rows[0] || {})
    const csv = [headers.join(','), ...rows.map(row => headers.map(key => JSON.stringify(row[key] ?? '')).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(link.href)
    toast(`Descargando ${filename}`, 'ok')
  }

  // KPIs derivados de datos reales
  const sgcValue = kpis?.sgcCompliance?.value || `${clausulas.length > 0 ? Math.round(clausulas.reduce((a,c) => a + c.pct, 0) / clausulas.length) : 0}%`
  const sgcTrend = kpis?.sgcCompliance?.trend || '↑ +3%'
  const sgcTrendType = kpis?.sgcCompliance?.trendType || 'up'
  const docsVigentes = kpis?.activeDocuments?.value ?? '—'
  const auditasProgramadas = audits.filter(a => a.status === 'Pendiente' || a.status === 'En Progreso').length
  const ncAbiertas = findings.filter(f => f.status !== 'Cerrado').length

  const kpiCards = [
    { v:'ok', icon:<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/></svg>, trend: sgcTrend, tt: sgcTrendType === 'up' ? 'up' : 'dn', num: sgcValue, lbl:'Cumplimiento SGC', w: sgcValue },
    { v:'gold', icon:<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>, trend:'Vigentes', tt:'up', num: String(docsVigentes), lbl:'Documentos Vigentes', w:'87%' },
    { v:'warn', icon:<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>, trend:'Abiertas', tt:'dn', num: String(ncAbiertas), lbl:'No Conformidades', w:'35%' },
    { v:'blue', icon:<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>, trend:'2026', tt:'n', num: String(auditasProgramadas || audits.length), lbl:'Auditorías Programadas', w:'20%' },
  ]
  const initials = userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U'

  return (
    <main className="page">
      {/* Banner bienvenida */}
      <div style={{ background:'linear-gradient(135deg,var(--red-k) 0%,var(--red-d) 60%,var(--red-m) 100%)', borderRadius:10, padding:'1.8rem 2rem', display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.6rem', flexWrap:'wrap', gap:'1rem', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-30, right:-30, width:180, height:180, borderRadius:'50%', background:'rgba(201,168,76,.06)' }} />
        <div style={{ position:'absolute', bottom:-40, right:80, width:120, height:120, borderRadius:'50%', background:'rgba(201,168,76,.04)' }} />
        <div style={{ display:'flex', alignItems:'center', gap:16, position:'relative', zIndex:1 }}>
          <div style={{ width:58, height:58, borderRadius:'50%', background:'linear-gradient(135deg,var(--gold-d),var(--gold))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.25rem', fontWeight:700, color:'var(--red-d)', flexShrink:0, boxShadow:'0 4px 14px rgba(201,168,76,.3)' }}>{initials}</div>
          <div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.3rem', fontWeight:900, color:'#fff' }}>Bienvenido, <em style={{ fontStyle:'italic', color:'var(--gold-l)' }}>{userName}</em></div>
            <div style={{ fontSize:'.78rem', color:'rgba(255,255,255,.6)', marginTop:3 }}>{userRole.replace('_', ' ')} · Acceso de solo lectura y análisis</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:'.7rem', position:'relative', zIndex:1, flexWrap:'wrap' }}>
          <span style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(255,255,255,.1)', border:'1px solid rgba(255,255,255,.15)', borderRadius:6, padding:'6px 12px', fontSize:'.75rem', fontWeight:600, color:'rgba(255,255,255,.75)' }}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" width="14"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
            Solo Lectura
          </span>
          <button className="btn btn-gold" onClick={() => downloadCsv([
              { Seccion: 'Cumplimiento SGC', Estado: sgcValue, Fecha: new Date().toLocaleDateString() },
              { Seccion: 'Documentos Vigentes', Estado: String(docsVigentes), Fecha: new Date().toLocaleDateString() },
              { Seccion: 'NC Abiertas', Estado: String(ncAbiertas), Fecha: new Date().toLocaleDateString() },
              { Seccion: 'Auditorías', Estado: String(audits.length), Fecha: new Date().toLocaleDateString() },
            ], 'Resumen_Consultor.csv')}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>Exportar Resumen
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="sg" style={{ marginBottom:'1.4rem' }}>
        {loading
          ? Array(4).fill(null).map((_,i) => <div key={i} className="sc sc-ok" style={{ opacity:.5, minHeight:90 }}><div className="sc-lbl">Cargando…</div></div>)
          : kpiCards.map((s,i) => (
            <div key={i} className={`sc sc-${s.v}`}>
              <div className="sc-top"><div className="sc-icon">{s.icon}</div><span className={`trend trend-${s.tt}`}>{s.trend}</span></div>
              <div className="sc-num">{s.num}</div><div className="sc-lbl">{s.lbl}</div>
              <div className="sc-bar"><div className="sc-bar-f" style={{width:s.w}}/></div>
            </div>
          ))
        }
      </div>

      <div className="mg">
        <div style={{display:'flex',flexDirection:'column',gap:'1.2rem'}}>
          {/* Cumplimiento por cláusula */}
          <div className="card">
            <div className="card-hd">
              <div className="card-hd-l">
                <div className="card-ico ico-ok"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg></div>
                <div><div className="card-title">Cumplimiento por Cláusula ISO 9001:2015</div><div className="card-sub">Evaluación actual del sistema</div></div>
              </div>
              <button className="btn btn-out btn-sm" onClick={() => downloadCsv(
                clausulas.map(c => ({ Cláusula: c.lbl, Cumplimiento: `${c.pct}%` })),
                'Clausulas_Consultor.csv')}>
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>Exportar
              </button>
            </div>
            <div style={{padding:'1.3rem',display:'flex',flexDirection:'column',gap:'1rem'}}>
              {clausulas.map((c,i) => (
                <div key={i}>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:'.82rem',marginBottom:'.4rem',fontWeight:500}}>
                    <span>{c.lbl}</span><span style={{color:c.nc,fontWeight:700}}>{c.pct}%</span>
                  </div>
                  <div className="prog-wrap" style={{height:8}}><div className="prog-fill" style={{width:`${c.pct}%`,background:c.color}}/></div>
                </div>
              ))}
            </div>
          </div>

          {/* Actividad reciente — auditorías y hallazgos reales */}
          <div className="card">
            <div className="card-hd">
              <div className="card-hd-l">
                <div className="card-ico ico-ink"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div>
                <div><div className="card-title">Actividad Reciente del Sistema</div></div>
              </div>
            </div>
            <div className="act-list">
              {loading
                ? <div style={{padding:'1rem',color:'var(--ash)',fontSize:'.83rem'}}>Cargando actividad…</div>
                : [
                    ...audits.slice(0,3).map(a => ({
                      dot: a.status === 'Completada' ? 'dot-ok' : 'dot-g',
                      msg: `Auditoría: ${a.title}`,
                      time: `${a.status} · ${new Date(a.date || a.createdAt).toLocaleDateString('es-ES')}`,
                    })),
                    ...findings.slice(0,2).map(f => ({
                      dot: f.status === 'Cerrado' ? 'dot-ok' : 'dot-r',
                      msg: `Hallazgo: ${f.title}`,
                      time: `${f.status} · ${new Date(f.findingDate || f.createdAt).toLocaleDateString('es-ES')}`,
                    })),
                  ].slice(0,5).map((a,i) => (
                    <div className="act-i" key={i}>
                      <div className={`act-dot ${a.dot}`}></div>
                      <div style={{flex:1}}><div className="act-msg">{a.msg}</div><div className="act-time">{a.time}</div></div>
                    </div>
                  ))
              }
              {!loading && audits.length === 0 && findings.length === 0 && (
                <div style={{padding:'1rem',color:'var(--ash)',fontSize:'.83rem',textAlign:'center'}}>Sin actividad registrada</div>
              )}
            </div>
          </div>
        </div>

        {/* Col derecha */}
        <div className="col-r">
          {/* Resumen NC */}
          <div className="card">
            <div className="card-hd">
              <div className="card-hd-l">
                <div className="card-ico ico-red"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg></div>
                <div><div className="card-title">Hallazgos Activos</div></div>
              </div>
              <span style={{fontSize:'.68rem',background:'var(--err-bg)',color:'var(--err)',fontWeight:700,padding:'3px 8px',borderRadius:4}}>{ncAbiertas}</span>
            </div>
            <div className="al-list">
              {findings.filter(f => f.status !== 'Cerrado').slice(0,3).map((f,i) => (
                <div key={i} className={`al ${f.severity === 'Alta' ? 'al-err' : 'al-warn'}`}>
                  <div className="al-ico"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" width="15"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg></div>
                  <div><div className="al-ttl">{f.title}</div><div className="al-sub">{f.area} · {f.status}</div></div>
                </div>
              ))}
              {!loading && findings.filter(f => f.status !== 'Cerrado').length === 0 && (
                <div style={{padding:'1rem',color:'var(--ok)',fontSize:'.83rem',textAlign:'center'}}>✓ Sin hallazgos activos</div>
              )}
            </div>
          </div>

          {/* Accesos rápidos */}
          <div className="card">
            <div className="card-hd"><div className="card-hd-l"><div className="card-ico ico-ink"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg></div><div><div className="card-title">Accesos Rápidos</div></div></div></div>
            <div className="qg">
              {[
                {label:'Auditorías',path:'/consultor/auditorias',icon:<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>},
                {label:'Hallazgos',path:'/consultor/hallazgos',icon:<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>},
                {label:'Riesgos',path:'/consultor/riesgos',icon:<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7"/></svg>},
                {label:'Indicadores',path:'/consultor/indicadores',icon:<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10"/></svg>},
                {label:'Documentos',path:'/consultor/documentos',icon:<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>},
                {label:'Reportes',path:'/consultor/reportes',icon:<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>},
              ].map((q,i) => (
                <button key={i} className="qbtn" onClick={() => navigate(q.path)}>{q.icon}{q.label}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal perfil */}
      <Modal title="Mi Perfil" open={modalPerfil} onClose={() => setModalPerfil(false)}
        footer={<><button className="btn btn-ghost" onClick={logout}>Cerrar Sesión</button><button className="btn btn-red" onClick={() => { toast('Perfil actualizado','ok'); setModalPerfil(false) }}>Guardar Cambios</button></>}>
        <div style={{display:'flex',alignItems:'center',gap:16,padding:'1rem',background:'linear-gradient(135deg,var(--red-k),var(--red-d))',borderRadius:8,marginBottom:'1.4rem'}}>
          <div style={{width:56,height:56,borderRadius:'50%',background:'linear-gradient(135deg,var(--gold-d),var(--gold))',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.2rem',fontWeight:700,color:'var(--red-d)',flexShrink:0}}>{initials}</div>
          <div><div style={{fontFamily:"'Playfair Display',serif",fontSize:'1.1rem',fontWeight:900,color:'#fff'}}>{userName}</div><div style={{fontSize:'.73rem',color:'var(--gold-l)',marginTop:2}}>{userEmail}</div></div>
        </div>
        <div className="form-grid">
          <div className="form-group"><label className="lbl">Nombre</label><input className="finput" defaultValue={userName}/></div>
          <div className="form-group"><label className="lbl">Correo</label><input className="finput" defaultValue={userEmail}/></div>
          <div className="form-group full"><label className="lbl">Nueva Contraseña</label><input className="finput" type="password" placeholder="Dejar vacío para no cambiar"/></div>
        </div>
      </Modal>
    </main>
  )
}
