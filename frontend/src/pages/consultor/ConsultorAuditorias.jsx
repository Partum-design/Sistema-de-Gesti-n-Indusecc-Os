import { useState, useEffect } from 'react'
import { toast } from '../../components/Toast'
import { downloadCSV } from '../../utils/downloadHelpers'
import { getAudits, getFindings } from '../../api/api'

function statusBadge(status) {
  if (!status) return 'b-gray'
  const s = status.toLowerCase()
  if (s.includes('complet') || s.includes('cerrad')) return 'b-ok'
  if (s.includes('progreso') || s.includes('proceso')) return 'b-warn'
  return 'b-blue'
}

export default function ConsultorAuditorias() {
  const [audits, setAudits] = useState([])
  const [findings, setFindings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [auditRes, findRes] = await Promise.allSettled([
          getAudits(),
          getFindings(),
        ])
        if (auditRes.status === 'fulfilled') {
          const list = auditRes.value.data?.data?.audits || []
          setAudits(list)
        }
        if (findRes.status === 'fulfilled') {
          const list = findRes.value.data?.data?.findings || findRes.value.data?.data || []
          setFindings(Array.isArray(list) ? list : [])
        }
      } catch (err) {
        console.error('[ConsultorAuditorias] Error:', err)
        toast('Error al cargar auditorías', 'err')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const programadas = audits.filter(a => a.status === 'Pendiente' || a.status === 'En Progreso').length
  const ncAbiertas = findings.filter(f => f.status !== 'Cerrado').length
  const ncResueltas = findings.filter(f => f.status === 'Cerrado').length

  function exportPlanAuditorias() {
    if (audits.length === 0) { toast('Sin datos para exportar', 'n'); return }
    const rows = audits.map(a => ({
      Auditoria: a.title,
      Tipo: 'Interna',
      Área: a.description || '—',
      Auditor: a.assignedTo?.name || '—',
      Fecha: a.date ? new Date(a.date).toLocaleDateString('es-ES') : '—',
      Estado: a.status || '—',
    }))
    downloadCSV(rows, `Plan_Auditorias_${new Date().toISOString().split('T')[0]}.csv`)
    toast('Plan de auditorías exportado', 'ok')
  }

  return (
    <main className="page">
      <div className="ph">
        <div><h1 className="ph-title">Auditorías <em>Internas</em></h1><p className="ph-sub">Vista global del plan de auditorías y no conformidades — Solo lectura</p></div>
        <div className="ph-actions">
          <span style={{display:'inline-flex',alignItems:'center',gap:6,background:'rgba(0,0,0,.06)',border:'1px solid var(--border)',borderRadius:6,padding:'6px 12px',fontSize:'.75rem',fontWeight:600,color:'var(--ash)'}}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" width="14"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>Solo Lectura
          </span>
          <button className="btn btn-out" onClick={exportPlanAuditorias}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>Exportar Plan
          </button>
        </div>
      </div>

      <div className="sg sg-3" style={{gridTemplateColumns:'repeat(3,1fr)'}}>
        {[
          { v:'blue', num: loading ? '…' : String(programadas || audits.length), lbl:'Programadas', trend:'2026', tt:'n', w:'50%', icon:<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg> },
          { v:'warn', num: loading ? '…' : String(ncAbiertas), lbl:'No Conformidades', trend:'Abiertas', tt:'dn', w:`${Math.min(ncAbiertas * 10, 100)}%`, icon:<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg> },
          { v:'ok', num: loading ? '…' : String(ncResueltas), lbl:'NC Resueltas', trend:'Cerradas', tt:'up', w:`${findings.length > 0 ? Math.round(ncResueltas/findings.length*100) : 0}%`, icon:<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> },
        ].map((s,i) => (
          <div key={i} className={`sc sc-${s.v}`}>
            <div className="sc-top"><div className="sc-icon">{s.icon}</div><span className={`trend trend-${s.tt}`}>{s.trend}</span></div>
            <div className="sc-num">{s.num}</div><div className="sc-lbl">{s.lbl}</div>
            <div className="sc-bar"><div className="sc-bar-f" style={{width:s.w}}/></div>
          </div>
        ))}
      </div>

      <div className="mg">
        <div style={{display:'flex',flexDirection:'column',gap:'1.2rem'}}>
          {/* Plan de auditorías */}
          <div className="card">
            <div className="card-hd">
              <div className="card-hd-l">
                <div className="card-ico ico-gold"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg></div>
                <div><div className="card-title">Plan de Auditorías</div></div>
              </div>
            </div>
            <div className="tbl-wrap">
              <table className="tbl">
                <thead><tr><th>Título</th><th>Área / Descripción</th><th>Auditor</th><th>Fecha</th><th>Estado</th></tr></thead>
                <tbody>
                  {loading
                    ? <tr><td colSpan={5} style={{textAlign:'center',color:'var(--ash)',padding:'1.5rem'}}>Cargando auditorías…</td></tr>
                    : audits.length === 0
                      ? <tr><td colSpan={5} style={{textAlign:'center',color:'var(--ash)',padding:'1.5rem'}}>Sin auditorías registradas</td></tr>
                      : audits.map((a,i) => (
                        <tr key={i}>
                          <td style={{fontWeight:700,fontSize:'.845rem'}}>{a.title}</td>
                          <td style={{fontSize:'.8rem'}}>{a.description?.slice(0,50) || '—'}</td>
                          <td style={{fontSize:'.8rem'}}>{a.assignedTo?.name || '—'}</td>
                          <td style={{fontSize:'.78rem',fontWeight:600}}>{a.date ? new Date(a.date).toLocaleDateString('es-ES') : '—'}</td>
                          <td><span className={`badge ${statusBadge(a.status)}`}>{a.status}</span></td>
                        </tr>
                      ))
                  }
                </tbody>
              </table>
            </div>
          </div>

          {/* NC Abiertas */}
          <div className="card">
            <div className="card-hd">
              <div className="card-hd-l">
                <div className="card-ico ico-red"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg></div>
                <div><div className="card-title">No Conformidades Abiertas</div><div className="card-sub">Requieren acción correctiva</div></div>
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem',padding:'1.2rem'}}>
              {loading
                ? <div style={{gridColumn:'span 2',textAlign:'center',color:'var(--ash)',padding:'1rem'}}>Cargando hallazgos…</div>
                : findings.filter(f => f.status !== 'Cerrado').length === 0
                  ? <div style={{gridColumn:'span 2',textAlign:'center',color:'var(--ok)',padding:'1rem'}}>✓ Sin no conformidades abiertas</div>
                  : findings.filter(f => f.status !== 'Cerrado').slice(0,4).map((nc,i) => (
                    <div className="nc" key={i}>
                      <div className="nc-top">
                        <div><div className="nc-title">{nc.title}</div><div className="nc-code">{nc.clause ? `Cláusula ${nc.clause}` : nc.area || '—'}</div></div>
                        <span className={`badge ${nc.severity === 'Alta' ? 'b-err' : 'b-warn'}`}>{nc.severity || 'Media'}</span>
                      </div>
                      <div className="nc-body">{nc.description?.slice(0,120) || '—'}</div>
                      <div className="nc-footer">
                        <span className="nc-meta">Estado: {nc.status}</span>
                      </div>
                    </div>
                  ))
              }
            </div>
          </div>
        </div>

        <div className="col-r">
          <div className="card">
            <div className="card-hd"><div className="card-hd-l"><div className="card-ico ico-gold"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg></div><div><div className="card-title">Próximas Auditorías</div></div></div></div>
            <div style={{padding:'1.2rem',display:'flex',flexDirection:'column',gap:'.8rem'}}>
              {loading
                ? <div style={{color:'var(--ash)',fontSize:'.83rem'}}>Cargando…</div>
                : audits.filter(a => a.status === 'Pendiente').slice(0,3).map((a,i) => (
                  <div key={i} style={{background:'linear-gradient(135deg,var(--red-k),var(--red-d))',borderRadius:8,padding:'1rem',color:'#fff'}}>
                    <div style={{fontSize:'.72rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'.15em',color:'var(--gold-l)',marginBottom:'.4rem'}}>Pendiente</div>
                    <div style={{fontFamily:"'Playfair Display',serif",fontSize:'1rem',fontWeight:700,marginBottom:'.2rem'}}>{a.title}</div>
                    <div style={{fontSize:'.78rem',color:'rgba(255,255,255,.6)'}}>{a.date ? new Date(a.date).toLocaleDateString('es-ES',{day:'2-digit',month:'short',year:'numeric'}) : 'Sin fecha'}</div>
                  </div>
                ))
              }
              {!loading && audits.filter(a => a.status === 'Pendiente').length === 0 && (
                <div style={{color:'var(--ash)',fontSize:'.83rem',textAlign:'center'}}>Sin auditorías pendientes</div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-hd"><div className="card-hd-l"><div className="card-ico ico-ink"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/></svg></div><div><div className="card-title">NC por Área</div></div></div></div>
            <div style={{padding:'1rem'}}>
              {(() => {
                const byArea = {}
                findings.filter(f => f.status !== 'Cerrado').forEach(f => {
                  const area = f.area || 'Sin área'
                  byArea[area] = (byArea[area] || 0) + 1
                })
                const entries = Object.entries(byArea)
                const max = Math.max(...entries.map(([,v]) => v), 1)
                return entries.length === 0
                  ? <div style={{color:'var(--ok)',fontSize:'.83rem',textAlign:'center'}}>✓ Sin NC activas</div>
                  : entries.slice(0,5).map(([area,v],i) => (
                    <div key={i} style={{marginBottom:'.9rem'}}>
                      <div style={{display:'flex',justifyContent:'space-between',fontSize:'.78rem',marginBottom:'.35rem'}}><span>{area}</span><span style={{fontWeight:700,color:'var(--err)'}}>{v}</span></div>
                      <div className="prog-wrap"><div className="prog-fill" style={{width:`${Math.round(v/max*100)}%`,background:'var(--red)'}}/></div>
                    </div>
                  ))
              })()}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
