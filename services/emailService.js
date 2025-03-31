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
            font-family: Arial, Helvetica, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
            color: #333333;
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
            padding: 25px 20px;
            text-align: center;
            border-radius: 4px 4px 0 0;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 8px;
        }
        .content {
            padding: 30px;
            background-color: #ffffff;
            border-radius: 0 0 4px 4px;
            border: 1px solid #e0e0e0;
        }
        .status-box {
            background-color: #f8f9fa;
            border: 1px solid #e0e0e0;
            padding: 20px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .status-label {
            font-size: 16px;
            font-weight: bold;
            color: #DC2626;
            margin-bottom: 10px;
        }
        .status-value {
            color: #333333;
        }
        .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #DC2626;
            color: #ffffff !important;
            text-decoration: none !important;
            border-radius: 4px;
            margin: 20px 0;
            font-weight: bold;
        }
        .button:hover {
            background-color: #B91C1C;
            color: #ffffff !important;
            text-decoration: none !important;
        }
        .info-box {
            background-color: #fff3e0;
            border: 1px solid #ffe0b2;
            padding: 15px;
            margin: 20px 0;
            font-size: 14px;
            color: #e65100;
            border-radius: 4px;
        }
        .divider {
            border-top: 1px solid #e0e0e0;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            padding-top: 20px;
            color: #666666;
            font-size: 12px;
        }
        .confirmation-number {
            background-color: #f5f5f5;
            padding: 8px 12px;
            border-radius: 4px;
            font-family: monospace;
            font-size: 16px;
            color: #333333;
            border: 1px solid #e0e0e0;
        }
        h2 {
            font-size: 20px;
            font-weight: bold;
            color: #333333;
            margin-bottom: 15px;
        }
        p {
            margin: 10px 0;
            color: #666666;
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
            <h2>Estimado(a) ${request.fullName}:</h2>
            <p>Su solicitud con número <span class="confirmation-number">${
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
                <strong>Información importante:</strong><br>
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

            <p>Si necesita asistencia adicional, no dude en contactarnos a través de la plataforma.</p>
            
        </div>
        <div class="footer">
            <p>© 2024 Taxes247. Todos los derechos reservados.</p>
            <p>Este es un correo automático, por favor no responda a este mensaje.</p>
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
            font-family: Arial, Helvetica, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
            color: #333333;
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
            padding: 25px 20px;
            text-align: center;
            border-radius: 4px 4px 0 0;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 8px;
        }
        .content {
            padding: 30px;
            background-color: #ffffff;
            border-radius: 0 0 4px 4px;
            border: 1px solid #e0e0e0;
        }
        .confirmation-box {
            background-color: #f8f9fa;
            border: 1px solid #e0e0e0;
            border-radius: 4px;
            padding: 20px;
            margin: 20px 0;
            text-align: center;
        }
        .confirmation-number {
            font-size: 24px;
            font-weight: bold;
            color: #DC2626;
            margin: 10px 0;
            font-family: monospace;
            letter-spacing: 1px;
        }
        .next-steps {
            background-color: #f8f9fa;
            border: 1px solid #e0e0e0;
            padding: 20px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #DC2626;
            color: #ffffff !important;
            text-decoration: none !important;
            border-radius: 4px;
            margin: 20px 0;
            font-weight: bold;
        }
        .button:hover {
            background-color: #B91C1C;
            color: #ffffff !important;
            text-decoration: none !important;
        }
        .divider {
            border-top: 1px solid #e0e0e0;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            padding-top: 20px;
            color: #666666;
            font-size: 12px;
        }
        .info-box {
            background-color: #fff3e0;
            border: 1px solid #ffe0b2;
            padding: 15px;
            margin: 20px 0;
            font-size: 14px;
            color: #e65100;
            border-radius: 4px;
        }
        h2 {
            font-size: 20px;
            font-weight: bold;
            color: #333333;
            margin-bottom: 15px;
        }
        p {
            margin: 10px 0;
            color: #666666;
        }
        ol {
            margin: 0;
            padding-left: 20px;
            color: #666666;
        }
        li {
            margin: 8px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">Taxes247</div>
            <div>Confirmación de Solicitud</div>
        </div>
        <div class="content">
            <h2>Estimado(a) ${request.fullName}:</h2>
            <p>Hemos recibido su solicitud exitosamente.</p>
            
            <div class="confirmation-box">
                <p>Su número de confirmación es:</p>
                <div class="confirmation-number">${request.confirmationNumber}</div>
                <p style="color: #DC2626;">Por favor, guarde este número para futuras referencias</p>
            </div>

            <div class="next-steps">
                <h3 style="margin-top: 0; color: #333333;">Próximos pasos:</h3>
                <ol>
                    <li>Guarde su número de confirmación</li>
                    <li>Acceda a su cuenta para dar seguimiento al estado de su solicitud</li>
                    <li>Mantenga su correo electrónico activo para recibir actualizaciones</li>
                </ol>
            </div>

            <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL}/dashboard" class="button" target="_blank">
                    Ver mi solicitud
                </a>
            </div>

            <div class="info-box">
                <strong>Información importante:</strong><br>
                Revisaremos su solicitud lo antes posible. Le mantendremos informado sobre cualquier actualización 
                o si necesitamos información adicional.
            </div>

            <div class="divider"></div>

            <p>Si necesita ayuda, no dude en contactarnos a través de nuestra plataforma.</p>
        </div>
        <div class="footer">
            <p>© 2024 Taxes247. Todos los derechos reservados.</p>
            <p>Este es un correo automático, por favor no responda a este mensaje.</p>
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
            font-family: Arial, Helvetica, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
            color: #333333;
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
            padding: 25px 20px;
            text-align: center;
            border-radius: 4px 4px 0 0;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 8px;
        }
        .content {
            padding: 30px;
            background-color: #ffffff;
            border-radius: 0 0 4px 4px;
            border: 1px solid #e0e0e0;
        }
        .request-details {
            background-color: #f8f9fa;
            border: 1px solid #e0e0e0;
            border-radius: 4px;
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
            padding: 12px;
            background-color: white;
            border-radius: 4px;
            border: 1px solid #e0e0e0;
        }
        .detail-label {
            color: #666666;
            font-size: 12px;
            text-transform: uppercase;
            margin-bottom: 4px;
        }
        .detail-value {
            color: #333333;
            font-weight: bold;
            font-size: 14px;
        }
        .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #DC2626;
            color: #ffffff !important;
            text-decoration: none !important;
            border-radius: 4px;
            margin: 20px 0;
            font-weight: bold;
        }
        .button:hover {
            background-color: #B91C1C;
            color: #ffffff !important;
            text-decoration: none !important;
        }
        .alert-box {
            background-color: #ffebee;
            border: 1px solid #ffcdd2;
            padding: 15px;
            margin: 20px 0;
            font-size: 14px;
            color: #c62828;
            border-radius: 4px;
        }
        .divider {
            border-top: 1px solid #e0e0e0;
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
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
        }
        .tag-payment {
            background-color: #e8f5e9;
            color: #2e7d32;
        }
        .tag-files {
            background-color: #e3f2fd;
            color: #1565c0;
        }
        h3 {
            font-size: 18px;
            font-weight: bold;
            color: #333333;
            margin: 0 0 15px 0;
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
                <strong>Nueva solicitud requiere revisión</strong><br>
                Se ha recibido una nueva solicitud en el sistema que requiere su atención.
            </div>

            <div class="request-details">
                <h3>Detalles de la Solicitud</h3>
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

            <p style="color: #666666; font-size: 14px;">
                Esta solicitud está pendiente de revisión. Por favor, acceda al panel administrativo 
                para procesar la solicitud y actualizar su estado.
            </p>
        </div>
        <div class="footer">
            <p>© 2024 Taxes247 - Panel Administrativo</p>
            <p>Este es un correo automático, por favor no responda a este mensaje.</p>
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
