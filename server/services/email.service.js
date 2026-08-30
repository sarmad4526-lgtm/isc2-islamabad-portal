const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
    if (transporter) return transporter;

    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && user && pass) {
        transporter = nodemailer.createTransport({
            host: host,
            port: parseInt(process.env.SMTP_PORT, 10) || 587,
            secure: process.env.SMTP_PORT === '465',
            auth: { user, pass }
        });
    } else {
        // Simulated logger transport for local development when SMTP is not configured
        transporter = {
            sendMail: async (options) => {
                console.log(`\n📧 [EMAIL DISPATCH SIMULATION]`);
                console.log(`To: ${options.to}`);
                console.log(`Subject: ${options.subject}`);
                console.log(`Content Preview: ${options.text ? options.text.substring(0, 150) : 'HTML email'}`);
                console.log(`------------------------------------\n`);
                return { messageId: `mock-${Date.now()}` };
            }
        };
    }
    return transporter;
}

/**
 * Sends confirmation email when an application is submitted
 */
async function sendApplicationReceivedEmail(applicant) {
    const transport = getTransporter();
    const from = process.env.EMAIL_FROM || '"ISC2 Islamabad Chapter" <membership@isc2islamabad.org>';

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a202c; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
            <div style="background: linear-gradient(135deg, #1a365d, #2c5282); padding: 24px; text-align: center; color: #fff;">
                <h2 style="margin: 0; font-size: 22px;">ISC2 Islamabad Chapter</h2>
                <p style="margin: 6px 0 0; font-size: 13px; letter-spacing: 2px; text-transform: uppercase;">Connect. Educate. Inspire. Secure.</p>
            </div>
            <div style="padding: 24px;">
                <p>Dear <strong>${applicant.name}</strong>,</p>
                <p>Thank you for your interest in joining the <strong>ISC2 Islamabad Chapter</strong>. We have received your membership application.</p>
                <div style="background: #f7fafc; padding: 16px; border-radius: 6px; border: 1px solid #edf2f7; margin: 18px 0;">
                    <p style="margin: 4px 0;"><strong>Application Reference:</strong> ${applicant.requestId}</p>
                    <p style="margin: 4px 0;"><strong>ISC2 Membership Number:</strong> ${applicant.isc2Number}</p>
                    <p style="margin: 4px 0;"><strong>Date Submitted:</strong> ${applicant.date}</p>
                </div>
                <p>Our membership team is reviewing your details. Once approved, your membership will become active for a 1-year term.</p>
                <p>Warm regards,<br><strong>ISC2 Islamabad Chapter Leadership</strong></p>
            </div>
            <div style="background: #edf2f7; padding: 12px 24px; text-align: center; font-size: 12px; color: #718096;">
                &copy; 2025-2026 ISC2 Islamabad Chapter. All rights reserved.
            </div>
        </div>
    `;

    try {
        await transport.sendMail({
            from,
            to: applicant.email,
            subject: `Application Received — ISC2 Islamabad Chapter [${applicant.requestId}]`,
            html,
            text: `Dear ${applicant.name},\n\nYour application (Ref: ${applicant.requestId}, ISC2 ID: ${applicant.isc2Number}) to the ISC2 Islamabad Chapter has been received.`
        });
    } catch (e) {
        console.error('Error sending application received email:', e.message);
    }
}

/**
 * Sends approval notification when an administrator approves a request
 */
async function sendApplicationApprovedEmail(member) {
    const transport = getTransporter();
    const from = process.env.EMAIL_FROM || '"ISC2 Islamabad Chapter" <membership@isc2islamabad.org>';

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a202c; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
            <div style="background: linear-gradient(135deg, #1a365d, #04844b); padding: 24px; text-align: center; color: #fff;">
                <h2 style="margin: 0; font-size: 22px;">Welcome to ISC2 Islamabad Chapter!</h2>
                <p style="margin: 6px 0 0; font-size: 13px; letter-spacing: 2px; text-transform: uppercase;">Membership Approved</p>
            </div>
            <div style="padding: 24px;">
                <p>Dear <strong>${member.name}</strong>,</p>
                <p>We are delighted to welcome you as an <strong>Active Member</strong> of the ISC2 Islamabad Chapter!</p>
                <div style="background: #f7fafc; padding: 16px; border-radius: 6px; border: 1px solid #edf2f7; margin: 18px 0;">
                    <p style="margin: 4px 0;"><strong>ISC2 Member ID:</strong> <span style="font-family: monospace; font-weight: bold;">${member.memberId}</span></p>
                    <p style="margin: 4px 0;"><strong>Membership Start Date:</strong> ${member.termStartDate}</p>
                    <p style="margin: 4px 0;"><strong>Membership End Date:</strong> ${member.termEndDate} (1 Year Term)</p>
                    <p style="margin: 4px 0;"><strong>Status:</strong> <span style="color: #04844b; font-weight: bold;">Active</span></p>
                </div>
                <p>You can now participate in chapter webinars, technical workshops, working groups, and exclusive CPE-eligible community events.</p>
                <p>Warm regards,<br><strong>ISC2 Islamabad Chapter Team</strong></p>
            </div>
            <div style="background: #edf2f7; padding: 12px 24px; text-align: center; font-size: 12px; color: #718096;">
                &copy; 2025-2026 ISC2 Islamabad Chapter. All rights reserved.
            </div>
        </div>
    `;

    try {
        await transport.sendMail({
            from,
            to: member.email,
            subject: `Welcome to ISC2 Islamabad Chapter — Membership Approved!`,
            html,
            text: `Dear ${member.name},\n\nYour membership for ISC2 Islamabad Chapter has been approved!\nMember ID: ${member.memberId}\nTerm: ${member.termStartDate} to ${member.termEndDate}`
        });
    } catch (e) {
        console.error('Error sending approval email:', e.message);
    }
}

/**
 * Sends broadcast email to multiple members
 */
async function sendBroadcastEmail(recipients, subject, messageBody, senderEmail) {
    const transport = getTransporter();
    const from = senderEmail || process.env.EMAIL_FROM || '"ISC2 Islamabad Chapter" <membership@isc2islamabad.org>';

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a202c; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
            <div style="background: linear-gradient(135deg, #1a365d, #2c5282); padding: 20px; text-align: center; color: #fff;">
                <h3 style="margin: 0;">ISC2 Islamabad Chapter Announcement</h3>
            </div>
            <div style="padding: 24px; line-height: 1.6; white-space: pre-wrap;">${messageBody}</div>
            <div style="background: #edf2f7; padding: 12px 24px; text-align: center; font-size: 12px; color: #718096;">
                ISC2 Islamabad Chapter &bull; <a href="mailto:membership@isc2islamabad.org" style="color: #3182ce;">membership@isc2islamabad.org</a>
            </div>
        </div>
    `;

    // Dispatch to recipients
    const toAddresses = recipients.map(r => (typeof r === 'string' ? r : r.email)).join(', ');

    return await transport.sendMail({
        from,
        to: toAddresses,
        subject,
        html,
        text: messageBody
    });
}

module.exports = {
    sendApplicationReceivedEmail,
    sendApplicationApprovedEmail,
    sendBroadcastEmail
};
