const nodemailer = require('nodemailer');

/**
 * Envía un correo electrónico utilizando Gmail
 * @param {Object} options - Opciones del correo (email, subject, message)
 */
const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS
    }
  });

  const mailOptions = {
    from: `"Indusecc SGC" <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
