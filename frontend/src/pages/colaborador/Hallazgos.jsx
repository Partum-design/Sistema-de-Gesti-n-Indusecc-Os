import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from '../../components/Toast'
import { getFindings, updateFinding } from '../../api/api'

export default function Hallazgos() {
  const navigate = useNavigate()
  const [hallazgos, setHallazgos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editData, setEditData] = useState({})
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const fetchFindings = async () => {
      try {
        setLoading(true)
        const response = await getFindings({ limit: 100 })
        if (response.data?.success && response.data?.data?.findings) {
          // Mapear hallazgos de la API al formato del componente
          const mapped = response.data.data.findings.map(finding => {
            const severityMap = {
              'Crítica': { tipo: 'No Conformidad', tipoBadge: 'b-err' },
              'Alta': { tipo: 'Observación', tipoBadge: 'b-warn' },
              'Media': { tipo: 'Oportunidad de Mejora', tipoBadge: 'b-gray' },
              'Baja': { tipo: 'Riesgo Identificado', tipoBadge: 'b-blue' }
            }

            const statusMap = {
              'Cerrado': { badge: 'b-ok', estado: 'Cerrado', avance: 100, color: 'var(--ok)' },
              'En Revisión': { badge: 'b-warn', estado: 'En revisión', avance: 60, color: 'var(--gold)' },
              'Abierto': { badge: 'b-gray', estado: 'Abierto', avance: 0, color: 'var(--ash)' }
            }

            const severity = severityMap[finding.severity] || { tipo: finding.severity || 'Sin Tipo', tipoBadge: 'b-gray' }
            const status = statusMap[finding.status] || statusMap['Abierto']

            return {
              code: finding._id ? `H-${finding._id.slice(-6).toUpperCase()}` : 'SIN-CÓDIGO',
              title: finding.title || 'Hallazgo sin título',
              tipo: severity.tipo,
              tipoBadge: severity.tipoBadge,
              area: finding.area || finding.assignedTo?.name || 'Sin asignar',
              fecha: finding.createdAt ? new Date(finding.createdAt).toLocaleDateString('es-ES', {year:'numeric',month:'short',day:'numeric'}) : '—',
              badge: status.badge,
              estado: status.estado,
              avance: status.avance,
              color: status.color,
              id: finding._id
            }
          })
          setHallazgos(mapped)
        }
      } catch (err) {
        console.error('Error al obtener hallazgos:', err)
        setError(err.response?.data?.message || 'Error al cargar hallazgos')
        toast('Error al cargar hallazgos', 'err')
      } finally {
        setLoading(false)
      }
    }
    fetchFindings()
  }, [])

  const handleEdit = (hallazgo) => {
    setEditingId(hallazgo.id)
    setEditData({
      title: hallazgo.title,
      status: hallazgo.estado === 'Cerrado' ? 'Cerrado' : hallazgo.estado === 'En revisión' ? 'En Revisión' : 'Abierto'
    })
  }

  const closeModal = () => {
    setEditingId(null)
    setEditData({})
  }

  const handleSaveChanges = async () => {
    if (!editData.title || !editData.title.trim()) {
      toast('El título es requerido', 'err')
      return
    }

    try {
      setIsSaving(true)
      await updateFinding(editingId, {
        title: editData.title,
        status: editData.status
      })
      
      // Actualizar hallazgo en la lista
      setHallazgos(prev => prev.map(h => 
        h.id === editingId 
          ? { ...h, title: editData.title, estado: editData.status, badge: editData.status === 'Cerrado' ? 'b-ok' : editData.status === 'En Revisión' ? 'b-warn' : 'b-gray' }
          : h
      ))
      
      toast('Hallazgo actualizado exitosamente', 'ok')
      closeModal()
    } catch (err) {
      console.error('Error al actualizar hallazgo:', err)
      toast('Error al actualizar hallazgo', 'err')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <main className="page">
      <div className="ph">
        <div><div className="ph-title">Mis <em>Hallazgos</em></div><div className="ph-sub">Seguimiento de hallazgos y observaciones que has reportado</div></div>
        <div className="ph-actions">
          <button className="btn btn-red" onClick={() => navigate('/colaborador/reportar')}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>Nuevo Hallazgo
          </button>
        </div>
      </div>

      <div className="sg sg-3" style={{gridTemplateColumns:'repeat(3,1fr)'}}>
        {[
          { v:'warn', num:hallazgos.length, lbl:'Hallazgos Totales', icon:<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg> },
          { v:'ok', num:hallazgos.filter(h=>h.estado==='Cerrado').length, lbl:'Cerrados', icon:<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> },
          { v:'blue', num:hallazgos.filter(h=>h.estado==='En revisión').length, lbl:'En Revisión', icon:<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> },
        ].map((s,i) => (
          <div key={i} className={`sc sc-${s.v}`}>
            <div className="sc-top"><div className="sc-icon">{s.icon}</div></div>
            <div className="sc-num">{s.num}</div><div className="sc-lbl">{s.lbl}</div>
          </div>
        ))}
      </div>

      {error && (
        <div style={{background:'var(--err-bg)',border:'1px solid rgba(220,38,38,.2)',borderRadius:8,padding:'1rem',marginBottom:'1rem',display:'flex',alignItems:'center',gap:10,color:'var(--err)'}}>
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" width="20"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          <span style={{fontSize:'.85rem'}}>{error}</span>
        </div>
      )}

      <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
        {loading ? (
          <div style={{padding:'3rem',textAlign:'center',color:'var(--ash)'}}>
            <div style={{fontSize:'.9rem',marginBottom:'1rem'}}>Cargando hallazgos...</div>
            <div style={{display:'inline-block',width:30,height:30,border:'3px solid var(--border)',borderTop:'3px solid var(--blue)',borderRadius:'50%',animation:'spin 1s linear infinite'}}/>
          </div>
        ) : hallazgos.length === 0 ? (
          <div style={{padding:'2rem',textAlign:'center',color:'var(--ash)',fontSize:'.85rem'}}>No tienes hallazgos registrados</div>
        ) : (
          hallazgos.map((h,i) => (
          <div className="card" key={i}>
            <div style={{padding:'1.2rem'}}>
              <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'.5rem',marginBottom:'1rem',flexWrap:'wrap'}}>
                <div>
                  <div style={{fontSize:'.73rem',color:'var(--ash)',fontFamily:'monospace',marginBottom:'.2rem'}}>{h.code}</div>
                  <div style={{fontWeight:700,fontSize:'.95rem',color:'var(--ink)',marginBottom:'.4rem'}}>{h.title}</div>
                  <div style={{display:'flex',gap:'.5rem',flexWrap:'wrap',alignItems:'center'}}>
                    <span className={`badge ${h.tipoBadge}`}>{h.tipo}</span>
                    <span style={{fontSize:'.73rem',color:'var(--ash)',display:'flex',alignItems:'center',gap:4}}><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" width="12"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>{h.area}</span>
                    <span style={{fontSize:'.73rem',color:'var(--ash)',display:'flex',alignItems:'center',gap:4}}><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" width="12"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>{h.fecha}</span>
                  </div>
                </div>
                <div style={{display:'flex',gap:'.4rem',alignItems:'center',flexShrink:0}}>
                  <span className={`badge ${h.badge}`}>{h.estado}</span>
                  <button className="ibtn" onClick={() => handleEdit(h)}><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg></button>
                </div>
              </div>
              <div style={{marginBottom:'.5rem'}}>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:'.75rem',marginBottom:'.35rem'}}>
                  <span style={{fontWeight:600}}>Avance de la acción correctiva</span>
                  <span style={{fontWeight:700,color:h.color}}>{h.avance}%</span>
                </div>
                <div className="prog-wrap" style={{height:7}}><div className="prog-fill" style={{width:`${h.avance}%`,background:h.color}}/></div>
              </div>
            </div>
          </div>
        ))
        )}
      </div>

      {/* Modal de Edición */}
      {editingId && (
        <div className="modal-bg open" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="modal" style={{width:'90%',maxWidth:'500px'}}>
            <div className="modal-hd">
              <span className="modal-ttl">Editar Hallazgo</span>
              <button className="modal-close" onClick={closeModal}><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div style={{padding:'1.5rem',display:'flex',flexDirection:'column',gap:'1rem'}}>
              <div>
                <label style={{display:'block',fontSize:'.85rem',fontWeight:600,marginBottom:'.4rem',color:'var(--ink)'}}>Título</label>
                <input 
                  type="text" 
                  value={editData.title || ''}
                  onChange={(e) => setEditData({...editData, title: e.target.value})}
                  placeholder="Nombre del hallazgo"
                  style={{width:'100%',padding:'.6rem .8rem',border:'1px solid var(--border)',borderRadius:6,fontSize:'.9rem',fontFamily:'inherit'}}
                />
              </div>
              <div>
                <label style={{display:'block',fontSize:'.85rem',fontWeight:600,marginBottom:'.4rem',color:'var(--ink)'}}>Estado</label>
                <select 
                  value={editData.status || ''}
                  onChange={(e) => setEditData({...editData, status: e.target.value})}
                  style={{width:'100%',padding:'.6rem .8rem',border:'1px solid var(--border)',borderRadius:6,fontSize:'.9rem',fontFamily:'inherit'}}
                >
                  <option value="Abierto">Abierto</option>
                  <option value="En Revisión">En Revisión</option>
                  <option value="Cerrado">Cerrado</option>
                </select>
              </div>
              <div style={{display:'flex',gap:'.6rem',justifyContent:'flex-end',marginTop:'.5rem'}}>
                <button 
                  className="btn btn-out btn-sm"
                  onClick={closeModal}
                  disabled={isSaving}
                >
                  Cancelar
                </button>
                <button 
                  className="btn btn-ok btn-sm"
                  onClick={handleSaveChanges}
                  disabled={isSaving}
                >
                  {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
