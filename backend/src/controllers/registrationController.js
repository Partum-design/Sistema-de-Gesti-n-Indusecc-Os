const RegistrationRequest = require('../models/RegistrationRequest');
const User = require('../models/User');
const logger = require('../utils/logger');

// Crear solicitud de registro
const requestRegistration = async (req, res) => {
  try {
    const { name, email, phone, department, requestedRole } = req.body;

    // Validar que no exista un usuario con ese email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'El email ya está registrado',
        code: 'EMAIL_ALREADY_EXISTS'
      });
    }

    // Validar que no exista una solicitud pendiente con ese email
    const existingRequest = await RegistrationRequest.findOne({ 
      email, 
      status: 'Pendiente' 
    });
    if (existingRequest) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe una solicitud pendiente para este email',
        code: 'PENDING_REQUEST_EXISTS'
      });
    }

    const registrationRequest = new RegistrationRequest({
      name,
      email,
      phone,
      department,
      requestedRole: requestedRole || 'COLABORADOR',
      status: 'Pendiente'
    });

    await registrationRequest.save();

    logger.info(`Solicitud de registro creada: ${email}`);

    res.status(201).json({
      success: true,
      message: 'Solicitud de registro enviada. Espera la aprobación del administrador.',
      data: {
        request: {
          id: registrationRequest._id,
          name: registrationRequest.name,
          email: registrationRequest.email,
          requestedRole: registrationRequest.requestedRole,
          status: registrationRequest.status,
          createdAt: registrationRequest.createdAt
        }
      }
    });
  } catch (error) {
    logger.error('Error al crear solicitud de registro:', error);
    res.status(500).json({
      success: false,
      message: 'Error al procesar la solicitud',
      code: 'REGISTRATION_REQUEST_ERROR'
    });
  }
};

// Obtener solicitudes de registro (solo para admin)
const getRegistrationRequests = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const [requests, total] = await Promise.all([
      RegistrationRequest.find(filter)
        .populate('approvedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      RegistrationRequest.countDocuments(filter)
    ]);

    res.json({
      success: true,
      message: 'Solicitudes de registro obtenidas',
      data: {
        requests,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Error al obtener solicitudes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener solicitudes',
      code: 'GET_REQUESTS_ERROR'
    });
  }
};

// Generar contraseña temporal aleatoria
const generateTemporaryPassword = () => {
  const length = 12;
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
};

// Aprobar solicitud de registro
const approveRegistration = async (req, res) => {
  try {
    const { requestId, approvalNotes } = req.body;
    const approverId = req.user.id;

    const registrationRequest = await RegistrationRequest.findById(requestId);
    if (!registrationRequest) {
      return res.status(404).json({
        success: false,
        message: 'Solicitud no encontrada',
        code: 'REQUEST_NOT_FOUND'
      });
    }

    if (registrationRequest.status !== 'Pendiente') {
      return res.status(400).json({
        success: false,
        message: 'Esta solicitud ya fue procesada',
        code: 'REQUEST_ALREADY_PROCESSED'
      });
    }

    // Generar contraseña temporal
    const temporaryPassword = generateTemporaryPassword();

    // Crear usuario
    const user = new User({
      name: registrationRequest.name,
      email: registrationRequest.email,
      password: temporaryPassword,
      role: registrationRequest.requestedRole,
      active: true
    });

    await user.save();

    // Actualizar solicitud
    registrationRequest.status = 'Aprobada';
    registrationRequest.approvalNotes = approvalNotes || '';
    registrationRequest.approvedBy = approverId;
    registrationRequest.approvedAt = new Date();
    await registrationRequest.save();

    logger.info(`Solicitud de registro aprobada: ${registrationRequest.email} por ${req.user.email}`);

    res.json({
      success: true,
      message: 'Solicitud aprobada. Usuario creado exitosamente.',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          temporaryPassword: temporaryPassword
        },
        request: {
          id: registrationRequest._id,
          status: registrationRequest.status,
          approvedAt: registrationRequest.approvedAt
        }
      }
    });
  } catch (error) {
    logger.error('Error al aprobar solicitud:', error);
    res.status(500).json({
      success: false,
      message: 'Error al aprobar solicitud',
      code: 'APPROVE_ERROR'
    });
  }
};

// Rechazar solicitud de registro
const rejectRegistration = async (req, res) => {
  try {
    const { requestId, rejectionReason } = req.body;
    const approverId = req.user.id;

    const registrationRequest = await RegistrationRequest.findById(requestId);
    if (!registrationRequest) {
      return res.status(404).json({
        success: false,
        message: 'Solicitud no encontrada',
        code: 'REQUEST_NOT_FOUND'
      });
    }

    if (registrationRequest.status !== 'Pendiente') {
      return res.status(400).json({
        success: false,
        message: 'Esta solicitud ya fue procesada',
        code: 'REQUEST_ALREADY_PROCESSED'
      });
    }

    registrationRequest.status = 'Rechazada';
    registrationRequest.approvalNotes = rejectionReason || '';
    registrationRequest.approvedBy = approverId;
    registrationRequest.rejectedAt = new Date();
    await registrationRequest.save();

    logger.info(`Solicitud de registro rechazada: ${registrationRequest.email} por ${req.user.email}`);

    res.json({
      success: true,
      message: 'Solicitud rechazada',
      data: {
        request: {
          id: registrationRequest._id,
          status: registrationRequest.status,
          rejectedAt: registrationRequest.rejectedAt
        }
      }
    });
  } catch (error) {
    logger.error('Error al rechazar solicitud:', error);
    res.status(500).json({
      success: false,
      message: 'Error al rechazar solicitud',
      code: 'REJECT_ERROR'
    });
  }
};

module.exports = {
  requestRegistration,
  getRegistrationRequests,
  approveRegistration,
  rejectRegistration
};
