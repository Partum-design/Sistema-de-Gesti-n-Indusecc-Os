import { useState, useEffect } from 'react'
import Modal from '../../components/Modal'
import { toast } from '../../components/Toast'
import { getUsers, createUser, updateUser, deleteUser } from '../../api/api'

const rolesOpts = [
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
  { value: 'ADMIN', label: 'Administrador' },
  { value: 'COLABORADOR', label: 'Colaborador' },
  { value: 'CONSULTOR', label: 'Consultor' },
]

const roleLabel = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Administrador',
  COLABORADOR: 'Colaborador',
  CONSULTOR: 'Consultor',
}

const roleBadge = {
  SUPER_ADMIN: { bg: 'rgba(123,30,34,.12)', color: 'var(--red)' },
  ADMIN: { bg: 'rgba(123,30,34,.12)', color: 'var(--red)' },
  COLABORADOR: { bg: 'rgba(107,114,128,.1)', color: '#6b7280' },
  CONSULTOR: { bg: 'rgba(16,185,129,.1)', color: '#10b981' },
}

const roleColors = {
  SUPER_ADMIN: { bg: 'linear-gradient(135deg,var(--red-m),var(--red))', color: 'var(--gold-l)' },
  ADMIN: { bg: 'linear-gradient(135deg,var(--red-m),var(--red))', color: 'var(--gold-l)' },
  COLABORADOR: { bg: 'linear-gradient(135deg,#065F46,#10B981)', color: '#fff' },
  CONSULTOR: { bg: 'linear-gradient(135deg,var(--gold-d),var(--gold))', color: 'var(--red-d)' },
}
export default function SuperAdminUsuarios() {
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [filterRol, setFilterRol] = useState('Todos')
  const [modalCreate, setModalCreate] = useState(false)
  const [modalEdit, setModalEdit] = useState(null)
  const [modalDelete, setModalDelete] = useState(null)
  const [modalPass, setModalPass] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', rol: 'COLABORADOR', active: true, password: '' })
  const [genPass, setGenPass] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const res = await getUsers()
        const usersArr = res.data?.data?.users || res.data?.data || []
        setUsers(usersArr.map(user => {
          const nameToUse = user.name || user.email || 'Usuario';
          const uiColors = roleColors[user.role] || roleColors.COLABORADOR;
          return {
            ...user,
            id: user._id || user.id,
            init: nameToUse.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
            rolLabel: roleLabel[user.role] || user.role,
            created: user.createdAt ? new Date(user.createdAt).toLocaleDateString('es-MX') : '—',
            name: nameToUse,
            bg: uiColors.bg,
            color: uiColors.color,
            lastLogin: user.lastLogin ? new Date(user.lastLogin).toLocaleString('es-MX') : 'Sin actividad',
          };
        }))
      } catch (error) {
        toast('No se pudieron cargar los usuarios', 'err')
      } finally {
        setLoading(false)
      }
    }

    loadUsers()
  }, [])

  const filtered = users.filter(u => {
    const q = search.toLowerCase()
    const matchQ = u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    const matchR = filterRol === 'Todos' || u.rolLabel === filterRol
    return matchQ && matchR
  })

  async function handleCreate() {
    if (!form.name || !form.email || !form.password) {
      toast('Completa nombre, correo y contraseña', 'err');
      return
    }

    try {
      const res = await createUser({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.rol,
        active: form.active,
      })

      const created = res.data?.data?.user || res.data?.user
      const nameToUse = created.name || created.email || 'Usuario';
      const uiColors = roleColors[created.role] || roleColors.COLABORADOR;
      setUsers(p => [
        ...p,
        {
          ...created,
          id: created._id || created.id,
          init: nameToUse.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
          rolLabel: roleLabel[created.role] || created.role,
          created: created.createdAt ? new Date(created.createdAt).toLocaleDateString('es-MX') : '—',
          name: nameToUse,
          bg: uiColors.bg,
          color: uiColors.color,
          active: created.active,
          lastLogin: 'Recién creado',
        }
      ])

      toast(`Usuario "${form.name}" creado exitosamente`, 'ok')
      setModalCreate(false)
      setForm({ name: '', email: '', rol: 'COLABORADOR', active: true, password: '' })
    } catch (error) {
      const details = error.response?.data?.details;
      if (details && Array.isArray(details)) {
        const msgs = details.map(d => d.message).join('. ');
        toast(msgs, 'err');
      } else {
        toast(error.response?.data?.message || 'Error al crear usuario', 'err');
      }
    }
  }

  async function handleEdit() {
    try {
      const res = await updateUser(modalEdit.id, {
        name: form.name,
        email: form.email,
        role: form.rol,
        active: form.active,
      })
      const updated = res.data?.data?.user || res.data?.data || res.data
      setUsers(p => p.map(u => u.id === modalEdit.id ? {
        ...u,
        name: updated.name || updated.email,
        email: updated.email,
        rolLabel: roleLabel[updated.role] || updated.role,
        role: updated.role,
        active: updated.active,
      } : u))
      toast(`Usuario "${form.name}" actualizado`, 'ok')
      setModalEdit(null)
    } catch (error) {
      const details = error.response?.data?.details;
      if (details && Array.isArray(details)) {
        const msgs = details.map(d => d.message).join('. ');
        toast(msgs, 'err');
      } else {
        toast(error.response?.data?.message || 'Error al actualizar usuario', 'err');
      }
    }
  }

  async function handleDelete() {
    try {
      await deleteUser(modalDelete.id)
      setUsers(p => p.filter(u => u.id !== modalDelete.id))
      toast(`Usuario "${modalDelete.name}" eliminado permanentemente`, 'err')
      setModalDelete(null)
    } catch (error) {
      toast(error.response?.data?.message || 'Error al eliminar usuario', 'err')
    }
  }

  function generatePassword() {
    const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
    const lower = 'abcdefghjkmnpqrstuvwxyz'
    const nums = '23456789'
    const syms = '!@#$%'
    const all = upper + lower + nums + syms
    
    // Ensure at least one of each required type
    let pass = upper[Math.floor(Math.random()*upper.length)] +
               lower[Math.floor(Math.random()*lower.length)] +
               nums[Math.floor(Math.random()*nums.length)]
    
    for (let i = 0; i < 9; i++) pass += all[Math.floor(Math.random() * all.length)]
    
    // Shuffle the result
    pass = pass.split('').sort(() => 0.5 - Math.random()).join('')
    
    setGenPass(pass)
    setForm(p => ({ ...p, password: pass }))
  }

  function openEdit(u) {
    setForm({ name: u.name, email: u.email, rol: u.role, active: u.active, password: '' })
    setModalEdit(u)
  }

  return (
    <main className="page">
      <div className="ph">
        <div>
          <h1 className="ph-title">Gestión de <em>Usuarios</em></h1>
          <p className="ph-sub">Control total — crear, editar, eliminar y gestionar contraseñas de todos los niveles</p>
        </div>
        <div className="ph-actions">
          <button className="btn btn-out"
            onClick={() => { setGenPass(''); setModalPass({ id: 0, name: 'Todos' }) }}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/></svg>
            Generar Contraseña
          </button>
          <button className="btn btn-red"
            onClick={() => { setForm({ name: '', email: '', rol: 'COLABORADOR', active: true, password: '' }); setModalCreate(true) }}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/></svg>
            Nuevo Usuario
          </button>
        </div>
      </div>

      <div className="sg sg-4" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        {[
          { num: users.length, lbl: 'Usuarios Totales', color: 'var(--red)', bg: 'var(--white)', border: 'var(--red)' },
          { num: users.filter(u => u.active).length, lbl: 'Activos', color: '#10b981', bg: 'var(--white)', border: '#10b981' },
          { num: users.filter(u => !u.active).length, lbl: 'Inactivos', color: '#ef4444', bg: 'var(--white)', border: '#ef4444' },
          { num: rolesOpts.length, lbl: 'Roles Definidos', color: '#3b82f6', bg: 'var(--white)', border: '#3b82f6' },
        ].map((s, i) => (
          <div key={i} style={{ padding: '1.2rem', background: s.bg, border: `1px solid ${s.border}25`, borderTop: `4px solid ${s.border}`, borderRadius: 10, boxShadow: '0 4px 12px rgba(0,0,0,.04)' }}>
            <div style={{ fontSize: '2.2rem', fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.num}</div>
            <div style={{ fontSize: '.78rem', color: 'var(--ash)', fontWeight: 600, marginTop: 4, textTransform: 'uppercase', letterSpacing: '.05em' }}>{s.lbl}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', margin: '0 0 1rem', flexWrap: 'wrap' }}>
        <div className="fsearch" style={{ flex: 1, minWidth: 200, maxWidth: 320 }}>
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35"/></svg>
          <input placeholder="Buscar usuario…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {['Todos', ...rolesOpts.map(r => r.label)].map(r => (
            <button key={r} onClick={() => setFilterRol(r)}
              style={{ padding: '5px 12px', fontSize: '.74rem', fontWeight: 600, borderRadius: 20, border: '1px solid', cursor: 'pointer', transition: 'all .2s',
                background: filterRol === r ? 'var(--red)' : 'transparent',
                color: filterRol === r ? '#fff' : 'var(--ash)',
                borderColor: filterRol === r ? 'var(--red)' : 'var(--border)' }}>
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Users table */}
      <div className="card">
        <div style={{ padding: '0 1rem 1rem', display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
          {filtered.length === 0 && (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--ash)' }}>Sin resultados</div>
          )}
          {filtered.map(u => {
            const rb = roleBadge[u.role] || roleBadge['COLABORADOR']
            return (
              <div key={u.id} className="user-card" style={{ opacity: u.active ? 1 : .6 }}>
                <div className="user-av" style={{ background: u.bg }}>
                  <span style={{ color: u.color }}>{u.init}</span>
                </div>
                <div className="user-info">
                  <div className="user-name">{u.name}</div>
                  <div className="user-email">{u.email}</div>
                  <div style={{ fontSize: '.69rem', color: 'var(--ash)', marginTop: 1 }}>Último acceso: {u.lastLogin}</div>
                </div>
                <span style={{ fontSize: '.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: 10, background: rb.bg, color: rb.color, flexShrink: 0 }}>{u.rolLabel}</span>
                <span style={{ fontSize: '.7rem', padding: '2px 8px', borderRadius: 10, background: u.active ? 'rgba(16,185,129,.1)' : 'rgba(107,114,128,.1)', color: u.active ? '#10b981' : '#6b7280', fontWeight: 700, flexShrink: 0 }}>{u.active ? 'Activo' : 'Inactivo'}</span>
                <div className="user-actions" style={{ display: 'flex', gap: 4 }}>
                  <button className="ibtn" title="Editar" onClick={() => openEdit(u)}>
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                  </button>
                  <button className="ibtn" title="Resetear contraseña" style={{ color: 'var(--red)' }}
                    onClick={() => { setGenPass(''); setModalPass(u) }}>
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/></svg>
                  </button>
                  {u.role !== 'SUPER_ADMIN' && (
                    <button className="ibtn" title="Eliminar" style={{ color: '#ef4444' }} onClick={() => setModalDelete(u)}>
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Modal Crear */}
      {modalCreate && (
        <Modal title="Nuevo Usuario" onClose={() => setModalCreate(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem' }}>
            <div>
              <label style={{ fontSize: '.73rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--ash)', display: 'block', marginBottom: 5 }}>Nombre completo</label>
              <input className="finput" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Ej. Juan Martínez" />
            </div>
            <div>
              <label style={{ fontSize: '.73rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--ash)', display: 'block', marginBottom: 5 }}>Correo electrónico</label>
              <input className="finput" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="usuario@indusecc.com" />
            </div>
            <div>
              <label style={{ fontSize: '.73rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--ash)', display: 'block', marginBottom: 5 }}>Rol</label>
              <select className="finput" value={form.rol} onChange={e => setForm(p => ({ ...p, rol: e.target.value }))}>
                {rolesOpts.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '.73rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--ash)', display: 'block', marginBottom: 5 }}>Contraseña</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="finput" type="text" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="Mín. 8 caracteres, nms y letras" />
                <button className="btn btn-out" type="button" onClick={generatePassword} title="Generar segura">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                </button>
              </div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '.85rem' }}>
              <input type="checkbox" checked={form.active} onChange={e => setForm(p => ({ ...p, active: e.target.checked }))} style={{ accentColor: 'var(--red)', width: 16, height: 16 }} />
              <span>Usuario activo desde el inicio</span>
            </label>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: '.5rem' }}>
              <button className="btn btn-out" onClick={() => setModalCreate(false)}>Cancelar</button>
              <button className="btn btn-red" onClick={handleCreate}>Crear Usuario</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Editar */}
      {modalEdit && (
        <Modal title={`Editar — ${modalEdit.name}`} onClose={() => setModalEdit(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem' }}>
            <div>
              <label style={{ fontSize: '.73rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--ash)', display: 'block', marginBottom: 5 }}>Nombre completo</label>
              <input className="finput" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: '.73rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--ash)', display: 'block', marginBottom: 5 }}>Correo electrónico</label>
              <input className="finput" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: '.73rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--ash)', display: 'block', marginBottom: 5 }}>Rol</label>
              <select className="finput" value={form.rol} onChange={e => setForm(p => ({ ...p, rol: e.target.value }))}>
                {rolesOpts.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '.85rem' }}>
              <input type="checkbox" checked={form.active} onChange={e => setForm(p => ({ ...p, active: e.target.checked }))} style={{ accentColor: 'var(--red)', width: 16, height: 16 }} />
              <span>Usuario activo</span>
            </label>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: '.5rem' }}>
              <button className="btn btn-out" onClick={() => setModalEdit(null)}>Cancelar</button>
              <button className="btn btn-red" onClick={handleEdit}>Guardar Cambios</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Eliminar */}
      {modalDelete && (
        <Modal title="Confirmar Eliminación" onClose={() => setModalDelete(null)}>
          <div style={{ padding: '1rem', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem', color: '#ef4444' }}>
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" width="60" height="60"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg>
            </div>
            <p style={{ fontSize: '.9rem', color: 'var(--ink)', marginBottom: '.5rem' }}>
              ¿Estás seguro de eliminar permanentemente al usuario
            </p>
            <p style={{ fontWeight: 900, color: '#ef4444', fontSize: '1rem', marginBottom: '1.5rem' }}>"{modalDelete.name}"?</p>
            <p style={{ fontSize: '.8rem', color: 'var(--ash)', marginBottom: '1.5rem' }}>Esta acción no se puede deshacer y quedará registrada en el log de auditoría.</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button className="btn btn-out" onClick={() => setModalDelete(null)}>Cancelar</button>
              <button className="btn btn-red" onClick={handleDelete}>Eliminar Definitivamente</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Contraseña */}
      {modalPass && (
        <Modal title={modalPass.id === 0 ? 'Generar Contraseña' : `Resetear — ${modalPass.name}`} onClose={() => setModalPass(null)}>
          <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ fontSize: '.85rem', color: 'var(--ash)' }}>
              {modalPass.id === 0
                ? 'Genera una contraseña segura para asignar manualmente.'
                : `Genera una nueva contraseña para "${modalPass.name}". El usuario deberá cambiarla en su primer inicio de sesión.`}
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1, padding: '12px 16px', background: 'var(--red-b)', border: '1px solid rgba(123,30,34,.2)', borderRadius: 8, fontFamily: 'monospace', fontSize: '1.05rem', fontWeight: 700, color: 'var(--red)', letterSpacing: '.12em', minHeight: 46, display: 'flex', alignItems: 'center' }}>
                {genPass || <span style={{ color: 'var(--ash-l)', fontStyle: 'italic', fontSize: '.8rem', fontFamily: 'inherit' }}>Haz clic en Generar…</span>}
              </div>
              {genPass && (
                <button className="ibtn" title="Copiar" style={{ color: 'var(--red)', border: '1px solid rgba(123,30,34,.3)', borderRadius: 8, padding: '0 14px' }}
                  onClick={() => { navigator.clipboard?.writeText(genPass); toast('Contraseña copiada', 'ok') }}>
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" width="17"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path strokeLinecap="round" strokeLinejoin="round" d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                </button>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn-out" onClick={() => setModalPass(null)}>Cerrar</button>
              <button className="btn btn-red" onClick={generatePassword}>
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                Generar Nueva
              </button>
              {genPass && modalPass.id !== 0 && (
                <button className="btn btn-red" onClick={() => { toast(`Contraseña de "${modalPass.name}" reseteada`, 'ok'); setModalPass(null) }}>
                  Confirmar Reseteo
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </main>
  )
}
