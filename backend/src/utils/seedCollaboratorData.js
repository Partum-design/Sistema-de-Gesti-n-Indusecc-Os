const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const User = require('../models/User');
const Action = require('../models/Action');
const Document = require('../models/Document');
const Training = require('../models/Training');
const Certificate = require('../models/Certificate');
const Finding = require('../models/Finding');
const Calendar = require('../models/Calendar');
const Audit = require('../models/Audit');
const logger = require('./logger');

const uploadsDir = path.join(__dirname, '../../uploads');

const ensureUploadsDir = () => {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
};

const escapePdfText = (value) =>
  String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');

const buildSamplePdfBuffer = (title, lines) => {
  const textLines = [title, ...lines].filter(Boolean);
  const contentStream = [
    'BT',
    '/F1 16 Tf',
    '50 780 Td',
    '18 TL',
    ...textLines.map((line, index) =>
      index === 0 ? `(${escapePdfText(line)}) Tj` : `T* (${escapePdfText(line)}) Tj`
    ),
    'ET'
  ].join('\n');

  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${Buffer.byteLength(contentStream, 'utf8')} >>\nstream\n${contentStream}\nendstream`
  ];

  let pdf = '%PDF-1.4\n';
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf, 'utf8'));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';

  for (let index = 1; index < offsets.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, '0')} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return Buffer.from(pdf, 'utf8');
};

const createSampleUpload = (documentSeed) => {
  ensureUploadsDir();

  const buffer = buildSamplePdfBuffer(documentSeed.title, [
    `Codigo: ${documentSeed.code}`,
    `Clausula ISO: ${documentSeed.clause}`,
    `Responsable: ${documentSeed.responsible}`,
    `Categoria: ${documentSeed.category}`,
    '',
    documentSeed.description
  ]);

  const filePath = path.join(uploadsDir, documentSeed.filename);
  fs.writeFileSync(filePath, buffer);

  return {
    size: buffer.length,
    url: `/uploads/${documentSeed.filename}`,
    mimetype: 'application/pdf'
  };
};

const buildSeedDocuments = (adminId) => {
  const today = Date.now();
  const documents = [
    {
      code: 'COD-4.1-001',
      title: 'Procedimiento de Control de Calidad',
      filename: 'procedimiento_calidad_v2.1.pdf',
      originalName: 'Procedimiento de Control de Calidad.pdf',
      type: 'Procedimiento',
      category: 'Procedimientos',
      clause: '4.1',
      responsible: 'Coordinacion de Calidad',
      status: 'Vigente',
      description: 'Procedimiento para el control de calidad en produccion y liberacion de producto.',
      uploadedBy: adminId,
      expiryDate: new Date(today + 365 * 24 * 60 * 60 * 1000)
    },
    {
      code: 'COD-5.2-002',
      title: 'Manual de Calidad ISO 9001',
      filename: 'manual_calidad_iso9001.pdf',
      originalName: 'Manual de Calidad ISO 9001.pdf',
      type: 'Manual',
      category: 'Manuales',
      clause: '5.2',
      responsible: 'Representante del SGC',
      status: 'Vigente',
      description: 'Manual marco del sistema de gestion de calidad conforme a ISO 9001:2015.',
      uploadedBy: adminId,
      expiryDate: new Date(today + 730 * 24 * 60 * 60 * 1000)
    },
    {
      code: 'COD-8.6-003',
      title: 'Formato de Inspeccion de Calidad',
      filename: 'formato_inspeccion_v1.3.pdf',
      originalName: 'Formato de Inspeccion de Calidad.pdf',
      type: 'Formato',
      category: 'Formatos',
      clause: '8.6',
      responsible: 'Inspector de Calidad',
      status: 'Vigente',
      description: 'Formato oficial para registrar inspecciones en linea de produccion.',
      uploadedBy: adminId,
      expiryDate: new Date(today + 180 * 24 * 60 * 60 * 1000)
    },
    {
      code: 'COD-5.2-004',
      title: 'Politica de Calidad 2026',
      filename: 'politica_calidad_2026.pdf',
      originalName: 'Politica de Calidad 2026.pdf',
      type: 'Politica',
      category: 'Politicas',
      clause: '5.2',
      responsible: 'Direccion General',
      status: 'Vigente',
      description: 'Politica de calidad vigente para 2026 con compromisos de mejora continua.',
      uploadedBy: adminId,
      expiryDate: new Date(today + 365 * 24 * 60 * 60 * 1000)
    },
    {
      code: 'COD-9.2-005',
      title: 'Procedimiento de Auditoria Interna',
      filename: 'procedimiento_auditoria_interna.pdf',
      originalName: 'Procedimiento de Auditoria Interna.pdf',
      type: 'Procedimiento',
      category: 'Procedimientos',
      clause: '9.2',
      responsible: 'Auditor Lider',
      status: 'Vigente',
      description: 'Procedimiento para planificar, ejecutar y cerrar auditorias internas del SGC.',
      uploadedBy: adminId,
      expiryDate: new Date(today + 365 * 24 * 60 * 60 * 1000)
    }
  ];

  return documents.map((documentSeed) => ({
    ...documentSeed,
    ...createSampleUpload(documentSeed)
  }));
};

const seedCollaboratorData = async () => {
  try {
    logger.info('Iniciando seed de datos para colaborador...');

    const colaborador = await User.findOne({ email: 'colaborador@indusecc.com' });
    const admin = await User.findOne({ email: 'admin@indusecc.com' });

    if (!colaborador) {
      throw new Error('No se encontro el usuario colaborador@indusecc.com');
    }

    if (!admin) {
      throw new Error('No se encontro el usuario admin@indusecc.com');
    }

    try {
      await Action.collection.dropIndex('code_1');
      logger.info('Indice code_1 eliminado');
    } catch (_error) {
      // No-op: el indice no existia.
    }

    const actions = [
      {
        title: 'Revision de procedimientos de calidad',
        description: 'Revisar y actualizar los procedimientos de control de calidad del area de produccion',
        area: 'Produccion',
        assignedTo: colaborador._id,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        priority: 'high',
        status: 'En Proceso'
      },
      {
        title: 'Capacitacion en normas ISO 9001',
        description: 'Completar el modulo de capacitacion sobre normas ISO 9001:2015',
        area: 'Calidad',
        assignedTo: colaborador._id,
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        priority: 'medium',
        status: 'Iniciada'
      },
      {
        title: 'Auditoria interna de procesos',
        description: 'Participar en la auditoria interna del proceso de empaque',
        area: 'Auditoria',
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
        title: 'Actualizacion de documentacion',
        description: 'Actualizar documentacion de procedimientos obsoletos',
        area: 'Documentacion',
        assignedTo: colaborador._id,
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        priority: 'low',
        status: 'Iniciada'
      }
    ];

    await Action.deleteMany({ assignedTo: colaborador._id });
    const createdActions = await Action.insertMany(actions);
    logger.info(`Creadas ${createdActions.length} acciones para el colaborador`);

    logger.info('Creando documentos ISO de ejemplo con archivos reales...');
    const documents = buildSeedDocuments(admin._id);
    const seedFilenames = documents.map((documentSeed) => documentSeed.filename);
    await Document.deleteMany({ filename: { $in: seedFilenames } });
    const createdDocuments = await Document.insertMany(documents);
    logger.info(`Creados ${createdDocuments.length} documentos ISO`);

    const trainings = [
      {
        title: 'Fundamentos ISO 9001:2015',
        module: 'Modulo 1 - Contexto y Liderazgo',
        description: 'Capacitacion basica sobre los fundamentos de la norma ISO 9001:2015',
        assignedTo: colaborador._id,
        status: 'Completado',
        progress: 100,
        score: 95,
        startDate: new Date('2026-01-15'),
        completionDate: new Date('2026-01-20'),
        scheduledDate: new Date('2026-01-10')
      },
      {
        title: 'Gestion de Documentos SGC',
        module: 'Modulo 2 - Control Documental',
        description: 'Gestion y control de documentos en el Sistema de Gestion de Calidad',
        assignedTo: colaborador._id,
        status: 'Completado',
        progress: 100,
        score: 88,
        startDate: new Date('2026-02-01'),
        completionDate: new Date('2026-02-10'),
        scheduledDate: new Date('2026-01-25')
      },
      {
        title: 'Auditorias Internas ISO',
        module: 'Modulo 3 - Planificacion',
        description: 'Tecnicas y metodologias para auditorias internas',
        assignedTo: colaborador._id,
        status: 'En proceso',
        progress: 65,
        startDate: new Date('2026-03-01'),
        scheduledDate: new Date('2026-02-25')
      },
      {
        title: 'Gestion de Riesgos y Oportunidades',
        module: 'Modulo 4 - Clausula 6.1',
        description: 'Identificacion y gestion de riesgos en el SGC',
        assignedTo: colaborador._id,
        status: 'Pendiente',
        progress: 0,
        scheduledDate: new Date('2026-04-15')
      },
      {
        title: 'Mejora Continua y CAPA',
        module: 'Modulo 5 - Clausula 10',
        description: 'Sistemas de mejora continua y acciones correctivas',
        assignedTo: colaborador._id,
        status: 'Pendiente',
        progress: 0,
        scheduledDate: new Date('2026-05-05')
      }
    ];

    await Training.deleteMany({ assignedTo: colaborador._id });
    const createdTrainings = await Training.insertMany(trainings);
    logger.info(`Creadas ${createdTrainings.length} capacitaciones para el colaborador`);

    const completedTrainings = createdTrainings.filter((training) => training.status === 'Completado');
    const certificates = completedTrainings.map((training) => ({
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
    logger.info(`Creados ${createdCertificates.length} certificados para el colaborador`);

    const audits = await Audit.find();
    const sampleAudits = audits.length > 0 ? audits : [null];
    const findings = [
      {
        title: 'Procedimiento de inspeccion desactualizado',
        description: 'El procedimiento de inspeccion de calidad no refleja los ultimos cambios en el proceso de produccion',
        severity: 'Media',
        status: 'Abierto',
        reportedBy: colaborador._id,
        assignedTo: admin._id,
        audit: sampleAudits[0]?._id,
        area: 'Produccion',
        clause: '8.5.1',
        riskLevel: 'Medio',
        relatedDocument: 'procedimiento_calidad_v2.1.pdf',
        findingDate: new Date('2026-03-10'),
        immediateAction: 'Actualizar procedimiento y capacitar al personal'
      },
      {
        title: 'Falta de documentacion de capacitacion',
        description: 'No se cuenta con evidencia documental de la capacitacion en normas ISO para nuevos empleados',
        severity: 'Baja',
        status: 'En Revisi\u00f3n',
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
        title: 'Equipo de medicion sin calibracion',
        description: 'Instrumentos de medicion en linea de produccion no cuentan con certificado de calibracion vigente',
        severity: 'Alta',
        status: 'Abierto',
        reportedBy: colaborador._id,
        assignedTo: admin._id,
        audit: sampleAudits[0]?._id,
        area: 'Calibracion',
        clause: '7.1.5',
        riskLevel: 'Alto',
        relatedDocument: 'formato_inspeccion_v1.3.pdf',
        findingDate: new Date('2026-03-12'),
        immediateAction: 'Calibrar equipos y establecer programa de mantenimiento'
      }
    ];

    await Finding.deleteMany({ reportedBy: colaborador._id });
    const createdFindings = await Finding.insertMany(findings);
    logger.info(`Creados ${createdFindings.length} hallazgos reportados por el colaborador`);

    const calendars = [
      {
        title: 'Reunion de seguimiento de indicadores',
        description: 'Revision mensual de indicadores de calidad y desempeno',
        date: new Date('2026-04-15'),
        type: 'Reuni\u00f3n',
        assignedTo: colaborador._id,
        createdBy: admin._id
      },
      {
        title: 'Capacitacion en auditoria interna',
        description: 'Sesion de capacitacion practica sobre auditorias internas',
        date: new Date('2026-04-20'),
        type: 'Capacitaci\u00f3n',
        assignedTo: colaborador._id,
        createdBy: admin._id
      },
      {
        title: 'Auditoria interna de procesos',
        description: 'Auditoria interna del proceso de empaque y almacenamiento',
        date: new Date('2026-04-25'),
        type: 'Auditor\u00eda',
        assignedTo: colaborador._id,
        createdBy: admin._id
      },
      {
        title: 'Revision de documentacion',
        description: 'Revision y actualizacion de documentacion del area de produccion',
        date: new Date('2026-05-02'),
        type: 'Reuni\u00f3n',
        assignedTo: colaborador._id,
        createdBy: admin._id
      },
      {
        title: 'Entrega de certificados',
        description: 'Entrega de certificados de capacitacion completada',
        date: new Date('2026-05-10'),
        type: 'Otro',
        assignedTo: colaborador._id,
        createdBy: admin._id
      }
    ];

    await Calendar.deleteMany({ assignedTo: colaborador._id });
    const createdCalendars = await Calendar.insertMany(calendars);
    logger.info(`Creados ${createdCalendars.length} eventos de calendario para el colaborador`);

    logger.info('Seed de datos para colaborador completado exitosamente');

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
    logger.error('Error al crear datos de seed para colaborador:', error);
    throw error;
  }
};

if (require.main === module) {
  mongoose
    .connect(process.env.MONGO_URI || 'mongodb://localhost:27017/indusecc')
    .then(async () => {
      await seedCollaboratorData();
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Error de conexion:', error);
      process.exit(1);
    });
}

module.exports = seedCollaboratorData;
