
import { useState, useEffect } from 'react'
import { toast } from '../../components/Toast'
import Modal from '../../components/Modal'
import { getCalendars, createCalendar } from '../../api/api'

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

const _eventos = [
  { day: 5, type: 'warn', label: 'IT-SGC-007 Vence' },
  { day: 15, type: 'red', label: 'Auditoría Q1' },
  { day: 20, type: 'ok', label: 'Rev. Documentos' },
  { day: 25, type: 'blue', label: 'Capacitación ISO' },
]

const _proximosEventos = [
  { date: '5 Mar', title: 'Vencimiento IT-SGC-007', badge: 'b-warn', color: 'var(--warn)' },
  { date: '15 Mar', title: 'Auditoría Interna Q1', badge: 'b-err', color: 'var(--err)' },
  { date: '20 Mar', title: 'Revisión de Documentos', badge: 'b-ok', color: 'var(--ok)' },
  { date: '25 Mar', title: 'Capacitación ISO 9001', badge: 'b-blue', color: 'var(--blue)' },
  { date: '2 Abr', title: 'Revisión por Dirección', badge: 'b-gray', color: 'var(--ash)' },
]

export default function CalendarioAdmin() {
  const today = new Date()
  const [year, _setYear] = useState(today.getFullYear())
  const [month, _setMonth] = useState(today.getMonth())
  const [modalNew, setModalNew] = useState(false)
  const [eventosDB, setEventosDB] = useState([])
  const [_loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [_hasLoaded, setHasLoaded] = useState(false)
  const [form, setForm] = useState({ title: '', type: 'Auditoría', date: '', description: '', assignedTo: '' })

  const loadData = async () => {
    try {
      setLoading(true)
      const res = await getCalendars()
      setEventosDB(res.data?.data?.calendars || res.data?.data || [])
      setHasLoaded(true)
    } catch (err) {
      console.error('Error loading calendars:', err)
      setHasLoaded(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCrearEvento = async () => {
    try {
      if (!form.title || !form.date) return toast('Título y fecha son requeridos', 'err')
      // Convertir fecha DD/MM/YYYY a YYYY-MM-DD
      let dateFormatted = form.date
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(form.date)) {
        const [day, month, year] = form.date.split('/')
        dateFormatted = `${year}-${month}-${day}`
      }
      setIsSaving(true)
      // No enviar assignedTo si está vacío
      const eventData = { ...form, date: dateFormatted }
      if (!eventData.assignedTo) delete eventData.assignedTo
      await createCalendar(eventData)
      toast('Evento programado con éxito', 'ok')
      setModalNew(false)
      loadData()
      setForm({ title: '', type: 'Auditoría', date: '', description: '', assignedTo: '' })
    } catch (_err) {
      toast('Error al programar evento', 'err')
    } finally {
      setIsSaving(false)
    }
  }

  // --- Cálculos dinámicos ---
  const filteredEventosDB = eventosDB.filter(e => {
    const d = new Date(e.date)
    return d.getMonth() === month && d.getFullYear() === year
  })

  // 1. Próximos Eventos (Siguientes 60 días)
  const todayTS = today.getTime()
  const sixtyDaysLater = todayTS + (60 * 24 * 60 * 60 * 1000)
  const proximosEventosLogica = eventosDB
    .filter(e => {
      const d = new Date(e.date).getTime()
      return d >= todayTS && d <= sixtyDaysLater
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 5)
    .map(e => ({
      date: new Date(e.date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }),
      title: e.title,
      badge: e.type === 'Auditoría' ? 'b-err' : e.type === 'Vencimiento' ? 'b-warn' : 'b-ok',
      color: e.type === 'Auditoría' ? 'var(--err)' : e.type === 'Vencimiento' ? 'var(--warn)' : 'var(--ok)'
    }))

  // 2. Resumen del Mes
  const statsMes = {
    vencimientos: filteredEventosDB.filter(e => e.type === 'Vencimiento').length,
    auditorias: filteredEventosDB.filter(e => e.type === 'Auditoría').length,
    revisiones: filteredEventosDB.filter(e => e.type === 'Revisión').length,
    capacitaciones: filteredEventosDB.filter(e => e.type === 'Capacitación').length
  }

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const prevMonth = () => { if (month === 0) { _setYear(year - 1); _setMonth(11) } else _setMonth(month - 1) }
  const nextMonth = () => { if (month === 11) { _setYear(year + 1); _setMonth(0) } else _setMonth(month + 1) }

  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <main className="page">
      <div className="ph">
        <div>
          <h1 className="ph-title">Calendario <em>SGC</em></h1>
          <p className="ph-sub">Eventos, auditorías y vencimientos programados</p>
        </div>
        <div className="ph-actions">
          <button className="btn btn-out" onClick={() => toast('Exportando calendario…', 'n')}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>Exportar
          </button>
          <button className="btn btn-red" onClick={() => setModalNew(true)}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>Nuevo Evento
          </button>
        </div>
      </div>

      <div className="mg">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div className="card">
            <div style={{ padding: '1rem 1.3rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button className="ibtn" onClick={prevMonth}><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg></button>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.1rem', fontWeight: 700 }}>{MESES[month]} <em style={{ fontWeight: 400, color: 'var(--red)' }}>{year}</em></div>
              <button className="ibtn" onClick={nextMonth}><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg></button>
            </div>
            <div style={{ padding: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 8 }}>
                {DIAS.map(d => <div key={d} style={{ textAlign: 'center', fontSize: '.68rem', fontWeight: 700, color: 'var(--ash)', letterSpacing: '.05em', textTransform: 'uppercase', padding: '4px 0' }}>{d}</div>)}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
                 {cells.map((day, i) => {
                  if (day === null) return <div key={i} />
                  
                  // Buscar eventos del día real
                  const dayEventsReal = eventosDB.filter(e => {
                    const d = new Date(e.date)
                    // Ajustamos por zona horaria para comparar solo el día local
                    return d.getUTCDate() === day && d.getUTCMonth() === month && d.getUTCFullYear() === year
                  })

                  const ev = dayEventsReal.map(e => ({
                    label: e.title,
                    type: e.type === 'Auditoría' ? 'warn' : e.type === 'Vencimiento' ? 'red' : e.type === 'Revisión' ? 'ok' : 'blue'
                  }))

                  const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
                  return (
                    <div key={i} onClick={() => ev.length && toast(ev.map(e => e.label).join(', '), 'n')}
                      style={{ minHeight: 52, borderRadius: 6, padding: '4px 6px', background: isToday ? 'var(--red)' : ev.length ? 'rgba(201,168,76,.06)' : 'transparent', border: isToday ? 'none' : ev.length ? '1px solid rgba(201,168,76,.2)' : '1px solid transparent', cursor: ev.length ? 'pointer' : 'default', transition: 'background .15s' }}>
                      <div style={{ fontSize: '.78rem', fontWeight: isToday ? 700 : 500, color: isToday ? '#fff' : 'var(--ink)', marginBottom: 2, textAlign: 'center' }}>{day}</div>
                      {ev.slice(0, 2).map((e, j) => (
                        <div key={j} style={{ fontSize: '.58rem', fontWeight: 600, padding: '1px 4px', borderRadius: 3, marginBottom: 1, background: e.type === 'red' ? 'var(--err-bg)' : e.type === 'warn' ? 'var(--warn-bg)' : e.type === 'ok' ? 'var(--ok-bg)' : 'var(--blue-bg)', color: e.type === 'red' ? 'var(--err)' : e.type === 'warn' ? 'var(--warn)' : e.type === 'ok' ? 'var(--ok)' : 'var(--blue)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.label}</div>
                      ))}
                    </div>
                  )
                })}
              </div>
            </div>
            {/* Legend */}
            <div style={{ padding: '.8rem 1.3rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {[{ color: 'var(--err-bg)', text: 'var(--err)', label: 'Vencimiento' }, { color: 'var(--warn-bg)', text: 'var(--warn)', label: 'Auditoría' }, { color: 'var(--ok-bg)', text: 'var(--ok)', label: 'Revisión' }, { color: 'var(--blue-bg)', text: 'var(--blue)', label: 'Capacitación' }].map((l, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '.72rem', color: 'var(--ash)' }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: l.color, border: `1px solid ${l.text}33` }} />{l.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-r">
          <div className="card">
            <div className="card-hd">
              <div className="card-hd-l">
                <div className="card-ico ico-gold"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg></div>
                <div><div className="card-title">Próximos Eventos</div><div className="card-sub">Siguientes 60 días</div></div>
              </div>
            </div>
            <div style={{ padding: '.5rem' }}>
              {proximosEventosLogica.length === 0 ? (
                <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--ash)', fontSize: '.8rem' }}>Sin eventos programados</div>
              ) : proximosEventosLogica.map((ev, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 6, marginBottom: 2, cursor: 'pointer' }}
                  onMouseOver={e => e.currentTarget.style.background = 'var(--surface)'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ width: 44, textAlign: 'center', flexShrink: 0 }}>
                    <div style={{ fontSize: '.68rem', fontWeight: 700, color: ev.color, fontFamily: "'Playfair Display',serif" }}>{ev.date.split(' ')[0]}</div>
                    <div style={{ fontSize: '.6rem', color: 'var(--ash)', textTransform: 'uppercase', letterSpacing: '.05em' }}>{ev.date.split(' ')[1]}</div>
                  </div>
                  <div style={{ width: 1, height: 28, background: 'var(--border)', flexShrink: 0 }} />
                  <div style={{ flex: 1, fontSize: '.8rem', fontWeight: 500 }}>{ev.title}</div>
                  <span className={`badge ${ev.badge}`} style={{ fontSize: '.6rem' }}><svg fill="currentColor" viewBox="0 0 24 24" width="6"><circle cx="12" cy="12" r="12"/></svg></span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-hd">
              <div className="card-hd-l">
                <div className="card-ico ico-red"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div>
                <div><div className="card-title">Resumen del Mes</div></div>
              </div>
            </div>
            <div style={{ padding: '1rem' }}>
              {[
                { label: 'Vencimientos', num: statsMes.vencimientos, color: 'var(--err)' },
                { label: 'Auditorías', num: statsMes.auditorias, color: 'var(--warn)' },
                { label: 'Revisiones', num: statsMes.revisiones, color: 'var(--ok)' },
                { label: 'Capacitaciones', num: statsMes.capacitaciones, color: 'var(--blue)' }
              ].map((s, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < 3 ? '1px solid var(--border)' : 'none' }}>
                  <span style={{ fontSize: '.82rem', color: 'var(--ash)' }}>{s.label}</span>
                  <span style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: '1.1rem', color: s.color }}>{s.num}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

       {modalNew && (
        <Modal 
          title="Nuevo Evento" 
          open={modalNew} 
          onClose={() => setModalNew(false)}
          footer={<>
            <button className="btn btn-out" onClick={() => setModalNew(false)} disabled={isSaving}>Cancelar</button>
            <button className="btn btn-red" onClick={handleCrearEvento} disabled={isSaving}>
              {isSaving ? 'Guardando...' : 'Guardar Evento'}
            </button>
          </>}
        >
          <div className="form-grid">
            <div className="form-group full"><label className="lbl">Título del Evento</label><input className="finput" placeholder="Ej. Auditoría Interna Q2" value={form.title} onChange={e => setForm({...form, title: e.target.value})} /></div>
            <div className="form-group"><label className="lbl">Tipo</label><select className="fselect" value={form.type} onChange={e => setForm({...form, type: e.target.value})}><option>Auditoría</option><option>Vencimiento</option><option>Revisión</option><option>Capacitación</option><option>Otro</option></select></div>
            <div className="form-group"><label className="lbl">Fecha</label><input className="finput" type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} /></div>
            <div className="form-group full"><label className="lbl">Descripción</label><textarea className="ftextarea" placeholder="Detalles del evento…" value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
          </div>
        </Modal>
      )}
    </main>
  )
}
