import { useState, useEffect } from 'react'
import Papa from 'papaparse'
import { getDocuments, uploadDocument, downloadDocument as downloadDocumentRequest } from '../../api/api'

function Modal({ title, children, onClose }) {
  return (
    <div className="modal-bg open" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-hd">
          <span className="modal-ttl">{title}</span>
          <button className="modal-close" onClick={onClose}><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        {children}
      </div>
    </div>
  )
}

const CLAUSULAS = [
  {
    punto: '4', titulo: 'Contexto de la Organización', subs: [
      { id: '4.1', num: '4.1', titulo: 'Contexto de la Organización', desc: 'Cuestiones externas e internas pertinentes para el propósito del SGC' },
      { id: '4.2', num: '4.2', titulo: 'Partes Interesadas', desc: 'Identificar partes interesadas pertinentes y sus requisitos' },
      { id: '4.3', num: '4.3', titulo: 'Alcance del SGC', desc: 'Límites y aplicabilidad del sistema de gestión de la calidad' },
      { id: '4.4', num: '4.4', titulo: 'SGC y sus Procesos', desc: 'Establecer, implementar, mantener y mejorar el SGC' },
    ]
  },
  {
    punto: '5', titulo: 'Liderazgo', subs: [
      { id: '5.1', num: '5.1', titulo: 'Liderazgo y Compromiso', desc: 'Compromiso de la alta dirección con el SGC y el enfoque al cliente' },
      { id: '5.2', num: '5.2', titulo: 'Política de Calidad', desc: 'Establecer, implementar y mantener la política de calidad' },
      { id: '5.3', num: '5.3', titulo: 'Roles, Responsabilidades y Autoridades', desc: 'Asignar responsabilidades y autoridades dentro del SGC' },
    ]
  },
  {
    punto: '6', titulo: 'Planificación', subs: [
      { id: '6.1', num: '6.1', titulo: 'Acciones para Riesgos y Oportunidades', desc: 'Determinar riesgos y oportunidades que deben abordarse' },
      { id: '6.2', num: '6.2', titulo: 'Objetivos de Calidad', desc: 'Establecer objetivos de calidad y planificación para lograrlos' },
      { id: '6.3', num: '6.3', titulo: 'Planificación de los Cambios', desc: 'Planificar los cambios al SGC de manera controlada' },
    ]
  },
  {
    punto: '7', titulo: 'Apoyo', subs: [
      { id: '7.1', num: '7.1', titulo: 'Recursos', desc: 'Determinar y proporcionar los recursos necesarios para el SGC' },
      { id: '7.2', num: '7.2', titulo: 'Competencia', desc: 'Determinar y asegurar la competencia necesaria del personal' },
      { id: '7.3', num: '7.3', titulo: 'Toma de Conciencia', desc: 'Asegurar que las personas sean conscientes de la política y objetivos' },
      { id: '7.4', num: '7.4', titulo: 'Comunicación', desc: 'Determinar las comunicaciones internas y externas pertinentes' },
      { id: '7.5', num: '7.5', titulo: 'Información Documentada', desc: 'Controlar la información documentada requerida por la norma' },
    ]
  },
  {
    punto: '8', titulo: 'Operación', subs: [
      { id: '8.1', num: '8.1', titulo: 'Planificación y Control Operacional', desc: 'Planificar, implementar, controlar y revisar los procesos operativos' },
      { id: '8.2', num: '8.2', titulo: 'Requisitos para Productos y Servicios', desc: 'Comunicación con el cliente y determinación de requisitos' },
      { id: '8.3', num: '8.3', titulo: 'Diseño y Desarrollo', desc: 'Proceso de diseño y desarrollo de productos y servicios' },
      { id: '8.4', num: '8.4', titulo: 'Control de Procesos Externos', desc: 'Controlar los productos y servicios suministrados externamente' },
      { id: '8.5', num: '8.5', titulo: 'Producción y Provisión del Servicio', desc: 'Implementar la producción bajo condiciones controladas' },
      { id: '8.6', num: '8.6', titulo: 'Liberación de Productos y Servicios', desc: 'Verificación de cumplimiento de requisitos antes de entrega' },
      { id: '8.7', num: '8.7', titulo: 'Control de Salidas No Conformes', desc: 'Identificar y controlar las salidas no conformes' },
    ]
  },
  {
    punto: '9', titulo: 'Evaluación del Desempeño', subs: [
      { id: '9.1', num: '9.1', titulo: 'Seguimiento, Medición, Análisis y Evaluación', desc: 'Determinar qué, cómo y cuándo se realiza el seguimiento' },
      { id: '9.2', num: '9.2', titulo: 'Auditoría Interna', desc: 'Realizar auditorías internas a intervalos planificados' },
      { id: '9.3', num: '9.3', titulo: 'Revisión por la Dirección', desc: 'Revisar el SGC para asegurar su idoneidad y eficacia' },
    ]
  },
  {
    punto: '10', titulo: 'Mejora', subs: [
      { id: '10.1', num: '10.1', titulo: 'Generalidades', desc: 'Determinar y seleccionar oportunidades de mejora' },
      { id: '10.2', num: '10.2', titulo: 'No Conformidad y Acción Correctiva', desc: 'Reaccionar ante no conformidades y tomar acciones correctivas' },
      { id: '10.3', num: '10.3', titulo: 'Mejora Continua', desc: 'Mejorar continuamente la conveniencia, adecuación y eficacia del SGC' },
    ]
  },
]

const DOCS_INICIALES = [
  { id: 1, code: 'PR-CAL-001', name: 'Control de Información Documentada', tipo: 'Procedimiento', tipoCls: 'b-blue', version: 'v.04', status: 'Vigente', statusCls: 'b-ok', vigencia: '26 Feb 2027', resp: 'A. García', clausula: '7.5', archivo: null },
  { id: 2, code: 'MA-SGC-001', name: 'Manual del Sistema de Gestión de Calidad', tipo: 'Manual', tipoCls: 'b-gray', version: 'v.02', status: 'En Revisión', statusCls: 'b-warn', vigencia: '—', resp: 'M. López', clausula: '4.1', archivo: null },
  { id: 3, code: 'FO-RH-015', name: 'Matriz de Identificación de Riesgos', tipo: 'Formato', tipoCls: 'b-gray', version: 'v.05', status: 'Vigente', statusCls: 'b-ok', vigencia: '20 Feb 2027', resp: 'A. García', clausula: '6.1', archivo: null },
  { id: 4, code: 'PR-COM-003', name: 'Procedimiento de Compras', tipo: 'Procedimiento', tipoCls: 'b-blue', version: 'v.03', status: 'Vencido', statusCls: 'b-err', vigencia: '15 Ene 2026', resp: 'R. Torres', clausula: '8.4', archivo: null },
  { id: 5, code: 'IT-PRD-008', name: 'Instructivo de Control de Producción', tipo: 'Instructivo', tipoCls: 'b-gray', version: 'v.01', status: 'Vigente', statusCls: 'b-ok', vigencia: '10 Jun 2026', resp: 'L. Martínez', clausula: '8.5', archivo: null },
  { id: 6, code: 'FO-CAL-012', name: 'Formato de Inspección de Calidad', tipo: 'Formato', tipoCls: 'b-gray', version: 'v.03', status: 'Vigente', statusCls: 'b-ok', vigencia: '15 May 2027', resp: 'C. Pérez', clausula: '8.6', archivo: null },
  { id: 7, code: 'PR-PRD-005', name: 'Procedimiento de Control de Producción', tipo: 'Procedimiento', tipoCls: 'b-blue', version: 'v.02', status: 'En Revisión', statusCls: 'b-warn', vigencia: '—', resp: 'J. Martínez', clausula: '8.1', archivo: null },
  { id: 8, code: 'PO-CAL-001', name: 'Política de Calidad', tipo: 'Política', tipoCls: 'b-blue', version: 'v.03', status: 'Vigente', statusCls: 'b-ok', vigencia: '01 Ene 2027', resp: 'A. García', clausula: '5.2', archivo: null },
  { id: 9, code: 'FO-OBJ-001', name: 'Matriz de Objetivos de Calidad', tipo: 'Formato', tipoCls: 'b-gray', version: 'v.02', status: 'Vigente', statusCls: 'b-ok', vigencia: '31 Dic 2026', resp: 'M. López', clausula: '6.2', archivo: null },
  { id: 10, code: 'PR-AUD-001', name: 'Procedimiento de Auditoría Interna', tipo: 'Procedimiento', tipoCls: 'b-blue', version: 'v.02', status: 'Vigente', statusCls: 'b-ok', vigencia: '15 Mar 2027', resp: 'L. García', clausula: '9.2', archivo: null },
  { id: 11, code: 'FO-NC-001', name: 'Registro de No Conformidades', tipo: 'Formato', tipoCls: 'b-gray', version: 'v.04', status: 'Vigente', statusCls: 'b-ok', vigencia: '30 Jun 2027', resp: 'C. Pérez', clausula: '10.2', archivo: null },
  { id: 12, code: 'MA-CTX-001', name: 'Análisis de Contexto Organizacional', tipo: 'Manual', tipoCls: 'b-gray', version: 'v.01', status: 'Vigente', statusCls: 'b-ok', vigencia: '01 Dic 2026', resp: 'A. García', clausula: '4.1', archivo: null },
]

const EyeIcon = () => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
const EditIcon = () => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
const DownloadIcon = () => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
const UploadIcon = () => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
const RefreshIcon = () => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
const TrashIcon = () => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
const ChevronIcon = ({ open }) => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16, transition: 'transform .2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>

const FORM_EMPTY = { code: '', name: '', tipo: 'Procedimiento', version: 'v.01', resp: '', vigencia: '', clausula: '', archivo: null }

export default function DocumentosISO() {
  const [docs, setDocs] = useState([])
  const [_loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [selectedDoc, setSelectedDoc] = useState(null)
  const [activeFilter, setActiveFilter] = useState('Todos')
  const [search, setSearch] = useState('')
  const [expandedPuntos, setExpandedPuntos] = useState({ '4': true })
  const [viewMode, setViewMode] = useState('clausulas')
  const [toastMsg, setToastMsg] = useState(null)
  const [form, setForm] = useState(FORM_EMPTY)

  useEffect(() => {
    async function loadDocs() {
      try {
        const res = await getDocuments()
        const dataDocs = res.data?.data?.documents || res.data?.data || []
        setDocs(dataDocs.map(d => ({
          ...d,
          id: d._id,
          code: d.code || 'DOC-001',
          name: d.title || d.name,
          tipo: d.type || 'Procedimiento',
          tipoCls: d.type === 'Procedimiento' ? 'b-blue' : 'b-gray',
          version: d.version || 'v.01',
          status: d.status || 'Vigente',
          statusCls: d.status === 'Vencido' ? 'b-err' : d.status === 'En Revisión' ? 'b-warn' : 'b-ok',
          vigencia: d.expiryDate ? new Date(d.expiryDate).toLocaleDateString('es-MX') : '—',
          resp: d.responsible || '—',
          clausula: d.clause || d.clausula || '4.1',
          archivo: d.originalName || d.filename || null
        })))
      } catch (err) {
        console.error('Error loadDocs:', err)
      } finally {
        setLoading(false)
      }
    }
    loadDocs()
  }, [])

  function showToast(msg, type = 'ok') {
    setToastMsg({ msg, type })
    setTimeout(() => setToastMsg(null), 2800)
  }

  function togglePunto(p) {
    setExpandedPuntos(prev => ({ ...prev, [p]: !prev[p] }))
  }

  function abrirSubir(clausulaId) {
    setForm({ ...FORM_EMPTY, clausula: clausulaId })
    setModal('form')
  }

  function abrirNuevo() {
    setForm(FORM_EMPTY)
    setModal('form')
  }

  async function guardar() {
    if (!form.code.trim() || !form.name.trim() || !form.clausula) {
      showToast('Completa los campos obligatorios (*)', 'err')
      return
    }
    try {
      setLoading(true)
      const formData = new FormData()
      formData.append('title', form.name.trim())
      formData.append('filename', form.name.trim())
      formData.append('code', form.code.trim())
      formData.append('type', form.tipo)
      formData.append('clausula', form.clausula)
      formData.append('responsible', form.resp)
      formData.append('vigencia', form.vigencia)
      if (form.archivo) {
        formData.append('file', form.archivo)
        formData.append('originalName', form.archivo.name)
        formData.append('size', form.archivo.size)
        formData.append('mimetype', form.archivo.type)
      }

      await uploadDocument(formData)
      showToast(`Documento ${form.code} guardado correctamente`)
      setModal(null)
      // Recargar para ver los cambios
      const res = await getDocuments()
      const dataDocs = res.data?.data?.documents || res.data?.data || []
      setDocs(dataDocs.map(d => ({
        ...d,
        id: d._id,
        code: d.code || 'DOC-001',
        name: d.title || d.name,
        tipo: d.type || 'Procedimiento',
        tipoCls: d.type === 'Procedimiento' ? 'b-blue' : 'b-gray',
        version: d.version || 'v.01',
        status: d.status || 'Vigente',
        statusCls: d.status === 'Vencido' ? 'b-err' : d.status === 'En Revisión' ? 'b-warn' : 'b-ok',
        vigencia: d.expiryDate ? new Date(d.expiryDate).toLocaleDateString('es-MX') : '—',
        resp: d.responsible || '—',
        clausula: d.clause || d.clausula || '4.1',
        archivo: d.originalName || d.filename || null
      })))
    } catch (err) {
      console.error('Error saving doc:', err)
      showToast('Error al guardar documento', 'err')
    } finally {
      setLoading(false)
    }
  }

  function eliminar(id) {
    setDocs(prev => prev.filter(d => d.id !== id))
    showToast('Documento eliminado', 'warn')
  }

  function editDocument(doc) {
    setSelectedDoc(doc)
    setForm({ ...doc, archivo: null })
    setModal('form')
  }

  async function downloadDocument(doc) {
    if (!doc.id) {
      showToast('No hay archivo adjunto disponible para descargar', 'warn')
      return
    }
    try {
      const response = await downloadDocumentRequest(doc.id)
      const blob = new Blob([response.data], { type: response.headers['content-type'] })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = doc.archivo || doc.name
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
      showToast(`Descargando ${doc.name}`, 'ok')
    } catch (error) {
      console.error('Error downloading doc:', error)
      showToast('Error al descargar documento', 'err')
    }
  }

  function renovarDocumento(doc) {
    showToast(`Solicitud de renovación enviada para ${doc.name}`, 'ok')
  }

  const vigentes = docs.filter(d => d.status === 'Vigente').length
  const enRevision = docs.filter(d => d.status === 'En Revisión').length
  const vencidos = docs.filter(d => d.status === 'Vencido').length

  const filters = ['Todos', 'Procedimientos', 'Manuales', 'Formatos', 'Instructivos']
  const filtered = docs.filter(d => {
    const mf = activeFilter === 'Todos' || d.tipo.startsWith(activeFilter.slice(0, -1))
    const ms = !search || d.name.toLowerCase().includes(search.toLowerCase()) || d.code.toLowerCase().includes(search.toLowerCase())
    return mf && ms
  })

  function docsDe(cid) { return docs.filter(d => d.clausula === cid) }

  function puntoCumple(punto) {
    const subs = CLAUSULAS.find(c => c.punto === punto)?.subs || []
    return subs.every(s => docsDe(s.id).length > 0)
  }

  function exportToCSV() {
    const csv = Papa.unparse(docs.map(d => ({
      Código: d.code,
      Nombre: d.name,
      Tipo: d.tipo,
      Versión: d.version,
      Estado: d.status,
      Cláusula: d.clausula,
      Vigencia: d.vigencia,
      Responsable: d.resp,
    })))
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `Documentos_ISO_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    showToast('Documentos exportados en CSV', 'ok')
  }

  return (
    <main className="page">
      {toastMsg && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'var(--ink)', color: '#fff', borderRadius: 8, fontSize: '.82rem', fontWeight: 500, boxShadow: '0 8px 24px rgba(0,0,0,.2)', borderLeft: `3px solid ${toastMsg.type === 'ok' ? 'var(--ok)' : toastMsg.type === 'err' ? 'var(--err)' : 'var(--warn)'}`, animation: 'fadeUp .3s ease' }}>
          <span>
            {toastMsg.type === 'ok' ? <svg fill="none" viewBox="0 0 24 24" stroke="var(--ok)" strokeWidth="3" width="16"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> :
              toastMsg.type === 'err' ? <svg fill="none" viewBox="0 0 24 24" stroke="var(--err)" strokeWidth="3" width="16"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg> :
                <svg fill="none" viewBox="0 0 24 24" stroke="var(--warn)" strokeWidth="3" width="16"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
          </span>
          <span>{toastMsg.msg}</span>
        </div>
      )}

      <div className="ph">
        <div>
          <h1 className="ph-title">Documentos <em>ISO 9001</em></h1>
          <p className="ph-sub">ISO 9001:2015 — Gestión documental por cláusula · {docs.length} documentos</p>
        </div>
        <div className="ph-actions">
          <button className="btn btn-out" onClick={() => setViewMode(v => v === 'clausulas' ? 'tabla' : 'clausulas')}>
            {viewMode === 'clausulas'
              ? <><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18M3 6h18M3 18h18" /></svg>Vista Tabla</>
              : <><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>Vista Cláusulas</>
            }
          </button>
          <button className="btn btn-out" onClick={exportToCSV}><DownloadIcon /> Exportar</button>
          <button className="btn btn-red" onClick={abrirNuevo}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            Nuevo Documento
          </button>
        </div>
      </div>

      <div className="sg">
        {[
          { cls: 'sc-gold', num: docs.length, lbl: 'Total Documentos', bar: 100 },
          { cls: 'sc-ok', num: vigentes, lbl: 'Vigentes', bar: Math.round(vigentes / docs.length * 100) || 0 },
          { cls: 'sc-warn', num: enRevision, lbl: 'En Revisión', bar: Math.round(enRevision / docs.length * 100) || 0 },
          { cls: 'sc-red', num: vencidos, lbl: 'Vencidos', bar: Math.round(vencidos / docs.length * 100) || 0 },
        ].map((s, i) => (
          <div key={i} className={`sc ${s.cls}`}>
            <div className="sc-num">{s.num}</div>
            <div className="sc-lbl">{s.lbl}</div>
            <div className="sc-bar"><div className="sc-bar-f" style={{ width: `${s.bar}%` }} /></div>
          </div>
        ))}
      </div>

      {/* ── VISTA CLÁUSULAS ── */}
      {viewMode === 'clausulas' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {CLAUSULAS.map(punto => {
            const isOpen = !!expandedPuntos[punto.punto]
            const cumple = puntoCumple(punto.punto)
            const totalDocs = punto.subs.reduce((a, s) => a + docsDe(s.id).length, 0)
            return (
              <div key={punto.punto} className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '1rem 1.3rem', cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => togglePunto(punto.punto)}>
                  <div style={{ width: 44, height: 44, borderRadius: 8, background: cumple ? 'var(--ok-bg)' : 'var(--warn-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Playfair Display',serif", fontSize: '1.1rem', fontWeight: 900, color: cumple ? 'var(--ok)' : 'var(--warn)', flexShrink: 0 }}>
                    {punto.punto}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '.95rem' }}>Punto {punto.punto} — {punto.titulo}</div>
                    <div style={{ fontSize: '.73rem', color: 'var(--ash)', marginTop: 2 }}>{punto.subs.length} sub-cláusulas · {totalDocs} documento{totalDocs !== 1 ? 's' : ''}</div>
                  </div>
                  <span className={`badge ${cumple ? 'b-ok' : 'b-warn'}`}>{cumple ? 'Completo' : 'Pendiente'}</span>
                  <ChevronIcon open={isOpen} />
                </div>

                {isOpen && (
                  <div style={{ borderTop: '1px solid var(--border)' }}>
                    {punto.subs.map((sub, si) => {
                      const subDocs = docsDe(sub.id)
                      const tieneDocs = subDocs.length > 0
                      return (
                        <div key={sub.id} style={{ borderBottom: si < punto.subs.length - 1 ? '1px solid var(--border)' : 'none' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '.85rem 1.3rem .85rem 2.8rem', background: 'var(--surface)' }}>
                            <div style={{ width: 36, height: 36, borderRadius: 6, background: tieneDocs ? 'var(--ok-bg)' : 'rgba(239,236,232,.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Playfair Display',serif", fontSize: '.85rem', fontWeight: 900, color: tieneDocs ? 'var(--ok)' : 'var(--ash-l)', flexShrink: 0 }}>
                              {sub.num}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 600, fontSize: '.85rem' }}>{sub.titulo}</div>
                              <div style={{ fontSize: '.72rem', color: 'var(--ash)', marginTop: 1 }}>{sub.desc}</div>
                            </div>
                            <span style={{ fontSize: '.7rem', color: 'var(--ash)', flexShrink: 0 }}>{subDocs.length} doc{subDocs.length !== 1 ? 's' : ''}</span>
                            <button className="btn btn-red btn-sm" onClick={e => { e.stopPropagation(); abrirSubir(sub.id) }}>
                              <UploadIcon /> Subir
                            </button>
                          </div>

                          {tieneDocs && (
                            <div style={{ padding: '.5rem 1.3rem .6rem 2.8rem', display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
                              {subDocs.map(d => (
                                <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 11px', borderRadius: 6, border: '1px solid var(--border)', background: '#fff', transition: 'all .2s' }}
                                  onMouseOver={e => e.currentTarget.style.borderColor = 'rgba(201,168,76,.5)'}
                                  onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                                  <div className="dn-ico"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg></div>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 600, fontSize: '.83rem', color: 'var(--ink)' }}>{d.name}</div>
                                    <div style={{ fontSize: '.7rem', color: 'var(--ash)', marginTop: 1 }}>{d.code} · {d.version} · {d.resp}</div>
                                  </div>
                                  <span className={`badge ${d.statusCls}`}>{d.status}</span>
                                  {d.archivo && <span className="badge b-blue" style={{ fontSize: '.6rem', display: 'flex', alignItems: 'center', gap: 4 }}><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" width="10"><path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>{d.archivo}</span>}
                                  <div style={{ display: 'flex', gap: '.25rem', flexShrink: 0 }}>
                                    <button className="ibtn" title="Ver" onClick={() => { setSelectedDoc(d); setModal('ver') }}><EyeIcon /></button>
                                    <button className="ibtn" title="Editar" onClick={() => editDocument(d)}><EditIcon /></button>
                                    {d.status === 'Vencido'
                                      ? <button className="ibtn ibtn-red" title="Renovar" onClick={() => renovarDocumento(d)}><RefreshIcon /></button>
                                      : <button className="ibtn" title="Descargar" onClick={() => downloadDocument(d)}><DownloadIcon /></button>
                                    }
                                    <button className="ibtn" title="Eliminar"
                                      style={{ color: 'var(--err)' }}
                                      onMouseOver={e => e.currentTarget.style.background = 'var(--err-bg)'}
                                      onMouseOut={e => e.currentTarget.style.background = ''}
                                      onClick={() => eliminar(d.id)}><TrashIcon /></button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {!tieneDocs && (
                            <div style={{ padding: '.65rem 1.3rem .65rem 2.8rem' }}>
                              <span style={{ fontSize: '.78rem', color: 'var(--ash-l)', fontStyle: 'italic' }}>
                                Sin documentos — haz clic en "Subir" para añadir el primer archivo a esta cláusula
                              </span>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── VISTA TABLA ── */}
      {viewMode === 'tabla' && (
        <div className="card">
          <div className="filters">
            {filters.map(f => (
              <button key={f} className={`filter-tab${activeFilter === f ? ' active' : ''}`} onClick={() => setActiveFilter(f)}>{f}</button>
            ))}
            <div className="filters-r">
              <div className="fsearch">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" /></svg>
                <input placeholder="Buscar documento…" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>
          </div>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr><th>Código</th><th>Nombre del Documento</th><th>Cláusula</th><th>Tipo</th><th>Versión</th><th>Estado</th><th>Vigencia</th><th>Responsable</th><th>Archivo</th><th></th></tr>
              </thead>
              <tbody>
                {filtered.map(d => (
                  <tr key={d.id}>
                    <td style={{ fontWeight: 700, color: 'var(--red)', fontSize: '.78rem' }}>{d.code}</td>
                    <td><div style={{ fontWeight: 600, fontSize: '.845rem' }}>{d.name}</div></td>
                    <td><span className="badge b-gray" style={{ fontSize: '.6rem' }}>{d.clausula}</span></td>
                    <td><span className={`badge ${d.tipoCls}`}>{d.tipo}</span></td>
                    <td style={{ color: 'var(--ash)', fontWeight: 600, fontSize: '.8rem' }}>{d.version}</td>
                    <td><span className={`badge ${d.statusCls}`}>{d.status}</span></td>
                    <td style={{ fontSize: '.78rem', color: d.status === 'Vencido' ? 'var(--err)' : 'var(--ash)', fontWeight: d.status === 'Vencido' ? 600 : 400 }}>{d.vigencia}</td>
                    <td style={{ fontSize: '.78rem' }}>{d.resp}</td>
                    <td>{d.archivo ? <span className="badge b-blue" style={{ fontSize: '.6rem' }}><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" width="10"><path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg></span> : <span style={{ color: 'var(--ash-l)', fontSize: '.78rem' }}>—</span>}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '.3rem' }}>
                        <button className="ibtn" title="Ver" onClick={() => { setSelectedDoc(d); setModal('ver') }}><EyeIcon /></button>
                        {d.status === 'Vencido'
                          ? <button className="ibtn ibtn-red" title="Renovar" onClick={() => renovarDocumento(d)}><RefreshIcon /></button>
                          : <><button className="ibtn" title="Editar" onClick={() => editDocument(d)}><EditIcon /></button><button className="ibtn" title="Descargar" onClick={() => downloadDocument(d)}><DownloadIcon /></button></>
                        }
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '1rem 1.3rem', borderTop: '1px solid var(--border)' }}>
            <span style={{ fontSize: '.78rem', color: 'var(--ash)' }}>Mostrando {filtered.length} de {docs.length} documentos</span>
          </div>
        </div>
      )}

      {/* ── MODAL FORMULARIO ── */}
      {modal === 'form' && (
        <Modal title={form.clausula ? `Subir Documento — Cláusula ${form.clausula}` : 'Nuevo Documento'} onClose={() => setModal(null)}>
          <div className="modal-body">
            <div className="form-grid">
              <div className="form-group">
                <label className="lbl">Código <span style={{ color: 'var(--err)' }}>*</span></label>
                <input className="finput" placeholder="PR-XXX-000" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="lbl">Versión</label>
                <input className="finput" placeholder="v.01" value={form.version} onChange={e => setForm(f => ({ ...f, version: e.target.value }))} />
              </div>
              <div className="form-group full">
                <label className="lbl">Nombre del Documento <span style={{ color: 'var(--err)' }}>*</span></label>
                <input className="finput" placeholder="Nombre completo del documento" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="lbl">Tipo</label>
                <select className="fselect" value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
                  <option>Procedimiento</option><option>Manual</option><option>Formato</option><option>Instructivo</option><option>Política</option><option>Plan</option>
                </select>
              </div>
              <div className="form-group">
                <label className="lbl">Responsable</label>
                <select className="fselect" value={form.resp} onChange={e => setForm(f => ({ ...f, resp: e.target.value }))}>
                  <option value="">Seleccionar…</option>
                  <option>A. García</option><option>M. López</option><option>R. Torres</option><option>L. Martínez</option><option>C. Pérez</option>
                </select>
              </div>
              <div className="form-group">
                <label className="lbl">Fecha de Vigencia</label>
                <input className="finput" type="date" value={form.vigencia} onChange={e => setForm(f => ({ ...f, vigencia: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="lbl">Cláusula ISO <span style={{ color: 'var(--err)' }}>*</span></label>
                <select className="fselect" value={form.clausula} onChange={e => setForm(f => ({ ...f, clausula: e.target.value }))}>
                  <option value="">Seleccionar cláusula…</option>
                  {CLAUSULAS.flatMap(p => p.subs).map(s => <option key={s.id} value={s.id}>{s.id} — {s.titulo}</option>)}
                </select>
              </div>
              <div className="form-group full">
                <label className="lbl">Archivo del Documento</label>
                <input className="finput" type="file" accept=".pdf,.docx,.xlsx,.pptx"
                  onChange={e => setForm(f => ({ ...f, archivo: e.target.files[0] || null }))} />
                <span style={{ fontSize: '.72rem', color: 'var(--ash)', marginTop: 2 }}>PDF, Word, Excel, PowerPoint</span>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-out" onClick={() => setModal(null)}>Cancelar</button>
            <button className="btn btn-red" onClick={guardar}><UploadIcon /> Guardar Documento</button>
          </div>
        </Modal>
      )}

      {/* ── MODAL VER ── */}
      {modal === 'ver' && selectedDoc && (
        <Modal title="Detalle del Documento" onClose={() => setModal(null)}>
          <div className="modal-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="dn-ico" style={{ width: 48, height: 48, borderRadius: 8 }}><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>{selectedDoc.name}</div>
                  <div style={{ fontSize: '.75rem', color: 'var(--ash)', marginTop: 2 }}>{selectedDoc.code} · {selectedDoc.version}</div>
                </div>
                <span className={`badge ${selectedDoc.statusCls}`}>{selectedDoc.status}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.8rem' }}>
                {[['Tipo', selectedDoc.tipo], ['Cláusula ISO', selectedDoc.clausula], ['Responsable', selectedDoc.resp], ['Vigencia', selectedDoc.vigencia]].map(([k, v]) => (
                  <div key={k} style={{ background: 'var(--surface)', borderRadius: 6, padding: '.7rem .9rem' }}>
                    <div style={{ fontSize: '.68rem', color: 'var(--ash)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 3 }}>{k}</div>
                    <div style={{ fontSize: '.85rem', fontWeight: 600 }}>{v || '—'}</div>
                  </div>
                ))}
              </div>
              {selectedDoc.archivo
                ? <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '.8rem', background: 'var(--blue-bg)', borderRadius: 6, border: '1px solid rgba(29,78,216,.12)' }}>
                  <svg fill="none" viewBox="0 0 24 24" stroke="var(--blue)" strokeWidth="2" style={{ width: 20, height: 20, flexShrink: 0 }}><path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                  <span style={{ flex: 1, fontSize: '.83rem', fontWeight: 600, color: 'var(--blue)' }}>{selectedDoc.archivo}</span>
                  <button className="btn btn-out btn-sm" onClick={() => downloadDocument(selectedDoc)}><DownloadIcon /> Descargar</button>
                </div>
                : <div style={{ padding: '.8rem', background: 'var(--warn-bg)', borderRadius: 6, border: '1px solid rgba(180,83,9,.12)', fontSize: '.83rem', color: 'var(--warn)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" width="16"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  Sin archivo adjunto — sube el documento para completar esta cláusula
                </div>
              }
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-out" onClick={() => setModal(null)}>Cerrar</button>
            <button className="btn btn-red" onClick={() => { setForm({ ...selectedDoc, archivo: null }); setModal('form') }}><UploadIcon /> Actualizar Archivo</button>
          </div>
        </Modal>
      )}
    </main>
  )
}
