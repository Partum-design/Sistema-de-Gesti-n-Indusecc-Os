import { useState, useEffect } from 'react'
import { toast } from '../../components/Toast'
import { getActions, updateAction } from '../../api/api'

export default function Tareas() {
  const [tareas, setTareas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeFilter, setActiveFilter] = useState('Todas')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const fetchActions = async () => {
      try {
        setLoading(true)
        const response = await getActions({ limit: 100 })
        if (response.data?.success && response.data?.data?.actions) {
          // Mapear acciones de la API al formato del componente
          const mapped = response.data.data.actions.map(action => ({
            id: action._id,
            label: action.title || 'Acción sin título',
            area: action.area || 'Sin área',
            asigno: action.assignedTo?.name || 'Sin asignar',
            vence: action.dueDate ? new Date(action.dueDate).toLocaleDateString('es-ES', {year:'numeric',month:'short',day:'numeric'}) : '',
            vColor: action.priority === 'high' ? 'var(--err)' : action.priority === 'medium' ? 'var(--warn)' : 'var(--ok)',
            pri: action.priority === 'high' ? 'Alta' : action.priority === 'medium' ? 'Media' : 'Baja',
            priC: action.priority === 'high' ? 'pri-h' : action.priority === 'medium' ? 'pri-m' : 'pri-l',
            urgente: action.priority === 'high',
            done: action.status === 'Cerrada',
            meta: action.status === 'Cerrada' ? `Completada el ${new Date(action.updatedAt).toLocaleDateString('es-ES', {year:'numeric',month:'short',day:'numeric'})}` : ''
          }))
          setTareas(mapped)
        }
      } catch (err) {
        console.error('Error al obtener tareas:', err)
        setError(err.response?.data?.message || 'Error al cargar tareas')
        toast('Error al cargar tareas', 'err')
      } finally {
        setLoading(false)
      }
    }
    fetchActions()
  }, [])

  function toggleTask(id) {
    setTareas(prev => prev.map(t => {
      if (t.id !== id) return t
      const newDone = !t.done
      // Update local state immediately for responsiveness
      const updatedTask = { ...t, done: newDone }
      // Call API to save the change
      updateAction(id, { status: newDone ? 'Cerrada' : 'Iniciada' })
        .then(() => {
          toast(newDone ? '¡Tarea completada!' : 'Tarea reabierta', newDone ? 'ok' : 'n')
        })
        .catch(err => {
          console.error('Error al actualizar tarea:', err)
          toast('Error al guardar cambios', 'err')
          // Revert local state on error
          setTareas(prev => prev.map(task => task.id === id ? t : task))
        })
      return updatedTask
    }))
  }

  // Aplicar filtros
  const filteredTareas = tareas.filter(t => {
    // Filtro por estado
    if (activeFilter === 'Pendientes' && t.done) return false
    if (activeFilter === 'En Proceso' && (t.done || t.pri === 'Alta')) return false
    if (activeFilter === 'Completadas' && !t.done) return false
    
    // Filtro por búsqueda
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      return t.label.toLowerCase().includes(term) || 
             t.area.toLowerCase().includes(term) ||
             t.asigno.toLowerCase().includes(term)
    }
    
    return true
  })

  const pendientes = tareas.filter(t => !t.done).length
  const completadas = tareas.filter(t => t.done).length
  const urgentes = tareas.filter(t => !t.done && t.pri === 'Alta').length

  return (
    <main className="page">
      <div className="ph">
        <div><div className="ph-title">Mis <em>Tareas</em></div><div className="ph-sub">Acciones de mejora asignadas a ti</div></div>
        <div className="ph-actions">
          <button className="btn btn-out" onClick={() => toast('Filtros aplicados', 'n')}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" width="14"><path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/></svg>Filtrar
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
        <div className="sc sc-warn"><div className="sc-top"><div className="sc-icon"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div></div><div className="sc-num">{pendientes}</div><div className="sc-lbl">Pendientes</div></div>
        <div className="sc" style={{'--sc-color':'var(--err)'}}>
          <div className="sc-top"><div className="sc-icon" style={{background:'var(--err-bg)',color:'var(--err)'}}><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div></div>
          <div className="sc-num" style={{color:'var(--err)'}}>{urgentes}</div><div className="sc-lbl">Urgentes</div>
        </div>
        <div className="sc sc-ok"><div className="sc-top"><div className="sc-icon"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div></div><div className="sc-num">{completadas}</div><div className="sc-lbl">Completadas (mes)</div></div>
        <div className="sc sc-blue"><div className="sc-top"><div className="sc-icon"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg></div></div><div className="sc-num">{tareas.length > 0 ? Math.round((completadas / tareas.length) * 100) : 0}%</div><div className="sc-lbl">Eficiencia</div></div>
      </div>

      <div className="card">
         <div className="filters">
           {['Todas','Pendientes','En Proceso','Completadas'].map(f => (
             <button key={f} className={`filter-tab${activeFilter===f?' active':''}`} onClick={() => setActiveFilter(f)}>{f}</button>
           ))}
           <div className="filters-r">
             <div className="fsearch">
               <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
               <input 
                 type="text" 
                 placeholder="Buscar tarea…" 
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
               />
             </div>
           </div>
         </div>

         <div style={{ padding: '1rem' }}>
           {loading ? (
             <div style={{padding:'3rem',textAlign:'center',color:'var(--ash)'}}>
               <div style={{fontSize:'.9rem',marginBottom:'1rem'}}>Cargando tareas...</div>
               <div style={{display:'inline-block',width:30,height:30,border:'3px solid var(--border)',borderTop:'3px solid var(--blue)',borderRadius:'50%',animation:'spin 1s linear infinite'}}/>
             </div>
           ) : filteredTareas.length === 0 ? (
             <div style={{padding:'2rem',textAlign:'center',color:'var(--ash)',fontSize:'.85rem'}}>
               {tareas.length === 0 ? 'No tienes tareas asignadas' : 'No se encontraron tareas con esos criterios'}
             </div>
           ) : (
             filteredTareas.map(t => (
            <div key={t.id} className="task-item" style={{ ...(t.urgente ? {background:'rgba(254,226,226,.2)',borderColor:'rgba(155,28,28,.2)'} : {}), ...(t.done ? {opacity:.65} : {}) }}>
              <div className={`task-check${t.done?' done':''}`} onClick={() => toggleTask(t.id)}>
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
              </div>
              <div className="task-txt">
                <div className={`task-title${t.done?' done-txt':''}`}>{t.label}</div>
                {t.done
                  ? <div className="task-meta">{t.meta}</div>
                  : <div className="task-meta" style={{display:'flex',gap:'1rem',flexWrap:'wrap'}}>
                      {t.area && <span style={{display:'flex',alignItems:'center',gap:4}}><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" width="12"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>{t.area}</span>}
                      {t.asigno && <span style={{display:'flex',alignItems:'center',gap:4}}><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" width="12"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>{t.asigno}</span>}
                      {t.vence && <span style={{color:t.vColor,fontWeight:700,display:'flex',alignItems:'center',gap:4}}><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" width="12"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>Vence: {t.vence}</span>}
                    </div>
                }
              </div>
              {!t.done && (
                <div style={{display:'flex',flexDirection:'column',gap:'.3rem',alignItems:'flex-end',flexShrink:0}}>
                  <span className={`task-pri ${t.priC}`}>{t.pri} prioridad</span>
                  <button className={`btn btn-sm ${t.pri==='Alta'?'btn-red':t.pri==='Media'?'btn-out':'btn-ok'}`} onClick={() => toast('Tarea iniciada','ok')}>Iniciar</button>
                </div>
              )}
              {t.done && <span className="task-pri pri-l">Lista</span>}
            </div>
          ))
        )}
        </div>
      </div>
    </main>
  )
}
