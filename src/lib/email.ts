import transporter from "@/config/nodemailer";
import { APP_NAME } from "@/constants/env";
/**
 * Send welcome email with credentials to new user
 */
export const sendWelcomeEmail = async (
  name: string,
  email: string,
  password: string
) => {
  const mailOptions = {
    from: `"${APP_NAME}" <no-reply@example.com>`,
    to: email,
    subject: `Selamat Datang di ${APP_NAME}`,
    html: welcomeTemplate(name, email, password),
  };
  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};

/**
 * Generate welcome email template with user credentials
 */
const welcomeTemplate = (name: string, email: string, password: string) => {
  return `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
    <h2 style="color: #333;">Selamat Datang di ${APP_NAME}!</h2>
    <p>Halo ${name},</p>
    <p>Akun Anda telah berhasil dibuat. Anda dapat masuk menggunakan kredensial berikut:</p>
    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Password:</strong> ${password}</p>
    </div>
    <p>Silakan login di Aplikasi ${APP_NAME}</p>
    <p>Untuk alasan keamanan, kami sarankan untuk mengubah kata sandi Anda setelah login pertama.</p>
    <p>Jika Anda memiliki pertanyaan, silakan hubungi administrator.</p>
    <p>Salam,<br/>Tim ${APP_NAME}</p>
  </div>
  `;
};

/**
 * Create a new random password and send it to the user
 */
export const createAndSendPassword = async (name: string, email: string) => {
  const password = generateRandomPassword(10);
  await sendWelcomeEmail(name, email, password);
  return password;
};

const generateRandomPassword = (length: number) => {
  return Math.random()
    .toString(36)
    .substring(2, 2 + length);
};
