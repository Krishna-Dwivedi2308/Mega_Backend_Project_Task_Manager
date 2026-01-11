import Mailgen from 'mailgen';
import nodemailer from 'nodemailer';
import { MailtrapTransport } from 'mailtrap';

export const sendMail = async (options) => {
  console.log(options);

  // Mailgen setup (UNCHANGED)
  const mailGenerator = new Mailgen({
    theme: 'default',
    product: {
      name: 'Task Manager',
      link: 'https://mailgen.js/',
    },
  });

  const emailBody = mailGenerator.generate(options.mailGenContent);
  const emailText = mailGenerator.generatePlaintext(options.mailGenContent);

  // ✅ Mailtrap API transport (replaces SMTP)
  const transporter = nodemailer.createTransport(
    MailtrapTransport({
      token: process.env.MAILTRAP_API_TOKEN,
    })
  );

  // Mail object (UNCHANGED)
  const mail = {
    from: {
      address: process.env.MAIL_FROM_ADDRESS,
      name: 'Task Manager',
    },
    to: [{ address: options.email }],
    subject: options.subject,
    text: emailText,
    html: emailBody,
  };

  try {
    await transporter.sendMail(mail);
  } catch (error) {
    console.error('error sending mail', error);
    throw error;
  }
};

//our factory functions that will return an object called body based on our custom urls and usernames  that mailgen needs to craft a mail HTML
export const emailverificationMailGenContent = (username, verificationUrl) => {
  //this will generate the content for the mail based on the options we pass
  return {
    body: {
      name: username,
      intro: 'welcome to our App!',
      action: {
        instructions: 'To get started Tandem, please click here:',
        button: {
          color: '#22BC66', // Optional action button color
          text: 'Verify Email',
          link: verificationUrl,
        },
      },
      outro:
        "This link is valid for 20 minutes. Need help, or have questions? Just reply to this email, we'd love to help.",
    },
  };
};
export const forgotPasswordMailGenContent = (username, passwordResetUrl) => {
  //this will generate the content for the mail based on the options we pass
  return {
    body: {
      name: username,
      intro: 'Reset Password',
      action: {
        instructions: 'To change password, please click here:',
        button: {
          color: '#22BC66', // Optional action button color
          text: 'Reset Password',
          link: passwordResetUrl,
        },
      },
      outro:
        "Need help, or have questions? Just reply to this email, we'd love to help.",
    },
  };
};
export const addProjectMemberMailGenContent = (
  username,
  passwordResetUrl,
  projectName
) => {
  //this will generate the content for the mail based on the options we pass
  return {
    body: {
      name: username,
      intro: 'Add Project Member',
      action: {
        instructions: `You are being Requested to join the Project ${projectName}.Please click on the button to join.This link is valid for 30 minutes.`,
        button: {
          color: '#22BC66', // Optional action button color
          text: 'Join Project',
          link: passwordResetUrl,
        },
      },
      outro:
        "Need help, or have questions? Just reply to this email, we'd love to help.",
    },
  };
};
