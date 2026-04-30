import { useState, useEffect } from 'react'
import Papa from 'papaparse'
import { toast } from '../../components/Toast'
import { getDocuments, downloadDocument, viewDocument } from '../../api/api'
import { downloadBlob } from '../../utils/downloadHelpers'

const SECCIONES = [
  { id:'todos', label:'Todos' },
  { id:'4', label:'4 — Contexto' },
  { id:'5', label:'5 — Liderazgo' },
  { id:'6', label:'6 — Planificación' },
  { id:'7', label:'7 — Apoyo' },
  { id:'8', label:'8 — Operación' },
  { id:'9', label:'9 — Evaluación' },
  { id:'10', label:'10 — Mejora' },
]

// Mapea estado de documento a badge CSS
const getEstadoBadge = (status) => {
  if (!status) return 'b-ok'
  if (status === 'Vencido') return 'b-err'
  if (status === 'Por vencer') return 'b-warn'
  return 'b-ok'
}

// Mapea tipo de documento a badge CSS
const getTipoBadge = (category) => {
  if (!category) return 'b-gray'
  if (category === 'Política' || category === 'Procedimiento') return 'b-blue'
  return 'b-gray'
}

export default function Documentos() {
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeSection, setActiveSection] = useState('todos')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true)
        const response = await getDocuments({ limit: 100 })
        if (response.data?.success && response.data?.data?.documents) {
          const formatted = response.data.data.documents.map(doc => ({
            code: doc.filename || 'SIN-CÓDIGO',
            name: doc.originalName || doc.filename || 'Documento sin nombre',
            tipo: doc.category || 'Documento',
            tipoBadge: getTipoBadge(doc.category),
            v: 'v.01',
            badge: getEstadoBadge(doc.status),
            estado: doc.status || 'Vigente',
            clausula: '—',
            punto: '0',
            resp: '—',
            fecha: doc.expiryDate ? new Date(doc.expiryDate).toLocaleDateString('es-ES', {year:'numeric',month:'short',day:'numeric'}) : '—',
            id: doc._id
          }))
          setDocs(formatted)
        }
      } catch (err) {
        console.error('Error al obtener documentos:', err)
        setError(err.response?.data?.message || 'Error al cargar documentos')
        toast('Error al cargar documentos', 'err')
      } finally {
        setLoading(false)
      }
    }
    fetchDocuments()
  }, [])

  const filtered = docs.filter(d => {
    const matchSec = activeSection==='todos' || d.punto===activeSection
    const matchQ = !search || d.name.toLowerCase().includes(search.toLowerCase()) || d.code.toLowerCase().includes(search.toLowerCase())
    return matchSec && matchQ
  })

  const handleView = async (id, name) => {
    try {
      const response = await viewDocument(id)
      const blob = new Blob([response.data], { type: response.headers['content-type'] })
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
      toast(`Visualizando ${name}`, 'ok')
    } catch (err) {
      console.error('Error al visualizar documento:', err)
      toast('Error al visualizar documento', 'err')
    }
  }

  const handleDownload = async (id, name) => {
    try {
      const response = await downloadDocument(id)
      const blob = new Blob([response.data], { type: response.headers['content-type'] })
      const filename = response.headers['content-disposition']?.split('filename=')[1]?.replace(/"/g, '') || name
      downloadBlob(blob, filename)
      toast(`Descargado ${name}`, 'ok')
    } catch (err) {
      console.error('Error al descargar documento:', err)
      toast('Error al descargar documento', 'err')
    }
  }

  function exportToCSV() {
    const csv = Papa.unparse(filtered.map(d => ({
      Código: d.code,
      Nombre: d.name,
      Cláusula: d.clausula,
      Tipo: d.tipo,
      Versión: d.v,
      Estado: d.estado,
      Vigencia: d.fecha,
      Responsable: d.resp,
    })))
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `Documentos_Colaborador_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast('Listado de documentos exportado en CSV', 'ok')
  }

  return (
    <main className="page">
      <div className="ph">
        <div>
          <h1 className="ph-title">Documentos <em>ISO 9001</em></h1>
          <p className="ph-sub">Puntos 4 al 10 · {filtered.length} archivo{filtered.length!==1?'s':''} registrado{filtered.length!==1?'s':''}</p>
        </div>
        <div className="ph-actions">
          <button className="btn btn-out" onClick={exportToCSV} disabled={loading}><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>{loading ? 'Cargando...' : 'Exportar'}</button>
        </div>
      </div>

      {error && (
        <div style={{background:'var(--err-bg)',border:'1px solid rgba(220,38,38,.2)',borderRadius:8,padding:'1rem',marginBottom:'1rem',display:'flex',alignItems:'center',gap:10,color:'var(--err)'}}>
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" width="20"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          <span style={{fontSize:'.85rem'}}>{error}</span>
        </div>
      )}

      {loading ? (
        <div style={{padding:'3rem',textAlign:'center',color:'var(--ash)'}}>
          <div style={{fontSize:'.9rem',marginBottom:'1rem'}}>Cargando documentos...</div>
          <div style={{display:'inline-block',width:30,height:30,border:'3px solid var(--border)',borderTop:'3px solid var(--blue)',borderRadius:'50%',animation:'spin 1s linear infinite'}}/>
        </div>
      ) : (
        <>
      <div className="sg">
        {[
          { v:'blue', num:docs.length, lbl:'Total Documentos', w:'100%', icon:<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg> },
          { v:'ok', num:docs.filter(d=>d.badge==='b-ok').length, lbl:'Vigentes', w:'80%', icon:<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> },
          { v:'warn', num:docs.filter(d=>d.badge==='b-warn').length, lbl:'Por Vencer', w:'20%', icon:<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> },
          { v:'gold', num:docs.filter(d=>d.punto!=='0').length, lbl:'Puntos ISO', w:'100%', icon:<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg> },
        ].map((s,i) => (
          <div key={i} className={`sc sc-${s.v}`}>
            <div className="sc-top"><div className="sc-icon">{s.icon}</div></div>
            <div className="sc-num">{s.num}</div><div className="sc-lbl">{s.lbl}</div>
            <div className="sc-bar"><div className="sc-bar-f" style={{ width:s.w }}/></div>
          </div>
        ))}
      </div>

      <div className="card">
        <div style={{ padding:'.8rem 1rem',borderBottom:'1px solid var(--border)',display:'flex',gap:'.4rem',flexWrap:'wrap',alignItems:'center' }}>
          {SECCIONES.map(s => (
            <button key={s.id} className={`filter-tab${activeSection===s.id?' active':''}`} onClick={() => setActiveSection(s.id)}>{s.label}</button>
          ))}
          <div style={{ marginLeft:'auto' }}>
            <div className="fsearch" style={{ minWidth:200 }}>
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35"/></svg>
              <input placeholder="Buscar documento…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Código</th><th>Nombre del Documento</th><th>Cláusula</th><th>Tipo</th><th>Versión</th><th>Estado</th><th>Vigencia</th><th>Acciones</th></tr></thead>
            <tbody>
              {filtered.map((d,i) => (
                <tr key={d.id || i}>
                  <td style={{ fontWeight:700,color:'var(--red)',fontSize:'.78rem',fontFamily:'monospace' }}>{d.code}</td>
                  <td><div style={{ fontWeight:600,fontSize:'.845rem' }}>{d.name}</div></td>
                  <td><span className="badge b-gray" style={{ fontSize:'.6rem' }}>{d.clausula}</span></td>
                  <td><span className={`badge ${d.tipoBadge}`}>{d.tipo}</span></td>
                  <td style={{ color:'var(--ash)',fontWeight:600,fontSize:'.8rem' }}>{d.v}</td>
                  <td><span className={`badge ${d.badge}`}>{d.estado}</span></td>
                  <td style={{ fontSize:'.78rem',color:d.badge==='b-err'?'var(--err)':'var(--ash)',fontWeight:d.badge==='b-err'?600:400 }}>{d.fecha}</td>
                  <td>
                    <div style={{ display:'flex',gap:'.3rem' }}>
                      <button className="ibtn" title="Ver" onClick={() => handleView(d.id, d.name)}><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg></button>
                      <button className="ibtn" title="Descargar" onClick={() => handleDownload(d.id, d.name)}><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length===0 && !loading && (
          <div style={{ padding:'2rem',textAlign:'center',color:'var(--ash)',fontSize:'.85rem' }}>No se encontraron documentos</div>
        )}
        <div style={{ padding:'.8rem 1.3rem',borderTop:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
          <span style={{ fontSize:'.78rem',color:'var(--ash)' }}>Mostrando {filtered.length} de {docs.length} documentos</span>
          <div style={{ background:'var(--blue-bg)',borderRadius:6,padding:'5px 10px',fontSize:'.73rem',color:'var(--blue)',fontWeight:600, display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" width="12"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            Vista de solo lectura
          </div>
        </div>
      </div>
        </>
      )}
    </main>
  )
}
