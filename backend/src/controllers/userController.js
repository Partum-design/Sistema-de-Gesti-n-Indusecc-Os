const User = require('../models/User');
const logger = require('../utils/logger');

// Crear usuario
const createUser = async (req, res) => {
  try {
    const { name, email, password, role, active } = req.body;

    // Si el usuario autenticado es ADMIN, solo puede crear COLABORADOR o CONSULTOR
    if (req.user.role === 'ADMIN' && !['COLABORADOR', 'CONSULTOR'].includes(role)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para crear este tipo de usuario',
        code: 'FORBIDDEN_ROLE_CREATE'
      });
    }

    // Verificar si el email ya existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'El email ya está registrado',
        code: 'DUPLICATE_EMAIL'
      });
    }

    // Crear usuario
    const user = new User({
      name,
      email,
      password,
      role,
      active: active !== false
    });

    await user.save();

    logger.info(`Usuario creado: ${email} por ${req.user?.email || 'sistema'}`);

    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          active: user.active,
          createdAt: user.createdAt,
        }
      }
    });
  } catch (error) {
    logger.error('Error al crear usuario:', error);
    
    // Manejar errores de duplicado de MongoDB
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue || {})[0];
      return res.status(409).json({
        success: false,
        message: `${field === 'email' ? 'El email' : field} ya está registrado`,
        code: 'DUPLICATE_ERROR'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error al crear usuario',
      code: 'CREATE_USER_ERROR'
    });
  }
};

// Obtener usuarios con paginación y filtros
const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const skip = (page - 1) * limit;

    // Filtros
    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.active !== undefined) filter.active = req.query.active === 'true';
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(filter)
    ]);

    res.json({
      success: true,
      message: 'Usuarios obtenidos exitosamente',
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Error al obtener usuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuarios',
      code: 'GET_USERS_ERROR'
    });
  }
};

// Obtener usuario por ID
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
        code: 'USER_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      message: 'Usuario obtenido exitosamente',
      data: { user }
    });
  } catch (error) {
    logger.error('Error al obtener usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuario',
      code: 'GET_USER_ERROR'
    });
  }
};

// ...existing code...

// Eliminar usuario
const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
        code: 'USER_NOT_FOUND'
      });
    }

    logger.info(`Usuario eliminado: ${user.email} por ${req.user?.email || 'sistema'}`);

    res.json({
      success: true,
      message: 'Usuario eliminado exitosamente',
      data: { deletedUser: { id: user._id, email: user.email } }
    });
  } catch (error) {
    logger.error('Error al eliminar usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar usuario',
      code: 'DELETE_USER_ERROR'
    });
  }
};

// Cambiar estado de usuario
const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
        code: 'USER_NOT_FOUND'
      });
    }

    // Si el usuario autenticado es ADMIN, solo puede cambiar estado a COLABORADOR o CONSULTOR
    if (req.user.role === 'ADMIN' && !['COLABORADOR', 'CONSULTOR'].includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para cambiar el estado de este usuario',
        code: 'FORBIDDEN_ROLE_UPDATE'
      });
    }

    user.active = !user.active;
    user.updatedAt = new Date();
    await user.save();

    logger.info(`Estado de usuario cambiado: ${user.email} -> ${user.active ? 'activo' : 'inactivo'} por ${req.user?.email || 'sistema'}`);

    res.json({
      success: true,
      message: `Usuario ${user.active ? 'activado' : 'desactivado'} exitosamente`,
      data: {
        user: {
          id: user._id,
          email: user.email,
          active: user.active
        }
      }
    });
  } catch (error) {
    logger.error('Error al cambiar estado de usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar estado de usuario',
      code: 'TOGGLE_USER_STATUS_ERROR'
    });
  } 
};

// Actualizar usuario
const updateUser = async (req, res) => {
  try {
    const { name, email, role, active } = req.body;
    const updateData = {};

    // Primero obtener el usuario a actualizar
    const userToUpdate = await User.findById(req.params.id);
    if (!userToUpdate) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
        code: 'USER_NOT_FOUND'
      });
    }

    // Si el usuario autenticado es ADMIN, solo puede actualizar COLABORADOR o CONSULTOR
    if (req.user.role === 'ADMIN' && !['COLABORADOR', 'CONSULTOR'].includes(userToUpdate.role)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para actualizar este usuario',
        code: 'FORBIDDEN_ROLE_UPDATE'
      });
    }

    // Si el usuario autenticado es ADMIN, solo puede cambiar a COLABORADOR o CONSULTOR
    if (req.user.role === 'ADMIN' && role !== undefined && !['COLABORADOR', 'CONSULTOR'].includes(role)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para asignar este tipo de rol',
        code: 'FORBIDDEN_ROLE_UPDATE'
      });
    }

    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (role !== undefined) updateData.role = role;
    if (active !== undefined) updateData.active = active;
    updateData.updatedAt = new Date();

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      data: { user }
    });
  } catch (error) {
    logger.error('Error al actualizar usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar usuario',
      code: 'UPDATE_USER_ERROR'
    });
  }
};

// Obtener estadísticas de usuarios
const getUserStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ active: true });
    const inactiveUsers = await User.countDocuments({ active: false });
    
    const roleStats = {};
    const roles = ['SUPER_ADMIN', 'ADMIN', 'COLABORADOR', 'CONSULTOR'];
    
    for (const role of roles) {
      roleStats[role] = await User.countDocuments({ role });
    }

    res.json({
      success: true,
      message: 'Estadísticas de usuarios obtenidas exitosamente',
      data: {
        total: totalUsers,
        active: activeUsers,
        inactive: inactiveUsers,
        byRole: roleStats
      }
    });
  } catch (error) {
    logger.error('Error al obtener estadísticas de usuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas de usuarios',
      code: 'GET_USER_STATS_ERROR'
    });
  }
};

// Actualizar perfil del usuario autenticado
const updateUserProfile = async (req, res) => {
  try {
    const { name, currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
        code: 'USER_NOT_FOUND'
      });
    }

    // Si intenta cambiar contraseña, validar la actual
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Debe proporcionar la contraseña actual',
          code: 'CURRENT_PASSWORD_REQUIRED'
        });
      }

      const passwordMatch = await user.comparePassword(currentPassword);
      if (!passwordMatch) {
        return res.status(401).json({
          success: false,
          message: 'Contraseña actual incorrecta',
          code: 'INVALID_CURRENT_PASSWORD'
        });
      }

      user.password = newPassword;
    }

    if (name) user.name = name;
    user.updatedAt = new Date();

    await user.save();

    logger.info(`Perfil actualizado: ${user.email}`);

    res.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          active: user.active,
          updatedAt: user.updatedAt
        }
      }
    });
  } catch (error) {
    logger.error('Error al actualizar perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar perfil',
      code: 'UPDATE_PROFILE_ERROR'
    });
  }
};

module.exports = {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  toggleUserStatus,
  getUserStats,
  updateUserProfile,
};