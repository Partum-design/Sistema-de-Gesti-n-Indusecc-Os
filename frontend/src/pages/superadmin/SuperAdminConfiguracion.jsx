import { useState, useEffect } from 'react'
import { toast } from '../../components/Toast'
import { getConfiguration, updateConfiguration, restoreConfiguration, clearCache, purgeLogs, logoutAllSessions } from '../../api/api'

export default function SuperAdminConfiguracion() {
  const [config, setConfig] = useState({
    siteName: 'Indusecc SGC', version: '2.4.1', sessionTimeout: '60', maxUsers: '50',
    logRetention: '365', twoFactor: true, maintenanceMode: false, emailNotif: true,
    autoBackup: true, backupFrequency: 'Diario', debugMode: false, allowRegister: false,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadConfig()
  }, [])

  async function loadConfig() {
    try {
      setLoading(true)
      const res = await getConfiguration()
      if (res.data?.success && res.data?.data) {
        const cfg = {}
        const dataArr = res.data.data;
        if (Array.isArray(dataArr)) {
          dataArr.forEach(item => {
            cfg[item.key] = item.value
          })
          setConfig(prev => ({ ...prev, ...cfg }))
        }
      }
    } catch (err) {
      toast(`Error cargando configuración: ${err.response?.data?.message || err.message}`, 'err')
    } finally {
      setLoading(false)
    }
  }

  const update = (k, v) => setConfig(p => ({ ...p, [k]: v }))

  async function saveAll() {
    try {
      setLoading(true)
      const res = await updateConfiguration(config)
      if (res.data?.success) {
        toast('Configuración global guardada exitosamente', 'ok')
      } else {
        toast(res.data?.message || 'Error al guardar configuración', 'err')
      }
    } catch (err) {
      toast(`Error: ${err.response?.data?.message || err.message}`, 'err')
    } finally {
      setLoading(false)
    }
  }

  async function handleRestoreDefaults() {
    try {
      const res = await restoreConfiguration()
      if (res.data?.success) {
        toast('Configuración restaurada a valores predeterminados', 'warn')
        await loadConfig()
      } else {
        toast(res.data?.message || 'Error al restaurar', 'err')
      }
    } catch (err) {
      toast(`Error: ${err.response?.data?.message || err.message}`, 'err')
    }
  }

  async function handleClearCache() {
    try {
      const res = await clearCache()
      if (res.data?.success) {
        toast('Caché del sistema limpiado exitosamente', 'ok')
      } else {
        toast(res.data?.message || 'Error al limpiar caché', 'err')
      }
    } catch (err) {
      toast(`Error: ${err.response?.data?.message || err.message}`, 'err')
    }
  }

  async function handlePurgeLogs() {
    try {
      const daysOld = parseInt(config.logRetention) || 365
      const res = await purgeLogs(daysOld)
      if (res.data?.success) {
        toast(`${res.data?.data?.deletedCount || 0} logs antiguos purgados`, 'ok')
      } else {
        toast(res.data?.message || 'Error al purgar logs', 'err')
      }
    } catch (err) {
      toast(`Error: ${err.response?.data?.message || err.message}`, 'err')
    }
  }

  async function handleLogoutAll() {
    try {
      const res = await logoutAllSessions()
      if (res.data?.success) {
        toast(`${res.data?.data?.loggedOut || 'Todos'} usuarios desconectados`, 'ok')
      } else {
        toast(res.data?.message || 'Error al desconectar usuarios', 'err')
      }
    } catch (err) {
      toast(`Error: ${err.response?.data?.message || err.message}`, 'err')
    }
  }

  return (
    <main className="page">
      <div className="ph">
        <div>
          <h1 className="ph-title">Configuración <em>Global</em></h1>
          <p className="ph-sub">Control total sobre los parámetros del sistema — solo accesible para Super Admin</p>
        </div>
        <div className="ph-actions">
          <button className="btn btn-out" onClick={handleRestoreDefaults}
            style={{ color: '#ef4444' }}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            Restaurar Defaults
          </button>
          <button className="btn btn-red" onClick={saveAll}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg>
            Guardar Todo
          </button>
        </div>
      </div>

      <div className="mg">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          {/* General */}
          <div className="card">
            <div className="card-hd">
              <div className="card-hd-l">
                <div className="card-ico" style={{ background: 'var(--red-b)', color: 'var(--red)' }}>
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><circle cx="12" cy="12" r="3"/></svg>
                </div>
                <div><div className="card-title">Configuración General</div></div>
              </div>
            </div>
            <div style={{ padding: '0 1.3rem 1.3rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '.73rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--ash)', display: 'block', marginBottom: 5 }}>Nombre del Sistema</label>
                <input className="finput" value={config.siteName} onChange={e => update('siteName', e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: '.73rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--ash)', display: 'block', marginBottom: 5 }}>Versión Actual</label>
                <input className="finput" value={config.version} onChange={e => update('version', e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: '.73rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--ash)', display: 'block', marginBottom: 5 }}>Timeout de Sesión (min)</label>
                <input className="finput" type="number" value={config.sessionTimeout} onChange={e => update('sessionTimeout', e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: '.73rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--ash)', display: 'block', marginBottom: 5 }}>Máximo de Usuarios</label>
                <input className="finput" type="number" value={config.maxUsers} onChange={e => update('maxUsers', e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: '.73rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--ash)', display: 'block', marginBottom: 5 }}>Retención de Logs (días)</label>
                <input className="finput" type="number" value={config.logRetention} onChange={e => update('logRetention', e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: '.73rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--ash)', display: 'block', marginBottom: 5 }}>Frecuencia de Backup</label>
                <select className="finput" value={config.backupFrequency} onChange={e => update('backupFrequency', e.target.value)}>
                  {['Diario', 'Semanal', 'Mensual'].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Seguridad */}
          <div className="card">
            <div className="card-hd">
              <div className="card-hd-l">
                <div className="card-ico" style={{ background: 'rgba(239,68,68,.1)', color: '#ef4444' }}>
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                </div>
                <div><div className="card-title">Seguridad y Acceso</div></div>
              </div>
            </div>
            <div style={{ padding: '0 1.3rem 1.3rem', display: 'flex', flexDirection: 'column', gap: '.9rem' }}>
              {[
                { key: 'twoFactor', label: 'Autenticación de dos factores (2FA)', sub: 'Requerido para todos los usuarios', danger: false },
                { key: 'allowRegister', label: 'Permitir auto-registro de usuarios', sub: 'Si está desactivado, solo Super Admin puede crear cuentas', danger: true },
                { key: 'maintenanceMode', label: 'Modo de mantenimiento', sub: 'Bloquea el acceso a todos los usuarios excepto Super Admin', danger: true },
                { key: 'debugMode', label: 'Modo debug', sub: 'Muestra información técnica extendida en errores', danger: true },
              ].map(item => (
                <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: item.danger && config[item.key] ? 'rgba(239,68,68,.05)' : 'var(--surface)', borderRadius: 8, border: `1px solid ${item.danger && config[item.key] ? 'rgba(239,68,68,.2)' : 'var(--border)'}`, transition: 'all .2s' }}>
                  <div>
                    <div style={{ fontSize: '.85rem', fontWeight: 600, color: item.danger && config[item.key] ? '#ef4444' : 'var(--ink)' }}>{item.label}</div>
                    <div style={{ fontSize: '.72rem', color: 'var(--ash)' }}>{item.sub}</div>
                  </div>
                  <label style={{ position: 'relative', width: 44, height: 24, flexShrink: 0, cursor: 'pointer' }}>
                    <input type="checkbox" checked={config[item.key]} onChange={e => update(item.key, e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
                    <span style={{ position: 'absolute', inset: 0, borderRadius: 34, background: config[item.key] ? (item.danger ? '#ef4444' : 'var(--red)') : '#cbd5e1', transition: '.3s' }} />
                    <span style={{ position: 'absolute', left: config[item.key] ? 22 : 2, top: 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: '.3s', boxShadow: '0 1px 4px rgba(0,0,0,.2)' }} />
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Col derecha */}
        <div className="col-r">
          {/* Notificaciones */}
          <div className="card">
            <div className="card-hd">
              <div className="card-hd-l">
                <div className="card-ico" style={{ background: 'rgba(59,130,246,.1)', color: '#3b82f6' }}>
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
                </div>
                <div><div className="card-title">Notificaciones</div></div>
              </div>
            </div>
            <div style={{ padding: '0 1.2rem 1.2rem', display: 'flex', flexDirection: 'column', gap: '.8rem' }}>
              {[
                { key: 'emailNotif', label: 'Notificaciones por email', sub: 'Alertas críticas y resúmenes' },
                { key: 'autoBackup', label: 'Backup automático', sub: `Frecuencia: ${config.backupFrequency}` },
              ].map(item => (
                <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '.84rem', fontWeight: 600, color: 'var(--ink)' }}>{item.label}</div>
                    <div style={{ fontSize: '.72rem', color: 'var(--ash)' }}>{item.sub}</div>
                  </div>
                  <label style={{ position: 'relative', width: 44, height: 24, flexShrink: 0, cursor: 'pointer' }}>
                    <input type="checkbox" checked={config[item.key]} onChange={e => update(item.key, e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
                    <span style={{ position: 'absolute', inset: 0, borderRadius: 34, background: config[item.key] ? 'var(--red)' : '#cbd5e1', transition: '.3s' }} />
                    <span style={{ position: 'absolute', left: config[item.key] ? 22 : 2, top: 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: '.3s', boxShadow: '0 1px 4px rgba(0,0,0,.2)' }} />
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Info del sistema */}
          <div className="card" style={{ marginTop: '1rem' }}>
            <div className="card-hd">
              <div className="card-hd-l">
                <div className="card-ico" style={{ background: 'rgba(16,185,129,.1)', color: '#10b981' }}>
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                </div>
                <div><div className="card-title">Info del Sistema</div></div>
              </div>
            </div>
            <div style={{ padding: '0 1.2rem 1.2rem', display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
              {[
                { label: 'Versión', val: config.version },
                { label: 'Entorno', val: 'Producción' },
                { label: 'Último backup', val: 'Hoy, 03:00' },
                { label: 'BD tamaño', val: '2.3 GB' },
                { label: 'Uptime', val: '99.98%' },
                { label: 'Node.js', val: '20.x LTS' },
              ].map((r, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: i < 5 ? '1px solid var(--border)' : 'none' }}>
                  <span style={{ fontSize: '.8rem', color: 'var(--ash)' }}>{r.label}</span>
                  <span style={{ fontSize: '.8rem', fontWeight: 700, color: 'var(--ink)' }}>{r.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Acciones peligrosas */}
          <div className="card" style={{ border: '1px solid rgba(239,68,68,.25)', marginTop: '1rem' }}>
            <div className="card-hd">
              <div className="card-hd-l">
                <div className="card-ico" style={{ background: 'rgba(239,68,68,.1)', color: '#ef4444' }}>
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                </div>
                <div><div className="card-title" style={{ color: '#ef4444' }}>Zona de Peligro</div></div>
              </div>
            </div>
            <div style={{ padding: '0 1.2rem 1.2rem', display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
              <button className="btn btn-out" style={{ width: '100%', justifyContent: 'center', borderColor: '#ef4444', color: '#ef4444', fontSize: '.82rem' }}
                onClick={handleClearCache}>
                Limpiar caché del sistema
              </button>
              <button className="btn btn-out" style={{ width: '100%', justifyContent: 'center', borderColor: '#ef4444', color: '#ef4444', fontSize: '.82rem' }}
                onClick={handlePurgeLogs}>
                Purgar logs antiguos
              </button>
              <button className="btn btn-out" style={{ width: '100%', justifyContent: 'center', borderColor: '#ef4444', color: '#ef4444', fontSize: '.82rem' }}
                onClick={handleLogoutAll}>
                Forzar logout de todos
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
