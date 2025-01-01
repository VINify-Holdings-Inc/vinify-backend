  import { contactFormMailTemplate, forgetPasswordMailTemplate } from "./MailTemplate";
  const nodemailer = require("nodemailer");  
  const createTransporter = () => {
    return nodemailer.createTransport({
      host: "smtp.office365.com",
      port:   587,
      secure: false, 
      auth: {
        user: "hello@techwagger.com",
       pass: "Bond@2024"
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
    // tslint:disable-next-line:no-console
    console.log("Email sent successfully to", mailOptions.to);
  } catch (error: any) {
    // tslint:disable-next-line:no-console
    console.error("Error sending email to", mailOptions.to, ":", error.message);
    throw new Error("Failed to send email");
  }
};

export const sendEmail = async (to: any, subject: any, text: any, hyperText: any) => { 
  try {
    const htmlContent = forgetPasswordMailTemplate({
      subject: subject || "Reset Password",
      text: text,
      hyperText: hyperText || "https://mvm.techwagger.com"
    });

    const mailOptions = {
      from: "hello@techwagger.com",  
      to: to, 
      bcc:"praveen@techwagger.com,vivek@techwagger.com, nakul@hashtaglabs.biz,astha.sharma@hashtaglabs.in,amit.chauhan@techwagger.com", 
      subject: subject, 
      html: htmlContent  
    };

    await sendMail(mailOptions);
  } catch (error: any) {
    // tslint:disable-next-line:no-console
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
        from: "hello@techwagger.com",  
      to: "contactmvm@yopmail.com ",
      bcc: "praveen@techwagger.com,vivek@techwagger.com, nakul@hashtaglabs.biz,astha.sharma@hashtaglabs.in,amit.chauhan@techwagger.com", 
      subject: "New Inquiry from Contact Us Page", // Email subject
      html: htmlContent // Email content in HTML
    };

    await sendMail(mailOptions);
  } catch (error: any) {
    // tslint:disable-next-line:no-console
    console.error("Error in sendContactFormEmail function:", error.message);
    throw new Error("Failed to send contact form email");
  }
};
 