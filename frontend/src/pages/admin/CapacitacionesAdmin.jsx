import { useEffect, useState } from 'react'
import { toast } from '../../components/Toast'
import { createAdminTraining, getAdminTrainings, getUsers, updateAdminTraining } from '../../api/api'

export default function CapacitacionesAdmin() {
  const [trainings, setTrainings] = useState([])
  const [users, setUsers] = useState([])
  const [stats, setStats] = useState({ total: 0, completed: 0, inProgress: 0, pending: 0 })
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    title: '',
    module: '',
    description: '',
    assignedTo: '',
    scheduledDate: '',
  })

  const loadData = async (status = '') => {
    setLoading(true)
    try {
      const [trainingsRes, usersRes] = await Promise.all([
        getAdminTrainings(status ? { status } : {}),
        getUsers(),
      ])

      const trainingsData = trainingsRes.data?.data?.trainings || []
      const usersData = usersRes.data?.data?.users || usersRes.data?.data || []
      setTrainings(trainingsData)
      setStats(trainingsRes.data?.data?.stats || { total: 0, completed: 0, inProgress: 0, pending: 0 })
      setUsers(usersData.filter((user) => ['COLABORADOR', 'CONSULTOR'].includes(user.role)))
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
      const nextStatus = nextProgress >= 100 ? 'Completado' : 'En proceso'
      await updateAdminTraining(training._id, { progress: nextProgress, status: nextStatus })
      toast('Progreso actualizado', 'ok')
      loadData(statusFilter)
    } catch {
      toast('No se pudo actualizar', 'err')
    }
  }

  return (
    <main className="page">
      <div className="ph">
        <div>
          <div className="ph-title">Capacitaciones <em>Admin</em></div>
          <div className="ph-sub">Gestion de capacitaciones para colaboradores y consultores</div>
        </div>
      </div>

      <div className="sg">
        <div className="sc sc-gold"><div className="sc-num">{stats.total}</div><div className="sc-lbl">Total</div></div>
        <div className="sc sc-ok"><div className="sc-num">{stats.completed}</div><div className="sc-lbl">Completadas</div></div>
        <div className="sc sc-blue"><div className="sc-num">{stats.inProgress}</div><div className="sc-lbl">En Proceso</div></div>
        <div className="sc sc-warn"><div className="sc-num">{stats.pending}</div><div className="sc-lbl">Pendientes</div></div>
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
          <select className="fselect" style={{ maxWidth: 200 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">Todos los estados</option>
            <option value="Pendiente">Pendiente</option>
            <option value="En proceso">En proceso</option>
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
                  <td><span className={`badge ${training.status === 'Completado' ? 'b-ok' : training.status === 'En proceso' ? 'b-blue' : 'b-warn'}`}>{training.status}</span></td>
                  <td>{training.progress || 0}%</td>
                  <td>{training.scheduledDate ? new Date(training.scheduledDate).toLocaleDateString('es-MX') : 'Sin fecha'}</td>
                  <td>
                    {training.status !== 'Completado' && (
                      <button className="btn btn-sm btn-blue" onClick={() => handleAdvance(training)}>Avanzar</button>
                    )}
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
