const jwt = require('jsonwebtoken')
const User = require('../models/User')
const { JWT_SECRET } = require('../config/environment')
const logger = require('../utils/logger')

const registerUser = async (req, res) => {
  try {
    // Este endpoint está deprecado. Usar POST /api/registration/request en su lugar
    return res.status(410).json({
      success: false,
      message: 'Este endpoint está deprecado. Use POST /api/registration/request',
      code: 'DEPRECATED_ENDPOINT',
      newEndpoint: 'POST /api/registration/request'
    });
  } catch (error) {
    logger.error('Error:', error);
  }
}

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body
    const user = await User.findOne({ email })

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Credenciales incorrectas' })
    }

    if (!user.active) {
      return res.status(403).json({ message: 'Usuario desactivado' })
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: '1h' }
    )

    res.json({
      message: 'Login exitoso',
      user: { id: user._id, name: user.name, email: user.email, role: user.role, profilePhotoUrl: user.profilePhotoUrl || '' },
      token,
    })
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor' })
  }
}

const uploadFile = async (req, res) => {
  try {
    const { file, filename } = req.body
    const userId = req.user.id

    if (!file || !filename) {
      return res.status(400).json({
        success: false,
        message: 'Archivo y nombre de archivo son requeridos',
        code: 'MISSING_FILE'
      })
    }

    // Validar tamaño máximo (10MB)
    const fileSizeBytes = Buffer.byteLength(file, 'utf8')
    const maxSize = 10 * 1024 * 1024
    if (fileSizeBytes > maxSize) {
      return res.status(413).json({
        success: false,
        message: 'Archivo demasiado grande (máximo 10MB)',
        code: 'FILE_TOO_LARGE'
      })
    }

    logger.info(`Archivo cargado: ${filename} por usuario ${userId}`)

    res.json({
      success: true,
      message: 'Archivo cargado exitosamente',
      data: {
        file: {
          filename,
          size: fileSizeBytes,
          uploadedBy: userId,
          uploadedAt: new Date()
        }
      }
    })
  } catch (error) {
    logger.error('Error al cargar archivo:', error)
    res.status(500).json({
      success: false,
      message: 'Error al cargar archivo',
      code: 'UPLOAD_ERROR'
    })
  }
}

const crypto = require('crypto')
const sendEmail = require('../utils/email')

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'No hay usuario con ese correo' });
    }

    // Generar token
    const resetToken = crypto.randomBytes(20).toString('hex');
    
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutos

    await user.save();

    // Link para el frontend
    // En producción esto debería venir de una variable de entorno
    const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;

    const message = `Has solicitado restablecer tu contraseña en Indusecc SGC.\n\nPor favor haz clic en el siguiente enlace:\n\n${resetUrl}\n\nSi no solicitaste esto, ignora este correo.`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #8B0000; border-bottom: 2px solid #D4AF37; padding-bottom: 10px;">Recuperación de Contraseña</h2>
        <p>Hola, <strong>${user.name}</strong>.</p>
        <p>Has solicitado restablecer tu contraseña en nuestra plataforma <strong>Indusecc SGC</strong>.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #8B0000; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Restablecer Contraseña</a>
        </div>
        <p style="font-size: 0.8em; color: #666;">Este enlace expirará en 10 minutos. Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
        <p style="font-size: 0.8em; color: #666; word-break: break-all;">${resetUrl}</p>
        <hr />
        <p style="font-size: 0.7em; color: #999;">Indusecc SGC - Sistema de Gestión de Calidad</p>
      </div>
    `;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Recuperación de Contraseña - Indusecc SGC',
        message: message,
        html: html
      });

      res.status(200).json({
        success: true,
        data: 'Se ha enviado un enlace de recuperación a su correo electrónico.'
      });

    } catch (err) {
      logger.error('Error al enviar el correo:', err);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      return res.status(500).json({ message: 'No se pudo enviar el correo, intente más tarde' });
    }

  } catch (error) {
    logger.error('Error in forgotPassword:', error);
    res.status(500).json({ message: 'Error al procesar la solicitud' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { password } = req.body;
    const { token } = req.params;

    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Token inválido o expirado' });
    }

    // Cambiar contraseña
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Contraseña actualizada exitosamente',
    });

  } catch (error) {
    logger.error('Error in resetPassword:', error);
    res.status(500).json({ message: 'Error al restablecer contraseña' });
  }
};

module.exports = { loginUser, uploadFile, registerUser, forgotPassword, resetPassword }
