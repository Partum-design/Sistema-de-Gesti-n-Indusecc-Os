const Role = require('../models/Role');
const logger = require('../utils/logger');

// Crear rol
const createRole = async (req, res) => {
  try {
    const { name, description, permissions } = req.body;
    const createdBy = req.user.id;

    // Validar que el rol no exista
    const existingRole = await Role.findOne({ name });
    if (existingRole) {
      return res.status(409).json({
        success: false,
        message: 'El rol ya existe',
        code: 'ROLE_ALREADY_EXISTS'
      });
    }

    const role = new Role({
      name,
      description,
      permissions: permissions || [],
      createdBy
    });

    await role.save();

    logger.info(`Rol creado: ${name} por usuario ${createdBy}`);

    res.status(201).json({
      success: true,
      message: 'Rol creado exitosamente',
      data: {
        role: {
          id: role._id,
          name: role.name,
          description: role.description,
          permissions: role.permissions,
          createdAt: role.createdAt
        }
      }
    });
  } catch (error) {
    logger.error('Error al crear rol:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear rol',
      code: 'CREATE_ROLE_ERROR'
    });
  }
};

// Obtener roles
const getRoles = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const skip = (page - 1) * limit;

    const [roles, total] = await Promise.all([
      Role.find()
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Role.countDocuments()
    ]);

    res.json({
      success: true,
      message: 'Roles obtenidos exitosamente',
      data: {
        roles,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Error al obtener roles:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener roles',
      code: 'GET_ROLES_ERROR'
    });
  }
};

// Obtener rol por ID
const getRoleById = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id).populate('createdBy', 'name email');

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Rol no encontrado',
        code: 'ROLE_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: { role }
    });
  } catch (error) {
    logger.error('Error al obtener rol:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener rol',
      code: 'GET_ROLE_ERROR'
    });
  }
};

// Actualizar rol
const updateRole = async (req, res) => {
  try {
    const { name, description, permissions } = req.body;

    // Validar que no haya otro rol con el mismo nombre
    const existingRole = await Role.findOne({ name, _id: { $ne: req.params.id } });
    if (existingRole) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe otro rol con ese nombre',
        code: 'ROLE_NAME_ALREADY_EXISTS'
      });
    }

    const role = await Role.findByIdAndUpdate(
      req.params.id,
      {
        name,
        description,
        permissions: permissions || [],
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Rol no encontrado',
        code: 'ROLE_NOT_FOUND'
      });
    }

    logger.info(`Rol actualizado: ${role.name}`);

    res.json({
      success: true,
      message: 'Rol actualizado exitosamente',
      data: { role }
    });
  } catch (error) {
    logger.error('Error al actualizar rol:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar rol',
      code: 'UPDATE_ROLE_ERROR'
    });
  }
};

// Eliminar rol
const deleteRole = async (req, res) => {
  try {
    const role = await Role.findByIdAndDelete(req.params.id);

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Rol no encontrado',
        code: 'ROLE_NOT_FOUND'
      });
    }

    logger.info(`Rol eliminado: ${role.name}`);

    res.json({
      success: true,
      message: 'Rol eliminado exitosamente'
    });
  } catch (error) {
    logger.error('Error al eliminar rol:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar rol',
      code: 'DELETE_ROLE_ERROR'
    });
  }
};

module.exports = {
  createRole,
  getRoles,
  getRoleById,
  updateRole,
  deleteRole
};
