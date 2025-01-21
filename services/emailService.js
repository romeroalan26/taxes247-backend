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
      <!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Actualización de Estado - Taxes247</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #ffffff;
        }
        .header {
            background-color: #DC2626;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .content {
            padding: 30px;
            background-color: #ffffff;
            border-radius: 0 0 8px 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .status-box {
            background-color: #F3F4F6;
            border-left: 4px solid #DC2626;
            padding: 20px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .status-label {
            font-size: 18px;
            font-weight: bold;
            color: #DC2626;
            margin-bottom: 10px;
        }
        .status-value {
            color:rgb(0, 0, 0);
        }
        .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #DC2626;
            color: #ffffff;
            text-decoration: none;
            border-radius: 4px;
            margin: 20px 0;
            font-weight: bold;
        }
        .button:hover {
            background-color: #B91C1C;
        }
        .info-box {
            background-color: #FEF3C7;
            border-left: 4px solid #F59E0B;
            padding: 15px;
            margin: 20px 0;
            font-size: 14px;
            color: #92400E;
        }
        .divider {
            border-top: 1px solid #eeeeee;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            padding-top: 20px;
            color: #666666;
            font-size: 12px;
        }
        .confirmation-number {
            background-color: #E5E7EB;
            padding: 8px;
            border-radius: 4px;
            font-family: monospace;
            font-size: 16px;
            color: #374151;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">Taxes247</div>
            <div>Actualización de tu Solicitud</div>
        </div>
        <div class="content">
            <h2>¡Hola ${request.fullName}!</h2>
            <p>Tu solicitud con número <span class="confirmation-number">${
              request.confirmationNumber
            }</span> ha sido actualizada.</p>
            
            <div class="status-box">
                <div class="status-label">Nuevo Estado: <span class="status-value">${status}</span></div>
                <p>${statusDescription || "Sin descripción adicional"}</p>
                ${
                  comment
                    ? `<p><strong>Comentario adicional:</strong><br>${comment}</p>`
                    : ""
                }
            </div>

            ${
              status === "Aprobada"
                ? `
            <div class="info-box">
                <strong>ℹ️ Información importante:</strong><br>
                El tiempo estimado para procesar una declaración de impuestos electrónica es de 21 días laborables. 
                Este período puede extenderse debido a verificaciones adicionales por parte del IRS o durante períodos de alta demanda.
            </div>
            `
                : ""
            }

            <div style="text-align: center;">
                <a href="${
                  process.env.FRONTEND_URL
                }/dashboard" class="button" target="_blank">
                    Ver detalles en mi cuenta
                </a>
            </div>

            <div class="divider"></div>

            <p>Si necesitas asistencia adicional, no dudes en contactarnos a través de la plataforma.</p>
            
        </div>
        <div class="footer">
            <p>© 2024 Taxes247. Todos los derechos reservados.</p>
            <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
        </div>
    </div>
</body>
</html>
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
        <!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirmación de Solicitud - Taxes247</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #ffffff;
        }
        .header {
            background-color: #DC2626;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .content {
            padding: 30px;
            background-color: #ffffff;
            border-radius: 0 0 8px 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .confirmation-box {
            background-color: #F0FDF4;
            border: 2px dashed #059669;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            text-align: center;
        }
        .confirmation-number {
            font-size: 28px;
            font-weight: bold;
            color: #059669;
            margin: 10px 0;
            font-family: monospace;
            letter-spacing: 2px;
        }
        .next-steps {
            background-color: #F3F4F6;
            border-left: 4px solid #DC2626;
            padding: 20px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #DC2626;
            color: #ffffff;
            text-decoration: none;
            border-radius: 4px;
            margin: 20px 0;
            font-weight: bold;
        }
        .button:hover {
            background-color: #B91C1C;
        }
        .divider {
            border-top: 1px solid #eeeeee;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            padding-top: 20px;
            color: #666666;
            font-size: 12px;
        }
        .info-box {
            background-color: #FEF3C7;
            border-left: 4px solid #F59E0B;
            padding: 15px;
            margin: 20px 0;
            font-size: 14px;
            color: #92400E;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">Taxes247</div>
            <div>¡Solicitud Recibida!</div>
        </div>
        <div class="content">
            <h2>¡Hola ${request.fullName}!</h2>
            <p>¡Excelentes noticias! Hemos recibido tu solicitud exitosamente.</p>
            
            <div class="confirmation-box">
                <p>Tu número de confirmación es:</p>
                <div class="confirmation-number">${request.confirmationNumber}</div>
                <p style="color: #059669;">Guarda este número para futuras referencias</p>
            </div>

            <div class="next-steps">
                <h3 style="margin-top: 0;">Próximos pasos:</h3>
                <ol style="margin: 0; padding-left: 20px;">
                    <li>Guarda tu número de confirmación</li>
                    <li>Accede a tu cuenta para dar seguimiento al estado de tu solicitud</li>
                    <li>Mantén tu correo electrónico activo para recibir actualizaciones</li>
                </ol>
            </div>

            <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL}/dashboard" class="button" target="_blank">
                    Ver mi solicitud
                </a>
            </div>

            <div class="info-box">
                <strong>ℹ️ Importante:</strong><br>
                Revisaremos tu solicitud lo antes posible. Te mantendremos informado sobre cualquier actualización 
                o si necesitamos información adicional.
            </div>

            <div class="divider"></div>

            <p>¿Necesitas ayuda? No dudes en contactarnos a través de nuestra plataforma.</p>
        </div>
        <div class="footer">
            <p>© 2024 Taxes247. Todos los derechos reservados.</p>
            <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
        </div>
    </div>
</body>
</html>
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
       <!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nueva Solicitud - Panel Administrativo Taxes247</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #ffffff;
        }
        .header {
            background-color: #1E40AF;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .content {
            padding: 30px;
            background-color: #ffffff;
            border-radius: 0 0 8px 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .request-details {
            background-color: #F0F9FF;
            border: 1px solid #BAE6FD;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .detail-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin-top: 15px;
        }
        .detail-item {
            padding: 10px;
            background-color: white;
            border-radius: 6px;
            border: 1px solid #E5E7EB;
        }
        .detail-label {
            color: #6B7280;
            font-size: 12px;
            text-transform: uppercase;
            margin-bottom: 4px;
        }
        .detail-value {
            color: #111827;
            font-weight: 600;
            font-size: 14px;
        }
        .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #1E40AF;
            color: #ffffff;
            text-decoration: none;
            border-radius: 4px;
            margin: 20px 0;
            font-weight: bold;
        }
        .button:hover {
            background-color: #1E3A8A;
        }
        .alert-box {
            background-color: #FEF2F2;
            border-left: 4px solid #DC2626;
            padding: 15px;
            margin: 20px 0;
            font-size: 14px;
            color: #991B1B;
        }
        .divider {
            border-top: 1px solid #eeeeee;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            padding-top: 20px;
            color: #666666;
            font-size: 12px;
        }
        .tag {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
        }
        .tag-payment {
            background-color: #ECFDF5;
            color: #059669;
        }
        .tag-files {
            background-color: #EFF6FF;
            color: #2563EB;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">Taxes247 Admin</div>
            <div>Nueva Solicitud Recibida</div>
        </div>
        <div class="content">
            <div class="alert-box">
                <strong>¡Nueva solicitud requiere revisión!</strong><br>
                Se ha recibido una nueva solicitud en el sistema que requiere tu atención.
            </div>

            <div class="request-details">
                <h3 style="margin-top: 0; color: #1E40AF;">Detalles de la Solicitud</h3>
                <div class="detail-grid">
                    <div class="detail-item">
                        <div class="detail-label">Número de Confirmación</div>
                        <div class="detail-value">#${
                          request.confirmationNumber
                        }</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Fecha de Solicitud</div>
                        <div class="detail-value">${new Date().toLocaleString(
                          "es-ES",
                          { timeZone: "America/New_York" }
                        )}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Cliente</div>
                        <div class="detail-value">${request.fullName}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Correo Electrónico</div>
                        <div class="detail-value">${request.email}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Método de Pago</div>
                        <div class="detail-value">
                            <span class="tag tag-payment">${
                              request.paymentMethod
                            }</span>
                        </div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Archivos W2</div>
                        <div class="detail-value">
                            <span class="tag tag-files">${
                              request.w2Files.length
                            } archivo(s)</span>
                        </div>
                    </div>
                </div>
            </div>

            <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL}/admin/requests/${
        request._id
      }" class="button">
                    Revisar Solicitud
                </a>
            </div>

            <div class="divider"></div>

            <p style="color: #6B7280; font-size: 14px;">
                Esta solicitud está pendiente de revisión. Por favor, accede al panel administrativo 
                para procesar la solicitud y actualizar su estado.
            </p>
        </div>
        <div class="footer">
            <p>© 2024 Taxes247 - Panel Administrativo</p>
            <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
        </div>
    </div>
</body>
</html>
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
