import { useState, useEffect } from 'react'
import { toast } from '../../components/Toast'
import { getUsers, resetUserPassword } from '../../api/api'

const CHARS = {
  upper: 'ABCDEFGHJKLMNPQRSTUVWXYZ',
  lower: 'abcdefghjkmnpqrstuvwxyz',
  numbers: '23456789',
  symbols: '!@#$%&*',
}

const roleColors = {
  SUPER_ADMIN: { bg: 'linear-gradient(135deg,var(--red-m),var(--red))', color: 'var(--gold-l)' },
  ADMIN: { bg: 'linear-gradient(135deg,var(--red-m),var(--red))', color: 'var(--gold-l)' },
  AUDITOR: { bg: 'linear-gradient(135deg,#1D4ED8,#3B82F6)', color: '#fff' },
  COLABORADOR: { bg: 'linear-gradient(135deg,#065F46,#10B981)', color: '#fff' },
  CONSULTOR: { bg: 'linear-gradient(135deg,var(--gold-d),var(--gold))', color: 'var(--red-d)' },
}

export default function SuperAdminContrasenas() {
  const [users, setUsers] = useState([])
  const [length, setLength] = useState(12)
  const [opts, setOpts] = useState({ upper: true, lower: true, numbers: true, symbols: true })
  const [generated, setGenerated] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
    try {
      setLoading(true)
      const res = await getUsers()
      if (res.data?.success && res.data?.data) {
        const usersArr = res.data.data.users || res.data.data || []
        const formatted = usersArr.map(u => ({
          id: u._id,
          name: u.name,
          email: u.email,
          role: u.role || 'COLABORADOR',
          init: (u.name || u.email).charAt(0).toUpperCase(),
          ...(roleColors[u.role] || roleColors.COLABORADOR),
          lastReset: u.lastPasswordReset ? new Date(u.lastPasswordReset).toLocaleDateString('es-MX') : 'Nunca'
        }))
        setUsers(formatted)
      }
    } catch (err) {
      const details = err.response?.data?.details;
      if (details && Array.isArray(details)) {
        const msgs = details.map(d => d.message).join('. ');
        toast(`Error cargando usuarios: ${msgs}`, 'err');
      } else {
        toast(`Error cargando usuarios: ${err.response?.data?.message || err.message}`, 'err');
      }
    } finally {
      setLoading(false)
    }
  }

  function generate() {
    let pool = ''
    if (opts.upper) pool += CHARS.upper
    if (opts.lower) pool += CHARS.lower
    if (opts.numbers) pool += CHARS.numbers
    if (opts.symbols) pool += CHARS.symbols
    if (!pool) { toast('Selecciona al menos un tipo de carácter', 'err'); return }
    let pass = ''
    for (let i = 0; i < length; i++) pass += pool[Math.floor(Math.random() * pool.length)]
    setGenerated(pass)
  }

  async function confirmReset() {
    if (!selectedUser) { toast('Selecciona un usuario primero', 'err'); return }
    if (!generated) { toast('Genera una contraseña primero', 'err'); return }

    try {
      setLoading(true)
      const res = await resetUserPassword(selectedUser.id, generated)
      if (res.data?.success) {
        setHistory(p => [
          {
            user: selectedUser.name,
            email: selectedUser.email,
            pass: generated,
            time: new Date().toLocaleTimeString('es-MX')
          },
          ...p.slice(0, 4)
        ])
        toast(`Contraseña de "${selectedUser.name}" reseteada exitosamente`, 'ok')
        setGenerated('')
        setSelectedUser(null)
        await loadUsers()
      } else {
        toast(res.data?.message || 'Error al resetear', 'err')
      }
    } catch (err) {
      const details = err.response?.data?.details;
      if (details && Array.isArray(details)) {
        const msgs = details.map(d => d.message).join('. ');
        toast(`Error: ${msgs}`, 'err');
      } else {
        toast(`Error: ${err.response?.data?.message || err.message}`, 'err');
      }
    } finally {
      setLoading(false)
    }
  }

  const strength = !generated ? 0 : generated.length < 8 ? 1 : generated.length < 12 ? 2 : generated.length < 16 ? 3 : 4
  const strengthLabel = ['', 'Débil', 'Regular', 'Fuerte', 'Muy Fuerte']
  const strengthColor = ['', '#ef4444', '#f59e0b', '#10b981', 'var(--red)']

  return (
    <main className="page">
      <div className="ph">
        <div>
          <h1 className="ph-title">Generar / <em>Resetear</em></h1>
          <p className="ph-sub">Generación y reseteo de contraseñas para todos los niveles del sistema</p>
        </div>
      </div>

      <div className="mg">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          {/* Generador */}
          <div className="card">
            <div className="card-hd">
              <div className="card-hd-l">
                <div className="card-ico" style={{ background: 'var(--red-b)', color: 'var(--red)' }}>
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                </div>
                <div><div className="card-title">Generador de Contraseñas</div></div>
              </div>
            </div>
            <div style={{ padding: '0 1.3rem 1.3rem' }}>
              {/* Output */}
              <div style={{ display: 'flex', gap: 8, marginBottom: '1.2rem' }}>
                <div style={{ flex: 1, padding: '14px 18px', background: 'var(--red-b)', border: '1px solid rgba(123,30,34,.2)', borderRadius: 8, fontFamily: 'monospace', fontSize: '1.15rem', fontWeight: 700, color: 'var(--red)', letterSpacing: '.15em', wordBreak: 'break-all', minHeight: 52, display: 'flex', alignItems: 'center' }}>
                  {generated || <span style={{ color: 'var(--ash-l)', fontStyle: 'italic', fontSize: '.85rem', fontFamily: 'inherit', fontWeight: 400, letterSpacing: 0 }}>Haz clic en Generar…</span>}
                </div>
                {generated && (
                  <button className="ibtn" title="Copiar" style={{ color: 'var(--red)', border: '1px solid rgba(123,30,34,.3)', borderRadius: 8, padding: '0 16px', flexShrink: 0 }}
                    onClick={() => { navigator.clipboard?.writeText(generated); toast('Contraseña copiada al portapapeles', 'ok') }}>
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" width="18"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path strokeLinecap="round" strokeLinejoin="round" d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>
                  </button>
                )}
              </div>

              {/* Strength */}
              {generated && (
                <div style={{ marginBottom: '1.2rem' }}>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} style={{ flex: 1, height: 4, borderRadius: 4, background: i <= strength ? strengthColor[strength] : 'var(--border)', transition: 'background .3s' }} />
                    ))}
                  </div>
                  <span style={{ fontSize: '.72rem', fontWeight: 700, color: strengthColor[strength] }}>{strengthLabel[strength]}</span>
                </div>
              )}

              {/* Opciones */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.7rem', marginBottom: '1.2rem' }}>
                {[
                  { key: 'upper', label: 'Mayúsculas (A-Z)' },
                  { key: 'lower', label: 'Minúsculas (a-z)' },
                  { key: 'numbers', label: 'Números (0-9)' },
                  { key: 'symbols', label: 'Símbolos (!@#$)' },
                ].map(o => (
                  <label key={o.key} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '.83rem', fontWeight: 500, color: opts[o.key] ? 'var(--ink)' : 'var(--ash)' }}>
                    <input type="checkbox" checked={opts[o.key]} onChange={e => setOpts(p => ({ ...p, [o.key]: e.target.checked }))} style={{ accentColor: 'var(--red)', width: 15, height: 15 }} />
                    {o.label}
                  </label>
                ))}
              </div>

              <div style={{ marginBottom: '1.2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <label style={{ fontSize: '.73rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--ash)' }}>Longitud</label>
                  <span style={{ fontSize: '.85rem', fontWeight: 700, color: 'var(--red)' }}>{length} caracteres</span>
                </div>
                <input type="range" min="8" max="32" value={length} onChange={e => setLength(+e.target.value)}
                  style={{ width: '100%', accentColor: 'var(--red)' }} />
              </div>

              <button className="btn btn-red" style={{ width: '100%', justifyContent: 'center' }} onClick={generate}>
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                Generar Contraseña
              </button>
            </div>
          </div>

          {/* Historial */}
          {history.length > 0 && (
            <div className="card">
              <div className="card-hd">
                <div className="card-hd-l">
                  <div className="card-ico" style={{ background: 'var(--red-b)', color: 'var(--red)' }}>
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <div><div className="card-title">Historial de Reseteos</div></div>
                </div>
              </div>
              <div style={{ padding: '0 1rem 1rem', display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                {history.map((h, i) => (
                  <div key={i} style={{ padding: '10px 14px', background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '.82rem', fontWeight: 700, color: 'var(--ink)' }}>{h.user}</div>
                    <div style={{ fontSize: '.72rem', color: 'var(--ash)', display: 'flex', justifyContent: 'space-between' }}>
                      <span>{h.email}</span><span style={{ color: 'var(--red)' }}>{h.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Col derecha - selección de usuario */}
        <div className="col-r">
          <div className="card">
            <div className="card-hd">
              <div className="card-hd-l">
                <div className="card-ico" style={{ background: 'var(--red-b)', color: 'var(--red)' }}>
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </div>
                <div><div className="card-title">Seleccionar Usuario</div></div>
              </div>
            </div>
            <div style={{ padding: '0 1rem', display: 'flex', flexDirection: 'column', gap: '.5rem', marginBottom: '1rem' }}>
              {loading ? (
                <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--ash)' }}>Cargando usuarios...</div>
              ) : (
                users.map(u => (
                  <div key={u.id} onClick={() => setSelectedUser(u)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, cursor: 'pointer', border: `1px solid ${selectedUser?.id === u.id ? 'var(--red)' : 'var(--border)'}`, background: selectedUser?.id === u.id ? 'var(--red-b)' : 'transparent', transition: 'all .2s' }}>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: u.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.72rem', fontWeight: 700, color: u.color, flexShrink: 0 }}>{u.init}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '.82rem', fontWeight: 700, color: selectedUser?.id === u.id ? 'var(--red)' : 'var(--ink)' }}>{u.name}</div>
                      <div style={{ fontSize: '.7rem', color: 'var(--ash)' }}>{u.role}</div>
                      <div style={{ fontSize: '.67rem', color: 'var(--ash-l)' }}>Último reset: {u.lastReset}</div>
                    </div>
                    {selectedUser?.id === u.id && (
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" width="16" style={{ color: 'var(--red)', flexShrink: 0 }}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Botón asignar */}
          <div style={{ marginTop: '1rem', padding: '1.2rem', background: selectedUser && generated ? 'var(--red-b)' : 'var(--surface)', border: `1px solid ${selectedUser && generated ? 'rgba(123,30,34,.2)' : 'var(--border)'}`, borderRadius: 10, transition: 'all .3s' }}>
            {selectedUser && generated ? (
              <>
                <div style={{ fontSize: '.8rem', color: 'var(--red)', fontWeight: 700, marginBottom: '.5rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <svg fill="currentColor" viewBox="0 0 24 24" width="14"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
                  Listo para asignar
                </div>
                <div style={{ fontSize: '.75rem', color: 'var(--ash)', marginBottom: '1rem' }}>Se reseteará la contraseña de <strong>{selectedUser.name}</strong> con la contraseña generada.</div>
              </>
            ) : (
              <div style={{ fontSize: '.78rem', color: 'var(--ash)', marginBottom: '1rem' }}>Genera una contraseña y selecciona un usuario para asignarla.</div>
            )}
            <button className="btn btn-red" style={{ width: '100%', justifyContent: 'center', background: selectedUser && generated ? 'var(--red)' : 'var(--border)', color: selectedUser && generated ? '#fff' : 'var(--ash)', border: 'none', cursor: selectedUser && generated ? 'pointer' : 'not-allowed' }}
              onClick={confirmReset}>
              Confirmar Reseteo
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
