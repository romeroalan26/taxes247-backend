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
    // Agregar información adicional si el estado es "Aprobada"
    if (status === "Aprobada") {
      statusDescription +=
        "<br><strong>Nota:</strong> El tiempo estimado para procesar una declaración de impuestos electrónica es de 21 días laborables, aunque puede tardar más debido a factores como verificaciones adicionales por parte del IRS, o la presentación de la declaración durante periodos de alta demanda.";
    }

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

    // Enviar el correo usando el transporter configurado
    await transporter.sendMail(emailOptions);

    console.log(
      `Correo de actualización de estado enviado exitosamente a ${request.email}`
    );
  } catch (error) {
    console.error("Error al enviar correo de actualización de estado:", error);
    throw new Error("No se pudo enviar el correo de actualización de estado.");
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

const sendAdminNewRequestNotification = async (request) => {
  try {
    const emailOptions = {
      from: `"Taxes247 Notificaciones" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_NOTIFICATION_EMAIL, // Add this to your .env file
      subject: `Nueva Solicitud Creada - #${request.confirmationNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Notificación de Nueva Solicitud</h2>
          <p>Se ha creado una nueva solicitud en el sistema de Taxes247.</p>
          
          <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px;">
            <strong>Detalles de la Solicitud:</strong>
            <ul>
              <li><strong>Número de Confirmación:</strong> ${
                request.confirmationNumber
              }</li>
              <li><strong>Nombre Completo:</strong> ${request.fullName}</li>
              <li><strong>Correo Electrónico:</strong> ${request.email}</li>
              <li><strong>Método de Pago:</strong> ${request.paymentMethod}</li>
              <li><strong>Número de Archivos W2:</strong> ${
                request.w2Files.length
              }</li>
              <li><strong>Fecha de Solicitud:</strong> ${new Date().toLocaleString(
                "es-ES",
                { timeZone: "America/New_York" }
              )}</li>
            </ul>
          </div>
          
          <p>Inicie sesión en el panel de administración para revisar los detalles completos.</p>
          
          <hr>
          <small>Esta es una notificación automática generada por Taxes247.</small>
        </div>
      `,
    };

    // Send the email
    await transporter.sendMail(emailOptions);

    logger.info(
      `Notificación de nueva solicitud enviada al administrador para solicitud ${request.confirmationNumber}`
    );
  } catch (error) {
    logger.error(
      `Error al enviar notificación de nueva solicitud al administrador:`,
      error
    );
    // Optionally, I could implement a retry mechanism or alternative notification method
  }
};

module.exports = {
  sendStatusUpdateEmail,
  sendNewRequestEmail,
  sendAdminNewRequestNotification,
};
