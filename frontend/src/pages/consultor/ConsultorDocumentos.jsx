import { useState } from 'react'
import Papa from 'papaparse'
import { toast } from '../../components/Toast'
import { downloadText } from '../../utils/downloadHelpers'

const CLAUSULAS = [
  { punto:'4', titulo:'Contexto de la Organización', subs:[
    { id:'4.1', num:'4.1', titulo:'Contexto de la Organización', desc:'Cuestiones externas e internas pertinentes para el SGC', completado:true, docs:['MA-SGC-001 v.02 — Manual del SGC','MA-CTX-001 v.01 — Análisis de Contexto','FO-CTX-001 v.01 — Análisis FODA'] },
    { id:'4.2', num:'4.2', titulo:'Partes Interesadas', desc:'Identificar partes interesadas pertinentes y sus requisitos', completado:true, docs:['FO-CTX-003 v.02 — Matriz Partes Interesadas','PR-CLI-001 v.01 — Gestión de Requisitos del Cliente'] },
    { id:'4.3', num:'4.3', titulo:'Alcance del SGC', desc:'Límites y aplicabilidad del sistema de gestión de la calidad', completado:true, docs:['MA-SGC-001 v.02 — Sección 3: Alcance del SGC'] },
    { id:'4.4', num:'4.4', titulo:'SGC y sus Procesos', desc:'Establecer, implementar, mantener y mejorar el SGC', completado:false, docs:['FO-SGC-001 v.04 — Mapa de Procesos','FO-SGC-002 v.02 — Caracterización de Procesos'] },
  ]},
  { punto:'5', titulo:'Liderazgo', subs:[
    { id:'5.1', num:'5.1', titulo:'Liderazgo y Compromiso', desc:'Compromiso de la alta dirección con el SGC y el enfoque al cliente', completado:true, docs:['MA-SGC-001 v.02 — Sección 5: Liderazgo','FO-DIR-001 v.01 — Acta de Compromiso de Dirección'] },
    { id:'5.2', num:'5.2', titulo:'Política de Calidad', desc:'Establecer, implementar y mantener la política de calidad', completado:true, docs:['PO-CAL-001 v.03 — Política de Calidad'] },
    { id:'5.3', num:'5.3', titulo:'Roles y Responsabilidades', desc:'Asignar responsabilidades y autoridades dentro del SGC', completado:false, docs:[] },
  ]},
  { punto:'6', titulo:'Planificación', subs:[
    { id:'6.1', num:'6.1', titulo:'Riesgos y Oportunidades', desc:'Determinar riesgos y oportunidades que deben abordarse', completado:true, docs:['FO-RH-015 v.05 — Matriz de Identificación de Riesgos','PR-RIE-001 v.02 — Gestión de Riesgos'] },
    { id:'6.2', num:'6.2', titulo:'Objetivos de Calidad', desc:'Establecer objetivos de calidad y planificación para lograrlos', completado:true, docs:['FO-OBJ-001 v.02 — Matriz de Objetivos de Calidad'] },
    { id:'6.3', num:'6.3', titulo:'Planificación de los Cambios', desc:'Planificar los cambios al SGC de manera controlada', completado:false, docs:[] },
  ]},
  { punto:'7', titulo:'Apoyo', subs:[
    { id:'7.1', num:'7.1', titulo:'Recursos', desc:'Determinar y proporcionar los recursos necesarios', completado:true, docs:['PR-REC-001 v.01 — Gestión de Recursos','FO-INF-001 v.02 — Inventario de Infraestructura'] },
    { id:'7.2', num:'7.2', titulo:'Competencia', desc:'Determinar y asegurar la competencia necesaria del personal', completado:false, docs:['FO-RH-002 v.03 — Matriz de Competencias'] },
    { id:'7.3', num:'7.3', titulo:'Toma de Conciencia', desc:'Asegurar que las personas sean conscientes de la política y objetivos', completado:false, docs:[] },
    { id:'7.4', num:'7.4', titulo:'Comunicación', desc:'Determinar las comunicaciones internas y externas pertinentes', completado:false, docs:[] },
    { id:'7.5', num:'7.5', titulo:'Información Documentada', desc:'Controlar la información documentada requerida por la norma', completado:true, docs:['PR-CAL-001 v.04 — Control de Información Documentada','FO-CAL-012 v.03 — Registro de Inspección'] },
  ]},
  { punto:'8', titulo:'Operación', subs:[
    { id:'8.1', num:'8.1', titulo:'Planificación y Control Operacional', desc:'Planificar, implementar, controlar y revisar los procesos operativos', completado:true, docs:['PR-PRD-005 v.02 — Control de Producción','FO-PRD-001 v.01 — Plan de Producción'] },
    { id:'8.2', num:'8.2', titulo:'Requisitos para Productos y Servicios', desc:'Comunicación con el cliente y determinación de requisitos', completado:false, docs:['FO-COM-001 v.01 — Revisión de Requisitos del Cliente'] },
    { id:'8.3', num:'8.3', titulo:'Diseño y Desarrollo', desc:'Proceso de diseño y desarrollo de productos y servicios', completado:false, docs:[] },
    { id:'8.4', num:'8.4', titulo:'Control de Procesos Externos', desc:'Controlar los productos y servicios suministrados externamente', completado:false, docs:['PR-COM-003 v.03 — Procedimiento de Compras (Vencido)'] },
    { id:'8.5', num:'8.5', titulo:'Producción y Provisión del Servicio', desc:'Implementar la producción bajo condiciones controladas', completado:true, docs:['IT-PRD-008 v.01 — Instructivo de Control de Producción'] },
    { id:'8.6', num:'8.6', titulo:'Liberación de Productos y Servicios', desc:'Verificación de cumplimiento de requisitos antes de entrega', completado:true, docs:['FO-CAL-012 v.03 — Formato de Inspección de Calidad'] },
    { id:'8.7', num:'8.7', titulo:'Control de Salidas No Conformes', desc:'Identificar y controlar las salidas no conformes', completado:false, docs:[] },
  ]},
  { punto:'9', titulo:'Evaluación del Desempeño', subs:[
    { id:'9.1', num:'9.1', titulo:'Seguimiento, Medición, Análisis y Evaluación', desc:'Determinar qué, cómo y cuándo se realiza el seguimiento', completado:false, docs:['FO-IND-001 v.02 — Cuadro de Indicadores de Calidad'] },
    { id:'9.2', num:'9.2', titulo:'Auditoría Interna', desc:'Realizar auditorías internas a intervalos planificados', completado:true, docs:['PR-AUD-001 v.02 — Procedimiento de Auditoría Interna','FO-AUD-001 v.01 — Plan de Auditoría'] },
    { id:'9.3', num:'9.3', titulo:'Revisión por la Dirección', desc:'Revisar el SGC para asegurar su idoneidad y eficacia', completado:false, docs:[] },
  ]},
  { punto:'10', titulo:'Mejora', subs:[
    { id:'10.1', num:'10.1', titulo:'Generalidades', desc:'Determinar y seleccionar oportunidades de mejora', completado:false, docs:[] },
    { id:'10.2', num:'10.2', titulo:'No Conformidad y Acción Correctiva', desc:'Reaccionar ante no conformidades y tomar acciones correctivas', completado:true, docs:['FO-NC-001 v.04 — Registro de No Conformidades','PR-MC-001 v.02 — Acciones Correctivas y Preventivas'] },
    { id:'10.3', num:'10.3', titulo:'Mejora Continua', desc:'Mejorar continuamente la conveniencia, adecuación y eficacia del SGC', completado:false, docs:[] },
  ]},
]

const todasLasSubs = CLAUSULAS.flatMap(p => p.subs)

export default function ConsultorDocumentos() {
  const [selectedSub, setSelectedSub] = useState(null)
  const [expandedPuntos, setExpandedPuntos] = useState({ '4':true })

  const totalSubs = todasLasSubs.length
  const completadas = todasLasSubs.filter(s=>s.completado).length
  const totalDocs = todasLasSubs.reduce((a,s)=>a+s.docs.length,0)
  const pendientes = totalSubs - completadas

  function exportListadoDocumental() {
    const csv = Papa.unparse([
      ['LISTADO DOCUMENTAL ISO 9001:2015'],
      ['Fecha de Exportación', new Date().toLocaleDateString('es-ES')],
      [],
      ['RESUMEN'],
      ['Total de Subcláusulas', totalSubs],
      ['Subcláusulas Completas', completadas],
      ['Subcláusulas Pendientes', pendientes],
      ['Total de Documentos', totalDocs],
      [],
      ['DETALLE POR CLÁUSULA'],
      ['Punto', 'Subcláusula', 'Descripción', 'Estado', 'Documentos'],
      ...todasLasSubs.map(s => [s.num.split('.')[0], s.num, s.titulo, s.completado ? 'Completo' : 'Pendiente', s.docs.length]),
    ])
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `Listado_Documental_Consultor_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast('Listado documental exportado en CSV', 'ok')
  }

  function togglePunto(p) {
    setExpandedPuntos(prev => ({ ...prev,[p]:!prev[p] }))
  }

  function exportSubidaToCSV(sub) {
    const csv = Papa.unparse([
      ['Cláusula', `${sub.num} — ${sub.titulo}`],
      ['Descripción', sub.desc],
      ['Estado', sub.completado ? 'Completo' : 'Pendiente'],
      [],
      ['Documentos Asociados'],
      ...sub.docs.map(d => [d]),
    ])
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `Clausula_${sub.num.replace('.', '-')}_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast(`Cláusula ${sub.num} exportada en CSV`, 'ok')
  }

  function downloadDocumentFile(docName) {
    const content = `Documento: ${docName}\nGenerado: ${new Date().toLocaleDateString('es-ES')}\n\nEste archivo se descarga como ejemplo de contenido.`
    downloadText(content, `${docName.replace(/\s+/g, '_')}.txt`)
    toast(`Descargando ${docName}`, 'ok')
  }

  if (selectedSub) {
    const punto = CLAUSULAS.find(p => p.subs.some(s=>s.id===selectedSub.id))
    return (
      <main className="page">
        <div className="ph" style={{ marginBottom:'1.4rem' }}>
          <div>
            <div style={{ display:'flex',gap:'.5rem',alignItems:'center',marginBottom:'.4rem' }}>
              <span className="badge b-ok">ISO 9001:2015</span>
              <span style={{ fontSize:'.75rem',color:'var(--ash)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" width="10"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                Punto {punto.punto} — {punto.titulo}
              </span>
            </div>
            <h1 className="ph-title">{selectedSub.num} — <em>{selectedSub.titulo}</em></h1>
            <p className="ph-sub">{selectedSub.desc}</p>
          </div>
          <div className="ph-actions">
            <button className="btn btn-out" onClick={() => setSelectedSub(null)}>← Volver</button>
            <button className="btn btn-out" onClick={() => exportSubidaToCSV(selectedSub)}>
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
              Exportar
            </button>
          </div>
        </div>

        <div className="mg">
          <div style={{ display:'flex',flexDirection:'column',gap:'1.2rem' }}>
            <div className="card">
              <div style={{ padding:'1.2rem' }}>
                <div style={{ display:'flex',alignItems:'center',gap:12,marginBottom:'1rem' }}>
                  <div style={{ width:48,height:48,borderRadius:8,background:selectedSub.completado?'var(--ok-bg)':'var(--warn-bg)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.1rem',fontWeight:900,color:selectedSub.completado?'var(--ok)':'var(--warn)',fontFamily:"'Playfair Display',serif",flexShrink:0 }}>{selectedSub.num}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700,fontSize:'1rem' }}>{selectedSub.titulo}</div>
                    <div style={{ fontSize:'.73rem',color:'var(--ash)' }}>ISO 9001:2015 — Cláusula {selectedSub.num}</div>
                  </div>
                  <span className={`badge ${selectedSub.completado?'b-ok':'b-warn'}`}>{selectedSub.completado?'Completo':'Pendiente'}</span>
                </div>
                <div style={{ background:'var(--surface)',borderRadius:8,padding:'1rem',fontSize:'.83rem',lineHeight:1.7,color:'var(--ink6)',marginBottom:'1rem' }}>{selectedSub.desc}</div>
                <div className="readonly-badge"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>Solo lectura — Consultor</div>
              </div>
            </div>

            <div className="card">
              <div className="card-hd">
                <div className="card-hd-l">
                  <div className="card-ico ico-blue"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg></div>
                  <div><div className="card-title">Documentos de esta Cláusula</div><div className="card-sub">{selectedSub.docs.length} archivo{selectedSub.docs.length!==1?'s':''} registrado{selectedSub.docs.length!==1?'s':''}</div></div>
                </div>
              </div>
              {selectedSub.docs.length > 0
                ? <div style={{ padding:'.8rem',display:'flex',flexDirection:'column',gap:'.5rem' }}>
                    {selectedSub.docs.map((doc,i) => (
                      <div key={i} style={{ display:'flex',alignItems:'center',gap:10,padding:'10px 11px',borderRadius:6,border:'1px solid var(--border)',cursor:'pointer',transition:'all .2s' }}
                        onMouseOver={e=>e.currentTarget.style.borderColor='var(--gold)'}
                        onMouseOut={e=>e.currentTarget.style.borderColor='var(--border)'}
                        onClick={() => downloadDocumentFile(doc)}>
                        <div className="dn-ico"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg></div>
                        <div style={{ flex:1,fontSize:'.83rem',fontWeight:500 }}>{doc}</div>
                        <svg fill="none" viewBox="0 0 24 24" stroke="var(--ash-l)" strokeWidth="2" width="14"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                      </div>
                    ))}
                  </div>
                : <div style={{ padding:'1.5rem',textAlign:'center',color:'var(--ash)',fontSize:'.83rem' }}>
                    Sin documentos registrados para esta cláusula
                  </div>
              }
            </div>
          </div>

          <div className="col-r">
            <div className="card">
              <div className="card-hd"><div className="card-hd-l"><div className="card-ico ico-ok"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div><div><div className="card-title">Otras Cláusulas — Punto {punto.punto}</div></div></div></div>
              <div style={{ padding:'.5rem' }}>
                {punto.subs.filter(s=>s.id!==selectedSub.id).map((s,i) => (
                  <div key={i} style={{ display:'flex',alignItems:'center',gap:10,padding:'9px 10px',borderRadius:6,cursor:'pointer',transition:'background .15s' }}
                    onMouseOver={e=>e.currentTarget.style.background='var(--surface)'}
                    onMouseOut={e=>e.currentTarget.style.background='transparent'}
                    onClick={() => setSelectedSub(s)}>
                    <div style={{ fontWeight:700,fontSize:'.75rem',color:s.completado?'var(--ok)':'var(--warn)',minWidth:36 }}>{s.num}</div>
                    <div style={{ flex:1,fontSize:'.82rem',fontWeight:500 }}>{s.titulo}</div>
                    <span className={`badge ${s.completado?'b-ok':'b-warn'}`} style={{ fontSize:'.6rem' }}>
                      {s.completado ? <svg fill="currentColor" viewBox="0 0 24 24" width="8"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg> : <svg fill="currentColor" viewBox="0 0 24 24" width="8"><circle cx="12" cy="12" r="12"/></svg>}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="page">
      <div className="ph">
        <div><h1 className="ph-title">Documentos <em>ISO 9001</em></h1><p className="ph-sub">ISO 9001:2015 — Puntos 4 al 10 · Solo lectura</p></div>
        <div className="ph-actions">
          <button className="btn btn-out" onClick={exportListadoDocumental}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>Exportar
          </button>
        </div>
      </div>

      <div className="sg">
        {[
          { v:'ok', num:`${completadas}/${totalSubs}`, lbl:'Cláusulas Completas', w:`${Math.round(completadas/totalSubs*100)}%` },
          { v:'gold', num:totalDocs, lbl:'Documentos Totales', w:'85%' },
          { v:'blue', num:CLAUSULAS.length, lbl:'Puntos ISO', w:'100%' },
          { v:'warn', num:pendientes, lbl:'Pendientes', w:`${Math.round(pendientes/totalSubs*100)}%` },
        ].map((s,i) => (
          <div key={i} className={`sc sc-${s.v}`}>
            <div className="sc-num">{s.num}</div><div className="sc-lbl">{s.lbl}</div>
            <div className="sc-bar"><div className="sc-bar-f" style={{ width:s.w }}/></div>
          </div>
        ))}
      </div>

      <div style={{ display:'flex',flexDirection:'column',gap:'1rem' }}>
        {CLAUSULAS.map(punto => {
          const isOpen = !!expandedPuntos[punto.punto]
          const subsCompletas = punto.subs.filter(s=>s.completado).length
          const puntoCumple = subsCompletas===punto.subs.length
          return (
            <div key={punto.punto} className="card">
              <div style={{ display:'flex',alignItems:'center',gap:12,padding:'1rem 1.3rem',cursor:'pointer',userSelect:'none' }}
                onClick={() => togglePunto(punto.punto)}>
                <div style={{ width:44,height:44,borderRadius:8,background:puntoCumple?'var(--ok-bg)':'var(--warn-bg)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Playfair Display',serif",fontSize:'1.1rem',fontWeight:900,color:puntoCumple?'var(--ok)':'var(--warn)',flexShrink:0 }}>
                  {punto.punto}
                </div>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ fontWeight:700,fontSize:'.95rem' }}>Punto {punto.punto} — {punto.titulo}</div>
                  <div style={{ fontSize:'.73rem',color:'var(--ash)',marginTop:2 }}>{subsCompletas}/{punto.subs.length} cláusulas completas</div>
                </div>
                <div style={{ display:'flex',gap:6,alignItems:'center' }}>
                  <span className={`badge ${puntoCumple?'b-ok':'b-warn'}`}>{puntoCumple?'Completo':'Pendiente'}</span>
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{ width:16,height:16,transition:'transform .2s',transform:isOpen?'rotate(180deg)':'rotate(0deg)',flexShrink:0 }}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
                </div>
              </div>

              {isOpen && (
                <div style={{ borderTop:'1px solid var(--border)',display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:'.8rem',padding:'1rem 1.3rem' }}>
                  {punto.subs.map(sub => (
                    <div key={sub.id} className="card" onClick={() => setSelectedSub(sub)}
                      style={{ cursor:'pointer',transition:'all .2s',border:`1px solid ${sub.completado?'rgba(27,107,58,.2)':'rgba(180,83,9,.15)'}` }}
                      onMouseOver={e=>e.currentTarget.style.boxShadow='0 4px 14px rgba(0,0,0,.08)'}
                      onMouseOut={e=>e.currentTarget.style.boxShadow=''}>
                      <div style={{ padding:'1rem' }}>
                        <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:'.6rem' }}>
                          <div style={{ width:36,height:36,borderRadius:6,background:sub.completado?'var(--ok-bg)':'var(--warn-bg)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Playfair Display',serif",fontSize:'.85rem',fontWeight:900,color:sub.completado?'var(--ok)':'var(--warn)',flexShrink:0 }}>{sub.num}</div>
                          <span className={`badge ${sub.completado?'b-ok':'b-warn'}`} style={{ fontSize:'.6rem' }}>{sub.completado?'OK':'Pendiente'}</span>
                        </div>
                        <div style={{ fontWeight:700,fontSize:'.85rem',marginBottom:'.3rem' }}>{sub.titulo}</div>
                        <div style={{ fontSize:'.73rem',color:'var(--ash)',lineHeight:1.5,marginBottom:'.6rem' }}>{sub.desc}</div>
                        <div style={{ fontSize:'.7rem',color:'var(--ash)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          {sub.docs.length} documento{sub.docs.length!==1?'s':''} · Ver detalle <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" width="10"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </main>
  )
}
