const nodemailer = require('nodemailer');

// Create transporter using your Gmail credentials
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Generate a random strong password
const generateTempPassword = () => {
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const special = "!@#$%^&*()_+-=<>?";
  const all = upper + lower + numbers + special;
  
  let password = [
    upper[Math.floor(Math.random() * upper.length)],
    lower[Math.floor(Math.random() * lower.length)],
    numbers[Math.floor(Math.random() * numbers.length)],
    special[Math.floor(Math.random() * special.length)]
  ];
  
  for (let i = 4; i < 12; i++) {
    password.push(all[Math.floor(Math.random() * all.length)]);
  }
  
  return password.sort(() => Math.random() - 0.5).join('');
};

// Send approval email to doctor
const sendDoctorApprovalEmail = async (doctorData) => {
  try {
    const tempPassword = generateTempPassword();
    
    const mailOptions = {
      from: {
        name: 'SilverCare Platform',
        address: process.env.EMAIL_USER
      },
      to: doctorData.email,
      subject: '🎉 Your Doctor Account Has Been Approved - SilverCare',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
            .password-box { background: #fff; border: 2px solid #28a745; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }
            .password { font-family: 'Courier New', monospace; font-size: 18px; font-weight: bold; color: #dc3545; background: #f8f9fa; padding: 10px; border-radius: 5px; margin: 10px 0; }
            .button { display: inline-block; background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Congratulations!</h1>
              <p>Your Doctor Account Has Been Approved</p>
            </div>
            
            <div class="content">
              <h2>Dear Dr. ${doctorData.name},</h2>
              
              <p>We are pleased to inform you that your application to join the SilverCare platform has been <strong>approved</strong>!</p>
              
              <p>Your account details:</p>
              <ul>
                <li><strong>Name:</strong> ${doctorData.name}</li>
                <li><strong>Email:</strong> ${doctorData.email}</li>
                <li><strong>Specialization:</strong> ${doctorData.specialization}</li>
                <li><strong>License Number:</strong> ${doctorData.license_number}</li>
              </ul>
              
              <div class="password-box">
                <h3>🔐 Your Temporary Login Password</h3>
                <p>Please use this temporary password to log in to your account:</p>
                <div class="password">${tempPassword}</div>
                <p><small>Please save this password securely. You can change it after logging in.</small></p>
              </div>
              
              <div class="warning">
                <strong>⚠️ Important Security Notice:</strong>
                <ul>
                  <li>This is a temporary password. Please change it immediately after logging in.</li>
                  <li>Keep this password confidential and do not share it with anyone.</li>
                  <li>If you didn't request this account, please contact us immediately.</li>
                </ul>
              </div>
              
              <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" class="button">
                  🚀 Log In to Your Account
                </a>
              </div>
              
              <h3>Next Steps:</h3>
              <ol>
                <li>Click the login button above or visit our website</li>
                <li>Use your email (${doctorData.email}) and the temporary password provided</li>
                <li>Complete your profile and change your password</li>
                <li>Start connecting with patients and families</li>
              </ol>
              
              <p>Welcome to the SilverCare community! We're excited to have you on board.</p>
              
              <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
              
              <p>Best regards,<br>
              <strong>The SilverCare Team</strong></p>
            </div>
            
            <div class="footer">
              <p>© 2025 SilverCare Platform. All rights reserved.</p>
              <p>This email was sent to ${doctorData.email} because your doctor account was approved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log('Doctor approval email sent successfully:', info.messageId);
    
    return {
      success: true,
      tempPassword: tempPassword,
      messageId: info.messageId
    };
    
  } catch (error) {
    console.error('Error sending doctor approval email:', error);
    throw error;
  }
};

// Test email configuration
const testEmailConnection = async () => {
  try {
    await transporter.verify();
    console.log('Email service is ready to send messages');
    return true;
  } catch (error) {
    console.error('Email service configuration error:', error);
    return false;
  }
};

module.exports = {
  sendDoctorApprovalEmail,
  testEmailConnection,
  generateTempPassword
};