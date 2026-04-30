import { useState } from 'react'
import { toast } from '../../components/Toast'
import { createFinding } from '../../api/api'

export default function Reportar() {
  const [tipo, setTipo] = useState('')
  const [titulo, setTitulo] = useState('')
  const [desc, setDesc] = useState('')
  const [area, setArea] = useState('Producción')
  const [clausula, setClausula] = useState('')
  const [riesgo, setRiesgo] = useState('Medio')
  const [doc, setDoc] = useState('')
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [accion, setAccion] = useState('')
  const [loading, setLoading] = useState(false)

  async function enviar() {
    if (!tipo) { toast('Selecciona el tipo de hallazgo', 'warn'); return }
    if (!titulo.trim()) { toast('Escribe un título para el hallazgo', 'warn'); return }

    try {
      setLoading(true)

      // Mapear el tipo de hallazgo a severity
      const severityMap = {
        'No Conformidad': 'critical',
        'Observación': 'high',
        'Oportunidad de Mejora': 'medium',
        'Riesgo Identificado': 'low'
      }

      const findingData = {
        title: titulo.trim(),
        description: desc.trim(),
        severity: severityMap[tipo] || 'medium',
        area: area,
        clause: clausula,
        riskLevel: riesgo,
        relatedDocument: doc.trim(),
        findingDate: fecha,
        immediateAction: accion.trim()
      }

      const response = await createFinding(findingData)

      if (response.data?.success) {
        toast('Hallazgo registrado exitosamente', 'ok')
        // Limpiar formulario
        setTipo('')
        setTitulo('')
        setDesc('')
        setArea('Producción')
        setClausula('')
        setRiesgo('Medio')
        setDoc('')
        setFecha('2026-03-05')
        setAccion('')
      } else {
        toast('Error al registrar el hallazgo', 'err')
      }
    } catch (error) {
      console.error('Error al crear hallazgo:', error)
      toast(error.response?.data?.message || 'Error al registrar el hallazgo', 'err')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="page">
      <div className="ph">
        <div><div className="ph-title">Reportar <em>Hallazgo</em></div><div className="ph-sub">Registra observaciones, no conformidades o sugerencias de mejora</div></div>
      </div>

      <div className="mg">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div className="card">
            <div className="card-hd">
              <div className="card-hd-l">
                <div className="card-ico ico-red"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg></div>
                <div><div className="card-title">Nuevo Hallazgo</div><div className="card-sub">Completa el formulario para registrar tu hallazgo</div></div>
              </div>
            </div>
            <div style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="lbl">Tipo de Hallazgo</label>
                  <select className="fselect" value={tipo} onChange={e => setTipo(e.target.value)}>
                    <option value="">Seleccionar tipo…</option>
                    <option>No Conformidad</option>
                    <option>Observación</option>
                    <option>Oportunidad de Mejora</option>
                    <option>Riesgo Identificado</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="lbl">Área / Proceso afectado</label>
                  <select className="fselect" value={area} onChange={e => setArea(e.target.value)}>
                    <option>Producción</option>
                    <option>Calidad</option>
                    <option>Almacén</option>
                    <option>Compras</option>
                    <option>Mantenimiento</option>
                    <option>Recursos Humanos</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="lbl">Cláusula ISO 9001</label>
                  <select className="fselect" value={clausula} onChange={e => setClausula(e.target.value)}>
                    <option value="">Seleccionar cláusula…</option>
                    <option>4.1 Contexto de la organización</option>
                    <option>6.1 Acciones para riesgos</option>
                    <option>7.1 Recursos</option>
                    <option>7.2 Competencia</option>
                    <option>8.1 Planificación operacional</option>
                    <option>9.1 Seguimiento y medición</option>
                    <option>10.2 No conformidad y acción correctiva</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="lbl">Nivel de Riesgo</label>
                  <select className="fselect" value={riesgo} onChange={e => setRiesgo(e.target.value)}>
                    <option>Bajo</option>
                    <option>Medio</option>
                    <option>Alto</option>
                    <option>Crítico</option>
                  </select>
                </div>
                <div className="form-group full">
                  <label className="lbl">Título del Hallazgo</label>
                  <input className="finput" value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Describe brevemente el hallazgo…" />
                </div>
                <div className="form-group full">
                  <label className="lbl">Descripción Detallada</label>
                  <textarea className="ftextarea" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Describe con detalle qué se observó, cuándo, en qué condiciones…" style={{ minHeight: 110 }} />
                </div>
                <div className="form-group full">
                  <label className="lbl">Evidencia / Documento relacionado (opcional)</label>
                  <input className="finput" value={doc} onChange={e => setDoc(e.target.value)} placeholder="Ej: PR-CAL-001, FO-CAL-012…" />
                </div>
                <div className="form-group">
                  <label className="lbl">Fecha del Hallazgo</label>
                  <input className="finput" type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="lbl">Acción Inmediata Tomada</label>
                  <input className="finput" value={accion} onChange={e => setAccion(e.target.value)} placeholder="Si ya tomaste alguna acción…" />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '.7rem', paddingTop: '.5rem', borderTop: '1px solid var(--border)' }}>
                <button className="btn btn-ghost" onClick={() => { setTipo(''); setTitulo(''); setDesc(''); setDoc(''); setAccion('') }}>Limpiar</button>
                <button className="btn btn-out" onClick={() => toast('Borrador guardado', 'ok')}>
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" width="13"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg>Guardar Borrador
                </button>
                <button className="btn btn-red" onClick={enviar} disabled={loading}>
                  {loading ? (
                    <>
                      <div style={{display:'inline-block',width:13,height:13,border:'2px solid rgba(255,255,255,.3)',borderTop:'2px solid white',borderRadius:'50%',animation:'spin 1s linear infinite',marginRight:6}}/>
                      Enviando...
                    </>
                  ) : (
                    <>
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" width="13"><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>Enviar Hallazgo
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Panel lateral */}
        <div className="col-r">
          <div className="card">
            <div className="card-hd">
              <div className="card-hd-l">
                <div className="card-ico ico-ink"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg></div>
                <div><div className="card-title">Mis Hallazgos Anteriores</div></div>
              </div>
            </div>
            <div style={{ padding: '.6rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
                <div style={{ textAlign: 'center', color: 'var(--ash)', fontSize: '.75rem', padding: '1rem' }}>
                  Consulta la sección "Hallazgos" para ver el historial completo de tus reportes.
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-hd">
              <div className="card-hd-l">
                <div className="card-ico ico-blue"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div>
                <div><div className="card-title">¿Qué reportar?</div></div>
              </div>
            </div>
            <div style={{ padding: '.9rem 1.1rem', display: 'flex', flexDirection: 'column', gap: '.7rem', fontSize: '.8rem' }}>
              <div><strong style={{ color: 'var(--err)' }}>No Conformidad:</strong> <span style={{ color: 'var(--ash)' }}>Incumplimiento de un requisito del SGC</span></div>
              <div><strong style={{ color: 'var(--warn)' }}>Observación:</strong> <span style={{ color: 'var(--ash)' }}>Situación que podría convertirse en NC</span></div>
              <div><strong style={{ color: 'var(--ok)' }}>Mejora:</strong> <span style={{ color: 'var(--ash)' }}>Propuesta para mejorar un proceso o documento</span></div>
              <div><strong style={{ color: 'var(--blue)' }}>Riesgo:</strong> <span style={{ color: 'var(--ash)' }}>Situación que puede afectar los objetivos SGC</span></div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
