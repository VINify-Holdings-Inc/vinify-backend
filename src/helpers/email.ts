import { contactFormMailTemplate, forgetPasswordMailTemplate } from "./MailTemplate";
const nodemailer = require("nodemailer");

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.office365.com",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    tls: {
      ciphers: "SSLv3",
      rejectUnauthorized: false
    }
  });
};

const sendMail = async (mailOptions: any) => {
  try {
    const transporter = createTransporter();
    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully to", mailOptions.to);
  } catch (error: any) {
    console.error("Error sending email to", mailOptions.to, ":", error.message);
    throw new Error("Failed to send email");
  }
};

export const sendEmail = async (to: any, subject: any, text: any, hyperText: any) => {
  try {
    const htmlContent = forgetPasswordMailTemplate({
      subject: subject || "Reset Password",
      text: text,
      hyperText: hyperText || process.env.DEFAULT_FORGOT_PASSWORD_URL
    });

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: to,
      bcc: process.env.BCC_EMAILS,
      subject: subject,
      html: htmlContent
    };

    await sendMail(mailOptions);
  } catch (error: any) {
    console.error("Error in sendEmail function:", error.message);
    throw new Error("Failed to send password reset email");
  }
};

export const sendContactFormEmail = async (name: any, email: any, phone: any, message: any, subject: any) => {
  try {
    const htmlContent = contactFormMailTemplate({
      name: name,
      email: email,
      phone: phone,
      message: message,
      subject: subject
    });

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: process.env.CONTACT_FORM_RECEIVER,
      bcc: process.env.BCC_EMAILS,
      subject: "New Inquiry from Contact Us Page",
      html: htmlContent
    };

    await sendMail(mailOptions);
  } catch (error: any) {
    console.error("Error in sendContactFormEmail function:", error.message);
    throw new Error("Failed to send contact form email");
  }
};
