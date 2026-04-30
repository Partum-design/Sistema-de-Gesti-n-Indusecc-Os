import { useState, useEffect } from 'react'
import { toast } from '../../components/Toast'
import { downloadCSV } from '../../utils/downloadHelpers'
import { getFindings } from '../../api/api'

const iconMap = {
  warn: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" width="18"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  err:  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" width="18"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>,
  ok:   <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" width="18"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
}

function getIconType(severity, status) {
  if (status === 'Cerrado' || status === 'Resuelto') return 'ok'
  if (severity === 'Alta') return 'err'
  return 'warn'
}

function getStatusBadge(status) {
  if (!status) return 'b-gray'
  const s = status.toLowerCase()
  if (s.includes('cerrad') || s.includes('resuel')) return 'b-ok'
  if (s.includes('proceso') || s.includes('progres') || s.includes('revisión')) return 'b-warn'
  if (s.includes('abierto') || s.includes('pendiente')) return 'b-err'
  return 'b-gray'
}

export default function ConsultorHallazgos() {
  const [hallazgos, setHallazgos] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('Todos')
  const [searchText, setSearchText] = useState('')
  const [areaFilter, setAreaFilter] = useState('Todas')

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const res = await getFindings()
        const list = res.data?.data?.findings || res.data?.data || []
        setHallazgos(Array.isArray(list) ? list : [])
      } catch (err) {
        console.error('[ConsultorHallazgos] Error:', err)
        toast('Error al cargar hallazgos', 'err')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const enProceso  = hallazgos.filter(h => h.status === 'En Revisión' || h.status === 'En Proceso').length
  const pendientes = hallazgos.filter(h => h.status === 'Abierto' || h.status === 'Pendiente').length
  const resueltos  = hallazgos.filter(h => h.status === 'Cerrado' || h.status === 'Resuelto').length
  const total      = hallazgos.length

  const areas = [...new Set(hallazgos.map(h => h.area).filter(Boolean))]

  const filtered = hallazgos.filter(h => {
    if (activeFilter === 'En Proceso' && h.status !== 'En Revisión' && h.status !== 'En Proceso') return false
    if (activeFilter === 'Pendientes' && h.status !== 'Abierto' && h.status !== 'Pendiente') return false
    if (activeFilter === 'Resueltos' && h.status !== 'Cerrado' && h.status !== 'Resuelto') return false
    if (areaFilter !== 'Todas' && h.area !== areaFilter) return false
    if (searchText && !h.title?.toLowerCase().includes(searchText.toLowerCase()) && !h.description?.toLowerCase().includes(searchText.toLowerCase())) return false
    return true
  })

  function exportHallazgos() {
    if (hallazgos.length === 0) { toast('Sin datos para exportar', 'n'); return }
    const rows = filtered.map(h => ({
      Título: h.title,
      Área: h.area || '—',
      Estado: h.status || '—',
      Severidad: h.severity || '—',
      Cláusula: h.clause || '—',
      Responsable: h.assignedTo?.name || '—',
      Fecha: h.findingDate ? new Date(h.findingDate).toLocaleDateString('es-ES') : '—',
    }))
    downloadCSV(rows, `Hallazgos_Consultor_${new Date().toISOString().split('T')[0]}.csv`)
    toast('Listado de hallazgos exportado', 'ok')
  }

  return (
    <main className="page">
      <div className="ph">
        <div><h1 className="ph-title">Hallazgos <em>del Sistema</em></h1><p className="ph-sub">Vista global de todos los hallazgos y observaciones registradas — Solo lectura</p></div>
        <div className="ph-actions">
          <span style={{display:'inline-flex',alignItems:'center',gap:6,background:'rgba(0,0,0,.06)',border:'1px solid var(--border)',borderRadius:6,padding:'6px 12px',fontSize:'.75rem',fontWeight:600,color:'var(--ash)'}}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" width="14"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>Solo Lectura
          </span>
          <button className="btn btn-out" onClick={exportHallazgos}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>Exportar
          </button>
        </div>
      </div>

      <div className="sg">
        {[
          { v:'warn', num: loading ? '…' : String(enProceso), lbl:'En Proceso', trend:'Pendientes', tt:'dn', w:`${total>0?Math.round(enProceso/total*100):0}%`, icon:<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> },
          { v:'red', num: loading ? '…' : String(pendientes), lbl:'Pendientes', trend:'Alerta', tt:'dn', w:`${total>0?Math.round(pendientes/total*100):0}%`, icon:<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg> },
          { v:'ok', num: loading ? '…' : String(resueltos), trend: total > 0 ? `${Math.round(resueltos/total*100)}%` : '—', tt:'up', w:`${total>0?Math.round(resueltos/total*100):0}%`, lbl:'Resueltos', icon:<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> },
          { v:'gold', num: loading ? '…' : String(total), lbl:'Total Registrados', trend:'Total', tt:'n', w:'60%', icon:<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg> },
        ].map((s,i) => (
          <div key={i} className={`sc sc-${s.v}`}>
            <div className="sc-top"><div className="sc-icon">{s.icon}</div><span className={`trend trend-${s.tt}`}>{s.trend}</span></div>
            <div className="sc-num">{s.num}</div><div className="sc-lbl">{s.lbl}</div>
            <div className="sc-bar"><div className="sc-bar-f" style={{width:s.w}}/></div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="card" style={{marginBottom:'1.2rem'}}>
        <div className="filters">
          {['Todos','En Proceso','Pendientes','Resueltos'].map(f => (
            <button key={f} className={`filter-tab${activeFilter===f?' active':''}`} onClick={() => setActiveFilter(f)}>{f}</button>
          ))}
          <div className="filters-r">
            <select className="fselect" style={{minWidth:140,padding:'7px 10px',fontSize:'.78rem'}} value={areaFilter} onChange={e => setAreaFilter(e.target.value)}>
              <option value="Todas">Todas las áreas</option>
              {areas.map(a => <option key={a}>{a}</option>)}
            </select>
            <div className="fsearch">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35"/></svg>
              <input type="text" placeholder="Buscar hallazgo…" value={searchText} onChange={e => setSearchText(e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
        {loading
          ? <div className="card" style={{padding:'2rem',textAlign:'center',color:'var(--ash)'}}>Cargando hallazgos…</div>
          : filtered.length === 0
          ? <div className="card" style={{padding:'2rem',textAlign:'center',color:'var(--ash)'}}>
              {hallazgos.length === 0 ? 'Sin hallazgos registrados en el sistema' : 'Sin resultados para los filtros aplicados'}
            </div>
          : filtered.map((h,i) => {
            const tipo = getIconType(h.severity, h.status)
            const done = h.status === 'Cerrado' || h.status === 'Resuelto'
            return (
              <div key={h._id || i} className="card" style={done?{opacity:.75}:{}}>
                <div style={{padding:'1.2rem 1.4rem',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'1rem',flexWrap:'wrap'}}>
                  <div style={{display:'flex',alignItems:'flex-start',gap:12,flex:1,minWidth:0}}>
                    <div style={{width:40,height:40,borderRadius:8,background:tipo==='ok'?'var(--ok-bg)':tipo==='err'?'var(--err-bg)':'var(--warn-bg)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,color:tipo==='ok'?'var(--ok)':tipo==='err'?'var(--err)':'var(--warn)'}}>
                      {iconMap[tipo]}
                    </div>
                    <div>
                      <div style={{fontFamily:"'Playfair Display',serif",fontSize:'1rem',fontWeight:700,color:done?'var(--ash)':'var(--ink)'}}>{h.title}</div>
                      <div style={{fontSize:'.73rem',color:'var(--ash)',marginTop:3}}>
                        {h.clause ? `Cláusula ${h.clause}` : '—'} · {h.findingDate ? new Date(h.findingDate).toLocaleDateString('es-ES') : new Date(h.createdAt).toLocaleDateString('es-ES')}
                      </div>
                    </div>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:'.6rem',flexShrink:0}}>
                    <span className={`badge ${getStatusBadge(h.status)}`}>{h.status}</span>
                    {h.severity && <span className={`badge ${h.severity==='Alta'?'b-err':h.severity==='Media'?'b-warn':'b-ok'}`}>{h.severity}</span>}
                    <span style={{fontSize:'.75rem',color:'var(--ash)'}}>{h.area || '—'}</span>
                  </div>
                </div>
                <div style={{padding:'1rem 1.4rem',display:'flex',gap:'2rem',flexWrap:'wrap'}}>
                  <div style={{flex:1,minWidth:200}}>
                    <div style={{fontSize:'.72rem',color:'var(--ash)',fontWeight:700,textTransform:'uppercase',letterSpacing:'.1em',marginBottom:'.4rem'}}>Descripción</div>
                    <div style={{fontSize:'.83rem',color:done?'var(--ash)':'var(--ink6)',lineHeight:1.6}}>{h.description || '—'}</div>
                  </div>
                  {h.immediateAction && (
                    <div style={{minWidth:200}}>
                      <div style={{fontSize:'.72rem',color:'var(--ash)',fontWeight:700,textTransform:'uppercase',letterSpacing:'.1em',marginBottom:'.4rem'}}>Acción Inmediata</div>
                      <div style={{fontSize:'.83rem',color:'var(--ink6)',lineHeight:1.6}}>{h.immediateAction}</div>
                      <div style={{fontSize:'.72rem',color:'var(--ash)',marginTop:'.4rem'}}>Responsable: {h.assignedTo?.name || '—'}</div>
                    </div>
                  )}
                </div>
              </div>
            )
          })
        }
      </div>
    </main>
  )
}
