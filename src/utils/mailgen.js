import Mailgen from 'mailgen';
import nodemailer from 'nodemailer';

export const sendMail = async (options) => {
  console.log(options);

  //copied this from documentation directly
  var mailGenerator = new Mailgen({
    theme: 'default',
    product: {
      name: 'Task Manager',
      link: 'https://mailgen.js/', //your company/app link here
    },
  });
  var emailBody = mailGenerator.generate(options.mailGenContent);

  // Generate the plaintext version of the e-mail (for clients that do not support HTML)
  var emailText = mailGenerator.generatePlaintext(options.mailGenContent);

  //nodemailer starts here
  const transporter = nodemailer.createTransport({
    host: process.env.MAILTRAP_HOST,
    port: process.env.MAILTRAP_PORT,
    secure: false, // true for port 465, false for other ports
    auth: {
      user: process.env.MAILTRAP_USER,
      pass: process.env.MAILTRAP_PASSWORD,
    },
  });

  //now create mail as per nodemailer
  const mail = {
    from: process.env.MAIL_FROM_ADDRESS, // sender address
    to: options.email, // list of receivers
    subject: options.subject, // Subject line
    text: emailText, // plain text body
    html: emailBody, // html body
  };

  //pass it to sendMail function of transporter in nodemailer to be sent as mail
  try {
    await transporter.sendMail(mail);
  } catch (error) {
    console.log('error sending mail', error);
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
        instructions: 'To get started with our app, please click here:',
        button: {
          color: '#22BC66', // Optional action button color
          text: 'Verify your email',
          link: verificationUrl,
        },
      },
      outro:
        "Need help, or have questions? Just reply to this email, we'd love to help.",
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
        instructions: `You are being Requested to join the Project ${projectName}.Please click on the button to join`,
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
