import { useState } from 'react'
import { toast } from '../../components/Toast'

function Toggle({ label, sub, defaultChecked }) {
  const [checked, setChecked] = useState(defaultChecked)
  return (
    <div className="toggle-wrap">
      <div><div className="toggle-label">{label}</div>{sub && <div className="toggle-sub">{sub}</div>}</div>
      <label className="toggle">
        <input type="checkbox" checked={checked} onChange={e => setChecked(e.target.checked)} />
        <span className="toggle-slider" />
      </label>
    </div>
  )
}

export default function Configuracion() {
  return (
    <main className="page">
      <div className="ph">
        <div>
          <h1 className="ph-title">Configuración del <em>Sistema</em></h1>
          <p className="ph-sub">Personalización y ajustes del SGC Indusecc</p>
        </div>
        <div className="ph-actions">
          <button className="btn btn-red" onClick={() => toast('Cambios guardados correctamente', 'ok')}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
            Guardar Cambios
          </button>
        </div>
      </div>

      <div className="mg-3">
        {/* Col 1: General */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div className="card">
            <div className="card-hd">
              <div className="card-hd-l">
                <div className="card-ico ico-ink"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg></div>
                <div><div className="card-title">Información de la Organización</div></div>
              </div>
            </div>
            <div style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group"><label className="lbl">Razón Social</label><input className="finput" defaultValue="Indusecc S.A. de C.V." /></div>
              <div className="form-group"><label className="lbl">Norma de Referencia</label><input className="finput" defaultValue="ISO 9001:2015" /></div>
              <div className="form-group"><label className="lbl">Número de Certificación</label><input className="finput" defaultValue="BV-ISO-2025-0142" /></div>
              <div className="form-group"><label className="lbl">Organismo Certificador</label><input className="finput" defaultValue="Bureau Veritas" /></div>
              <div className="form-group"><label className="lbl">Vigencia del Certificado</label><input className="finput" type="date" defaultValue="2028-01-15" /></div>
            </div>
          </div>

          <div className="card">
            <div className="card-hd">
              <div className="card-hd-l">
                <div className="card-ico ico-gold"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg></div>
                <div><div className="card-title">Notificaciones</div></div>
              </div>
            </div>
            <div style={{ padding: '1rem 1.3rem' }}>
              <Toggle label="Alertas de vencimiento" sub="Notificar 30 días antes del vencimiento" defaultChecked={true} />
              <Toggle label="Correo de auditorías" sub="Avisos de auditorías programadas" defaultChecked={true} />
              <Toggle label="No conformidades abiertas" sub="Recordatorio semanal de NC activas" defaultChecked={true} />
              <Toggle label="Nuevos documentos" sub="Notificar al equipo sobre nuevas subidas" defaultChecked={false} />
            </div>
          </div>
        </div>

        {/* Col 2: Documentos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div className="card">
            <div className="card-hd">
              <div className="card-hd-l">
                <div className="card-ico ico-red"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg></div>
                <div><div className="card-title">Control Documental</div></div>
              </div>
            </div>
            <div style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group"><label className="lbl">Prefijo para Procedimientos</label><input className="finput" defaultValue="PR-" /></div>
              <div className="form-group"><label className="lbl">Prefijo para Manuales</label><input className="finput" defaultValue="MA-" /></div>
              <div className="form-group"><label className="lbl">Prefijo para Formatos</label><input className="finput" defaultValue="FO-" /></div>
              <div className="form-group"><label className="lbl">Días de alerta antes de vencimiento</label>
                <select className="fselect"><option>30 días</option><option>60 días</option><option>90 días</option></select>
              </div>
              <div className="form-group"><label className="lbl">Aprobación requerida por</label>
                <select className="fselect"><option>Gerente de Calidad</option><option>Director General</option><option>Ambos</option></select>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-hd">
              <div className="card-hd-l">
                <div className="card-ico ico-ink"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg></div>
                <div><div className="card-title">Seguridad</div></div>
              </div>
            </div>
            <div style={{ padding: '1rem 1.3rem' }}>
              <Toggle label="Autenticación de dos factores" sub="Requerir 2FA para todos los usuarios" defaultChecked={false} />
              <Toggle label="Bloqueo por inactividad" sub="Cerrar sesión tras 30 minutos" defaultChecked={true} />
              <Toggle label="Log de acciones" sub="Registrar todas las acciones del sistema" defaultChecked={true} />
            </div>
          </div>
        </div>

        {/* Col 3: Integraciones */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div className="card">
            <div className="card-hd">
              <div className="card-hd-l">
                <div className="card-ico ico-gold"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg></div>
                <div><div className="card-title">Integraciones</div></div>
              </div>
            </div>
            <div style={{ padding: '.8rem' }}>
              {[
                { name: 'Gmail', sub: 'Notificaciones por correo', bg: '#EA4335', badge: 'b-ok', status: 'Activo', icon: <svg fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="2" width="18"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg> },
                { name: 'SharePoint', sub: 'Repositorio de documentos', bg: '#0078D4', badge: 'b-gray', status: 'Desconectado', icon: <svg fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="2" width="18"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg> },
                { name: 'Slack', sub: 'Alertas de equipo', bg: '#2EB67D', badge: 'b-ok', status: 'Activo', icon: <svg fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="2" width="18"><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg> },
              ].map((int, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 12px', borderRadius: 6, border: '1px solid var(--border)', marginBottom: '.6rem', background: 'var(--surface)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <div style={{ width: 34, height: 34, background: int.bg, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{int.icon}</div>
                    <div><div style={{ fontSize: '.82rem', fontWeight: 600 }}>{int.name}</div><div style={{ fontSize: '.68rem', color: 'var(--ash)' }}>{int.sub}</div></div>
                  </div>
                  <span className={`badge ${int.badge}`}>{int.status}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-hd">
              <div className="card-hd-l">
                <div className="card-ico ico-ink"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"/></svg></div>
                <div><div className="card-title">Respaldo y Datos</div></div>
              </div>
            </div>
            <div style={{ padding: '1rem 1.3rem' }}>
              <Toggle label="Respaldo automático" sub="Diario a las 02:00 AM" defaultChecked={true} />
              <div style={{ padding: '.8rem 0' }}>
                <div style={{ fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--ash)', marginBottom: '.5rem' }}>Último respaldo</div>
                <div style={{ fontSize: '.82rem', fontWeight: 600, color: 'var(--ok)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <svg fill="currentColor" viewBox="0 0 24 24" width="14"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg> 
                  Hoy, 02:00 AM — 248 MB
                </div>
              </div>
              <button className="btn btn-out" style={{ width: '100%', justifyContent: 'center' }} onClick={() => toast('Descargando respaldo…', 'n')}>
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                Descargar Respaldo
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
