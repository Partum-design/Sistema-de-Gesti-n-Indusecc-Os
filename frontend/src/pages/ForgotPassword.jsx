import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { forgotPasswordRequest } from '../api/auth'
import { toast } from '../components/Toast'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) {
      toast('Por favor ingresa tu correo', 'warn')
      return
    }

    try {
      setLoading(true)
      await forgotPasswordRequest(email)
      toast('Se ha enviado un enlace a tu correo', 'ok')
    } catch (error) {
      toast(error.response?.data?.message || 'Error al procesar solicitud', 'err')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--red-k)', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="card" style={{ width: '100%', maxWidth: 400, padding: '2.5rem' }}>
         <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.8rem', fontWeight: 900 }}>Recuperar <em style={{ color: 'var(--red)', fontStyle: 'italic', fontWeight: 400 }}>Contraseña</em></h2>
            <p style={{ fontSize: '.85rem', color: 'var(--ash)', marginTop: '.5rem' }}>Te enviaremos las instrucciones de recuperación.</p>
         </div>

         <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
               <label className="lbl">Correo Electrónico</label>
               <input 
                  type="email" 
                  className="finput" 
                  placeholder="usuario@indusecc.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
               />
            </div>
            
            <button className="btn btn-red" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
               {loading ? 'Enviando...' : 'Enviar instrucciones'}
            </button>
         </form>

         <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <span onClick={() => navigate('/login')} style={{ fontSize: '.85rem', color: 'var(--red)', fontWeight: 600, cursor: 'pointer' }}>Volver al inicio</span>
         </div>
      </div>
    </div>
  )
}
