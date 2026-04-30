import { useContext, useEffect, useState } from 'react'
import { getUserProfile, updateUserProfile } from '../api/api'
import { AuthContext } from '../context/AuthContext'
import { toast } from '../components/Toast'

export default function Profile() {
  const { user, updateSessionUser } = useContext(AuthContext)
  const [form, setForm] = useState({
    name: '',
    email: '',
    role: '',
    profilePhotoUrl: '',
    currentPassword: '',
    newPassword: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await getUserProfile()
        const profile = response.data?.data?.user
        if (profile) {
          setForm((prev) => ({
            ...prev,
            name: profile.name || '',
            email: profile.email || '',
            role: profile.role || '',
            profilePhotoUrl: profile.profilePhotoUrl || '',
          }))
        }
      } catch {
        toast('No se pudo cargar el perfil', 'err')
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        name: form.name,
        profilePhotoUrl: form.profilePhotoUrl,
      }
      if (form.newPassword) {
        payload.currentPassword = form.currentPassword
        payload.newPassword = form.newPassword
      }

      const response = await updateUserProfile(payload)
      const updatedUser = response.data?.data?.user
      if (updatedUser) {
        updateSessionUser(updatedUser)
      }
      setForm((prev) => ({ ...prev, currentPassword: '', newPassword: '' }))
      toast('Perfil actualizado correctamente', 'ok')
    } catch (error) {
      toast(error?.response?.data?.message || 'No se pudo actualizar el perfil', 'err')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <main className="page"><div className="card" style={{ padding: '1.2rem' }}>Cargando perfil...</div></main>
  }

  return (
    <main className="page">
      <div className="ph">
        <div>
          <div className="ph-title">Mi <em>Perfil</em></div>
          <div className="ph-sub">Actualiza tus datos personales y foto</div>
        </div>
      </div>

      <div className="card" style={{ padding: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px,280px) 1fr', gap: '1rem' }}>
          <div>
            <div style={{ width: 180, height: 180, borderRadius: 14, border: '1px solid var(--border)', overflow: 'hidden', background: 'var(--surface)' }}>
              {form.profilePhotoUrl ? (
                <img src={form.profilePhotoUrl} alt="Foto de perfil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: 'var(--ash)' }}>
                  {(user?.name || 'US').slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gap: '.75rem' }}>
            <input className="finput" placeholder="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className="finput" placeholder="Correo" value={form.email} disabled />
            <input className="finput" placeholder="Rol" value={form.role} disabled />
            <input className="finput" placeholder="URL de foto de perfil" value={form.profilePhotoUrl} onChange={(e) => setForm({ ...form, profilePhotoUrl: e.target.value })} />
            <input className="finput" type="password" placeholder="Contraseña actual (si cambiarás contraseña)" value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} />
            <input className="finput" type="password" placeholder="Nueva contraseña (opcional)" value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} />
            <button className="btn btn-red" onClick={handleSave} disabled={saving}>{saving ? 'Guardando...' : 'Guardar cambios'}</button>
          </div>
        </div>
      </div>
    </main>
  )
}
