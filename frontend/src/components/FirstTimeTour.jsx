import { useContext, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'

const TOUR_STEPS = {
  ADMIN: [
    { path: '/admin/dashboard', title: 'Panel General', description: 'Aqui ves resumen del sistema, alertas y accesos rapidos.' },
    { path: '/admin/documentos-iso', title: 'Documentos ISO', description: 'Gestiona procedimientos, formatos y vigencias documentales.' },
    { path: '/admin/auditorias', title: 'Auditorias', description: 'Programa y da seguimiento a auditorias internas y externas.' },
    { path: '/admin/capacitaciones', title: 'Capacitaciones', description: 'Asigna cursos, aprueba finalizaciones y emite certificados.' },
    { path: '/admin/perfil', title: 'Mi Perfil', description: 'Actualiza tus datos y foto de perfil cuando lo necesites.' },
  ],
  COLABORADOR: [
    { path: '/colaborador/mipanel', title: 'Mi Panel', description: 'Aqui encuentras tus pendientes y actividad reciente.' },
    { path: '/colaborador/tareas', title: 'Mis Tareas', description: 'Da seguimiento a tareas asignadas y su progreso.' },
    { path: '/colaborador/reportar', title: 'Reportar Hallazgo', description: 'Reporta hallazgos o no conformidades del proceso.' },
    { path: '/colaborador/capacitacion', title: 'Mis Capacitaciones', description: 'Completa tus cursos y revisa estatus de certificacion.' },
    { path: '/colaborador/perfil', title: 'Mi Perfil', description: 'Configura tus datos personales y foto.' },
  ],
  CONSULTOR: [
    { path: '/consultor/panel', title: 'Panel General', description: 'Vista ejecutiva del estado general del sistema.' },
    { path: '/consultor/indicadores', title: 'Indicadores', description: 'Analiza KPIs y desempeno del sistema de gestion.' },
    { path: '/consultor/hallazgos', title: 'Hallazgos', description: 'Consulta los hallazgos reportados por los equipos.' },
    { path: '/consultor/reportes', title: 'Reportes', description: 'Revisa reportes para diagnostico y recomendaciones.' },
    { path: '/consultor/perfil', title: 'Mi Perfil', description: 'Mantiene tus datos y foto de usuario actualizados.' },
  ],
  SUPER_ADMIN: [
    { path: '/superadmin/dashboard', title: 'Panel Dios', description: 'Centro de control global para todo el sistema.' },
    { path: '/superadmin/usuarios', title: 'Usuarios', description: 'Gestiona cuentas, roles y estado de usuarios.' },
    { path: '/superadmin/configuracion', title: 'Configuracion Global', description: 'Define parametros criticos y politicas del sistema.' },
    { path: '/superadmin/auditoria-logs', title: 'Logs del Sistema', description: 'Audita cambios y acciones importantes registradas.' },
    { path: '/superadmin/perfil', title: 'Mi Perfil', description: 'Configura tus datos personales y foto de perfil.' },
  ],
}

export default function FirstTimeTour() {
  const { user } = useContext(AuthContext)
  const navigate = useNavigate()
  const location = useLocation()
  const [stepIndex, setStepIndex] = useState(0)
  const [active, setActive] = useState(false)

  const steps = useMemo(() => TOUR_STEPS[user?.role] || [], [user?.role])
  const storageKey = user?.id ? `indusecc_tour_seen_${user.id}` : null

  useEffect(() => {
    if (!user || !storageKey || !steps.length) return
    const alreadySeen = localStorage.getItem(storageKey) === '1'
    if (!alreadySeen) {
      setActive(true)
      setStepIndex(0)
      if (location.pathname !== steps[0].path) {
        navigate(steps[0].path, { replace: true })
      }
    }
  }, [user, storageKey, steps, navigate])

  const finishTour = () => {
    if (storageKey) localStorage.setItem(storageKey, '1')
    setActive(false)
  }

  const goToStep = (nextIndex) => {
    const bounded = Math.max(0, Math.min(nextIndex, steps.length - 1))
    setStepIndex(bounded)
    const step = steps[bounded]
    if (step && location.pathname !== step.path) {
      navigate(step.path)
    }
  }

  const handleNext = () => {
    if (stepIndex >= steps.length - 1) return finishTour()
    goToStep(stepIndex + 1)
  }

  const handleBack = () => {
    if (stepIndex <= 0) return
    goToStep(stepIndex - 1)
  }

  if (!active || !steps.length) return null
  const current = steps[stepIndex]
  const isLast = stepIndex === steps.length - 1

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        <div style={styles.badge}>Tutorial de inicio</div>
        <h3 style={styles.title}>{current.title}</h3>
        <p style={styles.description}>{current.description}</p>
        <div style={styles.progress}>
          Paso {stepIndex + 1} de {steps.length}
        </div>
        <div style={styles.actions}>
          <button type="button" style={styles.ghost} onClick={finishTour}>Omitir</button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" style={styles.secondary} onClick={handleBack} disabled={stepIndex === 0}>Anterior</button>
            <button type="button" style={styles.primary} onClick={handleNext}>{isLast ? 'Finalizar' : 'Siguiente'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 12000,
    background: 'rgba(17, 24, 39, 0.55)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    width: 'min(520px, 95vw)',
    background: '#fff',
    borderRadius: 14,
    border: '1px solid rgba(0,0,0,0.08)',
    boxShadow: '0 24px 40px rgba(0,0,0,0.22)',
    padding: 18,
  },
  badge: {
    display: 'inline-flex',
    background: '#fef3c7',
    color: '#78350f',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
    padding: '4px 10px',
  },
  title: { margin: '10px 0 6px 0', fontSize: 20, color: '#111827' },
  description: { margin: 0, color: '#4b5563', lineHeight: 1.4 },
  progress: { marginTop: 12, fontSize: 12, color: '#6b7280', fontWeight: 600 },
  actions: { marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  primary: { border: 'none', background: '#7f1d1d', color: '#fff', borderRadius: 8, padding: '8px 12px', fontWeight: 700, cursor: 'pointer' },
  secondary: { border: '1px solid #d1d5db', background: '#fff', color: '#111827', borderRadius: 8, padding: '8px 12px', fontWeight: 700, cursor: 'pointer' },
  ghost: { border: 'none', background: 'transparent', color: '#6b7280', fontWeight: 700, cursor: 'pointer' },
}
