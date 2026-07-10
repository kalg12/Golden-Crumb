import fs from 'fs/promises';
import path from 'path';
import { EmailSettings } from '@/models/EmailSettings';
import { getSiteSettings } from '@/lib/siteSettings';
export const DEFAULT_TEMPLATES = {
  customerConfirmation: {
    subject: '🍪 Order Confirmation #{{orderId}} - Golden Crumb',
    body: `<h2>Hello, {{customerName}}!</h2>
<p>Thank you for baking with us! We have received your order request <strong>#{{orderId}}</strong> and are reviewing details.</p>
<p>Here is your delivery summary:</p>
{{itemsTable}}
<div class="total">Estimated Total: {{totalPrice}}</div>
<div style="background-color: #F8EBDD; padding: 16px; border-radius: 8px; margin-top: 16px;">
  <p style="margin: 0 0 8px 0;"><strong>Delivery Slot:</strong> {{preferredDate}} ({{preferredTime}})</p>
  <p style="margin: 0;"><strong>Address:</strong> {{deliveryAddress}}</p>
</div>
<p>You can track the live status of your baking cookies at the link below:</p>
<div style="text-align: center;">
  <a href="{{trackingUrl}}" class="button">Track My Order</a>
</div>`,
  },
  adminConfirmation: {
    subject: '🚨 [ALERT] New Order #{{orderId}} - Golden Crumb',
    body: `<h2>New Order Request Received!</h2>
<p>Order <strong>#{{orderId}}</strong> has been registered in the queue.</p>
<p><strong>Customer:</strong> {{customerName}} ({{customerEmail}})</p>
{{itemsTable}}
<div class="total">Total Value: {{totalPrice}}</div>
<div style="background-color: #F8EBDD; padding: 16px; border-radius: 8px; margin-top: 16px;">
  <p style="margin: 0 0 8px 0;"><strong>Scheduled Slot:</strong> {{preferredDate}} ({{preferredTime}})</p>
  <p style="margin: 0;"><strong>Destination:</strong> {{deliveryAddress}}</p>
</div>
<div style="text-align: center;">
  <a href="{{adminUrl}}" class="button">Open HQ Dashboard</a>
</div>`,
  },
  statusKitchenPrep: {
    subject: '📦 Update on Order #{{orderId}}: BAKING STARTED',
    body: `<h2>Ovens are pre-heating!</h2>
<p>Hello, {{customerName}}. We want to share a live update regarding your order request <strong>#{{orderId}}</strong>.</p>
<div style="background-color: #F8EBDD; border-left: 4px solid #D49A55; padding: 16px; margin: 16px 0; border-radius: 0 8px 8px 0;">
  <p style="margin: 0; font-size: 15px; font-weight: bold; text-transform: uppercase;">Current Status: Baking</p>
  <p style="margin: 8px 0 0 0; font-size: 13px; line-height: 1.4;">Your artisan cookies have entered the kitchen prep stage and are now being freshly rolled and baked by our team.</p>
</div>
<p>Target delivery window remains: <strong>{{preferredDate}} ({{preferredTime}})</strong>.</p>
<p>Track live updates on our portal:</p>
<div style="text-align: center;">
  <a href="{{trackingUrl}}" class="button">Track My Order</a>
</div>`,
  },
  statusReadyForDelivery: {
    subject: '📦 Update on Order #{{orderId}}: READY FOR DELIVERY',
    body: `<h2>Golden and fresh!</h2>
<p>Hello, {{customerName}}. We want to share a live update regarding your order request <strong>#{{orderId}}</strong>.</p>
<div style="background-color: #F8EBDD; border-left: 4px solid #D49A55; padding: 16px; margin: 16px 0; border-radius: 0 8px 8px 0;">
  <p style="margin: 0; font-size: 15px; font-weight: bold; text-transform: uppercase;">Current Status: Ready for Delivery</p>
  <p style="margin: 8px 0 0 0; font-size: 13px; line-height: 1.4;">Great news! Your cookies have finished baking, cooled down, and are packed. They are waiting for dispatch.</p>
</div>
<p>Target delivery window remains: <strong>{{preferredDate}} ({{preferredTime}})</strong>.</p>
<p>Track live updates on our portal:</p>
<div style="text-align: center;">
  <a href="{{trackingUrl}}" class="button">Track My Order</a>
</div>`,
  },
  statusOutForDelivery: {
    subject: '📦 Update on Order #{{orderId}}: OUT FOR DELIVERY',
    body: `<h2>Cookies on the move!</h2>
<p>Hello, {{customerName}}. We want to share a live update regarding your order request <strong>#{{orderId}}</strong>.</p>
<div style="background-color: #F8EBDD; border-left: 4px solid #D49A55; padding: 16px; margin: 16px 0; border-radius: 0 8px 8px 0;">
  <p style="margin: 0; font-size: 15px; font-weight: bold; text-transform: uppercase;">Current Status: Out for Delivery</p>
  <p style="margin: 8px 0 0 0; font-size: 13px; line-height: 1.4;">Your delivery courier has departed the kitchen! Fresh cookies are heading your way in San Francisco right now.</p>
</div>
<p>Target delivery window remains: <strong>{{preferredDate}} ({{preferredTime}})</strong>.</p>
<p>Track live updates on our portal:</p>
<div style="text-align: center;">
  <a href="{{trackingUrl}}" class="button">Track My Order</a>
</div>`,
  },
  statusDelivered: {
    subject: '🍪 Update on Order #{{orderId}}: DELIVERED',
    body: `<h2>Delivered & Fresh!</h2>
<p>Hello, {{customerName}}. We want to share a live update regarding your order request <strong>#{{orderId}}</strong>.</p>
<div style="background-color: #F8EBDD; border-left: 4px solid #D49A55; padding: 16px; margin: 16px 0; border-radius: 0 8px 8px 0;">
  <p style="margin: 0; font-size: 15px; font-weight: bold; text-transform: uppercase;">Current Status: Delivered</p>
  <p style="margin: 8px 0 0 0; font-size: 13px; line-height: 1.4;">Cookies have been successfully dropped off at your address. Enjoy your premium treats!</p>
</div>
<p>Enjoy your warm cookies!</p>`,
  },
  statusCancelled: {
    subject: '❌ Update on Order #{{orderId}}: CANCELLED',
    body: `<h2>Order Cancelled</h2>
<p>Hello, {{customerName}}. We want to share a live update regarding your order request <strong>#{{orderId}}</strong>.</p>
<div style="background-color: #F8EBDD; border-left: 4px solid #D49A55; padding: 16px; margin: 16px 0; border-radius: 0 8px 8px 0;">
  <p style="margin: 0; font-size: 15px; font-weight: bold; text-transform: uppercase;">Current Status: Cancelled</p>
  <p style="margin: 8px 0 0 0; font-size: 13px; line-height: 1.4;">Your order request has been marked as cancelled. If you did not request this, please reach out to our team.</p>
</div>
<p>If you have any questions, contact us on WhatsApp.</p>`,
  },
};

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

/**
 * Helper: Parse template placeholders like {{customerName}} to actual values.
 */
function replacePlaceholders(template: string, variables: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.split(`{{${key}}}`).join(value);
  }
  return result;
}

/**
 * Sends a transactional email. Integrates dynamically with Resend API or SMTP (via nodemailer),
 * falling back to writing a mock preview file locally if disabled.
 */
export async function sendEmail({ to, subject, html }: EmailPayload): Promise<boolean> {
  let settings = null;
  try {
    settings = await EmailSettings.findOne({});
  } catch (err) {
    console.warn('Could not read email settings from MongoDB:', err);
  }

  const provider = settings?.provider || (process.env.RESEND_API_KEY ? 'resend' : 'mock');
  const from = settings?.fromAddress || 'Golden Crumb <orders@golden-crumb.com>';

  if (provider === 'resend') {
    const apiKey = settings?.resendApiKey || process.env.RESEND_API_KEY;
    if (apiKey) {
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from,
            to,
            subject,
            html,
          }),
        });
        if (res.ok) {
          return true;
        }
        const data = await res.json();
        console.error('Resend API failed:', data);
      } catch (err) {
        console.error('Failed to dispatch Resend email:', err);
      }
    } else {
      console.warn('Resend provider selected but no API Key configured.');
    }
  } else if (provider === 'smtp') {
    if (settings?.smtpHost) {
      try {
        let nodemailer;
        try {
          nodemailer = require('nodemailer');
        } catch (e) {
          console.error('[SMTP ERROR] nodemailer is not installed. Run npm install nodemailer first.');
          throw new Error('nodemailer is missing');
        }

        const transporter = nodemailer.createTransport({
          host: settings.smtpHost,
          port: settings.smtpPort || 587,
          secure: settings.smtpSecure || false,
          auth: {
            user: settings.smtpUser || '',
            pass: settings.smtpPass || '',
          },
        });

        await transporter.sendMail({
          from,
          to,
          subject,
          html,
        });

        console.log(`[SMTP EMAIL] Sent successfully to: ${to}`);
        return true;
      } catch (err) {
        console.error('Failed to dispatch SMTP email:', err);
      }
    } else {
      console.warn('SMTP provider selected but no SMTP Host configured.');
    }
  }

  // Fallback: Write HTML mock email to local files for verification
  try {
    const mockDir = path.join(process.cwd(), 'artifacts', 'mock-emails');
    await fs.mkdir(mockDir, { recursive: true });

    const sanitizedSubject = subject.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const fileName = `${Date.now()}_to_${to.replace(/[^a-z0-9]/gi, '_')}_${sanitizedSubject}.html`;
    const filePath = path.join(mockDir, fileName);

    await fs.writeFile(filePath, html, 'utf8');
    console.log(`[EMAIL MOCK] Email saved to local preview file: ${filePath}`);
    return true;
  } catch (err) {
    console.error('Failed to save mock email:', err);
    return false;
  }
}

/**
 * Template Helper: Custom styles wrapper for emails.
 */
async function getEmailBaseTemplate(title: string, bodyContent: string): Promise<string> {
  const siteSettings = await getSiteSettings();
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            background-color: #F0E0D0;
            color: #4A2718;
            margin: 0;
            padding: 20px;
          }
          .container {
            max-width: 600px;
            background-color: #FFF7EC;
            border: 1px solid #D49A55;
            border-radius: 12px;
            overflow: hidden;
            margin: 0 auto;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
          }
          .header {
            background-color: #482612;
            padding: 24px;
            text-align: center;
            border-bottom: 3px solid #D49A55;
          }
          .header h1 {
            color: #F7EADD;
            font-family: Georgia, serif;
            margin: 0;
            font-size: 24px;
            letter-spacing: 1px;
          }
          .content {
            padding: 32px 24px;
            line-height: 1.6;
          }
          .footer {
            background-color: #F8EBDD;
            padding: 16px;
            text-align: center;
            font-size: 11px;
            color: #4A2718;
            border-top: 1px solid #EAEAEA;
          }
          .footer a {
            color: #D49A55;
            text-decoration: none;
            font-weight: bold;
          }
          .button {
            display: inline-block;
            background-color: #D49A55;
            color: #FFF7EC !important;
            padding: 12px 24px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: bold;
            margin: 16px 0;
            font-size: 14px;
          }
          .item-list {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          .item-list th {
            border-bottom: 2px solid #482612;
            text-align: left;
            padding: 8px;
            font-size: 12px;
            text-transform: uppercase;
          }
          .item-list td {
            border-bottom: 1px solid #F8EBDD;
            padding: 8px;
            font-size: 14px;
          }
          .total {
            text-align: right;
            font-weight: bold;
            font-size: 16px;
            margin-top: 16px;
            color: #D49A55;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>GOLDEN CRUMB</h1>
          </div>
          <div class="content">
            ${bodyContent}
          </div>
          <div class="footer">
            <p>Golden Crumb · Artisan Cookies · ${siteSettings.location}</p>
            <p>Questions? Contact us on <a href="${siteSettings.whatsappUrl}">WhatsApp</a></p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Triggers order placement confirmation emails.
 */
export async function sendOrderConfirmationEmail(order: {
  _id: string;
  customerName: string;
  customerEmail: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  totalPrice: number;
  preferredDate: string;
  preferredTime: string;
  address: { line1: string };
}) {
  let settings = null;
  try {
    settings = await EmailSettings.findOne({});
  } catch (err) {
    console.warn('Could not read email settings:', err);
  }

  const orderIdShort = order._id.substring(order._id.length - 6);
  const itemsHtml = order.items
    .map(
      (it) => `
    <tr>
      <td>${it.name}</td>
      <td style="text-align: center;">${it.quantity}</td>
      <td style="text-align: right;">$${(it.price * it.quantity).toFixed(2)}</td>
    </tr>`
    )
    .join('');

  const itemsTable = `
    <table class="item-list">
      <thead>
        <tr>
          <th>Cookie</th>
          <th style="text-align: center;">Quantity</th>
          <th style="text-align: right;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>
  `;

  const variables = {
    orderId: orderIdShort,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    totalPrice: `$${order.totalPrice.toFixed(2)}`,
    preferredDate: order.preferredDate,
    preferredTime: order.preferredTime,
    deliveryAddress: order.address.line1,
    itemsTable: itemsTable,
    trackingUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/my-orders`,
    adminUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/admin`,
  };

  // 1. Send to Customer
  const custTemplate = settings?.templates?.customerConfirmation || DEFAULT_TEMPLATES.customerConfirmation;
  const custSubject = replacePlaceholders(custTemplate.subject, variables);
  const custBody = replacePlaceholders(custTemplate.body, variables);
  const customerHtml = await getEmailBaseTemplate(custSubject, custBody);

  await sendEmail({
    to: order.customerEmail,
    subject: custSubject,
    html: customerHtml,
  });

  // 2. Send to Admin
  const adminTemplate = settings?.templates?.adminConfirmation || DEFAULT_TEMPLATES.adminConfirmation;
  const adminSubject = replacePlaceholders(adminTemplate.subject, variables);
  const adminBody = replacePlaceholders(adminTemplate.body, variables);
  const adminHtml = await getEmailBaseTemplate(adminSubject, adminBody);

  const adminEmailRecipient = settings?.adminAddress || 'admin@golden-crumb.com';

  await sendEmail({
    to: adminEmailRecipient,
    subject: adminSubject,
    html: adminHtml,
  });
}

/**
 * Triggers status change alerts to customers.
 */
export async function sendOrderStatusUpdateEmail(order: {
  _id: string;
  customerName: string;
  customerEmail: string;
  status: string;
  preferredDate: string;
  preferredTime: string;
}) {
  let settings = null;
  try {
    settings = await EmailSettings.findOne({});
  } catch (err) {
    console.warn('Could not read email settings:', err);
  }

  const orderIdShort = order._id.substring(order._id.length - 6);

  let statusTitle = '';
  let statusDescription = '';
  let templateConfig = null;

  switch (order.status) {
    case 'kitchen_prep':
      statusTitle = 'Ovens are pre-heating!';
      statusDescription = 'Your artisan cookies have entered the kitchen prep stage and are now being freshly rolled and baked by our team.';
      templateConfig = settings?.templates?.statusKitchenPrep || DEFAULT_TEMPLATES.statusKitchenPrep;
      break;
    case 'ready_for_delivery':
      statusTitle = 'Golden and fresh!';
      statusDescription = 'Great news! Your cookies have finished baking, cooled down, and are packed. They are waiting for dispatch.';
      templateConfig = settings?.templates?.statusReadyForDelivery || DEFAULT_TEMPLATES.statusReadyForDelivery;
      break;
    case 'out_for_delivery':
      statusTitle = 'Cookies on the move!';
      statusDescription = 'Your delivery courier has departed the kitchen! Fresh cookies are heading your way in San Francisco right now.';
      templateConfig = settings?.templates?.statusOutForDelivery || DEFAULT_TEMPLATES.statusOutForDelivery;
      break;
    case 'delivered':
      statusTitle = 'Delivered & Fresh!';
      statusDescription = 'Cookies have been successfully dropped off at your address. Enjoy your premium treats!';
      templateConfig = settings?.templates?.statusDelivered || DEFAULT_TEMPLATES.statusDelivered;
      break;
    case 'cancelled':
      statusTitle = 'Order Cancelled';
      statusDescription = 'Your order request has been marked as cancelled. If you did not request this, please reach out to our team.';
      templateConfig = settings?.templates?.statusCancelled || DEFAULT_TEMPLATES.statusCancelled;
      break;
    default:
      return;
  }

  const variables = {
    orderId: orderIdShort,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    preferredDate: order.preferredDate,
    preferredTime: order.preferredTime,
    statusTitle,
    statusDescription,
    trackingUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/my-orders`,
  };

  const subject = replacePlaceholders(templateConfig.subject, variables);
  const body = replacePlaceholders(templateConfig.body, variables);
  const html = await getEmailBaseTemplate(subject, body);

  await sendEmail({
    to: order.customerEmail,
    subject,
    html,
  });
}
