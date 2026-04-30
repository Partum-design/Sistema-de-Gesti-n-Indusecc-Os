const Training = require('../models/Training');
const Certificate = require('../models/Certificate');
const User = require('../models/User');
const Configuration = require('../models/Configuration');
const logger = require('../utils/logger');
const PDFDocument = require('pdfkit');

const CERTIFICATE_SETTINGS_KEY = 'certificate_settings';
const CERTIFICATE_SEQUENCE_KEY = 'certificate_sequence';

const getCertificateSettings = async () => {
  const config = await Configuration.findOne({ key: CERTIFICATE_SETTINGS_KEY });
  const defaults = {
    prefix: 'CERT',
    startSequence: 1,
    validityDays: 365,
    issuerName: 'Administrador INDUSECC',
    issuerRole: 'Administrador',
    signatureImageUrl: '',
    sealImageUrl: '',
  };
  return { ...defaults, ...(config?.value || {}) };
};

const generateCertificateNumber = async (prefix, startSequence = 1) => {
  const current = await Configuration.findOne({ key: CERTIFICATE_SEQUENCE_KEY });
  const currentValue = Number(current?.value || startSequence - 1);
  const nextValue = currentValue + 1;
  const year = new Date().getFullYear();
  const padded = String(nextValue).padStart(6, '0');
  const folio = `${prefix}-${year}-${padded}`;

  await Configuration.findOneAndUpdate(
    { key: CERTIFICATE_SEQUENCE_KEY },
    { key: CERTIFICATE_SEQUENCE_KEY, value: nextValue, updatedAt: new Date() },
    { upsert: true, new: true },
  );

  return folio;
};

const ensureCertificateForTraining = async (training, forcedScore) => {
  const settings = await getCertificateSettings();
  const score = forcedScore || training.score || Math.floor(Math.random() * 15) + 85;
  const issueDate = new Date();
  const expiryDate = new Date(issueDate);
  expiryDate.setDate(expiryDate.getDate() + Number(settings.validityDays || 365));

  const existing = await Certificate.findOne({ trainingId: training._id, userId: training.assignedTo });
  const certificateNumber = existing?.certificateNumber || await generateCertificateNumber(settings.prefix, settings.startSequence);

  return Certificate.findOneAndUpdate(
    { trainingId: training._id, userId: training.assignedTo },
    {
      trainingId: training._id,
      userId: training.assignedTo,
      title: training.title,
      module: training.module,
      score,
      issueDate,
      expiryDate,
      certificateNumber,
      issuedByName: settings.issuerName,
      issuedByRole: settings.issuerRole,
      signatureImageUrl: settings.signatureImageUrl,
      sealImageUrl: settings.sealImageUrl,
      status: 'Activo',
    },
    { upsert: true, new: true },
  );
};

const getUserTrainings = async (req, res) => {
  try {
    const userId = req.user.id;

    const trainings = await Training.find({ assignedTo: userId })
      .sort({ createdAt: -1 })
      .populate('assignedTo', 'name email');

    const stats = {
      completed: trainings.filter(t => t.status === 'Completado').length,
      inProgress: trainings.filter(t => t.status === 'En proceso').length,
      pending: trainings.filter(t => t.status === 'Pendiente').length,
      pendingApproval: trainings.filter(t => t.status === 'Pendiente de aprobacion').length,
      averageScore: 0,
    };

    const completedTrainings = trainings.filter(t => t.status === 'Completado' && t.score);
    if (completedTrainings.length > 0) {
      stats.averageScore = Math.round(
        completedTrainings.reduce((sum, t) => sum + t.score, 0) / completedTrainings.length,
      );
    }

    res.json({
      success: true,
      data: {
        trainings: trainings.map(training => ({
          _id: training._id,
          title: training.title,
          module: training.module,
          status: training.status,
          progress: training.progress,
          score: training.score,
          startDate: training.startDate,
          completionDate: training.completionDate,
          scheduledDate: training.scheduledDate,
          createdAt: training.createdAt,
        })),
        stats,
      },
    });
  } catch (error) {
    logger.error('Error al obtener capacitaciones del usuario:', error);
    res.status(500).json({ success: false, message: 'Error al obtener capacitaciones', code: 'GET_TRAININGS_ERROR' });
  }
};

const getUserCertificates = async (req, res) => {
  try {
    const userId = req.user.id;

    const certificates = await Certificate.find({ userId, status: 'Activo' })
      .sort({ issueDate: -1 })
      .populate('trainingId', 'title module');

    res.json({
      success: true,
      data: {
        certificates: certificates.map(cert => ({
          _id: cert._id,
          title: cert.title,
          module: cert.module,
          score: cert.score,
          issueDate: cert.issueDate,
          expiryDate: cert.expiryDate,
          certificateNumber: cert.certificateNumber,
          filePath: cert.filePath,
          status: cert.status,
          issuedByName: cert.issuedByName,
          issuedByRole: cert.issuedByRole,
          signatureImageUrl: cert.signatureImageUrl,
          sealImageUrl: cert.sealImageUrl,
        })),
      },
    });
  } catch (error) {
    logger.error('Error al obtener certificados del usuario:', error);
    res.status(500).json({ success: false, message: 'Error al obtener certificados', code: 'GET_CERTIFICATES_ERROR' });
  }
};

const updateTrainingProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const { progress, status } = req.body;
    const userId = req.user.id;

    const training = await Training.findOne({ _id: id, assignedTo: userId });
    if (!training) {
      return res.status(404).json({ success: false, message: 'Capacitacion no encontrada' });
    }

    if (progress !== undefined) {
      training.progress = Math.min(100, Math.max(0, progress));
    }

    if (training.progress === 100 && training.status !== 'Completado') {
      training.status = 'Pendiente de aprobacion';
    }

    if (status) {
      training.status = status;
      if (status === 'En proceso' && !training.startDate) {
        training.startDate = new Date();
      }
    }

    await training.save();

    res.json({
      success: true,
      data: {
        training: {
          _id: training._id,
          title: training.title,
          module: training.module,
          status: training.status,
          progress: training.progress,
          score: training.score,
          completionDate: training.completionDate,
        },
      },
    });
  } catch (error) {
    logger.error('Error al actualizar progreso de capacitacion:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar capacitacion', code: 'UPDATE_TRAINING_ERROR' });
  }
};

const downloadCertificate = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const certificate = await Certificate.findOne({ _id: id, userId, status: 'Activo' }).populate('userId', 'name email');

    if (!certificate) {
      return res.status(404).json({ success: false, message: 'Certificado no encontrado' });
    }
    const traineeName = certificate.userId?.name || 'Colaborador';
    const issueDate = new Date(certificate.issueDate).toLocaleDateString('es-MX');
    const expiryDate = certificate.expiryDate ? new Date(certificate.expiryDate).toLocaleDateString('es-MX') : 'N/A';
    const fileName = `certificado-${certificate.certificateNumber}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=\"${fileName}\"`);

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    doc.pipe(res);

    doc.rect(35, 35, 525, 770).lineWidth(2).stroke('#8B0000');
    doc.fontSize(26).fillColor('#8B0000').text('CERTIFICADO', { align: 'center' });
    doc.moveDown(0.4);
    doc.fontSize(14).fillColor('#444444').text('Sistema de Gestion de Calidad INDUSECC', { align: 'center' });
    doc.moveDown(1.5);
    doc.fontSize(12).fillColor('#222222').text('Se certifica que:', { align: 'center' });
    doc.moveDown(0.4);
    doc.fontSize(22).fillColor('#111111').text(traineeName, { align: 'center' });
    doc.moveDown(1);
    doc.fontSize(12).fillColor('#222222').text('ha completado satisfactoriamente la capacitacion:', { align: 'center' });
    doc.moveDown(0.4);
    doc.fontSize(17).fillColor('#8B0000').text(certificate.title, { align: 'center' });
    doc.moveDown(0.2);
    doc.fontSize(12).fillColor('#333333').text(certificate.module, { align: 'center' });
    doc.moveDown(1.2);
    doc.fontSize(11).fillColor('#222222').text(`Folio: ${certificate.certificateNumber}`, { align: 'center' });
    doc.text(`Fecha de emision: ${issueDate}`, { align: 'center' });
    doc.text(`Vigencia hasta: ${expiryDate}`, { align: 'center' });
    doc.text(`Calificacion: ${certificate.score}/100`, { align: 'center' });

    const signatureY = 650;
    if (certificate.signatureImageUrl && certificate.signatureImageUrl.startsWith('data:image')) {
      const base64Signature = certificate.signatureImageUrl.split(',')[1];
      if (base64Signature) {
        const signatureBuffer = Buffer.from(base64Signature, 'base64');
        doc.image(signatureBuffer, 110, signatureY - 55, { fit: [170, 60] });
      }
    }
    if (certificate.sealImageUrl && certificate.sealImageUrl.startsWith('data:image')) {
      const base64Seal = certificate.sealImageUrl.split(',')[1];
      if (base64Seal) {
        const sealBuffer = Buffer.from(base64Seal, 'base64');
        doc.image(sealBuffer, 390, signatureY - 60, { fit: [110, 110] });
      }
    }

    doc.moveTo(90, signatureY).lineTo(280, signatureY).stroke('#444444');
    doc.fontSize(10).fillColor('#222222').text(certificate.issuedByName || 'Administrador INDUSECC', 90, signatureY + 5, { width: 190, align: 'center' });
    doc.fontSize(9).fillColor('#555555').text(certificate.issuedByRole || 'Administrador', 90, signatureY + 20, { width: 190, align: 'center' });
    doc.moveTo(370, signatureY).lineTo(510, signatureY).stroke('#444444');
    doc.fontSize(10).fillColor('#222222').text('Sello institucional', 370, signatureY + 8, { width: 140, align: 'center' });

    doc.end();
  } catch (error) {
    logger.error('Error al descargar certificado:', error);
    res.status(500).json({ success: false, message: 'Error al descargar certificado', code: 'DOWNLOAD_CERTIFICATE_ERROR' });
  }
};

const createSampleTrainings = async (req, res) => {
  try {
    const userId = req.user.id;

    const sampleTrainings = [
      { title: 'Fundamentos ISO 9001:2015', module: 'Modulo 1 - Contexto y Liderazgo', assignedTo: userId, status: 'Completado', progress: 100, score: 95, completionDate: new Date('2026-01-15'), scheduledDate: new Date('2026-01-15') },
      { title: 'Gestion de Documentos SGC', module: 'Modulo 2 - Control Documental', assignedTo: userId, status: 'Completado', progress: 100, score: 88, completionDate: new Date('2026-02-28'), scheduledDate: new Date('2026-02-28') },
      { title: 'Auditorias Internas ISO', module: 'Modulo 3 - Planificacion', assignedTo: userId, status: 'En proceso', progress: 65, startDate: new Date(), scheduledDate: new Date('2026-03-15') },
      { title: 'Gestion de Riesgos y Oportunidades', module: 'Modulo 4 - Clausula 6.1', assignedTo: userId, status: 'Pendiente', progress: 0, scheduledDate: new Date('2026-04-15') },
      { title: 'Mejora Continua y CAPA', module: 'Modulo 5 - Clausula 10', assignedTo: userId, status: 'Pendiente', progress: 0, scheduledDate: new Date('2026-05-05') },
    ];

    await Training.deleteMany({ assignedTo: userId });
    const createdTrainings = await Training.insertMany(sampleTrainings);

    const completedTrainings = createdTrainings.filter(t => t.status === 'Completado');
    for (const training of completedTrainings) {
      await ensureCertificateForTraining(training, training.score);
    }

    res.json({ success: true, message: 'Capacitaciones de ejemplo creadas exitosamente', data: { trainingsCount: createdTrainings.length, certificatesCount: completedTrainings.length } });
  } catch (error) {
    logger.error('Error al crear capacitaciones de ejemplo:', error);
    res.status(500).json({ success: false, message: 'Error al crear capacitaciones de ejemplo', code: 'CREATE_SAMPLE_TRAININGS_ERROR' });
  }
};

const getAdminTrainings = async (req, res) => {
  try {
    const { status, assignedTo, search } = req.query;
    const query = {};

    if (status) query.status = status;
    if (assignedTo) query.assignedTo = assignedTo;
    if (search) query.title = { $regex: search, $options: 'i' };

    const trainings = await Training.find(query)
      .sort({ createdAt: -1 })
      .populate('assignedTo', 'name email role');

    const stats = {
      total: trainings.length,
      completed: trainings.filter(t => t.status === 'Completado').length,
      inProgress: trainings.filter(t => t.status === 'En proceso').length,
      pending: trainings.filter(t => t.status === 'Pendiente').length,
      pendingApproval: trainings.filter(t => t.status === 'Pendiente de aprobacion').length,
    };

    return res.json({ success: true, data: { trainings, stats } });
  } catch (error) {
    logger.error('Error al obtener capacitaciones para admin:', error);
    return res.status(500).json({ success: false, message: 'Error al obtener capacitaciones', code: 'GET_ADMIN_TRAININGS_ERROR' });
  }
};

const createTrainingByAdmin = async (req, res) => {
  try {
    const { title, module, description, assignedTo, scheduledDate, status = 'Pendiente', progress = 0, score } = req.body;

    if (!title || !module || !assignedTo) {
      return res.status(400).json({ success: false, message: 'title, module y assignedTo son requeridos' });
    }

    const user = await User.findById(assignedTo);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuario asignado no encontrado' });
    }

    const training = await Training.create({
      title,
      module,
      description,
      assignedTo,
      scheduledDate,
      status,
      progress,
      score,
      startDate: status === 'En proceso' ? new Date() : undefined,
      completionDate: status === 'Completado' ? new Date() : undefined,
    });

    if (status === 'Completado') {
      await ensureCertificateForTraining(training, score || 90);
    }

    return res.status(201).json({ success: true, data: { training } });
  } catch (error) {
    logger.error('Error al crear capacitacion por admin:', error);
    return res.status(500).json({ success: false, message: 'Error al crear capacitacion', code: 'CREATE_ADMIN_TRAINING_ERROR' });
  }
};

const updateTrainingByAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    const training = await Training.findById(id);
    if (!training) {
      return res.status(404).json({ success: false, message: 'Capacitacion no encontrada' });
    }

    const nextStatus = updates.status || training.status;
    const nextProgress = updates.progress !== undefined ? updates.progress : training.progress;

    if (nextStatus === 'En proceso' && !training.startDate) {
      updates.startDate = new Date();
    }
    if (nextStatus === 'Completado') {
      updates.status = 'Completado';
      updates.progress = 100;
      if (!training.completionDate) updates.completionDate = new Date();
    } else if (Number(nextProgress) >= 100) {
      updates.status = 'Pendiente de aprobacion';
      updates.progress = 100;
    }

    const updated = await Training.findByIdAndUpdate(id, updates, { new: true });

    if (updated.status === 'Completado') {
      await ensureCertificateForTraining(updated, updated.score || 90);
    }

    return res.json({ success: true, data: { training: updated } });
  } catch (error) {
    logger.error('Error al actualizar capacitacion por admin:', error);
    return res.status(500).json({ success: false, message: 'Error al actualizar capacitacion', code: 'UPDATE_ADMIN_TRAINING_ERROR' });
  }
};

const approveTrainingByAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { score } = req.body;
    const training = await Training.findById(id);

    if (!training) {
      return res.status(404).json({ success: false, message: 'Capacitacion no encontrada' });
    }

    training.status = 'Completado';
    training.progress = 100;
    training.completionDate = training.completionDate || new Date();
    if (score !== undefined) training.score = score;
    await training.save();

    const certificate = await ensureCertificateForTraining(training, training.score || 90);
    return res.json({ success: true, message: 'Capacitacion aprobada y certificado emitido', data: { training, certificate } });
  } catch (error) {
    logger.error('Error al aprobar capacitacion por admin:', error);
    return res.status(500).json({ success: false, message: 'Error al aprobar capacitacion', code: 'APPROVE_ADMIN_TRAINING_ERROR' });
  }
};

const getCertificateSettingsAdmin = async (req, res) => {
  try {
    const settings = await getCertificateSettings();
    return res.json({ success: true, data: settings });
  } catch (error) {
    logger.error('Error al obtener configuracion de certificados:', error);
    return res.status(500).json({ success: false, message: 'Error al obtener configuracion' });
  }
};

const updateCertificateSettingsAdmin = async (req, res) => {
  try {
    const settings = req.body || {};
    const allowed = {
      prefix: settings.prefix || 'CERT',
      startSequence: Number(settings.startSequence || 1),
      validityDays: Number(settings.validityDays || 365),
      issuerName: settings.issuerName || 'Administrador INDUSECC',
      issuerRole: settings.issuerRole || 'Administrador',
      signatureImageUrl: settings.signatureImageUrl || '',
      sealImageUrl: settings.sealImageUrl || '',
    };

    await Configuration.findOneAndUpdate(
      { key: CERTIFICATE_SETTINGS_KEY },
      { key: CERTIFICATE_SETTINGS_KEY, value: allowed, updatedBy: req.user.id, updatedAt: new Date() },
      { upsert: true, new: true },
    );

    return res.json({ success: true, message: 'Configuracion de certificados actualizada', data: allowed });
  } catch (error) {
    logger.error('Error al actualizar configuracion de certificados:', error);
    return res.status(500).json({ success: false, message: 'Error al actualizar configuracion' });
  }
};

module.exports = {
  getUserTrainings,
  getUserCertificates,
  updateTrainingProgress,
  downloadCertificate,
  createSampleTrainings,
  getAdminTrainings,
  createTrainingByAdmin,
  updateTrainingByAdmin,
  approveTrainingByAdmin,
  getCertificateSettingsAdmin,
  updateCertificateSettingsAdmin,
};
