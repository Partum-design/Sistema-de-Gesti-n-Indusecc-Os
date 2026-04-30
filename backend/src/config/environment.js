const dotenv = require('dotenv');

dotenv.config();

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/indusecc-os';
const JWT_SECRET = process.env.JWT_SECRET || 'tu_secreto_muy_largo_y_aleatorio_aqui';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '1h';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'otro_secreto_largo_aleatorio';
const JWT_REFRESH_EXPIRE = process.env.JWT_REFRESH_EXPIRE || '7d';
const CORS_ORIGIN = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim()).filter(Boolean)
  : ['http://localhost:5173', 'http://localhost:5174'];
const EMAIL_SERVICE = process.env.EMAIL_SERVICE || 'gmail';
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000; // 15 minutos
const RATE_LIMIT_MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100;
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@indusecc.com';

module.exports = {
  PORT,
  NODE_ENV,
  MONGO_URI,
  JWT_SECRET,
  JWT_EXPIRE,
  JWT_REFRESH_SECRET,
  JWT_REFRESH_EXPIRE,
  CORS_ORIGIN,
  EMAIL_SERVICE,
  EMAIL_USER,
  EMAIL_PASSWORD,
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX_REQUESTS,
  LOG_LEVEL,
  FRONTEND_URL,
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY,
  VAPID_SUBJECT,
}
