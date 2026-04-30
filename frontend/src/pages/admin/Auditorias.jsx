import { useState, useEffect } from 'react'
import { getAudits, createAudit, createFinding } from '../../api/api'
import { toast } from '../../components/Toast'
import Modal from '../../components/Modal'
import { useNavigate } from 'react-router-dom'
import Papa from 'papaparse'


const EyeIcon = () => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
const EditIcon = () => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>

export default function Auditorias() {
  const navigate = useNavigate()
  const [modal, setModal] = useState(null)
  const [selectedAudit, setSelectedAudit] = useState(null)
  const [auditorias, setAuditorias] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', date: '' })
  const [findingForm, setFindingForm] = useState({ title: '', description: '', severity: 'Media', audit: '' })

  // Cargar auditorías desde API
  useEffect(() => {
    const cargarAuditorias = async () => {
      try {
        console.log('🔄 Cargando auditorías desde API...')
        const res = await getAudits()
        console.log('✅ Auditorías cargadas:', res.data)
        const auditsArr = res.data?.data?.audits || res.data?.data || []
        setAuditorias(Array.isArray(auditsArr) ? auditsArr : [])
        setError(null)
      } catch (err) {
        console.error('❌ Error cargando auditorías:', err)
        setError(err.response?.data?.message || 'Error al cargar auditorías')
        setAuditorias([])
      } finally {
        setLoading(false)
      }
    }
    cargarAuditorias()
  }, [])

  const handleCrearAuditoria = async () => {
    try {
      if (!form.title || !form.date) return toast('Título y fecha son requeridos', 'err')
      setIsSaving(true)
      await createAudit(form)
      toast('Auditoría programada con éxito', 'ok')
      setModal(null)
      setForm({ title: '', description: '', date: '' })
      // Recargar datos
      const res = await getAudits()
      const auditsArr = res.data?.data?.audits || res.data?.data || []
      setAuditorias(Array.isArray(auditsArr) ? auditsArr : [])
    } catch (_err) {
      toast('Error al crear auditoría', 'err')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCrearHallazgo = async () => {
    try {
      if (!findingForm.title) return toast('La descripción es requerida', 'err')
      setIsSaving(true)
      await createFinding({
        ...findingForm,
        audit: selectedAudit._id
      })
      toast('Hallazgo registrado con éxito', 'ok')
      setModal(null)
      setFindingForm({ title: '', description: '', severity: 'Media', audit: '' })
    } catch (_err) {
      toast('Error al registrar hallazgo', 'err')
    } finally {
      setIsSaving(false)
    }
  }

  const exportarCSV = () => {
    if (auditorias.length === 0) return toast('No hay datos para exportar', 'err')
    const csv = Papa.unparse(auditorias.map(a => ({
      Titulo: a.title,
      Estado: a.status,
      Fecha: a.date ? new Date(a.date).toLocaleDateString() : 'Pendiente',
      Auditor: a.assignedTo?.name || 'No asignado'
    })))
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'plan_auditorias.csv')
    link.click()
    toast('Plan exportado correctamente', 'ok')
  }

  const stats = [
    { cls: 'sc-blue', icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>, trend: '2026', trendCls: 'trend-n', num: auditorias.length, lbl: 'Auditorías Programadas', bar: 50 },
    { cls: 'sc-warn', icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>, trend: 'Abiertas', trendCls: 'trend-dn', num: '7', lbl: 'No Conformidades', bar: 35 },
    { cls: 'sc-ok', icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, trend: 'Cerradas', trendCls: 'trend-up', num: '12', lbl: 'NC Resueltas (año)', bar: 80 },
  ]

  const ncAbiertas = [
    { title: 'Control de documentos sin firma', code: 'NC-2025-018 · Calidad', body: 'Se detectaron 4 documentos sin firma de aprobación en el área de producción durante la auditoría Q4.', vence: '15 Mar 2026', badge: 'Mayor', badgeCls: 'b-err' },
    { title: 'Registro de capacitaciones incompleto', code: 'NC-2025-019 · RRHH', body: 'Los registros de asistencia a capacitaciones no incluyen evidencia de evaluación de efectividad.', vence: '30 Mar 2026', badge: 'Menor', badgeCls: 'b-warn' },
  ]

  const ncByArea = [{ area: 'Calidad', n: 3, pct: 75, color: 'var(--red)' }, { area: 'Compras', n: 2, pct: 50, color: '#F59E0B' }, { area: 'RRHH', n: 2, pct: 50, color: '#F59E0B' }, { area: 'Producción', n: 0, pct: 0, color: '#16A34A' }]

  return (
    <main className="page">
      <div className="ph">
        <div>
          <h1 className="ph-title">Auditorías <em>Internas</em></h1>
          <p className="ph-sub">Planificación y seguimiento de auditorías ISO 9001:2015</p>
        </div>
        <div className="ph-actions">
          <button className="btn btn-out" onClick={exportarCSV}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Exportar Plan
          </button>
          <button className="btn btn-red" onClick={() => setModal('nueva')}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            Nueva Auditoría
          </button>
        </div>
      </div>

      <div className="sg sg-3" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        {stats.map((s, i) => (
          <div key={i} className={`sc ${s.cls}`} style={{ cursor: 'pointer' }} onClick={() => toast(`Filtrando por ${s.lbl}...`, 'n')}>
            <div className="sc-top"><div className="sc-icon">{s.icon}</div><span className={`trend ${s.trendCls}`}>{s.trend}</span></div>
            <div className="sc-num">{s.num}</div>
            <div className="sc-lbl">{s.lbl}</div>
            <div className="sc-bar"><div className="sc-bar-f" style={{ width: `${s.bar}%` }} /></div>
          </div>
        ))}
      </div>

      <div className="mg">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          {/* Plan de auditorías */}
          <div className="card">
            <div className="card-hd">
              <div className="card-hd-l">
                <div className="card-ico ico-gold"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>
                <div><div className="card-title">Plan de Auditorías 2026</div></div>
              </div>
            </div>
            {loading && (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--ash)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                <svg className="anim-spin" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3" style={{ color: 'var(--gold)' }}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                Cargando auditorías...
              </div>
            )}
            {error && (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--err)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                {error}
              </div>
            )}
            {!loading && !error && auditorias.length === 0 && <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--ash)' }}>No hay auditorías registradas</div>}
            {!loading && auditorias.length > 0 && (
              <div className="tbl-wrap">
                <table className="tbl">
                  <thead><tr><th>Auditoría</th><th>Tipo</th><th>Área</th><th>Auditor</th><th>Fecha</th><th>Estado</th><th>NC</th><th></th></tr></thead>
                  <tbody>
                    {auditorias.map((a, i) => (
                      <tr key={a._id || i}>
                        <td style={{ fontWeight: 700, fontSize: '.845rem' }}>{a.title || '—'}</td>
                        <td><span className="badge b-blue">Interna</span></td>
                        <td style={{ fontSize: '.8rem' }}>{a.description?.slice(0, 40) || '—'}</td>
                        <td style={{ fontSize: '.8rem' }}>{a.assignedTo?.name || a.createdBy?.name || '—'}</td>
                        <td style={{ fontSize: '.78rem', fontWeight: 600 }}>{a.date ? new Date(a.date).toLocaleDateString('es-MX') : '—'}</td>
                        <td><span className={`badge ${a.status === 'Completada' ? 'b-ok' : a.status === 'En Progreso' ? 'b-blue' : 'b-warn'}`}>{a.status || 'Pendiente'}</span></td>
                        <td style={{ fontSize: '.8rem', fontWeight: 700 }}>—</td>
                        <td>
                          <div style={{ display: 'flex', gap: '.3rem' }}>
                            <button className="ibtn" onClick={() => { setSelectedAudit(a); setModal('hallazgo'); }} title="Registrar Hallazgo">
                              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            </button>
                            <button className="ibtn" onClick={() => navigate('/admin/documentos-iso')} title="Ver Evidencias"><EyeIcon /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* NC Abiertas */}
          <div className="card">
            <div className="card-hd">
              <div className="card-hd-l">
                <div className="card-ico ico-red"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg></div>
                <div><div className="card-title">No Conformidades Abiertas</div><div className="card-sub">Requieren acción correctiva</div></div>
              </div>
              <button className="btn btn-out" style={{ padding: '6px 12px', fontSize: '.75rem' }} onClick={() => toast('Mostrando todas las no conformidades abiertas', 'n')}>Ver todas</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', padding: '1.2rem' }}>
              {ncAbiertas.map((nc, i) => (
                <div key={i} className="nc">
                  <div className="nc-top">
                    <div><div className="nc-title">{nc.title}</div><div className="nc-code">{nc.code}</div></div>
                    <span className={`badge ${nc.badgeCls}`}>{nc.badge}</span>
                  </div>
                  <div className="nc-body">{nc.body}</div>
                  <div className="nc-footer">
                    <span className="nc-meta">Vence: {nc.vence}</span>
                    <div style={{ display: 'flex', gap: '.35rem' }}>
                      <button className="ibtn" onClick={() => toast('Funcionalidad de editar hallazgos pendiente', 'n')}><EditIcon /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="col-r">
          {/* Próxima Auditoría */}
          <div className="card">
            <div className="card-hd">
              <div className="card-hd-l">
                <div className="card-ico ico-gold"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg></div>
                <div><div className="card-title">Próxima Auditoría</div></div>
              </div>
            </div>
            <div style={{ padding: '1.2rem' }}>
              <div style={{ background: 'linear-gradient(135deg,var(--red-k),var(--red-d))', borderRadius: 8, padding: '1.2rem', color: 'var(--white)', marginBottom: '1rem' }}>
                <div style={{ fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.15em', color: 'var(--gold-l)', marginBottom: '.5rem' }}>AI-2026-Q1</div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.3rem', fontWeight: 700, marginBottom: '.3rem' }}>Auditoría Interna</div>
                <div style={{ fontSize: '.8rem', color: 'rgba(255,255,255,.6)' }}>Calidad &amp; Producción</div>
                <div style={{ marginTop: '1rem', paddingTop: '.8rem', borderTop: '1px solid rgba(201,168,76,.2)', display: 'flex', justifyContent: 'space-between' }}>
                  {[{ lbl: 'Fecha', val: '15 Mar 2026', color: 'var(--gold-l)' }, { lbl: 'Auditor', val: 'L. García', color: '#fff' }, { lbl: 'Días', val: '11', color: 'var(--gold-l)' }].map((x, i) => (
                    <div key={i}>
                      <div style={{ fontSize: '.68rem', color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: '.1em' }}>{x.lbl}</div>
                      <div style={{ fontSize: '.9rem', fontWeight: 700, color: x.color }}>{x.val}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: '.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.78rem', marginBottom: '.4rem' }}>
                  <span style={{ fontWeight: 600 }}>Preparación</span><span style={{ color: 'var(--ash)' }}>60%</span>
                </div>
                <div className="prog-wrap"><div className="prog-fill" style={{ width: '60%', background: 'var(--gold)' }} /></div>
              </div>
              <button className="btn btn-red" style={{ width: '100%', justifyContent: 'center', marginTop: '.8rem' }} onClick={() => navigate('/admin/documentos-iso')}>Gestionar Evidencias</button>
            </div>
          </div>

          {/* NC por área */}
          <div className="card">
            <div className="card-hd">
              <div className="card-hd-l">
                <div className="card-ico ico-ink"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg></div>
                <div><div className="card-title">NC por Área</div></div>
              </div>
            </div>
            <div style={{ padding: '1rem' }}>
              {ncByArea.map((x, i) => (
                <div key={i} style={{ marginBottom: '.9rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.78rem', marginBottom: '.35rem' }}>
                    <span>{x.area}</span>
                    <span style={{ fontWeight: 700, color: x.n > 0 ? x.color : 'var(--ok)' }}>{x.n}</span>
                  </div>
                  <div className="prog-wrap"><div className="prog-fill" style={{ width: `${x.pct}%`, background: x.color }} /></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {modal === 'nueva' && (
        <Modal 
          title="Nueva Auditoría" 
          onClose={() => setModal(null)}
          footer={<>
            <button className="btn btn-out" onClick={() => setModal(null)} disabled={isSaving}>Cancelar</button>
            <button className="btn btn-red" onClick={handleCrearAuditoria} disabled={isSaving}>
              {isSaving ? 'Programando...' : 'Programar Auditoría'}
            </button>
          </>}
        >
          <div className="form-grid">
            <div className="form-group full">
              <label className="lbl">Título de la Auditoría</label>
              <input
                className="finput"
                placeholder="Ej. Auditoría Interna Q2"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="form-group full">
              <label className="lbl">Descripción / Alcance</label>
              <textarea
                className="ftextarea"
                placeholder="Describe el alcance..."
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="lbl">Fecha Programada</label>
              <input
                className="finput"
                type="date"
                value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })}
              />
            </div>
          </div>
        </Modal>
      )}

      {modal === 'hallazgo' && (
        <Modal 
          title={`Nuevo Hallazgo - ${selectedAudit?.title}`} 
          onClose={() => setModal(null)}
          footer={<>
            <button className="btn btn-out" onClick={() => setModal(null)} disabled={isSaving}>Cancelar</button>
            <button className="btn btn-red" onClick={handleCrearHallazgo} disabled={isSaving}>
              {isSaving ? 'Guardando...' : 'Guardar Hallazgo'}
            </button>
          </>}
        >
          <div className="form-grid">
            <div className="form-group full">
              <label className="lbl">Descripción del Hallazgo</label>
              <textarea
                className="ftextarea"
                placeholder="Describa la observación o no conformidad..."
                value={findingForm.title}
                onChange={e => setFindingForm({ ...findingForm, title: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="lbl">Tipo / Severidad</label>
              <select
                className="fselect"
                value={findingForm.severity}
                onChange={e => setFindingForm({ ...findingForm, severity: e.target.value })}
              >
                <option value="Alta">No Conformidad Mayor</option>
                <option value="Media">No Conformidad Menor</option>
                <option value="Baja">Observación / Mejora</option>
              </select>
            </div>
            <div className="form-group">
              <label className="lbl">Evidencia Detallada</label>
              <input
                className="finput"
                placeholder="Ej. Cláusula 7.1.1"
                value={findingForm.description}
                onChange={e => setFindingForm({ ...findingForm, description: e.target.value })}
              />
            </div>
          </div>
        </Modal>
      )}
    </main>
  )
}
