'use server';

import { randomUUID } from 'crypto';

import { connectToDatabase } from '@/lib/db';
import { Order } from '@/models/Order';
import { Survey } from '@/models/Survey';
import { sendSurveyEmail } from '@/lib/email';
import { getCurrentSession } from './authActions';

export interface SurveyResponseData {
  _id: string;
  orderId: string;
  customerName: string;
  customerEmail: string;
  rating?: number;
  feedback?: string;
  respondedAt: string | null;
  createdAt: string;
}

/**
 * Server Action: Send (or resend) a satisfaction survey email for each given
 * delivered order (admin only).
 */
export async function sendSurveysAction(
  orderIds: string[]
): Promise<{ success: boolean; sent?: number; error?: string }> {
  try {
    const session = await getCurrentSession();
    if (!session.isLoggedIn || session.role !== 'admin') {
      return { success: false, error: 'Unauthorized. Administrator access required.' };
    }

    if (!orderIds || orderIds.length === 0) {
      return { success: false, error: 'No orders selected.' };
    }

    await connectToDatabase();

    let sent = 0;
    for (const orderId of orderIds) {
      const order = await Order.findById(orderId);
      if (!order || order.status !== 'delivered') {
        continue;
      }

      let survey = await Survey.findOne({ orderId: order._id });
      if (!survey) {
        survey = new Survey({
          orderId: order._id,
          customerName: order.customerName,
          customerEmail: order.customerEmail,
          token: randomUUID(),
        });
        await survey.save();
      }

      await sendSurveyEmail({
        _id: order._id.toString(),
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        surveyToken: survey.token,
      });

      order.surveySentAt = new Date();
      await order.save();
      sent += 1;
    }

    return { success: true, sent };
  } catch (err) {
    console.error('sendSurveysAction error:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Failed to send surveys' };
  }
}

/**
 * Server Action: Get all survey responses for the HQ feedback dashboard (admin only).
 */
export async function getSurveyResponsesAction(): Promise<{
  success: boolean;
  surveys?: SurveyResponseData[];
  error?: string;
}> {
  try {
    const session = await getCurrentSession();
    if (!session.isLoggedIn || session.role !== 'admin') {
      return { success: false, error: 'Unauthorized. Administrator access required.' };
    }

    await connectToDatabase();
    const surveys = await Survey.find({}).sort({ createdAt: -1 }).lean();

    const serialized: SurveyResponseData[] = surveys.map((s) => ({
      _id: s._id.toString(),
      orderId: s.orderId.toString(),
      customerName: s.customerName,
      customerEmail: s.customerEmail,
      rating: s.rating,
      feedback: s.feedback,
      respondedAt: s.respondedAt ? s.respondedAt.toISOString() : null,
      createdAt: s.createdAt.toISOString(),
    }));

    return { success: true, surveys: serialized };
  } catch (err) {
    console.error('getSurveyResponsesAction error:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Failed to load survey responses' };
  }
}

/**
 * Server Action: Public read of a survey by its token, for the /survey/[token] page.
 */
export async function getSurveyByToken(token: string): Promise<{
  success: boolean;
  survey?: {
    customerName: string;
    rating?: number;
    feedback?: string;
    respondedAt: string | null;
  };
  error?: string;
}> {
  try {
    await connectToDatabase();
    const survey = await Survey.findOne({ token }).lean();
    if (!survey) {
      return { success: false, error: 'Survey not found' };
    }

    return {
      success: true,
      survey: {
        customerName: survey.customerName,
        rating: survey.rating,
        feedback: survey.feedback,
        respondedAt: survey.respondedAt ? survey.respondedAt.toISOString() : null,
      },
    };
  } catch (err) {
    console.error('getSurveyByToken error:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Failed to load survey' };
  }
}

/**
 * Server Action: Public submission of survey feedback.
 */
export async function submitSurveyAction(
  token: string,
  rating: number,
  feedback: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!rating || rating < 1 || rating > 5) {
      return { success: false, error: 'Please select a rating from 1 to 5.' };
    }

    await connectToDatabase();
    const survey = await Survey.findOne({ token });
    if (!survey) {
      return { success: false, error: 'This survey link is invalid or has expired.' };
    }

    if (survey.respondedAt) {
      return { success: false, error: 'This survey has already been submitted. Thank you!' };
    }

    survey.rating = rating;
    survey.feedback = feedback.trim();
    survey.respondedAt = new Date();
    await survey.save();

    return { success: true };
  } catch (err) {
    console.error('submitSurveyAction error:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Failed to submit feedback' };
  }
}
