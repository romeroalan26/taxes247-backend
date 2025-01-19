// services/emailService.js
const nodemailer = require("nodemailer");
const logger = require("../config/logger");

// Configurar el transporter de Nodemailer
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Servicio de envío de correo para actualización de estado
const sendStatusUpdateEmail = async (
  request,
  status,
  statusDescription,
  comment = ""
) => {
  try {
    const emailOptions = {
      from: `"Taxes247" <${process.env.EMAIL_USER}>`,
      to: request.email,
      subject: `Actualización de estado de tu solicitud - Taxes247`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Actualización de Estado de Solicitud</h2>
          <p>Hola ${request.fullName},</p>
          <p>El estado de tu solicitud #${
            request.confirmationNumber
          } ha sido actualizado:</p>
          <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px;">
            <strong>Nuevo estado:</strong> ${status}<br>
            <strong>Descripción:</strong> ${
              statusDescription || "Sin descripción adicional"
            }
            ${comment ? `<br><strong>Comentario:</strong> ${comment}` : ""}
          </div>
          <p>Puedes verificar los detalles completos iniciando sesión en tu cuenta de Taxes247.</p>
          <p>Gracias por confiar en nosotros.</p>
          <hr>
          <small>Este es un mensaje automático. Por favor, no responda a este correo.</small>
        </div>
      `,
    };

    await transporter.sendMail(emailOptions);

    logger.info(
      `Correo de notificación enviado para solicitud ${request.confirmationNumber}`
    );
    return true;
  } catch (error) {
    logger.error(
      `Error al enviar correo de notificación para solicitud ${request.confirmationNumber}:`,
      error
    );
    return false;
  }
};

// Servicio de envío de correo para nueva solicitud
const sendNewRequestEmail = async (request) => {
  try {
    const emailOptions = {
      from: `"Taxes247" <${process.env.EMAIL_USER}>`,
      to: request.email,
      subject: "Confirmación de Solicitud - Taxes247",
      html: `
        <p>Hola ${request.fullName},</p>
        <p>Hemos recibido tu solicitud exitosamente. A continuación, te proporcionamos tu código de confirmación:</p>
        <p style="font-size: 18px; font-weight: bold; color: red;">${request.confirmationNumber}</p>
        <p>Puedes usar este código para dar seguimiento al estado de tu solicitud en nuestra plataforma.</p>
        <p>Gracias por confiar en Taxes247.</p>
      `,
    };

    await transporter.sendMail(emailOptions);

    logger.info(
      `Correo de confirmación enviado para solicitud ${request.confirmationNumber}`
    );
    return true;
  } catch (error) {
    logger.error(
      `Error al enviar correo de confirmación para solicitud ${request.confirmationNumber}:`,
      error
    );
    return false;
  }
};

module.exports = {
  sendStatusUpdateEmail,
  sendNewRequestEmail,
};
