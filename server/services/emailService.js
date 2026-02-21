const nodemailer = require('nodemailer')

let transporter

if (process.env.EMAIL_SERVICE === 'sendgrid') {
  // SendGrid configuration
  transporter = nodemailer.createTransport({
    service: 'SendGrid',
    auth: {
      user: 'apikey',
      pass: process.env.SENDGRID_API_KEY,
    },
  })
} else {
  // SMTP configuration
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  })
}

exports.sendVerificationEmail = async (email, token) => {
  const verificationUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/auth/verify?token=${token}`

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@peerly.com',
    to: email,
    subject: 'Verify your Peerly account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #008080;">Welcome to Peerly!</h2>
        <p>Thank you for signing up. Please verify your email address by clicking the link below:</p>
        <a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; background-color: #008080; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0;">
          Verify Email
        </a>
        <p>Or copy and paste this link into your browser:</p>
        <p style="color: #777777; word-break: break-all;">${verificationUrl}</p>
        <p style="color: #777777; font-size: 12px; margin-top: 30px;">
          This link will expire in 24 hours. If you didn't create an account, please ignore this email.
        </p>
      </div>
    `,
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log(`Verification email sent to ${email}`)
  } catch (error) {
    console.error('Error sending verification email:', error)
    throw error
  }
}

exports.sendVerificationCode = async (email, code) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@peerly.com',
    to: email,
    subject: 'Your Peerly Verification Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #008080;">Welcome to Peerly!</h2>
        <p>Thank you for signing up with Google. Please use the verification code below to complete your registration:</p>
        <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
          <h1 style="color: #008080; font-size: 36px; letter-spacing: 8px; margin: 0;">${code}</h1>
        </div>
        <p>Enter this code on the verification page to continue.</p>
        <p style="color: #777777; font-size: 12px; margin-top: 30px;">
          This code will expire in 10 minutes. If you didn't create an account, please ignore this email.
        </p>
      </div>
    `,
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log(`Verification code sent to ${email}`)
  } catch (error) {
    console.error('Error sending verification code:', error)
    throw error
  }
}
