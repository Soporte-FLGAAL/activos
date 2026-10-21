const nodemailer = require('nodemailer');
const env = require('../config/env');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS || !env.SMTP_FROM) {
    throw new Error(
      'Configuración SMTP incompleta: revise SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_FROM'
    );
  }

  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,   // <-- ya es booleano, no comparar con 'true'
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });

  return transporter;
}

async function enviarCorreo(destinatario, asunto, mensajeHtml) {
  const t = getTransporter();
  await t.sendMail({
    from: env.SMTP_FROM,
    to: destinatario,
    subject: asunto,
    html: mensajeHtml,
  });
}

module.exports = { enviarCorreo };