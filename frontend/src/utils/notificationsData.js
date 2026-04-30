export const notificationsByRole = {
  SUPER_ADMIN: {
    title: 'Alertas del Sistema',
    badge: '3 críticas',
    items: [
      { title: 'Intento de acceso no autorizado', subtitle: 'IP bloqueada automáticamente', time: 'Hoy, 07:42', color: '#ef4444', bg: 'rgba(254,226,226,.2)' },
      { title: 'Configuración global modificada', subtitle: 'Usuario Admin actualizó parámetros', time: 'Hoy, 09:15', color: '#a855f7' },
      { title: 'Nuevo usuario creado', subtitle: 'Admin · auditoría aplicada', time: 'Ayer, 18:30', color: '#7c3aed' },
    ],
  },
  ADMIN: {
    title: 'Notificaciones',
    badge: '2 nuevas',
    items: [
      { title: 'Documento PR-COM-003 vencido', subtitle: 'Revisar acciones correctivas', time: 'Hoy, 08:00', color: 'var(--err)', bg: 'rgba(254,226,226,.3)' },
      { title: 'Auditoría Q1 en 11 días', subtitle: 'Preparar evidencias de seguridad', time: 'Ayer, 15:20', color: 'var(--warn)' },
      { title: 'Perfil actualizado correctamente', subtitle: 'Tus cambios se guardaron', time: 'Hoy, 09:42', color: 'var(--ok)' },
    ],
  },
  COLABORADOR: {
    title: 'Mis Notificaciones',
    badge: '2 nuevas',
    items: [
      { title: 'Tarea vence en 2 días', subtitle: 'Actualiza FO-CAL-012 antes del viernes', time: 'Hoy, 09:05', color: 'var(--err)', bg: 'rgba(254,226,226,.28)' },
      { title: 'Auditoría en 11 días', subtitle: 'Reúne tus documentos de proceso', time: 'Ayer, 15:20', color: 'var(--warn)' },
      { title: 'Capacitación completada', subtitle: 'Diploma listo para descargar', time: 'Ayer, 21:10', color: 'var(--ok)' },
    ],
  },
  CONSULTOR: {
    title: 'Notificaciones',
    badge: '3 nuevas',
    items: [
      { title: 'Nuevo hallazgo asignado', subtitle: 'Revisar evidencia en la sección Hallazgos', time: 'Hoy, 08:30', color: '#10b981', bg: 'rgba(16,185,129,.12)' },
      { title: 'Reporte ejecutivo listo', subtitle: 'Descargar desde Reportes', time: 'Hoy, 10:15', color: '#3b82f6' },
      { title: 'Auditoría programada', subtitle: 'Ver detalles de la revisión', time: 'Ayer, 17:20', color: '#f59e0b' },
    ],
  },
  DEFAULT: {
    title: 'Notificaciones',
    badge: 'Sin novedades',
    items: [
      { title: 'No hay notificaciones recientes', subtitle: 'Revisa más tarde o actualiza la página', time: '', color: 'var(--ash)' },
    ],
  },
}
