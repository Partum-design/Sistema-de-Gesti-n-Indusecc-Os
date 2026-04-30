import { useState, useEffect } from 'react'
import { toast } from '../../components/Toast'
import { getRisks } from '../../api/api'

export default function RiesgosColaborador() {
  const [riesgos, setRiesgos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchRisks = async () => {
      try {
        setLoading(true)
        const response = await getRisks()
        if (response.data?.success && response.data?.data) {
          // Mapear riesgos de la API al formato del componente
          const mapped = response.data.data.map(risk => ({
            code: risk._id ? `R-${risk._id.slice(-6).toUpperCase()}` : 'SIN-CÓDIGO',
            desc: risk.description || 'Sin descripción',
            proceso: risk.process || 'Sin proceso',
            nivel: risk.probability === 'Alta' || risk.impact === 'Alto' ? 'Crítico' : risk.probability === 'Media' || risk.impact === 'Medio' ? 'Alto' : 'Medio',
            badgeN: risk.probability === 'Alta' || risk.impact === 'Alto' ? 'b-err' : risk.probability === 'Media' || risk.impact === 'Medio' ? 'b-warn' : 'b-gray',
            control: risk.control || 'Sin control definido',
            estado: risk.score && risk.score > 15 ? 'Abierto' : risk.score && risk.score > 8 ? 'En control' : 'Mitigado',
            badgeE: risk.score && risk.score > 15 ? 'b-warn' : 'b-ok'
          }))
          setRiesgos(mapped)
        }
      } catch (err) {
        console.error('Error al obtener riesgos:', err)
        setError(err.response?.data?.message || 'Error al cargar riesgos')
        toast('Error al cargar riesgos', 'err')
      } finally {
        setLoading(false)
      }
    }
    fetchRisks()
  }, [])

  const riesgosAltos = riesgos.filter(r => r.nivel === 'Crítico').length
  const riesgosMedios = riesgos.filter(r => r.nivel === 'Alto' || r.nivel === 'Medio').length
  const conControl = riesgos.filter(r => r.estado === 'En control' || r.estado === 'Mitigado').length
  const porcentajeControl = riesgos.length > 0 ? Math.round((conControl / riesgos.length) * 100) : 0
  return (
    <main className="page">
      <div className="ph">
        <div>
          <h1 className="ph-title">Matriz de <em>Riesgos</em></h1>
          <p className="ph-sub">ISO 9001:2015 — Gestión de Riesgos y Oportunidades · Solo lectura</p>
        </div>
      </div>

      <div className="sg sg-3" style={{gridTemplateColumns:'repeat(3,1fr)'}}>
        {[
          { v:'red', num:riesgosAltos, lbl:'Riesgos Altos', icon:<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg> },
          { v:'warn', num:riesgosMedios, lbl:'Riesgos Medios', icon:<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> },
          { v:'gold', num:`${porcentajeControl}%`, lbl:'Con Control', icon:<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> },
        ].map((s,i) => (
          <div key={i} className={`sc sc-${s.v}`}>
            <div className="sc-top"><div className="sc-icon">{s.icon}</div></div>
            <div className="sc-num">{s.num}</div><div className="sc-lbl">{s.lbl}</div>
          </div>
        ))}
      </div>

      <div style={{marginBottom:'1rem',background:'var(--blue-bg)',border:'1px solid rgba(29,78,216,.15)',borderRadius:8,padding:'1rem',display:'flex',alignItems:'center',gap:10}}>
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" width="18" style={{color:'var(--blue)',flexShrink:0}}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        <div style={{fontSize:'.82rem',color:'var(--blue)',fontWeight:500}}>Vista de solo lectura — Puedes consultar los riesgos y controles de tu área. Para reportar un nuevo riesgo, usa <strong>Reportar Hallazgo</strong>.</div>
      </div>

      {error && (
        <div style={{background:'var(--err-bg)',border:'1px solid rgba(220,38,38,.2)',borderRadius:8,padding:'1rem',marginBottom:'1rem',display:'flex',alignItems:'center',gap:10,color:'var(--err)'}}>
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" width="20"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          <span style={{fontSize:'.85rem'}}>{error}</span>
        </div>
      )}

      <div className="card">
        <div className="card-hd">
          <div className="card-hd-l">
            <div className="card-ico ico-red"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"/></svg></div>
            <div><div className="card-title">Registro de Riesgos del SGC</div><div className="card-sub">Cláusula 6.1 — ISO 9001:2015</div></div>
          </div>
        </div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Código</th><th>Descripción</th><th>Proceso</th><th>Nivel</th><th>Control</th><th>Estado</th></tr></thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{textAlign:'center',padding:'2rem',color:'var(--ash)'}}>
                    <div style={{fontSize:'.9rem',marginBottom:'1rem'}}>Cargando riesgos...</div>
                    <div style={{display:'inline-block',width:30,height:30,border:'3px solid var(--border)',borderTop:'3px solid var(--blue)',borderRadius:'50%',animation:'spin 1s linear infinite'}}/>
                  </td>
                </tr>
              ) : riesgos.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{textAlign:'center',padding:'2rem',color:'var(--ash)',fontSize:'.85rem'}}>No hay riesgos registrados</td>
                </tr>
              ) : (
                riesgos.map((r,i) => (
                  <tr key={i}>
                    <td style={{fontWeight:700,fontSize:'.78rem',color:'var(--red)'}}>{r.code}</td>
                    <td style={{fontSize:'.8rem',fontWeight:500}}>{r.desc}</td>
                    <td style={{fontSize:'.78rem'}}>{r.proceso}</td>
                    <td><span className={`badge ${r.badgeN}`}>{r.nivel}</span></td>
                    <td style={{fontSize:'.76rem',color:'var(--ash)'}}>{r.control}</td>
                    <td><span className={`badge ${r.badgeE}`}>{r.estado}</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}
