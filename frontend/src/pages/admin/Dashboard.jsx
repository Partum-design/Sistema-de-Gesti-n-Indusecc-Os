import { useState, useEffect } from 'react'
import { getDocuments, getAudits, getFindings, getComplianceReport, uploadDocument, getCalendars } from '../../api/api'
import { useNavigate } from 'react-router-dom'
import { toast } from '../../components/Toast'

function Modal({ title, children, onClose }) {
  return (
    <div className="modal-bg open" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-hd">
          <span className="modal-ttl">{title}</span>
          <button className="modal-close" onClick={onClose}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

const EyeIcon = () => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
const DownloadIcon = () => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
const RefreshIcon = () => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
const DocIcon = () => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>

export default function Dashboard() {
  const navigate = useNavigate()
  const [modal, setModal] = useState(null)
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState({
    docsCount: 0,
    auditsCount: 0,
    findingsCount: 0,
    compliancePct: 0,
    recentDocs: [],
    recentActivity: []
  })

  // Estado para el formulario de subida
  const [uploadForm, setUploadForm] = useState({
    name: '',
    code: '',
    version: 'v.01',
    type: 'Procedimiento',
    responsible: '',
    file: null
  })
  const [isUploading, setIsUploading] = useState(false)

  function downloadCsv(rows, filename) {
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
  }

  function exportDashboardData() {
    const rows = [
      { Métrica: 'Documentos', Valor: data.docsCount },
      { Métrica: 'Auditorías', Valor: data.auditsCount },
      { Métrica: 'Hallazgos', Valor: data.findingsCount },
      { Métrica: 'Cumplimiento', Valor: `${data.compliancePct}%` },
      { Métrica: 'Eventos Calendario', Valor: data.recentActivity.length }
    ]
    downloadCsv(rows, `Dashboard_Resumen_${new Date().toISOString().split('T')[0]}.csv`)
    toast('Resumen del panel exportado en CSV', 'ok')
  }

  function handleViewDoc(doc) {
    toast(`Ver documento "${doc.name}"`, 'n')
  }

  function handleDownloadDoc(doc) {
    if (doc.isExpired) {
      toast(`El documento "${doc.name}" está vencido. Renueva o revisa el documento.`, 'warn')
    } else {
      toast(`Descargando "${doc.name}"`, 'ok')
    }
  }

  // Próximos Vencimientos (Dinamizados)
  const [vencimientos, setVencimientos] = useState([])

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const [docsRes, auditsRes, findingsRes, complianceRes, calendarRes] = await Promise.all([
          getDocuments(),
          getAudits(),
          getFindings(),
          getComplianceReport(),
          getCalendars()
        ])

        const docs = docsRes.data?.data?.documents || docsRes.data?.data || []
        const audits = auditsRes.data?.data?.audits || auditsRes.data?.data || []
        const findings = findingsRes.data?.data?.findings || findingsRes.data?.data || []
        const compliance = complianceRes.data?.data?.completion?.overall || 0
        const calendar = calendarRes.data?.data?.calendars || calendarRes.data?.data || []

        // Procesar vencimientos desde Documentos con fecha y Calendario
        const docVenc = docs
          .filter(d => d.expiryDate)
          .map(d => ({
            day: new Date(d.expiryDate).getUTCDate().toString(),
            mon: new Date(d.expiryDate).toLocaleDateString('es-ES', { month: 'short' }).replace('.', ''),
            title: d.filename,
            sub: 'Vencimiento de documento',
            badge: Math.round((new Date(d.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)) + 'd',
            badgeCls: 'b-err',
            numColor: 'var(--err)',
            ts: new Date(d.expiryDate).getTime()
          }))

        const calVenc = calendar
          .filter(e => e.type === 'Vencimiento' || e.type === 'Auditoría')
          .map(e => ({
            day: new Date(e.date).getUTCDate().toString(),
            mon: new Date(e.date).toLocaleDateString('es-ES', { month: 'short' }).replace('.', ''),
            title: e.title,
            sub: e.type,
            badge: Math.round((new Date(e.date) - new Date()) / (1000 * 60 * 60 * 24)) + 'd',
            badgeCls: 'b-warn',
            numColor: 'var(--warn)',
            ts: new Date(e.date).getTime()
          }))

        setVencimientos([...docVenc, ...calVenc].filter(v => v.ts >= new Date().setHours(0,0,0,0)).sort((a,b) => a.ts - b.ts).slice(0, 3))

        setData({
          docsCount: docs.length,
          auditsCount: audits.length,
          findingsCount: findings.length,
          compliancePct: compliance,
          recentDocs: docs.slice(0, 3).map(d => ({
            name: d.filename || d.name,
            code: d.code || 'DOC-001',
            version: d.version || 'v.01',
            status: d.status || 'Vigente',
            date: d.updatedAt ? new Date(d.updatedAt).toLocaleDateString('es-MX') : 'Reciente',
            badgeCls: d.status === 'Vencido' ? 'b-err' : d.status === 'En Revisión' ? 'b-warn' : 'b-ok',
            isExpired: d.status === 'Vencido'
          })),
          recentActivity: [
            { dot: 'dot-ok', icon: <DocIcon />, msg: 'Conexión con base de datos estable', time: 'Sistema en línea' },
            ...findings.slice(0, 2).map(f => ({
              dot: 'dot-warn',
              icon: <EyeIcon/>,
              msg: `Nuevo hallazgo: ${f.title}`,
              time: new Date(f.createdAt).toLocaleDateString()
            }))
          ]
        })
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchDashboardData()
  }, [])

  const stats = [
    { cls: 'sc-gold', to: '/admin/documentos-iso', icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>, iconTrend: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3" width="10"><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7"/></svg>, trend: 'Vigentes', trendCls: 'trend-up', num: data.docsCount, lbl: 'Docs. en Sistema', bar: 100 },
    { cls: 'sc-blue', to: '/admin/auditorias', icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>, iconTrend: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3" width="10"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>, trend: 'Activas', trendCls: 'trend-up', num: data.auditsCount, lbl: 'Auditorías', bar: 70 },
    { cls: 'sc-warn', to: '/admin/mejora-continua', icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>, iconTrend: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3" width="10"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>, trend: 'Abiertos', trendCls: 'trend-dn', num: data.findingsCount, lbl: 'Hallazgos / NC', bar: 30 },
    { cls: 'sc-ok', to: '/admin/reportes', icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/></svg>, iconTrend: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3" width="10"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>, trend: 'ISO', trendCls: 'trend-up', num: `${data.compliancePct}%`, lbl: 'Cumplimiento SGC', bar: data.compliancePct },
  ]

  const handleUpload = async () => {
    try {
      if (!uploadForm.name || !uploadForm.code || !uploadForm.file) {
        return toast('Por favor completa los campos y selecciona un archivo', 'err')
      }
      setIsUploading(true)
      
      const formData = new FormData()
      formData.append('file', uploadForm.file)
      formData.append('title', uploadForm.name)
      formData.append('filename', uploadForm.name)
      formData.append('originalName', uploadForm.file.name)
      formData.append('mimetype', uploadForm.file.type)
      formData.append('size', uploadForm.file.size)
      formData.append('code', uploadForm.code)
      formData.append('type', uploadForm.type)
      // Agregamos el archivo real si el backend lo soporta vía Multer, 
      // si no, enviamos la data como JSON según vimos en el controlador
      formData.append('category', uploadForm.type)
      formData.append('responsible', uploadForm.responsible)
      formData.append('description', `Versión ${uploadForm.version} subida por Admin`)
      
      await uploadDocument(formData)
      toast('Documento subido con éxito', 'ok')
      setModal(null)
      window.location.reload()
    } catch (err) {
      console.error('Error uploading:', err)
      toast('Error al subir el documento', 'err')
    } finally {
      setIsUploading(false)
    }
  }

  const recentDocs = data.recentDocs
  const activity = data.recentActivity

  const monthBars = [
    { month: 'Oct', h: 88, color: 'var(--ok)', opacity: .7 },
    { month: 'Nov', h: 90, color: 'var(--ok)', opacity: .7 },
    { month: 'Dic', h: 85, color: 'var(--gold)', opacity: .7 },
    { month: 'Ene', h: 91, color: 'var(--ok)', opacity: .7 },
    { month: 'Feb', h: 94, color: 'var(--ok)', opacity: .7 },
    { month: 'Mar', h: data.compliancePct > 0 ? data.compliancePct : 96, isCurrent: true },
  ]

  return (
    <main className="page">
      <div className="ph">
        <div>
          <h1 className="ph-title">Resumen del <em>Sistema</em></h1>
          <p className="ph-sub">ISO 9001:2015 — 4 Mar 2026</p>
        </div>
        <div className="ph-actions">
          <button className="btn btn-out" onClick={exportDashboardData}><DownloadIcon /> Exportar</button>
          <button className="btn btn-red" onClick={() => setModal('upload')}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
            Subir Documento
          </button>
        </div>
      </div>

      <div className="sg">
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', gridColumn: '1 / -1', color: 'var(--ash)' }}>Cargando estadísticas...</div>
        ) : stats.map((s, i) => (
          <div key={i} className={`sc ${s.cls}`} onClick={() => navigate(s.to)} style={{ cursor: 'pointer' }}>
            <div className="sc-top">
              <div className="sc-icon">{s.icon}</div>
              <span className={`trend ${s.trendCls}`}>{s.iconTrend} {s.trend}</span>
            </div>
            <div className="sc-num">{s.num}</div>
            <div className="sc-lbl">{s.lbl}</div>
            <div className="sc-bar"><div className="sc-bar-f" style={{ width: `${s.bar}%` }} /></div>
          </div>
        ))}
      </div>

      <div className="mg">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          {/* Modificaciones recientes */}
          <div className="card">
            <div className="card-hd">
              <div className="card-hd-l">
                <div className="card-ico ico-gold"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div>
                <div><div className="card-title">Modificaciones Recientes</div><div className="card-sub">Últimos 30 días</div></div>
              </div>
              <span className="card-link" style={{ cursor: 'pointer' }} onClick={() => navigate('/admin/documentos-iso')}>Ver todos →</span>
            </div>
            <div className="tbl-wrap">
              <table className="tbl">
                <thead><tr><th>Documento</th><th>Versión</th><th>Estado</th><th>Fecha</th><th></th></tr></thead>
                <tbody>
                  {recentDocs.map((d, i) => (
                    <tr key={i}>
                      <td>
                        <div className="dn">
                          <div className="dn-ico"><DocIcon /></div>
                          <div><div className="dn-title">{d.name}</div><div className="dn-code">{d.code}</div></div>
                        </div>
                      </td>
                      <td style={{ fontSize: '.8rem', color: 'var(--ash)', fontWeight: 600 }}>{d.version}</td>
                      <td><span className={`badge ${d.badgeCls}`}>{d.status}</span></td>
                      <td style={{ fontSize: '.78rem', color: 'var(--ash)' }}>{d.date}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '.3rem' }}>
                          <button className="ibtn" onClick={() => handleViewDoc(d)}><EyeIcon /></button>
                          {d.isExpired
                            ? <button className="ibtn ibtn-red" onClick={() => handleDownloadDoc(d)}><RefreshIcon /></button>
                            : <button className="ibtn" onClick={() => handleDownloadDoc(d)}><DownloadIcon /></button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Actividad reciente */}
          <div className="card">
            <div className="card-hd">
              <div className="card-hd-l">
                <div className="card-ico ico-ink"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div>
                <div><div className="card-title">Actividad Reciente</div></div>
              </div>
            </div>
            <div className="act-list">
              {activity.map((a, i) => (
                <div key={i} className="act-i">
                  <div className={`act-dot ${a.dot}`}>{a.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div className="act-msg">{a.msg}</div>
                    <div className="act-time">{a.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Gráfica cumplimiento mensual */}
          <div className="card">
            <div className="card-hd">
              <div className="card-hd-l">
                <div className="card-ico ico-ok"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg></div>
                <div><div className="card-title">Cumplimiento Mensual SGC</div><div className="card-sub">Últimos 6 meses — 2025/2026</div></div>
              </div>
            </div>
            <div style={{ padding: '1.2rem 1.4rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 100, marginBottom: '.7rem' }}>
                {monthBars.map((b, i) => (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{
                      width: '100%', borderRadius: '4px 4px 0 0', height: b.h,
                      background: b.isCurrent ? 'linear-gradient(to top,var(--red),var(--ok))' : b.color,
                      opacity: b.opacity || 1,
                      boxShadow: b.isCurrent ? '0 0 8px rgba(27,107,58,.3)' : 'none',
                    }} title={`${b.h}%`} />
                    <div style={{ fontSize: '.65rem', color: b.isCurrent ? 'var(--ink)' : 'var(--ash)', fontWeight: b.isCurrent ? 700 : 600 }}>{b.month}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '.73rem', color: 'var(--ash)' }}>Tendencia: <span style={{ color: 'var(--ok)', fontWeight: 700 }}>↑ +8% vs Oct 2025</span></div>
                <div style={{ fontSize: '.73rem', fontWeight: 700, color: 'var(--ok)' }}>96% actual</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="col-r">
          {/* Alertas */}
          <div className="card">
            <div className="card-hd">
              <div className="card-hd-l">
                <div className="card-ico ico-red"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg></div>
                <div><div className="card-title">Alertas Activas</div></div>
              </div>
              <span style={{ fontSize: '.68rem', background: 'var(--err-bg)', color: 'var(--err)', fontWeight: 700, padding: '3px 8px', borderRadius: 4 }}>2</span>
            </div>
            <div className="al-list">
              <div className="al al-err">
                <div className="al-ico"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" width="15"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg></div>
                <div><div className="al-ttl">PR-COM-003 vencido</div><div className="al-sub">Actualización urgente requerida</div></div>
              </div>
              <div className="al al-warn">
                <div className="al-ico"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" width="15"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div>
                <div><div className="al-ttl">Auditoría Interna — 15 Mar</div><div className="al-sub">Preparar evidencias documentales</div></div>
              </div>
            </div>
          </div>

          {/* Accesos rápidos */}
          <div className="card">
            <div className="card-hd">
              <div className="card-hd-l">
                <div className="card-ico ico-ink"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg></div>
                <div><div className="card-title">Accesos Rápidos</div></div>
              </div>
            </div>
            <div className="qg">
              <button className="qbtn qbtn-r" onClick={() => setModal('upload')}>
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                Subir Doc.
              </button>
              <button className="qbtn" onClick={() => navigate('/admin/documentos-iso')}>
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--gold-d)' }}><path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
                Documentos
              </button>
              <button className="qbtn" onClick={() => navigate('/admin/auditorias')}>
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--gold-d)' }}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
                Auditorías
              </button>
              <button className="qbtn" onClick={() => navigate('/admin/reportes')}>
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--gold-d)' }}><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                Reporte
              </button>
            </div>
          </div>

          {/* Próximos vencimientos */}
          <div className="card">
            <div className="card-hd">
              <div className="card-hd-l">
                <div className="card-ico ico-gold">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                </div>
                <div><div className="card-title">Próximos Vencimientos</div><div className="card-sub">Siguientes 60 días</div></div>
              </div>
            </div>
            <div style={{ padding: '.5rem' }}>
              {vencimientos.map((v, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '9px 8px', borderRadius: 6, cursor: 'pointer', transition: 'background .15s' }}
                  onMouseOver={e => e.currentTarget.style.background = 'var(--surface)'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ width: 36, textAlign: 'center', flexShrink: 0 }}>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1rem', fontWeight: 900, color: v.numColor, lineHeight: 1 }}>{v.day}</div>
                    <div style={{ fontSize: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--ash)' }}>{v.mon}</div>
                  </div>
                  <div style={{ width: 1, height: 30, background: 'var(--border)', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '.8rem', fontWeight: 600, color: 'var(--ink)' }}>{v.title}</div>
                    <div style={{ fontSize: '.68rem', color: 'var(--ash)' }}>{v.sub}</div>
                  </div>
                  <span className={`badge ${v.badgeCls}`}>{v.badge}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {modal === 'upload' && (
        <Modal title="Subir Documento" onClose={() => setModal(null)}>
          <div className="modal-body">
            <div className="form-grid">
              <div className="form-group full">
                <label className="lbl">Nombre del Documento *</label>
                <input className="finput" placeholder="Nombre completo" 
                  value={uploadForm.name} onChange={e => setUploadForm({...uploadForm, name: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="lbl">Código *</label>
                <input className="finput" placeholder="PR-XXX-000" 
                  value={uploadForm.code} onChange={e => setUploadForm({...uploadForm, code: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="lbl">Versión</label>
                <input className="finput" placeholder="v.01" 
                  value={uploadForm.version} onChange={e => setUploadForm({...uploadForm, version: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="lbl">Tipo</label>
                <select className="fselect" value={uploadForm.type} onChange={e => setUploadForm({...uploadForm, type: e.target.value})}>
                  <option>Procedimiento</option><option>Manual</option><option>Formato</option><option>Instructivo</option>
                </select>
              </div>
              <div className="form-group">
                <label className="lbl">Responsable</label>
                <input className="finput" placeholder="Nombre del responsable" 
                  value={uploadForm.responsible} onChange={e => setUploadForm({...uploadForm, responsible: e.target.value})} />
              </div>
              <div className="form-group full">
                <label className="lbl">Archivo *</label>
                <input className="finput" type="file" accept=".pdf,.docx,.xlsx" 
                  onChange={e => setUploadForm({...uploadForm, file: e.target.files[0]})} />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-out" onClick={() => setModal(null)}>Cancelar</button>
            <button className="btn btn-red" onClick={handleUpload} disabled={isUploading}>
              {isUploading ? 'Subiendo...' : 'Subir Documento'}
            </button>
          </div>
        </Modal>
      )}
    </main>
  )
}
