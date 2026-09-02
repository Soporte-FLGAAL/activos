const nodemailer = require('nodemailer');
const env = require('../config/env');

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_SECURE === 'true', // true para 465, false para otros
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

async function enviarCorreo(destinatario, asunto, mensajeHtml) {
  const mailOptions = {
    from: env.SMTP_FROM,
    to: destinatario,
    subject: asunto,
    html: mensajeHtml,
  };
  await transporter.sendMail(mailOptions);
}

module.exports = { enviarCorreo };