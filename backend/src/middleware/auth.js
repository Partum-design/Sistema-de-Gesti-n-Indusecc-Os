const jwt = require('jsonwebtoken')
const { JWT_SECRET } = require('../config/environment')

const authenticate = (req, res, next) => {
  const authHeader = req.header('Authorization')
  if (!authHeader) return res.status(401).json({ message: 'Acceso denegado' })

  const token = authHeader.replace('Bearer ', '')
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = decoded
    next()
  } catch (error) {
    res.status(401).json({ message: 'Token inválido' })
  }
}

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Acceso denegado' })
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'No tienes permisos para esta acción' })
    }
    next()
  }
}

module.exports = {
  authenticate,
  authorize,
}
