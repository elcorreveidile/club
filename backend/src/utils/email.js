import nodemailer from 'nodemailer';

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  SMTP_SECURE,
  FROM_EMAIL = 'no-reply@grxgrass.local',
  FRONTEND_URL = 'http://localhost:5173/login',
  ADMIN_EMAIL,
  WHATSAPP_WEBHOOK,
  WA_TOKEN,
  WA_PHONE_ID,
  WA_ADMIN_TO
} = process.env;

let transporter = null;
if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: SMTP_SECURE === 'true',
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    }
  });
}

export const sendWelcomeEmail = async ({ to, nombre, numero_socio, tempPassword }) => {
  const subject = 'Tu acceso a GRX Grass Social';
  const text = `Hola ${nombre},

Tu solicitud ha sido aprobada. Estos son tus datos de acceso:
Número de socio: ${numero_socio}
Contraseña temporal: ${tempPassword}

Inicia sesión en ${FRONTEND_URL} y cambia la contraseña cuanto antes.

Saludos,
GRX Grass Social`;

  if (!transporter) {
    console.log('⚠️ SMTP no configurado. Email simulado:\n', { to, subject, text });
    return;
  }

  await transporter.sendMail({
    from: FROM_EMAIL,
    to,
    subject,
    text
  });
};

export const sendAdminAlert = async ({ subject, text }) => {
  if (!ADMIN_EMAIL) {
    console.log('⚠️ ADMIN_EMAIL no configurado. Alerta simulada:\n', { subject, text });
    return;
  }
  if (!transporter) {
    console.log('⚠️ SMTP no configurado. Email simulado a admin:\n', { to: ADMIN_EMAIL, subject, text });
    return;
  }
  await transporter.sendMail({
    from: FROM_EMAIL,
    to: ADMIN_EMAIL,
    subject,
    text
  });
};

export const sendWhatsAppAlert = async ({ text }) => {
  // Prioridad: WhatsApp Cloud API si está configurada
  if (WA_TOKEN && WA_PHONE_ID && WA_ADMIN_TO) {
    const url = `https://graph.facebook.com/v18.0/${WA_PHONE_ID}/messages`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${WA_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: WA_ADMIN_TO,
          type: 'text',
          text: { body: text }
        })
      });
      if (!res.ok) {
        const errTxt = await res.text();
        console.log('⚠️ Error WhatsApp Cloud API:', errTxt);
      }
      return;
    } catch (err) {
      console.log('⚠️ Error conectando a WhatsApp Cloud API:', err.message);
      return;
    }
  }

  // Fallback: webhook genérico si se configuró
  if (WHATSAPP_WEBHOOK) {
    try {
      await fetch(WHATSAPP_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
    } catch (err) {
      console.log('⚠️ Error enviando WhatsApp (webhook):', err.message);
    }
    return;
  }

  // Sin config: simular en logs
  console.log('⚠️ WhatsApp no configurado. Mensaje simulado:\n', text);
};
