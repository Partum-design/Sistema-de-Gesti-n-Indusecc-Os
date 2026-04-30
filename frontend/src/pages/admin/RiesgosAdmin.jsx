import { useState } from 'react'
import Modal from '../../components/Modal'
import { toast } from '../../components/Toast'
import { getRisks, createRisk } from '../../api/api'
import { useEffect } from 'react'
import Papa from 'papaparse'

const riesgos = [
  { code: 'R-2026-001', description: 'Falta de personal calificado en auditorías internas', process: 'Calidad', probability: 'Alta', impact: 'Alto', level: 'Crítico', control: 'Programa de capacitación anual', owner: 'A. García', status: 'Abierto' },
  { code: 'R-2026-002', description: 'Desactualización de documentos críticos del SGC', process: 'Documental', probability: 'Media', impact: 'Alto', level: 'Alto', control: 'Alertas automáticas de vencimiento', owner: 'M. López', status: 'En control' },
  { code: 'R-2026-003', description: 'Incumplimiento de proveedores en calidad de materias primas', process: 'Compras', probability: 'Media', impact: 'Medio', level: 'Medio', control: 'Evaluación trimestral de proveedores', owner: 'R. Torres', status: 'En control' },
  { code: 'R-2026-004', description: 'Pérdida de información digital por fallo de sistema', process: 'TI', probability: 'Baja', impact: 'Alto', level: 'Medio', control: 'Respaldo diario automatizado', owner: 'A. García', status: 'Mitigado' },
  { code: 'R-2026-005', description: 'Rotación de personal clave en procesos críticos', process: 'RRHH', probability: 'Media', impact: 'Medio', level: 'Medio', control: 'Planes de sucesión y documentación de procesos', owner: 'C. Pérez', status: 'Abierto' },
]

export default function RiesgosAdmin() {
  const [modalNew, setModalNew] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [riesgosDB, setRiesgosDB] = useState([])
  const [form, setForm] = useState({ description: '', process: 'Calidad', probability: 'Media', impact: 'Medio', owner: '', control: '' })

  const [hasLoaded, setHasLoaded] = useState(false)

  const loadData = async () => {
    try {
      setLoading(true)
      const res = await getRisks()
      setRiesgosDB(res.data?.data || [])
      setHasLoaded(true)
    } catch (err) {
      console.error('Error loading risks:', err)
      setHasLoaded(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleGuardarRiesgo = async () => {
    try {
      if (!form.description || !form.owner) return toast('Descripción y responsable son requeridos', 'err')
      setIsSaving(true)
      await createRisk(form)
      toast('Riesgo registrado correctamente', 'ok')
      setModalNew(false)
      loadData()
      setForm({ description: '', process: 'Calidad', probability: 'Media', impact: 'Medio', owner: '', control: '' })
    } catch (err) {
      toast('Error al registrar riesgo', 'err')
    } finally {
      setIsSaving(false)
    }
  }

  const exportarMatriz = () => {
    const dataToExport = riesgosDB.length > 0 ? riesgosDB : riesgos
    const csv = Papa.unparse(dataToExport)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'matriz_riesgos.csv')
    link.click()
    toast('Matriz exportada correctamente', 'ok')
  }

  // --- Cálculos Dinámicos ---
  const displayRiesgos = (hasLoaded && riesgosDB.length > 0) ? riesgosDB : (hasLoaded && riesgosDB.length === 0 ? [] : riesgos)
  
  // 1. Resumen de nivel de riesgo
  const counts = {
    alto: displayRiesgos.filter(r => (r.probability === 'Alta' && r.impact === 'Alto')).length,
    medio: displayRiesgos.filter(r => (r.probability === 'Media' || r.impact === 'Medio') && !(r.probability === 'Alta' && r.impact === 'Alto')).length,
    bajo: displayRiesgos.filter(r => r.probability === 'Baja' && r.impact === 'Bajo').length,
    conControl: displayRiesgos.filter(r => r.control && r.control.trim() !== '').length
  }
  const pctControl = displayRiesgos.length > 0 ? Math.round((counts.conControl / displayRiesgos.length) * 100) : 0

  // 2. Mapa de Calor (Probabilidad vs Impacto)
  const getHeatCount = (p, i) => displayRiesgos.filter(r => r.probability === p && r.impact === i).length
  const mapaCalorDinamico = [
    { label: 'Alta', cells: [
      { color: '#FEF3C7', text: '#B45309', count: getHeatCount('Alta', 'Bajo') }, 
      { color: '#FEE2E2', text: '#9B1C1C', count: getHeatCount('Alta', 'Medio') }, 
      { color: '#FEE2E2', text: '#9B1C1C', count: getHeatCount('Alta', 'Alto') }
    ]},
    { label: 'Media', cells: [
      { color: '#E8F5EE', text: '#1B6B3A', count: getHeatCount('Media', 'Bajo') }, 
      { color: '#FEF3C7', text: '#B45309', count: getHeatCount('Media', 'Medio') }, 
      { color: '#FEE2E2', text: '#9B1C1C', count: getHeatCount('Media', 'Alto') }
    ]},
    { label: 'Baja', cells: [
      { color: '#E8F5EE', text: '#1B6B3A', count: getHeatCount('Baja', 'Bajo') }, 
      { color: '#E8F5EE', text: '#1B6B3A', count: getHeatCount('Baja', 'Medio') }, 
      { color: '#FEF3C7', text: '#B45309', count: getHeatCount('Baja', 'Alto') }
    ]},
  ]

  // 3. Riesgos por Proceso
  const procesosUnicos = [...new Set(displayRiesgos.map(r => r.process))]
  const riesgosPorProceso = procesosUnicos.map(p => {
    const total = displayRiesgos.filter(r => r.process === p).length
    const max = Math.max(...procesosUnicos.map(px => displayRiesgos.filter(r => r.process === px).length))
    return {
      area: p,
      v: total,
      w: `${(total / (max || 1)) * 100}%`,
      color: total > 2 ? 'var(--red)' : total > 1 ? '#F59E0B' : 'var(--gold)',
      nc: total > 2 ? 'var(--err)' : total > 1 ? 'var(--warn)' : 'var(--gold-d)'
    }
  }).sort((a,b) => b.v - a.v)

  return (
    <main className="page">
      <div className="ph">
        <div>
          <h1 className="ph-title">Matriz de <em>Riesgos</em></h1>
          <p className="ph-sub">Identificación y gestión de riesgos del SGC — ISO 9001:2015 Cl. 6.1</p>
        </div>
         <div className="ph-actions">
          <button className="btn btn-out" onClick={exportarMatriz}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>Exportar
          </button>
          <button className="btn btn-red" onClick={() => setModalNew(true)}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>Nuevo Riesgo
          </button>
        </div>
      </div>

      <div className="sg">
        {[
          { v: 'red', icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>, trend: 'Crítico', tt: 'dn', num: counts.alto, lbl: 'Riesgos Altos', w: `${displayRiesgos.length > 0 ? (counts.alto/displayRiesgos.length)*100 : 0}%` },
          { v: 'warn', icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>, trend: 'Medio', tt: 'n', num: counts.medio, lbl: 'Riesgos Medios', w: `${displayRiesgos.length > 0 ? (counts.medio/displayRiesgos.length)*100 : 0}%` },
          { v: 'ok', icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>, trend: 'Control', tt: 'up', num: counts.bajo, lbl: 'Riesgos Bajos', w: `${displayRiesgos.length > 0 ? (counts.bajo/displayRiesgos.length)*100 : 0}%` },
          { v: 'gold', icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>, iconTrend: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3" width="10"><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7"/></svg>, trend: ' '+counts.conControl, tt: 'up', num: pctControl+'%', lbl: 'Riesgos con Control', w: pctControl+'%' },
        ].map((s, i) => (
          <div key={i} className={`sc sc-${s.v}`}>
            <div className="sc-top"><div className="sc-icon">{s.icon}</div><span className={`trend trend-${s.tt}`}>{s.iconTrend}{s.trend}</span></div>
            <div className="sc-num">{s.num}</div><div className="sc-lbl">{s.lbl}</div>
            <div className="sc-bar"><div className="sc-bar-f" style={{ width: s.w }} /></div>
          </div>
        ))}
      </div>

      <div className="mg">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          {/* Mapa de calor */}
          <div className="card">
            <div className="card-hd">
              <div className="card-hd-l">
                <div className="card-ico ico-red"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"/></svg></div>
                <div><div className="card-title">Mapa de Calor de Riesgos</div><div className="card-sub">Probabilidad vs. Impacto</div></div>
              </div>
            </div>
            <div style={{ padding: '1.4rem' }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around', paddingBottom: 28 }}>
                  {['Alta', 'Media', 'Baja'].map(l => (
                    <div key={l} style={{ fontSize: '.68rem', color: 'var(--ash)', fontWeight: 600, textAlign: 'right', width: 36 }}>{l}</div>
                  ))}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, marginBottom: 8 }}>
                    {mapaCalorDinamico.map((row, ri) =>
                      row.cells.map((cell, ci) => (
                        <div key={`${ri}-${ci}`} style={{ background: cell.color, borderRadius: 6, padding: '14px 8px', textAlign: 'center', border: `1px solid ${cell.text}22` }}>
                          <div style={{ fontSize: '1.2rem', fontWeight: 900, color: cell.text, fontFamily: "'Playfair Display',serif" }}>{cell.count}</div>
                          <div style={{ fontSize: '.6rem', color: cell.text, opacity: .7 }}>riesgo{cell.count !== 1 ? 's' : ''}</div>
                        </div>
                      ))
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
                    {['Bajo', 'Medio', 'Alto'].map(l => (
                      <div key={l} style={{ textAlign: 'center', fontSize: '.68rem', color: 'var(--ash)', fontWeight: 600 }}>{l}</div>
                    ))}
                  </div>
                  <div style={{ textAlign: 'center', fontSize: '.68rem', color: 'var(--ash)', marginTop: 4 }}>Impacto →</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '.8rem', flexWrap: 'wrap' }}>
                {[{ color: '#FEE2E2', label: 'Alto / Crítico' }, { color: '#FEF3C7', label: 'Medio' }, { color: '#E8F5EE', label: 'Bajo / Aceptable' }].map((l, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '.72rem', color: 'var(--ash)' }}>
                    <div style={{ width: 12, height: 12, borderRadius: 3, background: l.color, border: '1px solid var(--border)' }} />{l.label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tabla de riesgos */}
          <div className="card">
            <div className="card-hd">
              <div className="card-hd-l">
                <div className="card-ico ico-gold"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"/></svg></div>
                <div><div className="card-title">Registro de Riesgos</div><div className="card-sub">ISO 9001:2015 — Cláusula 6.1</div></div>
              </div>
            </div>
            <div className="tbl-wrap">
              <table className="tbl">
                <thead><tr><th>Código</th><th>Descripción</th><th>Proceso</th><th>Prob.</th><th>Impacto</th><th>Nivel</th><th>Control</th><th>Responsable</th><th>Estado</th><th></th></tr></thead>
                <tbody>
                  {displayRiesgos.map((r, i) => (
                    <tr key={r._id || i}>
                      <td style={{ fontWeight: 700, fontSize: '.78rem', color: 'var(--red)' }}>{r.code || `R-${2026}-${i+1}`}</td>
                      <td style={{ fontSize: '.8rem', fontWeight: 500, maxWidth: 200 }}>{r.description}</td>
                      <td style={{ fontSize: '.78rem' }}>{r.process}</td>
                      <td style={{ fontSize: '.78rem' }}>{r.probability}</td>
                      <td style={{ fontSize: '.78rem' }}>{r.impact}</td>
                      <td>
                        <span className={`badge ${(r.probability === 'Alta' && r.impact === 'Alto' ? 'b-err' : 'b-warn')}`}>
                          {(r.probability === 'Alta' && r.impact === 'Alto' ? 'Crítico' : 'Medio')}
                        </span>
                      </td>
                      <td style={{ fontSize: '.76rem', color: 'var(--ash)', maxWidth: 160 }}>{r.control || '—'}</td>
                      <td style={{ fontSize: '.78rem' }}>{r.owner}</td>
                      <td><span className={`badge ${r.status === 'Abierto' ? 'b-warn' : 'b-ok'}`}>{r.status || 'Abierto'}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: '.3rem' }}>
                          <button className="ibtn" onClick={() => toast(`Editando ${r.code}`, 'n')}><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="col-r">
          <div className="card">
            <div className="card-hd">
              <div className="card-hd-l">
                <div className="card-ico ico-red"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg></div>
                <div><div className="card-title">Riesgos por Proceso</div></div>
              </div>
            </div>
            <div style={{ padding: '1rem' }}>
              {riesgosPorProceso.length === 0 ? (
                <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--ash)', fontSize: '.8rem' }}>Sin datos registrados</div>
              ) : riesgosPorProceso.map((b, i) => (
                <div key={i} style={{ marginBottom: '.9rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.78rem', marginBottom: '.35rem' }}>
                    <span>{b.area}</span><span style={{ fontWeight: 700, color: b.nc }}>{b.v}</span>
                  </div>
                  <div className="prog-wrap"><div className="prog-fill" style={{ width: b.w, background: b.color }} /></div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-hd">
              <div className="card-hd-l">
                <div className="card-ico ico-warn"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div>
                <div><div className="card-title">Riesgos Críticos</div><div className="card-sub">Requieren acción inmediata</div></div>
              </div>
            </div>
            <div className="al-list">
              {displayRiesgos.filter(r => r.probability === 'Alta' && r.impact === 'Alto').length === 0 ? (
                 <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--ash)', fontSize: '.7rem' }}>Ningún riesgo crítico actual</div>
              ) : displayRiesgos.filter(r => r.probability === 'Alta' && r.impact === 'Alto').slice(0, 3).map((r, i) => (
                <div key={i} className="al al-err">
                  <div className="al-ico"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" width="15"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg></div>
                  <div><div className="al-ttl">{r.code || 'R-CRIT'} · {r.process}</div><div className="al-sub">{r.description.slice(0, 40)}...</div></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

       {modalNew && (
        <Modal 
          title="Nuevo Riesgo / Oportunidad" 
          open={modalNew} 
          onClose={() => setModalNew(false)}
          footer={<>
            <button className="btn btn-out" onClick={() => setModalNew(false)} disabled={isSaving}>Cancelar</button>
            <button className="btn btn-red" onClick={handleGuardarRiesgo} disabled={isSaving}>
              {isSaving ? 'Registrando...' : 'Registrar Riesgo'}
            </button>
          </>}
        >
          <div className="form-grid">
            <div className="form-group full"><label className="lbl">Descripción del Riesgo</label><textarea className="ftextarea" placeholder="Describe el riesgo identificado…" value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
            <div className="form-group"><label className="lbl">Proceso</label><select className="fselect" value={form.process} onChange={e => setForm({...form, process: e.target.value})}><option>Calidad</option><option>Producción</option><option>Compras</option><option>RRHH</option><option>TI</option><option>Documental</option></select></div>
            <div className="form-group"><label className="lbl">Probabilidad</label><select className="fselect" value={form.probability} onChange={e => setForm({...form, probability: e.target.value})}><option>Alta</option><option>Media</option><option>Baja</option></select></div>
            <div className="form-group"><label className="lbl">Impacto</label><select className="fselect" value={form.impact} onChange={e => setForm({...form, impact: e.target.value})}><option>Alto</option><option>Medio</option><option>Bajo</option></select></div>
            <div className="form-group"><label className="lbl">Responsable</label><input className="finput" placeholder="Nombre del responsable" value={form.owner} onChange={e => setForm({...form, owner: e.target.value})} /></div>
            <div className="form-group full"><label className="lbl">Control / Acción de Tratamiento</label><textarea className="ftextarea" placeholder="Describe las medidas de control…" style={{ minHeight: 70 }} value={form.control} onChange={e => setForm({...form, control: e.target.value})} /></div>
          </div>
        </Modal>
      )}
    </main>
  )
}
