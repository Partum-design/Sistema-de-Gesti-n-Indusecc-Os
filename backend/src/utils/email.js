const nodemailer = require('nodemailer');
const {
  EMAIL_SERVICE,
  EMAIL_USER,
  EMAIL_PASSWORD,
  EMAIL_PASS,
} = require('../config/environment');

/**
 * Envía un correo electrónico utilizando Gmail
 * @param {Object} options - Opciones del correo (email, subject, message)
 */
const sendEmail = async (options) => {
  const emailPassword = EMAIL_PASSWORD || EMAIL_PASS;

  if (!EMAIL_USER || !emailPassword) {
    throw new Error('EMAIL_NOT_CONFIGURED');
  }

  const transporter = nodemailer.createTransport({
    service: EMAIL_SERVICE,
    auth: {
      user: EMAIL_USER,
      pass: emailPassword,
    },
  });

  const mailOptions = {
    from: `"Indusecc SGC" <${EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
