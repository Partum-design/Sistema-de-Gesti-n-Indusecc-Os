const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const {
  PORT,
  MONGO_URI,
  CORS_ORIGIN,
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX_REQUESTS,
  NODE_ENV
} = require('./config/environment');
const logger = require('./utils/logger');
const authRoutes = require('./routes/auth');
const registrationRoutes = require('./routes/registration');
const userRoutes = require('./routes/users'); 
const auditRoutes = require('./routes/audits');
const findingRoutes = require('./routes/findings');
const calendarRoutes = require('./routes/calendars');
const documentRoutes = require('./routes/documents');
const roleRoutes = require('./routes/roles');
const adminRoutes = require('./routes/admin');
const normRoutes = require('./routes/norms');
const notificationRoutes = require('./routes/notifications');

const riskRoutes = require('./routes/risks');
const actionRoutes = require('./routes/actions');
const metricsRoutes = require('./routes/metrics');
const trainingRoutes = require('./routes/trainings');
const User = require('./models/User');
const Audit = require('./models/Audit');
const Finding = require('./models/Finding');
const Calendar = require('./models/Calendar');
const Document = require('./models/Document');
const Action = require('./models/Action');
const Training = require('./models/Training');
const Certificate = require('./models/Certificate');
const Role = require('./models/Role');
const RegistrationRequest = require('./models/RegistrationRequest');
const Risk = require('./models/Risk');
const AuditLog = require('./models/AuditLog');
const Configuration = require('./models/Configuration');
const runCollaboratorSeed = require('./utils/seedCollaboratorData');

const app = express();

// Seguridad
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX_REQUESTS,
  message: {
    success: false,
    message: 'Demasiadas solicitudes desde esta IP, por favor intenta más tarde.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (CORS_ORIGIN.includes(origin)) return true;
  if (/^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin)) return true;
  if (/^http:\/\/(localhost|127\.0\.0\.1):\d+$/i.test(origin)) return true;
  return false;
};

// CORS
app.use(cors({
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`Origen no permitido por CORS: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Logging
if (NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: { write: message => logger.info(message.trim()) }
  }));
}

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

let serverReadyPromise;

const initializeServer = async () => {
  if (NODE_ENV === 'test') return;
  if (serverReadyPromise) return serverReadyPromise;

  serverReadyPromise = (async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGO_URI);
      logger.info(' Conectado a MongoDB');
    }

    await seedInitialData();
    await runCollaboratorSeed();
    await seedConsultorRisks();
  })();

  return serverReadyPromise;
};

app.use('/api', async (req, res, next) => {
  try {
    await initializeServer();
    next();
  } catch (error) {
    next(error);
  }
});

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/registration', registrationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/audits', auditRoutes);
app.use('/api/findings', findingRoutes);
app.use('/api/calendars', calendarRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/norms', normRoutes);
app.use('/api/risks', riskRoutes);
app.use('/api/actions', actionRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/trainings', trainingRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Servidor funcionando correctamente',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: NODE_ENV
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada',
    code: 'NOT_FOUND'
  });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error('Error inesperado:', err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      message: 'Error de validación',
      code: 'VALIDATION_ERROR',
      details: errors
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({
      success: false,
      message: `${field} ya existe`,
      code: 'DUPLICATE_ERROR'
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Token inválido',
      code: 'INVALID_TOKEN'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expirado',
      code: 'TOKEN_EXPIRED'
    });
  }

  // Default error
  res.status(500).json({
    success: false,
    message: NODE_ENV === 'development' ? err.message : 'Error interno del servidor',
    code: 'SERVER_ERROR'
  });
});

const seedInitialData = async () => {
  const baseUsers = [
    { email: 'superadmin@indusecc.com', password: 'super123', role: 'SUPER_ADMIN', name: 'Super Admin' },
    { email: 'admin@indusecc.com', password: 'admin123', role: 'ADMIN', name: 'Administrador' },
    { email: 'colaborador@indusecc.com', password: 'colab123', role: 'COLABORADOR', name: 'Colaborador Prueba' },
    { email: 'consultor@indusecc.com', password: 'cons123', role: 'CONSULTOR', name: 'Consultor Prueba' },
  ]

  for (const userData of baseUsers) {
    const existing = await User.findOne({ email: userData.email })
    if (!existing) {
      await User.create(userData)
      logger.info(`Usuario creado: ${userData.email}`)
    } else {
      // Forzar actualización de password en seed si ya existe para asegurar consistencia
      existing.password = userData.password
      await existing.save()
      logger.info(`Usuario actualizado (password reset): ${userData.email}`)
    }
  }

  const adminUser = await User.findOne({ email: 'admin@indusecc.com' })
  const sampleAudits = [
    { title: 'Auditoría Interna Q1 2026', description: 'Revisión de procesos de Calidad y Producción', date: new Date('2026-03-15'), status: 'Pendiente', createdBy: adminUser?._id, assignedTo: adminUser?._id },
    { title: 'Auditoría Interna Q4 2025', description: 'Revisión de RRHH y Compras', date: new Date('2025-12-10'), status: 'Completada', createdBy: adminUser?._id, assignedTo: adminUser?._id },
    { title: 'Auditoría Externa ISO 9001:2015', description: 'Auditoría de certificación por Bureau Veritas', date: new Date('2025-11-05'), status: 'Completada', createdBy: adminUser?._id, assignedTo: adminUser?._id },
  ]

  if (adminUser) {
    for (const auditData of sampleAudits) {
      const exists = await Audit.findOne({ title: auditData.title })
      if (!exists) {
        await Audit.create(auditData)
        logger.info(`Auditoría creada: ${auditData.title}`)
      }
    }
  }
}

const seedCollaboratorData = async () => {
  try {
    logger.info('🌱 Iniciando seed de datos para colaborador...');
    
    // Obtener usuarios
    const colaborador = await User.findOne({ email: 'colaborador@indusecc.com' });
    const admin = await User.findOne({ email: 'admin@indusecc.com' });
    
    if (!colaborador) {
      throw new Error('No se encontró el usuario colaborador@indusecc.com');
    }
    
    if (!admin) {
      throw new Error('No se encontró el usuario admin@indusecc.com');
    }

    // 1. Crear Acciones/Tareas asignadas al colaborador
    logger.info('📝 Creando acciones/tareas para el colaborador...');
    
    // Eliminar índice duplicado si existe
    try {
      await Action.collection.dropIndex('code_1');
      logger.info('Índice code_1 eliminado');
    } catch (e) {
      // El índice no existe, continuar
    }
    
    const actions = [
      {
        title: 'Revisión de procedimientos de calidad',
        description: 'Revisar y actualizar los procedimientos de control de calidad del área de producción',
        area: 'Producción',
        assignedTo: colaborador._id,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        priority: 'high',
        status: 'En Proceso'
      },
      {
        title: 'Capacitación en normas ISO 9001',
        description: 'Completar el módulo de capacitación sobre normas ISO 9001:2015',
        area: 'Calidad',
        assignedTo: colaborador._id,
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        priority: 'medium',
        status: 'Iniciada'
      },
      {
        title: 'Auditoría interna de procesos',
        description: 'Participar en la auditoría interna del proceso de empaque',
        area: 'Auditoría',
        assignedTo: colaborador._id,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        priority: 'high',
        status: 'Iniciada'
      },
      {
        title: 'Reporte de indicadores mensuales',
        description: 'Generar reporte de indicadores de calidad del mes anterior',
        area: 'Reportes',
        assignedTo: colaborador._id,
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        priority: 'medium',
        status: 'Iniciada'
      },
      {
        title: 'Actualización de documentación',
        description: 'Actualizar documentación de procedimientos obsoletos',
        area: 'Documentación',
        assignedTo: colaborador._id,
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        priority: 'low',
        status: 'Iniciada'
      }
    ];

    await Action.deleteMany({ assignedTo: colaborador._id });
    const createdActions = await Action.insertMany(actions);
    logger.info(` Creadas ${createdActions.length} acciones para el colaborador`);

    // 2. Crear Documentos ISO
    logger.info(' Creando documentos ISO...');
    
    const documents = [
      {
        filename: 'procedimiento_calidad_v2.1.pdf',
        originalName: 'Procedimiento de Control de Calidad.pdf',
        mimetype: 'application/pdf',
        size: 1542300,
        url: '/uploads/procedimiento_calidad_v2.1.pdf',
        status: 'Vigente',
        category: 'Procedimientos',
        description: 'Procedimiento para el control de calidad en producción',
        uploadedBy: admin._id,
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      },
      {
        filename: 'manual_calidad_iso9001.pdf',
        originalName: 'Manual de Calidad ISO 9001.pdf',
        mimetype: 'application/pdf',
        size: 2105400,
        url: '/uploads/manual_calidad_iso9001.pdf',
        status: 'Vigente',
        category: 'Manuales',
        description: 'Manual de Calidad según norma ISO 9001:2015',
        uploadedBy: admin._id,
        expiryDate: new Date(Date.now() + 730 * 24 * 60 * 60 * 1000)
      },
      {
        filename: 'formato_inspeccion_v1.3.pdf',
        originalName: 'Formato de Inspección de Calidad.pdf',
        mimetype: 'application/pdf',
        size: 452100,
        url: '/uploads/formato_inspeccion_v1.3.pdf',
        status: 'Vigente',
        category: 'Formatos',
        description: 'Formato para inspección de calidad en línea de producción',
        uploadedBy: admin._id,
        expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)
      },
      {
        filename: 'politica_calidad_2026.pdf',
        originalName: 'Política de Calidad 2026.pdf',
        mimetype: 'application/pdf',
        size: 320500,
        url: '/uploads/politica_calidad_2026.pdf',
        status: 'Vigente',
        category: 'Políticas',
        description: 'Política de Calidad vigente para el año 2026',
        uploadedBy: admin._id,
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      },
      {
        filename: 'procedimiento_auditoria_interna.pdf',
        originalName: 'Procedimiento de Auditoría Interna.pdf',
        mimetype: 'application/pdf',
        size: 890300,
        url: '/uploads/procedimiento_auditoria_interna.pdf',
        status: 'Vigente',
        category: 'Procedimientos',
        description: 'Procedimiento para auditorías internas del SGC',
        uploadedBy: admin._id,
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      }
    ];

    await Document.deleteMany({});
    const createdDocuments = await Document.insertMany(documents);
    logger.info(` Creados ${createdDocuments.length} documentos ISO`);

    // 3. Crear Capacitaciones para el colaborador
    logger.info('🎓 Creando capacitaciones para el colaborador...');
    
    const trainings = [
      {
        title: 'Fundamentos ISO 9001:2015',
        module: 'Módulo 1 — Contexto y Liderazgo',
        description: 'Capacitación básica sobre los fundamentos de la norma ISO 9001:2015',
        assignedTo: colaborador._id,
        status: 'Completado',
        progress: 100,
        score: 95,
        startDate: new Date('2026-01-15'),
        completionDate: new Date('2026-01-20'),
        scheduledDate: new Date('2026-01-10')
      },
      {
        title: 'Gestión de Documentos SGC',
        module: 'Módulo 2 — Control Documental',
        description: 'Gestión y control de documentos en el Sistema de Gestión de Calidad',
        assignedTo: colaborador._id,
        status: 'Completado',
        progress: 100,
        score: 88,
        startDate: new Date('2026-02-01'),
        completionDate: new Date('2026-02-10'),
        scheduledDate: new Date('2026-01-25')
      },
      {
        title: 'Auditorías Internas ISO',
        module: 'Módulo 3 — Planificación',
        description: 'Técnicas y metodologías para auditorías internas',
        assignedTo: colaborador._id,
        status: 'En proceso',
        progress: 65,
        startDate: new Date('2026-03-01'),
        scheduledDate: new Date('2026-02-25')
      },
      {
        title: 'Gestión de Riesgos y Oportunidades',
        module: 'Módulo 4 — Cláusula 6.1',
        description: 'Identificación y gestión de riesgos en el SGC',
        assignedTo: colaborador._id,
        status: 'Pendiente',
        progress: 0,
        scheduledDate: new Date('2026-04-15')
      },
      {
        title: 'Mejora Continua y CAPA',
        module: 'Módulo 5 — Cláusula 10',
        description: 'Sistemas de mejora continua y acciones correctivas',
        assignedTo: colaborador._id,
        status: 'Pendiente',
        progress: 0,
        scheduledDate: new Date('2026-05-05')
      }
    ];

    await Training.deleteMany({ assignedTo: colaborador._id });
    const createdTrainings = await Training.insertMany(trainings);
    logger.info(` Creadas ${createdTrainings.length} capacitaciones para el colaborador`);

    // 4. Crear Certificados para capacitaciones completadas
    logger.info('Creando certificados...');
    
    const completedTrainings = createdTrainings.filter(t => t.status === 'Completado');
    const certificates = completedTrainings.map(training => ({
      trainingId: training._id,
      userId: colaborador._id,
      title: training.title,
      module: training.module,
      score: training.score,
      issueDate: training.completionDate,
      expiryDate: new Date(training.completionDate.getTime() + 365 * 24 * 60 * 60 * 1000),
      certificateNumber: `CERT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      status: 'Activo'
    }));

    await Certificate.deleteMany({ userId: colaborador._id });
    const createdCertificates = await Certificate.insertMany(certificates);
    logger.info(` Creados ${createdCertificates.length} certificados para el colaborador`);

    // 5. Crear Hallazgos reportados por el colaborador
    logger.info('Creando hallazgos reportados por el colaborador...');
    
    const audits = await Audit.find();
    const sampleAudits = audits.length > 0 ? audits : [null];
    
    const findings = [
      {
        title: 'Procedimiento de inspección desactualizado',
        description: 'El procedimiento de inspección de calidad no refleja los últimos cambios en el proceso de producción',
        severity: 'Media',
        status: 'Abierto',
        reportedBy: colaborador._id,
        assignedTo: admin._id,
        audit: sampleAudits[0]?._id,
        area: 'Producción',
        clause: '8.5.1',
        riskLevel: 'Medio',
        relatedDocument: 'procedimiento_calidad_v2.1.pdf',
        findingDate: new Date('2026-03-10'),
        immediateAction: 'Actualizar procedimiento y capacitar al personal'
      },
      {
        title: 'Falta de documentación de capacitación',
        description: 'No se cuenta con evidencia documental de la capacitación en normas ISO para nuevos empleados',
        severity: 'Baja',
        status: 'En Revisión',
        reportedBy: colaborador._id,
        assignedTo: admin._id,
        audit: sampleAudits[0]?._id,
        area: 'Recursos Humanos',
        clause: '7.2',
        riskLevel: 'Bajo',
        relatedDocument: 'manual_calidad_iso9001.pdf',
        findingDate: new Date('2026-03-05'),
        immediateAction: 'Implementar sistema de registro de capacitaciones'
      },
      {
        title: 'Equipo de medición sin calibración',
        description: 'Instrumentos de medición en línea de producción no cuentan con certificado de calibración vigente',
        severity: 'Alta',
        status: 'Abierto',
        reportedBy: colaborador._id,
        assignedTo: admin._id,
        audit: sampleAudits[0]?._id,
        area: 'Calibración',
        clause: '7.1.5',
        riskLevel: 'Alto',
        relatedDocument: 'formato_inspeccion_v1.3.pdf',
        findingDate: new Date('2026-03-12'),
        immediateAction: 'Calibrar equipos y establecer programa de mantenimiento'
      }
    ];

    await Finding.deleteMany({ reportedBy: colaborador._id });
    const createdFindings = await Finding.insertMany(findings);
    logger.info(` Creados ${createdFindings.length} hallazgos reportados por el colaborador`);

    // 6. Crear Eventos de Calendario asignados al colaborador
    logger.info(' Creando eventos de calendario...');
    
    const calendars = [
      {
        title: 'Reunión de seguimiento de indicadores',
        description: 'Revisión mensual de indicadores de calidad y desempeño',
        date: new Date('2026-04-15'),
        type: 'Reunión',
        assignedTo: colaborador._id,
        createdBy: admin._id
      },
      {
        title: 'Capacitación en auditoría interna',
        description: 'Sesión de capacitación práctica sobre auditorías internas',
        date: new Date('2026-04-20'),
        type: 'Capacitación',
        assignedTo: colaborador._id,
        createdBy: admin._id
      },
      {
        title: 'Auditoría interna de procesos',
        description: 'Auditoría interna del proceso de empaque y almacenamiento',
        date: new Date('2026-04-25'),
        type: 'Auditoría',
        assignedTo: colaborador._id,
        createdBy: admin._id
      },
      {
        title: 'Revisión de documentación',
        description: 'Revisión y actualización de documentación del área de producción',
        date: new Date('2026-05-02'),
        type: 'Reunión',
        assignedTo: colaborador._id,
        createdBy: admin._id
      },
      {
        title: 'Entrega de certificados',
        description: 'Entrega de certificados de capacitación completada',
        date: new Date('2026-05-10'),
        type: 'Otro',
        assignedTo: colaborador._id,
        createdBy: admin._id
      }
    ];

    await Calendar.deleteMany({ assignedTo: colaborador._id });
    const createdCalendars = await Calendar.insertMany(calendars);
    logger.info(` Creados ${createdCalendars.length} eventos de calendario para el colaborador`);

    // Resumen
    logger.info(' Seed de datos para colaborador completado exitosamente!');
    logger.info(' Resumen de datos creados:');
    logger.info(`   - ${createdActions.length} acciones/tareas`);
    logger.info(`   - ${createdDocuments.length} documentos ISO`);
    logger.info(`   - ${createdTrainings.length} capacitaciones`);
    logger.info(`   - ${createdCertificates.length} certificados`);
    logger.info(`   - ${createdFindings.length} hallazgos reportados`);
    logger.info(`   - ${createdCalendars.length} eventos de calendario`);

    return {
      success: true,
      data: {
        actions: createdActions.length,
        documents: createdDocuments.length,
        trainings: createdTrainings.length,
        certificates: createdCertificates.length,
        findings: createdFindings.length,
        calendars: createdCalendars.length
      }
    };

  } catch (error) {
    logger.error(' Error al crear datos de seed para colaborador:', error);
    throw error;
  }
};

const seedConsultorRisks = async () => {
  try {
    const existing = await Risk.countDocuments();
    if (existing > 0) {
      logger.info(` Riesgos ya existentes: ${existing} — omitiendo seed`);
      return;
    }

    logger.info(' Creando datos de riesgos para el consultor...');
    const admin = await User.findOne({ email: 'admin@indusecc.com' });

    const riesgos = [
      {
        description: 'Fallo en línea de producción', process: 'Producción',
        probability: 'Media', impact: 'Alto', level: 'Alto', status: 'Activo',
        owner: 'J. Martínez', cause: 'Mantenimiento deficiente',
        control: 'Mantenimiento preventivo mensual', action: 'Implementar checklist diario',
        score: 12, createdBy: admin?._id
      },
      {
        description: 'Proveedor crítico no certificado', process: 'Compras',
        probability: 'Baja', impact: 'Alto', level: 'Medio', status: 'En tratamiento',
        owner: 'L. García', cause: 'Falta de evaluación de proveedores',
        control: 'Evaluación anual de proveedores', action: 'Auditoría a proveedor Q1-2026',
        score: 8, createdBy: admin?._id
      },
      {
        description: 'Rotación de personal clave', process: 'RRHH',
        probability: 'Alta', impact: 'Medio', level: 'Alto', status: 'Activo',
        owner: 'M. López', cause: 'Condiciones laborales',
        control: 'Plan de retención de talento', action: 'Encuesta clima laboral',
        score: 12, createdBy: admin?._id
      },
      {
        description: 'No conformidad no detectada en proceso', process: 'Calidad',
        probability: 'Baja', impact: 'Alto', level: 'Medio', status: 'Controlado',
        owner: 'C. Pérez', cause: 'Inspección insuficiente',
        control: 'Puntos de control en proceso', action: 'Ampliar puntos de muestreo',
        score: 6, createdBy: admin?._id
      },
      {
        description: 'Pérdida de información crítica', process: 'Tecnología',
        probability: 'Baja', impact: 'Crítico', level: 'Alto', status: 'Activo',
        owner: 'R. Torres', cause: 'Falta de respaldo de datos',
        control: 'Backups automáticos diarios', action: 'Implementar backup en nube',
        score: 12, createdBy: admin?._id
      },
      {
        description: 'Incumplimiento normativo', process: 'Legal',
        probability: 'Media', impact: 'Alto', level: 'Alto', status: 'Activo',
        owner: 'A. García', cause: 'Cambios en legislación',
        control: 'Seguimiento de normativa mensual', action: 'Revisión legal Q2-2026',
        score: 12, createdBy: admin?._id
      },
    ];

    await Risk.insertMany(riesgos);
    logger.info(` Creados ${riesgos.length} riesgos para el consultor`);
  } catch (error) {
    logger.error(' Error al crear riesgos:', error);
  }
};

if (require.main === module && NODE_ENV !== 'test') {
  initializeServer()
    .then(() => {
      app.listen(PORT, () => logger.info(` Backend iniciado en puerto ${PORT}`));
    })
    .catch((error) => {
      logger.error(' Error durante la inicializacion del servidor', error);
      process.exit(1);
    });
}

module.exports = app
