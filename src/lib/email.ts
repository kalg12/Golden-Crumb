import fs from 'fs/promises';
import path from 'path';

const RESEND_API_KEY = process.env.RESEND_API_KEY;

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

/**
 * Sends a transactional email. Integrates with Resend if credentials exist,
 * otherwise writes a mock preview file locally to artifacts.
 */
export async function sendEmail({ to, subject, html }: EmailPayload): Promise<boolean> {
  if (RESEND_API_KEY) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Golden Crumb <orders@golden-crumb.com>',
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
      console.error('Failed to dispatch real email:', err);
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
function getEmailBaseTemplate(title: string, bodyContent: string): string {
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
            background-color: #5A3019;
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
            border-bottom: 2px solid #5A3019;
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
            <p>Golden Crumb · Artisan Cookies · San Francisco, CA</p>
            <p>Questions? Contact us on <a href="https://wa.me/15551234567">WhatsApp</a></p>
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

  // 1. Send to Customer
  const customerContent = `
    <h2>Hello, ${order.customerName}!</h2>
    <p>Thank you for baking with us! We have received your order request <strong>#${orderIdShort}</strong> and are reviewing details.</p>
    <p>Here is your delivery summary:</p>
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
    <div class="total">Estimated Total: $${order.totalPrice.toFixed(2)}</div>
    <div style="background-color: #F8EBDD; padding: 16px; border-radius: 8px; margin-top: 16px;">
      <p style="margin: 0 0 8px 0;"><strong>Delivery Slot:</strong> ${order.preferredDate} (${order.preferredTime})</p>
      <p style="margin: 0;"><strong>Address:</strong> ${order.address.line1}</p>
    </div>
    <p>You can track the live status of your baking cookies at the link below:</p>
    <div style="text-align: center;">
      <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/my-orders" class="button">Track My Order</a>
    </div>
  `;

  const customerHtml = getEmailBaseTemplate(`Order Confirmation #${orderIdShort}`, customerContent);
  await sendEmail({
    to: order.customerEmail,
    subject: `🍪 Order Confirmation #${orderIdShort} - Golden Crumb`,
    html: customerHtml,
  });

  // 2. Send to Admin
  const adminContent = `
    <h2>New Order Request Received!</h2>
    <p>Order <strong>#${orderIdShort}</strong> has been registered in the queue.</p>
    <p><strong>Customer:</strong> ${order.customerName} (${order.customerEmail})</p>
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
    <div class="total">Total Value: $${order.totalPrice.toFixed(2)}</div>
    <div style="background-color: #F8EBDD; padding: 16px; border-radius: 8px; margin-top: 16px;">
      <p style="margin: 0 0 8px 0;"><strong>Scheduled Slot:</strong> ${order.preferredDate} (${order.preferredTime})</p>
      <p style="margin: 0;"><strong>Destination:</strong> ${order.address.line1}</p>
    </div>
    <div style="text-align: center;">
      <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/admin" class="button">Open HQ Dashboard</a>
    </div>
  `;

  const adminHtml = getEmailBaseTemplate(`New Order Alert #${orderIdShort}`, adminContent);
  await sendEmail({
    to: 'admin@golden-crumb.com',
    subject: `🚨 [ALERT] New Order #${orderIdShort} - Golden Crumb`,
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
  const orderIdShort = order._id.substring(order._id.length - 6);

  let statusTitle = '';
  let statusDescription = '';

  switch (order.status) {
    case 'kitchen_prep':
      statusTitle = 'Ovens are pre-heating!';
      statusDescription = 'Your artisan cookies have entered the kitchen prep stage and are now being freshly rolled and baked by our team.';
      break;
    case 'ready_for_delivery':
      statusTitle = 'Golden and fresh!';
      statusDescription = 'Great news! Your cookies have finished baking, cooled down, and are packed. They are waiting for dispatch.';
      break;
    case 'out_for_delivery':
      statusTitle = 'Cookies on the move!';
      statusDescription = 'Your delivery courier has departed the kitchen! Fresh cookies are heading your way in San Francisco right now.';
      break;
    case 'delivered':
      statusTitle = 'Delivered & Fresh!';
      statusDescription = 'Cookies have been successfully dropped off at your address. Enjoy your premium treats!';
      break;
    case 'cancelled':
      statusTitle = 'Order Cancelled';
      statusDescription = 'Your order request has been marked as cancelled. If you did not request this, please reach out to our team.';
      break;
    default:
      return;
  }

  const emailContent = `
    <h2>${statusTitle}</h2>
    <p>Hello, ${order.customerName}. We want to share a live update regarding your order request <strong>#${orderIdShort}</strong>.</p>
    <div style="background-color: #F8EBDD; border-left: 4px solid #D49A55; padding: 16px; margin: 16px 0; border-radius: 0 8px 8px 0;">
      <p style="margin: 0; font-size: 15px; font-weight: bold; capitalize;">Current Status: ${order.status.replace(/_/g, ' ')}</p>
      <p style="margin: 8px 0 0 0; font-size: 13px; line-height: 1.4;">${statusDescription}</p>
    </div>
    <p>Target delivery window remains: <strong>${order.preferredDate} (${order.preferredTime})</strong>.</p>
    <p>Track live updates and view directions on our portal:</p>
    <div style="text-align: center;">
      <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/my-orders" class="button">Track My Order</a>
    </div>
  `;

  const html = getEmailBaseTemplate(`Order Status Update: ${order.status}`, emailContent);
  await sendEmail({
    to: order.customerEmail,
    subject: `📦 Update on Order #${orderIdShort}: ${order.status.replace(/_/g, ' ').toUpperCase()}`,
    html,
  });
}
