import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter | null = null;

async function getEmailConfig() {
    // Use environment variables only
    return {
        from: process.env.EMAIL_USER || 'Pharmawind13@gmail.com',
        password: process.env.EMAIL_PASSWORD || 'hsrw ewvk aqfd lmiq'
    };
}

async function createTransporter() {
    const config = await getEmailConfig();

    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: config.from,
            pass: config.password.replace(/\s/g, '') // Remove spaces from app password
        }
    });
}

export async function sendOTPEmail(to: string, otp: string, type: 'entry' | 'exit') {
    try {
        if (!transporter) {
            transporter = await createTransporter();
        }
        
        const config = await getEmailConfig();
        
        const subject = type === 'entry' ? 'Entry OTP - Workplace Attendance' : 'Exit OTP - Workplace Attendance';
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
                    .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
                    .otp-box { background: white; border: 2px dashed #4F46E5; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }
                    .otp { font-size: 36px; font-weight: bold; color: #4F46E5; letter-spacing: 8px; }
                    .footer { background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 5px 5px; }
                    .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 15px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Workplace Attendance System</h1>
                    </div>
                    <div class="content">
                        <h2>Your ${type === 'entry' ? 'Entry' : 'Exit'} OTP</h2>
                        <p>Hello,</p>
                        <p>Use the following OTP to mark your ${type === 'entry' ? 'entry' : 'exit'} attendance:</p>
                        
                        <div class="otp-box">
                            <div class="otp">${otp}</div>
                        </div>
                        
                        <div class="warning">
                            <strong>⏱️ Important:</strong> This OTP is valid for <strong>5 minutes</strong> only.
                        </div>
                        
                        <p><strong>How to use:</strong></p>
                        <ol>
                            <li>Ask the security guard for the current OTP</li>
                            <li>Enter the OTP in your employee dashboard</li>
                            <li>Ensure your location services are enabled</li>
                        </ol>
                        
                        <p>If you didn't request this OTP, please ignore this email.</p>
                    </div>
                    <div class="footer">
                        <p>This is an automated message from the Workplace Attendance System.</p>
                        <p>&copy; ${new Date().getFullYear()} Workplace Attendance. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `;
        
        if (!transporter) {
            return { success: false, error: 'Email service not initialized' };
        }

        await transporter.sendMail({
            from: `"Workplace Attendance" <${config.from}>`,
            to,
            subject,
            html
        });
        
        return { success: true };
    } catch (error) {
        console.error('Error sending OTP email:', error);
        return { success: false, error: 'Failed to send email' };
    }
}

export async function sendBulkOTPEmail(employees: { email: string; name: string }[], otp: string, type: 'entry' | 'exit') {
    const results = [];
    
    for (const employee of employees) {
        const result = await sendOTPEmail(employee.email, otp, type);
        results.push({ email: employee.email, success: result.success });
    }
    
    return results;
}

// Send OTP request notification to security guard
export async function sendOTPRequestEmail(securityEmail: string, employeeName: string, employeeEmail: string, profilePictureUrl: string | undefined, otpCode: string, type: 'entry' | 'exit') {
    try {
        if (!transporter) {
            transporter = await createTransporter();
        }
        
        const config = await getEmailConfig();
        const profileImage = profilePictureUrl || 'https://via.placeholder.com/100?text=No+Photo';
        
        const subject = `🔔 OTP Request from ${employeeName} - ${type === 'entry' ? 'Entry' : 'Exit'}`;
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
                    .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
                    .profile-pic { width: 100px; height: 100px; border-radius: 50%; object-fit: cover; border: 3px solid #10b981; margin: 20px auto; display: block; }
                    .info-box { background: white; border-left: 4px solid #10b981; padding: 15px; margin: 15px 0; }
                    .otp-box { background: #dbeafe; border: 3px solid #3b82f6; padding: 20px; margin: 20px 0; border-radius: 10px; text-align: center; }
                    .otp-code { font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1e40af; font-family: monospace; }
                    .footer { background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 5px 5px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🔔 OTP Request Notification</h1>
                    </div>
                    <div class="content">
                        <img src="${profileImage}" alt="${employeeName}" class="profile-pic" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(employeeName)}&size=100&background=10b981&color=fff'" />
                        <h2 style="text-align: center;">${type === 'entry' ? 'Entry' : 'Exit'} OTP Request</h2>
                        <p style="text-align: center;">An employee has requested the current OTP code:</p>
                        
                        <div class="info-box">
                            <p><strong>Employee Name:</strong> ${employeeName}</p>
                            <p><strong>Employee Email:</strong> ${employeeEmail}</p>
                            <p><strong>Request Type:</strong> ${type === 'entry' ? 'Entry Attendance' : 'Exit Attendance'}</p>
                            <p><strong>Time:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
                        </div>
                        
                        <div class="otp-box">
                            <p style="margin: 0 0 10px 0; font-size: 14px; color: #1e40af;">Current OTP Code:</p>
                            <div class="otp-code">${otpCode}</div>
                            <p style="margin: 10px 0 0 0; font-size: 12px; color: #6b7280;">Please share this code with ${employeeName}</p>
                        </div>
                        
                        <p><strong>Action Required:</strong></p>
                        <p>Please provide the OTP code <strong>${otpCode}</strong> to <strong>${employeeName}</strong> for attendance verification.</p>
                        
                        <p style="margin-top: 20px; padding: 10px; background: #fef3c7; border-radius: 5px;">
                            <strong>Note:</strong> This is an automated notification to help you track OTP requests.
                        </p>
                    </div>
                    <div class="footer">
                        <p>Workplace Attendance System - Security Notifications</p>
                        <p>&copy; ${new Date().getFullYear()} All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `;
        
        if (!transporter) {
            return { success: false, error: 'Email service not initialized' };
        }

        await transporter.sendMail({
            from: `"Workplace Attendance" <${config.from}>`,
            to: securityEmail,
            subject,
            html
        });
        
        return { success: true };
    } catch (error) {
        console.error('Error sending OTP request email:', error);
        return { success: false, error: 'Failed to send email' };
    }
}

// Send OTP verification notification to security guard
export async function sendOTPVerificationEmail(securityEmail: string, employeeName: string, employeeEmail: string, profilePictureUrl: string | undefined, type: 'entry' | 'exit') {
    try {
        if (!transporter) {
            transporter = await createTransporter();
        }
        
        const config = await getEmailConfig();
        const profileImage = profilePictureUrl || 'https://via.placeholder.com/100?text=No+Photo';
        
        const subject = `✅ OTP Verified - ${employeeName} (${type === 'entry' ? 'Entry' : 'Exit'})`;
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #059669; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
                    .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
                    .profile-pic { width: 100px; height: 100px; border-radius: 50%; object-fit: cover; border: 3px solid #059669; margin: 20px auto; display: block; }
                    .info-box { background: white; border-left: 4px solid #059669; padding: 15px; margin: 15px 0; }
                    .success-box { background: #d1fae5; border-left: 4px solid #059669; padding: 15px; margin: 15px 0; text-align: center; }
                    .footer { background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 5px 5px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>✅ OTP Verification Success</h1>
                    </div>
                    <div class="content">
                        <img src="${profileImage}" alt="${employeeName}" class="profile-pic" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(employeeName)}&size=100&background=059669&color=fff'" />
                        <h2 style="text-align: center; color: #059669;">${type === 'entry' ? 'Entry' : 'Exit'} Attendance Verified</h2>
                        
                        <div class="success-box">
                            <p style="font-size: 18px; margin: 0;">
                                <strong>${employeeName}</strong> has successfully verified their OTP and marked attendance.
                            </p>
                        </div>
                        
                        <div class="info-box">
                            <p><strong>Employee Name:</strong> ${employeeName}</p>
                            <p><strong>Employee Email:</strong> ${employeeEmail}</p>
                            <p><strong>Attendance Type:</strong> ${type === 'entry' ? 'Entry' : 'Exit'}</p>
                            <p><strong>Verified Time:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
                        </div>
                        
                        <p style="margin-top: 20px; padding: 10px; background: #dbeafe; border-radius: 5px;">
                            <strong>Note:</strong> This confirmation is sent automatically when an employee successfully verifies their OTP.
                        </p>
                    </div>
                    <div class="footer">
                        <p>Workplace Attendance System - Security Notifications</p>
                        <p>&copy; ${new Date().getFullYear()} All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `;
        
        if (!transporter) {
            return { success: false, error: 'Email service not initialized' };
        }

        await transporter.sendMail({
            from: `"Workplace Attendance" <${config.from}>`,
            to: securityEmail,
            subject,
            html
        });
        
        return { success: true };
    } catch (error) {
        console.error('Error sending OTP verification email:', error);
        return { success: false, error: 'Failed to send verification email' };
    }
}

// Send test email
export async function sendTestEmail(to: string) {
    try {
        if (!transporter) {
            transporter = await createTransporter();
        }
        
        const config = await getEmailConfig();
        
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #6366f1; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
                    .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
                    .success-box { background: #d1fae5; border: 2px solid #10b981; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }
                    .footer { background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 5px 5px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>✅ Email Configuration Test</h1>
                    </div>
                    <div class="content">
                        <h2>Test Email Successful!</h2>
                        <p>Hello,</p>
                        <p>This is a test email from the Workplace Attendance System.</p>
                        
                        <div class="success-box">
                            <h3 style="color: #10b981; margin: 0;">✓ Email System Working</h3>
                            <p style="margin: 10px 0 0 0;">Your email configuration is working correctly!</p>
                        </div>
                        
                        <p><strong>Configuration Details:</strong></p>
                        <ul>
                            <li>Email Service: Gmail</li>
                            <li>Sender: ${config.from}</li>
                            <li>Timestamp: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</li>
                        </ul>
                        
                        <p>The system is ready to send attendance OTP notifications.</p>
                    </div>
                    <div class="footer">
                        <p>Workplace Attendance System</p>
                        <p>&copy; ${new Date().getFullYear()} All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `;
        
        if (!transporter) {
            return { success: false, error: 'Email service not initialized' };
        }

        await transporter.sendMail({
            from: `"Workplace Attendance" <${config.from}>`,
            to,
            subject: 'Test Email - Workplace Attendance System',
            html
        });
        
        return { success: true };
    } catch (error) {
        console.error('Error sending test email:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Failed to send email' };
    }
}
