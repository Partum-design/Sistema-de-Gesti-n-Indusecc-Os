import { useState, useEffect } from 'react'
import { toast } from '../../components/Toast'
import { downloadCSV } from '../../utils/downloadHelpers'
import Modal from '../../components/Modal'
import { getRisks } from '../../api/api'

function nivelBadge(nivel) {
  if (!nivel) return 'b-gray'
  const n = nivel.toLowerCase()
  if (n.includes('alto') || n.includes('crítico') || n.includes('critico')) return 'b-err'
  if (n.includes('medio')) return 'b-warn'
  return 'b-ok'
}
function probBadge(prob) {
  if (!prob) return 'b-gray'
  const p = prob.toLowerCase()
  if (p.includes('alta')) return 'b-err'
  if (p.includes('media')) return 'b-warn'
  return 'b-ok'
}
function estadoBadge(estado) {
  if (!estado) return 'b-gray'
  const e = estado.toLowerCase()
  if (e.includes('activ')) return 'b-err'
  if (e.includes('tratamiento')) return 'b-warn'
  if (e.includes('control')) return 'b-ok'
  return 'b-gray'
}

export default function ConsultorRiesgos() {
  const [riesgos, setRiesgos] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('Todos')
  const [searchText, setSearchText] = useState('')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const res = await getRisks()
        const list = res.data?.data || []
        setRiesgos(Array.isArray(list) ? list : [])
      } catch (err) {
        console.error('[ConsultorRiesgos] Error:', err)
        toast('Error al cargar riesgos', 'err')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const activos      = riesgos.filter(r => r.estado === 'Activo' || r.status === 'Activo').length
  const enTrat       = riesgos.filter(r => r.estado === 'En tratamiento' || r.status === 'En tratamiento').length
  const controlados  = riesgos.filter(r => r.estado === 'Controlado' || r.status === 'Controlado').length
  const total        = riesgos.length

  const filtered = riesgos.filter(r => {
    const estado = r.estado || r.status || ''
    if (activeFilter === 'Activos' && !estado.includes('Activo')) return false
    if (activeFilter === 'En tratamiento' && !estado.includes('tratamiento')) return false
    if (activeFilter === 'Controlados' && !estado.includes('Controlado')) return false
    if (searchText) {
      const q = searchText.toLowerCase()
      if (!r.riesgo?.toLowerCase().includes(q) && !r.title?.toLowerCase().includes(q) && !r.proceso?.toLowerCase().includes(q)) return false
    }
    return true
  })

  function exportRiesgos() {
    if (riesgos.length === 0) { toast('Sin datos para exportar', 'n'); return }
    const rows = filtered.map(r => ({
      ID: r._id?.slice(-6) || '—',
      Proceso: r.proceso || r.process || '—',
      Riesgo: r.riesgo || r.title || '—',
      Probabilidad: r.probabilidad || r.probability || '—',
      Impacto: r.impacto || r.impact || '—',
      Nivel: r.nivel || r.level || '—',
      Responsable: r.responsable || r.responsible || '—',
      Estado: r.estado || r.status || '—',
    }))
    downloadCSV(rows, `Matriz_Riesgos_Consultor_${new Date().toISOString().split('T')[0]}.csv`)
    toast('Matriz de riesgos exportada', 'ok')
  }

  return (
    <main className="page">
      <div className="ph">
        <div><h1 className="ph-title">Matriz de <em>Riesgos</em></h1><p className="ph-sub">Vista completa de riesgos y oportunidades del SGC — Solo lectura</p></div>
        <div className="ph-actions">
          <button className="btn btn-out" onClick={exportRiesgos}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>Exportar
          </button>
        </div>
      </div>

      <div className="sg">
        {[
          { v:'red', num: loading ? '…' : String(activos), lbl:'Riesgos Activos', trend:'Crítico', tt:'dn', w:`${total>0?Math.round(activos/total*100):0}%`, icon:<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg> },
          { v:'warn', num: loading ? '…' : String(enTrat), lbl:'En Tratamiento', trend:'Medio', tt:'n', w:`${total>0?Math.round(enTrat/total*100):0}%`, icon:<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> },
          { v:'ok', num: loading ? '…' : String(controlados), trend:'OK', tt:'up', w:`${total>0?Math.round(controlados/total*100):0}%`, lbl:'Controlados', icon:<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> },
          { v:'gold', num: loading ? '…' : String(total), lbl:'Total Riesgos', trend:'Total', tt:'n', w:'80%', icon:<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"/></svg> },
        ].map((s,i) => (
          <div key={i} className={`sc sc-${s.v}`}>
            <div className="sc-top"><div className="sc-icon">{s.icon}</div><span className={`trend trend-${s.tt}`}>{s.trend}</span></div>
            <div className="sc-num">{s.num}</div><div className="sc-lbl">{s.lbl}</div>
            <div className="sc-bar"><div className="sc-bar-f" style={{width:s.w}}/></div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="filters">
          {['Todos','Activos','En tratamiento','Controlados'].map(f => (
            <button key={f} className={`filter-tab${activeFilter===f?' active':''}`} onClick={() => setActiveFilter(f)}>{f}</button>
          ))}
          <div className="filters-r">
            <div className="fsearch">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35"/></svg>
              <input placeholder="Buscar riesgo…" value={searchText} onChange={e => setSearchText(e.target.value)} />
            </div>
          </div>
        </div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>ID</th><th>Proceso</th><th>Riesgo</th><th>Probabilidad</th><th>Impacto</th><th>Nivel</th><th>Responsable</th><th>Estado</th><th></th></tr></thead>
            <tbody>
              {loading
                ? <tr><td colSpan={9} style={{textAlign:'center',color:'var(--ash)',padding:'1.5rem'}}>Cargando riesgos…</td></tr>
                : filtered.length === 0
                  ? <tr><td colSpan={9} style={{textAlign:'center',color:'var(--ash)',padding:'1.5rem'}}>
                      {riesgos.length === 0 ? 'Sin riesgos registrados en el sistema' : 'Sin resultados para los filtros aplicados'}
                    </td></tr>
                  : filtered.map((r,i) => {
                    const riesgoText = r.riesgo || r.title || '—'
                    const procesoText = r.proceso || r.process || '—'
                    const probText = r.probabilidad || r.probability || '—'
                    const impactoText = r.impacto || r.impact || '—'
                    const nivelText = r.nivel || r.level || '—'
                    const respText = r.responsable || r.responsible || '—'
                    const estadoText = r.estado || r.status || '—'
                    return (
                      <tr key={r._id || i}>
                        <td style={{fontWeight:700,color:'var(--red)',fontSize:'.78rem'}}>{r._id?.slice(-5).toUpperCase() || String(i+1).padStart(3,'0')}</td>
                        <td style={{fontSize:'.8rem'}}>{procesoText}</td>
                        <td><div style={{fontWeight:600,fontSize:'.84rem',maxWidth:200}}>{riesgoText}</div></td>
                        <td><span className={`badge ${probBadge(probText)}`}>{probText}</span></td>
                        <td><span className={`badge ${probBadge(impactoText)}`}>{impactoText}</span></td>
                        <td><span className={`badge ${nivelBadge(nivelText)}`}>{nivelText}</span></td>
                        <td style={{fontSize:'.78rem',color:'var(--ash)'}}>{respText}</td>
                        <td><span className={`badge ${estadoBadge(estadoText)}`}>{estadoText}</span></td>
                        <td>
                          <button className="ibtn" title="Ver detalle" onClick={() => setSelected(r)}>
                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                          </button>
                        </td>
                      </tr>
                    )
                  })
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal detalle riesgo */}
      <Modal title="Detalle del Riesgo" open={!!selected} onClose={() => setSelected(null)}
        footer={<button className="btn btn-out" onClick={() => setSelected(null)}>Cerrar</button>}>
        {selected && (
          <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
            {[
              {l:'ID', v: selected._id?.slice(-8).toUpperCase() || '—', bold:true, color:'var(--red)'},
              {l:'Proceso', v: selected.proceso || selected.process || '—'},
              {l:'Riesgo', v: selected.riesgo || selected.title || '—', bold:true},
              {l:'Causa Raíz', v: selected.causa || selected.cause || '—'},
              {l:'Probabilidad', v: selected.probabilidad || selected.probability || '—'},
              {l:'Impacto', v: selected.impacto || selected.impact || '—'},
              {l:'Control', v: selected.control || '—'},
              {l:'Responsable', v: selected.responsable || selected.responsible || '—'},
              {l:'Acción de Tratamiento', v: selected.accion || selected.action || '—'},
            ].map((row,i) => (
              <div key={i} style={{display:'flex',gap:'1rem',padding:'8px 0',borderBottom:'1px solid var(--border)'}}>
                <div style={{fontSize:'.72rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'.1em',color:'var(--ash)',minWidth:140,flexShrink:0}}>{row.l}</div>
                <div style={{fontSize:'.84rem',fontWeight:row.bold?600:400,color:row.color||'var(--ink)'}}>{row.v}</div>
              </div>
            ))}
            <div style={{display:'flex',gap:'1rem',padding:'8px 0'}}>
              <div style={{fontSize:'.72rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'.1em',color:'var(--ash)',minWidth:140,flexShrink:0}}>Nivel</div>
              <div><span className={`badge ${nivelBadge(selected.nivel || selected.level || '')}`}>{selected.nivel || selected.level || '—'}</span></div>
            </div>
            <div style={{display:'flex',gap:'1rem',padding:'8px 0'}}>
              <div style={{fontSize:'.72rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'.1em',color:'var(--ash)',minWidth:140,flexShrink:0}}>Estado</div>
              <span className={`badge ${estadoBadge(selected.estado || selected.status || '')}`}>{selected.estado || selected.status || '—'}</span>
            </div>
          </div>
        )}
      </Modal>
    </main>
  )
}
