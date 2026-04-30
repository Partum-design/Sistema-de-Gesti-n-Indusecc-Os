import { useEffect, useState } from 'react'
import { toast } from '../../components/Toast'
import {
  approveAdminTraining,
  createAdminTraining,
  getAdminTrainings,
  getCertificateSettings,
  getUsers,
  updateAdminTraining,
  updateCertificateSettings,
} from '../../api/api'

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'))
    reader.readAsDataURL(file)
  })

export default function CapacitacionesAdmin() {
  const [trainings, setTrainings] = useState([])
  const [users, setUsers] = useState([])
  const [stats, setStats] = useState({ total: 0, completed: 0, inProgress: 0, pending: 0, pendingApproval: 0 })
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    title: '',
    module: '',
    description: '',
    assignedTo: '',
    scheduledDate: '',
  })
  const [certSettings, setCertSettings] = useState({
    prefix: 'CERT',
    startSequence: 1,
    validityDays: 365,
    issuerName: 'Administrador INDUSECC',
    issuerRole: 'Administrador',
    signatureImageUrl: '',
    sealImageUrl: '',
  })

  const loadData = async (status = '') => {
    setLoading(true)
    try {
      const [trainingsRes, usersRes, settingsRes] = await Promise.all([
        getAdminTrainings(status ? { status } : {}),
        getUsers(),
        getCertificateSettings(),
      ])

      const trainingsData = trainingsRes.data?.data?.trainings || []
      const usersData = usersRes.data?.data?.users || usersRes.data?.data || []
      setTrainings(trainingsData)
      setStats(trainingsRes.data?.data?.stats || { total: 0, completed: 0, inProgress: 0, pending: 0, pendingApproval: 0 })
      setUsers(usersData.filter((user) => ['COLABORADOR', 'CONSULTOR'].includes(user.role)))
      if (settingsRes.data?.data) setCertSettings(settingsRes.data.data)
    } catch (error) {
      console.error(error)
      toast('Error al cargar capacitaciones', 'err')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData(statusFilter)
  }, [statusFilter])

  const handleCreate = async () => {
    if (!form.title || !form.module || !form.assignedTo) {
      return toast('Completa titulo, modulo y usuario', 'warn')
    }
    try {
      await createAdminTraining(form)
      toast('Capacitacion asignada correctamente', 'ok')
      setForm({ title: '', module: '', description: '', assignedTo: '', scheduledDate: '' })
      loadData(statusFilter)
    } catch (error) {
      toast(error?.response?.data?.message || 'Error al crear capacitacion', 'err')
    }
  }

  const handleAdvance = async (training) => {
    try {
      const nextProgress = Math.min((training.progress || 0) + 20, 100)
      const nextStatus = nextProgress >= 100 ? 'Pendiente de aprobacion' : 'En proceso'
      await updateAdminTraining(training._id, { progress: nextProgress, status: nextStatus })
      toast('Progreso actualizado', 'ok')
      loadData(statusFilter)
    } catch {
      toast('No se pudo actualizar', 'err')
    }
  }

  const handleApprove = async (training) => {
    try {
      await approveAdminTraining(training._id, {})
      toast('Capacitacion aprobada y certificado emitido', 'ok')
      loadData(statusFilter)
    } catch (error) {
      toast(error?.response?.data?.message || 'No se pudo aprobar', 'err')
    }
  }

  const handleSaveSettings = async () => {
    try {
      await updateCertificateSettings(certSettings)
      toast('Configuracion de certificados guardada', 'ok')
      loadData(statusFilter)
    } catch (error) {
      toast(error?.response?.data?.message || 'No se pudo guardar configuracion', 'err')
    }
  }

  const handleAssetUpload = async (event, field) => {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const dataUrl = await readFileAsDataUrl(file)
      setCertSettings((prev) => ({ ...prev, [field]: dataUrl }))
      toast(`${field === 'signatureImageUrl' ? 'Firma' : 'Sello'} cargado correctamente`, 'ok')
    } catch {
      toast('No se pudo cargar el archivo', 'err')
    }
  }

  return (
    <main className="page">
      <div className="ph">
        <div>
          <div className="ph-title">Capacitaciones <em>Admin</em></div>
          <div className="ph-sub">Admin aprueba y el sistema emite certificados con folio, fecha, firma y sello</div>
        </div>
      </div>

      <div className="sg">
        <div className="sc sc-gold"><div className="sc-num">{stats.total}</div><div className="sc-lbl">Total</div></div>
        <div className="sc sc-ok"><div className="sc-num">{stats.completed}</div><div className="sc-lbl">Completadas</div></div>
        <div className="sc sc-blue"><div className="sc-num">{stats.inProgress}</div><div className="sc-lbl">En Proceso</div></div>
        <div className="sc sc-warn"><div className="sc-num">{stats.pending}</div><div className="sc-lbl">Pendientes</div></div>
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="card-hd"><div className="card-title">Configuracion de certificados</div></div>
        <div style={{ padding: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '.75rem' }}>
          <input className="finput" placeholder="Prefijo" value={certSettings.prefix || ''} onChange={(e) => setCertSettings({ ...certSettings, prefix: e.target.value })} />
          <input className="finput" type="number" placeholder="Folio inicial" value={certSettings.startSequence || 1} onChange={(e) => setCertSettings({ ...certSettings, startSequence: Number(e.target.value || 1) })} />
          <input className="finput" type="number" placeholder="Vigencia dias" value={certSettings.validityDays || 365} onChange={(e) => setCertSettings({ ...certSettings, validityDays: Number(e.target.value || 365) })} />
          <input className="finput" placeholder="Nombre firmante" value={certSettings.issuerName || ''} onChange={(e) => setCertSettings({ ...certSettings, issuerName: e.target.value })} />
          <input className="finput" placeholder="Cargo firmante" value={certSettings.issuerRole || ''} onChange={(e) => setCertSettings({ ...certSettings, issuerRole: e.target.value })} />
          <input className="finput" placeholder="URL firma o data:image" value={certSettings.signatureImageUrl || ''} onChange={(e) => setCertSettings({ ...certSettings, signatureImageUrl: e.target.value })} />
          <input className="finput" placeholder="URL sello o data:image" value={certSettings.sealImageUrl || ''} onChange={(e) => setCertSettings({ ...certSettings, sealImageUrl: e.target.value })} />
          <input className="finput" type="file" accept="image/*" onChange={(event) => handleAssetUpload(event, 'signatureImageUrl')} />
          <input className="finput" type="file" accept="image/*" onChange={(event) => handleAssetUpload(event, 'sealImageUrl')} />
          <button className="btn btn-red" onClick={handleSaveSettings}>Guardar config</button>
        </div>
        <div style={{ padding: '0 1rem 1rem 1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '.75rem' }}>
          <div style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '.75rem' }}>
            <div style={{ fontSize: '.8rem', fontWeight: 700, marginBottom: '.5rem' }}>Vista previa firma</div>
            {certSettings.signatureImageUrl ? (
              <img src={certSettings.signatureImageUrl} alt="Firma" style={{ width: '100%', maxHeight: 90, objectFit: 'contain' }} />
            ) : (
              <div style={{ fontSize: '.75rem', color: 'var(--ash)' }}>Sin firma cargada</div>
            )}
          </div>
          <div style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '.75rem' }}>
            <div style={{ fontSize: '.8rem', fontWeight: 700, marginBottom: '.5rem' }}>Vista previa sello</div>
            {certSettings.sealImageUrl ? (
              <img src={certSettings.sealImageUrl} alt="Sello" style={{ width: '100%', maxHeight: 110, objectFit: 'contain' }} />
            ) : (
              <div style={{ fontSize: '.75rem', color: 'var(--ash)' }}>Sin sello cargado</div>
            )}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="card-hd"><div className="card-title">Asignar nueva capacitacion</div></div>
        <div style={{ padding: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '.75rem' }}>
          <input className="finput" placeholder="Titulo" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <input className="finput" placeholder="Modulo" value={form.module} onChange={(e) => setForm({ ...form, module: e.target.value })} />
          <select className="fselect" value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}>
            <option value="">Seleccionar usuario</option>
            {users.map((user) => <option key={user._id} value={user._id}>{user.name} ({user.role})</option>)}
          </select>
          <input className="finput" type="date" value={form.scheduledDate} onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })} />
          <input className="finput" placeholder="Descripcion" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <button className="btn btn-red" onClick={handleCreate}>Asignar</button>
        </div>
      </div>

      <div className="card">
        <div className="card-hd" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="card-title">Listado de capacitaciones</div>
          <select className="fselect" style={{ maxWidth: 220 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">Todos los estados</option>
            <option value="Pendiente">Pendiente</option>
            <option value="En proceso">En proceso</option>
            <option value="Pendiente de aprobacion">Pendiente de aprobacion</option>
            <option value="Completado">Completado</option>
          </select>
        </div>

        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Titulo</th><th>Usuario</th><th>Estado</th><th>Progreso</th><th>Fecha</th><th></th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '1rem' }}>Cargando...</td></tr>
              ) : trainings.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '1rem' }}>Sin registros</td></tr>
              ) : trainings.map((training) => (
                <tr key={training._id}>
                  <td>{training.title}<div style={{ fontSize: '.72rem', color: 'var(--ash)' }}>{training.module}</div></td>
                  <td>{training.assignedTo?.name || 'N/A'}<div style={{ fontSize: '.72rem', color: 'var(--ash)' }}>{training.assignedTo?.email}</div></td>
                  <td><span className={`badge ${training.status === 'Completado' ? 'b-ok' : training.status === 'En proceso' ? 'b-blue' : training.status === 'Pendiente de aprobacion' ? 'b-err' : 'b-warn'}`}>{training.status}</span></td>
                  <td>{training.progress || 0}%</td>
                  <td>{training.scheduledDate ? new Date(training.scheduledDate).toLocaleDateString('es-MX') : 'Sin fecha'}</td>
                  <td>
                    {training.status === 'Pendiente de aprobacion' ? (
                      <button className="btn btn-sm btn-red" onClick={() => handleApprove(training)}>Aprobar y emitir</button>
                    ) : training.status !== 'Completado' ? (
                      <button className="btn btn-sm btn-blue" onClick={() => handleAdvance(training)}>Avanzar</button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}
