import { useState, useEffect } from 'react'
import { toast } from '../../components/Toast'
import { 
  getCollaboratorIndicators, 
  getComplianceByClause, 
  getProcessIndicators, 
  getUserPerformance 
} from '../../api/api'

export default function Indicadores() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [indicators, setIndicators] = useState(null)
  const [compliance, setCompliance] = useState([])
  const [processIndicators, setProcessIndicators] = useState([])
  const [performance, setPerformance] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        const [indicatorsRes, complianceRes, processRes, performanceRes] = await Promise.all([
          getCollaboratorIndicators(),
          getComplianceByClause(),
          getProcessIndicators(),
          getUserPerformance()
        ])

        if (indicatorsRes.data?.success && indicatorsRes.data?.data?.indicators) {
          setIndicators(indicatorsRes.data.data.indicators)
        } else {
          setIndicators(null)
        }

        if (complianceRes.data?.success && complianceRes.data?.data?.compliance) {
          setCompliance(complianceRes.data.data.compliance)
        } else {
          setCompliance([])
        }

        if (processRes.data?.success && processRes.data?.data?.indicators) {
          setProcessIndicators(processRes.data.data.indicators)
        } else {
          setProcessIndicators([])
        }

        if (performanceRes.data?.success && performanceRes.data?.data?.performance) {
          setPerformance(performanceRes.data.data.performance)
        } else {
          setPerformance([])
        }
      } catch (err) {
        console.error('Error al obtener indicadores:', err)
        setError('Error al cargar indicadores. Verifica tu conexión a internet.')
        toast('Error al cargar indicadores', 'err')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <main className="page">
        <div style={{padding:'3rem',textAlign:'center',color:'var(--ash)'}}>
          <div style={{fontSize:'.9rem',marginBottom:'1rem'}}>Cargando indicadores...</div>
          <div style={{display:'inline-block',width:30,height:30,border:'3px solid var(--border)',borderTop:'3px solid var(--blue)',borderRadius:'50%',animation:'spin 1s linear infinite'}}/>
        </div>
      </main>
    )
  }

  return (
    <main className="page">
      <div className="ph">
        <div><div className="ph-title">Indicadores <em>SGC</em></div><div className="ph-sub">Vista de solo consulta · Datos del área de producción</div></div>
        <div className="ph-actions">
          <button 
            className="btn btn-out" 
            onClick={() => toast('Exportando indicadores…','n')}
            disabled={loading}
          >
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>Exportar
          </button>
        </div>
      </div>

      {error && (
        <div style={{background:'var(--err-bg)',border:'1px solid rgba(220,38,38,.2)',borderRadius:8,padding:'1rem',marginBottom:'1rem',display:'flex',alignItems:'center',gap:10,color:'var(--err)'}}>
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" width="20"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          <span style={{fontSize:'.85rem'}}>{error}</span>
        </div>
      )}

      <div className="sg">
        {indicators ? [
          { 
            key: 'sgcCompliance',
            v:'ok', 
            num: indicators.sgcCompliance?.value || '0%', 
            lbl: indicators.sgcCompliance?.label || 'Cumplimiento SGC', 
            trend: indicators.sgcCompliance?.trend || 'N/A', 
            tt: indicators.sgcCompliance?.trendType || 'neutral',
            w: `${indicators.sgcCompliance?.percentage || 0}%`,
            icon:<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/></svg>
          },
          { 
            key: 'activeDocuments',
            v:'gold', 
            num: indicators.activeDocuments?.value || 0, 
            lbl: indicators.activeDocuments?.label || 'Docs Vigentes', 
            trend: indicators.activeDocuments?.trend || 'Total', 
            tt: indicators.activeDocuments?.trendType || 'neutral',
            w: `${indicators.activeDocuments?.percentage || 0}%`,
            icon:<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
          },
          { 
            key: 'completedTasks',
            v:'warn', 
            num: indicators.completedTasks?.value || '0/0', 
            lbl: indicators.completedTasks?.label || 'Tareas Completadas', 
            trend: indicators.completedTasks?.trend || 'Mes actual', 
            tt: indicators.completedTasks?.trendType || 'neutral',
            w: `${indicators.completedTasks?.percentage || 0}%`,
            icon:<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
          },
          { 
            key: 'completedAudits',
            v:'blue', 
            num: indicators.completedAudits?.value || '0/0', 
            lbl: indicators.completedAudits?.label || 'Auditorías', 
            trend: indicators.completedAudits?.trend || 'Mes actual', 
            tt: indicators.completedAudits?.trendType || 'neutral',
            w: `${indicators.completedAudits?.percentage || 0}%`,
            icon:<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z"/></svg>
          },
        ].map((s) => (
          <div key={s.key} className={`sc sc-${s.v}`}>
            <div className="sc-top"><div className="sc-icon">{s.icon}</div><span className={`trend trend-${s.tt}`}>{s.tt==='up'?<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3" width="10"><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7"/></svg>:<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3" width="10"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>}{s.trend}</span></div>
            <div className="sc-num">{s.num}</div><div className="sc-lbl">{s.lbl}</div>
            <div className="sc-bar"><div className="sc-bar-f" style={{width:s.w}}/></div>
          </div>
        )) : (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--ash)', padding: '2rem' }}>
            No se pudieron cargar los indicadores principales
          </div>
        )}
      </div>

      <div className="mg">
        <div style={{display:'flex',flexDirection:'column',gap:'1.2rem'}}>
          {/* Indicadores por cláusula */}
          <div className="card">
            <div className="card-hd">
              <div className="card-hd-l">
                <div className="card-ico ico-gold"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg></div>
                <div><div className="card-title">Cumplimiento por Cláusula ISO 9001</div><div className="card-sub">Área: Producción — Q1 2026</div></div>
              </div>
            </div>
            <div style={{padding:'1.3rem',display:'flex',flexDirection:'column',gap:'.9rem'}}>
              {compliance.map((c,i) => (
                <div key={i}>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:'.82rem',marginBottom:'.35rem',fontWeight:500}}>
                    <span>{c.label}</span><span style={{color: c.compliance >= 90 ? 'var(--ok)' : c.compliance >= 80 ? 'var(--gold-d)' : 'var(--warn)',fontWeight:700}}>{c.compliance}%</span>
                  </div>
                  <div className="prog-wrap" style={{height:7}}><div className="prog-fill" style={{width:`${c.compliance}%`,background:c.color}}/></div>
                </div>
              ))}
            </div>
          </div>

          {/* Indicadores del proceso */}
          <div className="card">
            <div className="card-hd">
              <div className="card-hd-l">
                <div className="card-ico ico-blue"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg></div>
                <div><div className="card-title">Indicadores de Proceso — Producción</div></div>
              </div>
            </div>
            <div className="tbl-wrap">
              <table className="tbl">
                <thead><tr><th>Indicador</th><th>Meta</th><th>Resultado</th><th>Tendencia</th><th>Estado</th></tr></thead>
                <tbody>
                  {processIndicators.map((r,i) => (
                    <tr key={i}>
                      <td style={{fontWeight:600,fontSize:'.845rem'}}>{r.name}</td>
                      <td style={{fontSize:'.8rem',color:'var(--ash)'}}>{r.target}</td>
                      <td style={{fontWeight:700,fontSize:'.845rem'}}>{r.result}</td>
                      <td><span className={`trend trend-${r.trendType}`}>{r.trendType==='up'?<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3" width="10"><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7"/></svg>:<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3" width="10"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>}{r.trend}</span></td>
                      <td><span className={`badge ${r.status}`}>{r.status==='b-ok'?'Cumple':'Por mejorar'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="col-r">
          <div className="card">
            <div className="card-hd"><div className="card-hd-l"><div className="card-ico ico-ok"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg></div><div><div className="card-title">Mi Desempeño</div><div className="card-sub">Marzo 2026</div></div></div></div>
            <div style={{padding:'1rem'}}>
              {performance.map((b,i) => (
                <div key={i} style={{marginBottom:'.9rem'}}>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:'.78rem',marginBottom:'.35rem'}}>
                    <span>{b.label}</span><span style={{fontWeight:700,color: b.color}}>{b.value}</span>
                  </div>
                  <div className="prog-wrap"><div className="prog-fill" style={{width:`${b.percentage}%`,background:b.color}}/></div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-hd"><div className="card-hd-l"><div className="card-ico ico-blue"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div><div><div className="card-title">Nota Informativa</div></div></div></div>
            <div style={{padding:'1rem 1.2rem'}}>
              <div style={{background:'var(--blue-bg)',border:'1px solid rgba(29,78,216,.15)',borderRadius:7,padding:'1rem',fontSize:'.82rem'}}>
                <div style={{fontWeight:600,color:'var(--blue)',marginBottom:'.4rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" width="14"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  Vista de consulta
                </div>
                <div style={{color:'var(--ash)',lineHeight:1.6}}>Estás viendo los indicadores en modo solo lectura. Los datos son actualizados por el área de Calidad. Si detectas alguna discrepancia, repórtala a tu supervisor.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
