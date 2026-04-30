import { useState, useEffect } from 'react'
import Modal from '../../components/Modal'
import { toast } from '../../components/Toast'
import { getUsers, getRoles, createUser, createRole, updateUser } from '../../api/api'
import { getInitials } from '../../utils/userHelpers'

export default function UsuariosRoles() {
  const [modalUser, setModalUser] = useState(false)
  const [modalRol, setModalRol] = useState(false)
  const [usuarios, setUsuarios] = useState([])
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'COLABORADOR' })
  const [editMode, setEditMode] = useState(false)
  const [editUserId, setEditUserId] = useState(null)
  const [roleForm, setRoleForm] = useState({ name: '', description: '', permissions: [] })

  const loadData = async () => {
    try {
      setLoading(true)
      const [uRes, rRes] = await Promise.all([getUsers(), getRoles()])
      
      const uData = uRes.data?.data?.users || uRes.data?.data || []
      const rData = rRes.data?.data?.roles || rRes.data?.data || []
      
      const formattedUsers = uData.map(u => ({
        init: getInitials(u.name, u.email),
        name: u.name,
        email: u.email,
        rol: u.role || 'Usuario',
        badge: u.role === 'ADMIN' ? 'b-err' : 'b-blue',
        bg: u.role === 'ADMIN' ? 'linear-gradient(135deg,var(--red-m),var(--red))' : 'linear-gradient(135deg,#1D4ED8,#3B82F6)',
        color: '#fff',
        active: u.active !== false
      }))

      setUsuarios(formattedUsers)
      setRoles(rData)
    } catch (error) {
      console.error('Error cargando usuarios/roles:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreateUser = async () => {
    try {
      if (!userForm.name || !userForm.email || (!editMode && !userForm.password)) return toast('Nombre, correo y contraseña son requeridos', 'err')
      setIsSaving(true)
      if (editMode && editUserId) {
        // No enviar password si está vacío
        const data = { ...userForm }
        if (!data.password) delete data.password
        await updateUser(editUserId, data)
        toast('Usuario actualizado correctamente', 'ok')
      } else {
        await createUser(userForm)
        toast('Usuario creado correctamente', 'ok')
      }
      setModalUser(false)
      loadData()
      setUserForm({ name: '', email: '', password: '', role: 'COLABORADOR' })
      setEditMode(false)
      setEditUserId(null)
    } catch (err) {
      toast(err.response?.data?.message || 'Error al guardar usuario', 'err')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCreateRol = async () => {
    try {
      if (!roleForm.name) return toast('El nombre del rol es requerido', 'err')
      setIsSaving(true)
      await createRole(roleForm)
      toast('Rol creado correctamente', 'ok')
      setModalRol(false)
      loadData()
      setRoleForm({ name: '', description: '', permissions: [] })
    } catch (err) {
      toast('Error al crear rol', 'err')
    } finally {
      setIsSaving(false)
    }
  }

  // Ocultar usuarios con rol SUPERADMIN, SUPER_ADMIN o variantes
  const filteredUsers = usuarios.filter(u => {
    const role = (u.rol || '').toUpperCase().replace(/\s|_/g, '_');
    if (role === 'SUPERADMIN' || role === 'SUPER_ADMIN' || role === 'SUPER-ADMIN') return false;
    return (
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <main className="page">
      <div className="ph">
        <div>
          <h1 className="ph-title">Usuarios <em>y Roles</em></h1>
          <p className="ph-sub">Gestión de accesos y permisos del sistema SGC</p>
        </div>
        <div className="ph-actions">
          <button className="btn btn-out" onClick={() => setModalRol(true)}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
            Nuevo Rol
          </button>
          <button className="btn btn-red" onClick={() => setModalUser(true)}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/></svg>
            Nuevo Usuario
          </button>
        </div>
      </div>

      <div className="sg sg-3" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        {[
          { v: 'gold', icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>, trend: '+2 este mes', tt: 'up', num: usuarios.length, lbl: 'Usuarios Activos', w: '100%' },
          { v: 'blue', icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>, trend: 'Definidos', tt: 'n', num: roles.length, lbl: 'Roles del Sistema', w: '60%' },
          { v: 'red', icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>, trend: 'Revisar', tt: 'n', num: '0', lbl: 'Inactivos', w: '0%' },
        ].map((s, i) => (
          <div key={i} className={`sc sc-${s.v}`} style={{ cursor: 'pointer' }} onClick={() => toast(`Información: ${s.lbl}`, 'n')}>
            <div className="sc-top"><div className="sc-icon">{s.icon}</div><span className={`trend trend-${s.tt}`}>{s.trend}</span></div>
            <div className="sc-num">{s.num}</div><div className="sc-lbl">{s.lbl}</div>
            <div className="sc-bar"><div className="sc-bar-f" style={{ width: s.w }} /></div>
          </div>
        ))}
      </div>

      <div className="mg">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div className="card">
            <div className="card-hd">
              <div className="card-hd-l">
                <div className="card-ico ico-gold"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg></div>
                <div><div className="card-title">Usuarios del Sistema</div></div>
              </div>
            </div>
            <div className="fsearch" style={{ margin: '0 1.3rem .8rem', maxWidth: 260 }}>
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35"/></svg>
              <input placeholder="Buscar usuario…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div style={{ padding: '0 1rem 1rem', display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
              {filteredUsers.length === 0 && <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--ash)' }}>No se encontraron usuarios</div>}
              {filteredUsers.map((u, i) => (
                <div key={i} className="user-card" style={{ opacity: u.active ? 1 : .6 }}>
                  <div className="user-av" style={{ background: u.bg }}>
                    <span style={{ color: u.color }}>{u.init}</span>
                  </div>
                  <div className="user-info">
                    <div className="user-name">{u.name}</div>
                    <div className="user-email">{u.email}</div>
                  </div>
                  <span className={`badge ${u.badge}`} style={{ flexShrink: 0 }}>{u.rol}</span>
                  <div className="user-actions">
                    <button className="ibtn" onClick={() => {
                      setUserForm({
                        name: u.name,
                        email: u.email,
                        password: '',
                        role: u.rol
                      })
                      setEditMode(true)
                      setEditUserId(u.id || u._id || u.email)
                      setModalUser(true)
                    }}>
                      {u.active
                        ? <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                        : <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"/></svg>
                      }
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-r">
          <div className="card">
            <div className="card-hd">
              <div className="card-hd-l">
                <div className="card-ico" style={{ background: 'var(--blue-bg)', color: 'var(--blue)' }}><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg></div>
                <div><div className="card-title">Roles Definidos</div></div>
              </div>
            </div>
            <div style={{ padding: '.8rem', display: 'flex', flexDirection: 'column', gap: '.7rem' }}>
              {(roles.length > 0 ? roles : [
                { name: 'Administrador', desc: 'Acceso total al sistema SGC', badge: 'b-err', usuarios: '1 usuario', perms: ['Ver todo', 'Editar', 'Aprobar', 'Eliminar', 'Configurar'], allOk: true },
                { name: 'Auditor', desc: 'Gestión y ejecución de auditorías', badge: 'b-blue', usuarios: '2 usuarios', perms: ['Ver documentos', 'Crear NC', 'Gestionar auditorías'], extra: ['Sin eliminar'] },
              ]).map((r, i) => (
                <div className="role-card" key={i}>
                  <div className="role-card-top">
                    <div><div className="role-name">{r.name}</div><div className="role-desc">{r.description || r.desc}</div></div>
                    <span className={`badge ${r.badge || 'b-blue'}`}>{r.usuarios || r.numUsers || '0'}</span>
                  </div>
                  <div className="role-perms">
                    {(r.perms || r.permissions || []).map((p, j) => <span key={j} className="perm perm-ok">{p}</span>)}
                    {r.extra?.map((p, j) => <span key={j} className="perm">{p}</span>)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {modalUser && (
        <Modal 
          title={editMode ? "Editar Usuario" : "Nuevo Usuario"} 
          open={modalUser} 
          onClose={() => {
            setModalUser(false)
            setEditMode(false)
            setEditUserId(null)
            setUserForm({ name: '', email: '', password: '', role: 'COLABORADOR' })
          }}
          footer={<>
            <button className="btn btn-out" onClick={() => {
              setModalUser(false)
              setEditMode(false)
              setEditUserId(null)
              setUserForm({ name: '', email: '', password: '', role: 'COLABORADOR' })
            }} disabled={isSaving}>Cancelar</button>
            <button className="btn btn-red" onClick={handleCreateUser} disabled={isSaving}>
              {isSaving ? (editMode ? 'Guardando...' : 'Creando...') : (editMode ? 'Guardar Cambios' : 'Crear Usuario')}
            </button>
          </>}
        >
          <div className="form-grid">
            <div className="form-group full"><label className="lbl">Nombre Completo</label><input className="finput" placeholder="Juan García" value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})} /></div>
            <div className="form-group full"><label className="lbl">Correo Electrónico</label><input className="finput" type="email" placeholder="usuario@indusecc.com" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} disabled={editMode} /></div>
            <div className="form-group"><label className="lbl">Rol</label><select className="fselect" value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value})}><option value="CONSULTOR">Consultor</option><option value="COLABORADOR">Colaborador</option></select></div>
            <div className="form-group"><label className="lbl">Contraseña</label><input className="finput" type="password" placeholder={editMode ? "(dejar en blanco para no cambiar)" : "********"} value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} /></div>
          </div>
        </Modal>
      )}

      {modalRol && (
        <Modal 
          title="Nuevo Rol" 
          open={modalRol} 
          onClose={() => setModalRol(false)}
          footer={<>
            <button className="btn btn-out" onClick={() => setModalRol(false)} disabled={isSaving}>Cancelar</button>
            <button className="btn btn-red" onClick={handleCreateRol} disabled={isSaving}>
              {isSaving ? 'Creando...' : 'Crear Rol'}
            </button>
          </>}
        >
          <div className="form-grid">
            <div className="form-group full"><label className="lbl">Nombre del Rol</label><input className="finput" placeholder="Ej. Revisor de Calidad" value={roleForm.name} onChange={e => setRoleForm({...roleForm, name: e.target.value})} /></div>
            <div className="form-group full"><label className="lbl">Descripción</label><textarea className="ftextarea" placeholder="Describe las responsabilidades de este rol…" value={roleForm.description} onChange={e => setRoleForm({...roleForm, description: e.target.value})} /></div>
            <div className="form-group full">
              <label className="lbl">Permisos</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem', marginTop: '.3rem' }}>
                {['Ver documentos', 'Editar documentos', 'Crear auditorías', 'Gestionar usuarios', 'Configurar sistema'].map((p, i) => (
                  <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '.84rem', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      style={{ accentColor: 'var(--red)' }} 
                      checked={roleForm.permissions.includes(p)}
                      onChange={e => {
                        const nextPerms = e.target.checked 
                          ? [...roleForm.permissions, p]
                          : roleForm.permissions.filter(x => x !== p)
                        setRoleForm({...roleForm, permissions: nextPerms})
                      }}
                    /> {p}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </main>
  )
}
