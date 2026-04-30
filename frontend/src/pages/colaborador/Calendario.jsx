import { useState, useEffect } from 'react'
import { toast } from '../../components/Toast'
import { getCalendars } from '../../api/api'

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DIAS = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']

// Mapea tipo de evento a color
const typeMap = {
  'urgente': 'err',
  'auditoria': 'red',
  'revision': 'warn',
  'capacitacion': 'blue',
  'default': 'gray'
}

export default function Calendario() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [eventos, setEventos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Cargar eventos desde la API
  useEffect(() => {
    const fetchCalendars = async () => {
      try {
        setLoading(true)
        const response = await getCalendars({ limit: 100 })
        if (response.data?.success && response.data?.data?.calendars) {
          // Mapear eventos de la API al formato del componente
          const mapped = response.data.data.calendars.map(cal => {
            const eventDate = new Date(cal.date)
            const typeKey = cal.type?.toLowerCase() || 'default'
            const typeColor = typeMap[typeKey] || 'gray'
            
            return {
              day: eventDate.getDate(),
              month: MESES[eventDate.getMonth()],
              title: cal.title || 'Evento sin título',
              badge: `b-${typeColor}`,
              type: typeColor,
              date: eventDate,
              id: cal._id
            }
          })
          setEventos(mapped)
        }
      } catch (err) {
        console.error('Error al obtener calendario:', err)
        setError(err.response?.data?.message || 'Error al cargar calendario')
        toast('Error al cargar eventos del calendario', 'err')
      } finally {
        setLoading(false)
      }
    }
    fetchCalendars()
  }, [])

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month+1, 0).getDate()

  function prev() { if(month===0){setMonth(11);setYear(y=>y-1)}else setMonth(m=>m-1) }
  function next() { if(month===11){setMonth(0);setYear(y=>y+1)}else setMonth(m=>m+1) }

  // Filtrar eventos del mes actual
  const eventosDelMes = eventos.filter(e => {
    return e.date.getFullYear() === year && e.date.getMonth() === month
  })

  // Próximos 5 eventos
  const proximosEventos = eventos
    .filter(e => e.date >= new Date(year, month, 1))
    .sort((a, b) => a.date - b.date)
    .slice(0, 5)

  // Resumen del mes
  const resumenMes = [
    { label: 'Tareas urgentes', num: eventosDelMes.filter(e => e.type === 'err').length, color: 'var(--err)' },
    { label: 'Auditorías', num: eventosDelMes.filter(e => e.type === 'red').length, color: 'var(--warn)' },
    { label: 'Revisiones', num: eventosDelMes.filter(e => e.type === 'warn').length, color: 'var(--gold-d)' },
    { label: 'Capacitaciones', num: eventosDelMes.filter(e => e.type === 'blue').length, color: 'var(--blue)' },
  ]

  const cells = []
  for(let i=0;i<firstDay;i++) cells.push(null)
  for(let d=1;d<=daysInMonth;d++) cells.push(d)

  return (
    <main className="page">
      <div className="ph">
        <div><h1 className="ph-title">Mi <em>Calendario</em></h1><p className="ph-sub">Eventos y actividades del SGC programadas para ti</p></div>
      </div>

      {error && (
        <div style={{background:'var(--err-bg)',border:'1px solid rgba(220,38,38,.2)',borderRadius:8,padding:'1rem',marginBottom:'1rem',display:'flex',alignItems:'center',gap:10,color:'var(--err)'}}>
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" width="20"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          <span style={{fontSize:'.85rem'}}>{error}</span>
        </div>
      )}

      <div className="mg">
        <div style={{display:'flex',flexDirection:'column',gap:'1.2rem'}}>
          <div className="card">
            <div style={{padding:'1rem 1.3rem',borderBottom:'1px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <button className="ibtn" onClick={prev}><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg></button>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:'1.1rem',fontWeight:700}}>{MESES[month]} <em style={{fontWeight:400,color:'var(--red)'}}>{year}</em></div>
              <button className="ibtn" onClick={next}><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg></button>
            </div>
            <div style={{padding:'1rem'}}>
              <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:4,marginBottom:8}}>
                {DIAS.map(d => <div key={d} style={{textAlign:'center',fontSize:'.68rem',fontWeight:700,color:'var(--ash)',letterSpacing:'.05em',textTransform:'uppercase',padding:'4px 0'}}>{d}</div>)}
              </div>
              {loading ? (
                <div style={{textAlign:'center',padding:'2rem',color:'var(--ash)',fontSize:'.85rem'}}>Cargando calendario...</div>
              ) : (
              <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:4}}>
                {cells.map((day,i) => {
                  if(day===null) return <div key={i}/>
                  const ev = eventosDelMes.filter(e => e.day===day)
                  const isToday = day===today.getDate()&&month===today.getMonth()&&year===today.getFullYear()
                  const colorMap = {err:'var(--err-bg)',red:'var(--err-bg)',warn:'var(--warn-bg)',blue:'var(--blue-bg)',gray:'rgba(201,168,76,.06)'}
                  const textMap = {err:'var(--err)',red:'var(--err)',warn:'var(--warn)',blue:'var(--blue)',gray:'var(--ash)'}
                  return (
                    <div key={i} onClick={() => ev.length&&toast(ev.map(e=>e.title).join(', '),'n')} style={{minHeight:52,borderRadius:6,padding:'4px 6px',background:isToday?'var(--red)':ev.length?colorMap[ev[0].type]:'transparent',border:isToday?'none':ev.length?`1px solid ${textMap[ev[0].type]}33`:'1px solid transparent',cursor:ev.length?'pointer':'default'}}>
                      <div style={{fontSize:'.78rem',fontWeight:isToday?700:500,color:isToday?'#fff':'var(--ink)',marginBottom:2,textAlign:'center'}}>{day}</div>
                      {ev.slice(0,2).map((e,j) => (
                        <div key={j} style={{fontSize:'.58rem',fontWeight:600,padding:'1px 4px',borderRadius:3,marginBottom:1,background:colorMap[e.type],color:textMap[e.type],whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{e.title}</div>
                      ))}
                    </div>
                  )
                })}
              </div>
              )}
            </div>
            <div style={{padding:'.8rem 1.3rem',borderTop:'1px solid var(--border)',display:'flex',gap:'1rem',flexWrap:'wrap'}}>
              {[{color:'var(--err-bg)',text:'var(--err)',label:'Urgente'},{color:'var(--warn-bg)',text:'var(--warn)',label:'Evento'},{color:'var(--blue-bg)',text:'var(--blue)',label:'Capacitación'}].map((l,i) => (
                <div key={i} style={{display:'flex',alignItems:'center',gap:5,fontSize:'.72rem',color:'var(--ash)'}}>
                  <div style={{width:10,height:10,borderRadius:2,background:l.color,border:`1px solid ${l.text}33`}}/>{l.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-r">
          <div className="card">
            <div className="card-hd"><div className="card-hd-l"><div className="card-ico ico-gold"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg></div><div><div className="card-title">Mis Próximos Eventos</div></div></div></div>
            <div style={{padding:'.5rem'}}>
              {loading ? (
                <div style={{padding:'1rem',textAlign:'center',color:'var(--ash)',fontSize:'.8rem'}}>Cargando...</div>
              ) : proximosEventos.length === 0 ? (
                <div style={{padding:'1rem',textAlign:'center',color:'var(--ash)',fontSize:'.8rem'}}>No hay próximos eventos</div>
              ) : (
                proximosEventos.map((ev,i) => (
                  <div key={ev.id || i} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 10px',borderRadius:6,marginBottom:2,cursor:'pointer'}} onMouseOver={e=>e.currentTarget.style.background='var(--surface)'} onMouseOut={e=>e.currentTarget.style.background='transparent'}>
                    <div style={{width:44,textAlign:'center',flexShrink:0}}>
                      <div style={{fontSize:'.72rem',fontWeight:700,color:typeMap[ev.type] === 'err' ? 'var(--err)' : typeMap[ev.type] === 'red' ? 'var(--err)' : typeMap[ev.type] === 'warn' ? 'var(--warn)' : 'var(--blue)',fontFamily:"'Playfair Display',serif"}}>{String(ev.day).padStart(2,'0')}</div>
                      <div style={{fontSize:'.6rem',color:'var(--ash)',textTransform:'uppercase',letterSpacing:'.05em'}}>{ev.month.slice(0,3)}</div>
                    </div>
                    <div style={{width:1,height:28,background:'var(--border)',flexShrink:0}}/>
                    <div style={{flex:1,fontSize:'.8rem',fontWeight:500}}>{ev.title}</div>
                    <span className={`badge ${ev.badge}`} style={{fontSize:'.6rem'}}><svg fill="currentColor" viewBox="0 0 24 24" width="6"><circle cx="12" cy="12" r="12"/></svg></span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-hd"><div className="card-hd-l"><div className="card-ico ico-warn"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div><div><div className="card-title">Resumen del Mes</div></div></div></div>
            <div style={{padding:'1rem'}}>
              {loading ? (
                <div style={{padding:'1rem',textAlign:'center',color:'var(--ash)',fontSize:'.8rem'}}>Cargando...</div>
              ) : (
                resumenMes.map((s,i) => (
                  <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:i<3?'1px solid var(--border)':'none'}}>
                    <span style={{fontSize:'.82rem',color:'var(--ash)'}}>{s.label}</span>
                    <span style={{fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:'1.1rem',color:s.color}}>{s.num}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
