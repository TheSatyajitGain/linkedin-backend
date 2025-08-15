const nodeMailer = require('nodemailer');

const sendEmail = function (receiver, subject, message) {
  const emailService = nodeMailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.GMAIL_ID,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
  emailService.sendMail({
    from: `${process.env.AUTHOR} <${process.env.GMAIL_ID}>`,
    to: `${receiver}`,
    subject: `${subject}`,
    text: `${message}`,
  });
};

module.exports = sendEmail;
