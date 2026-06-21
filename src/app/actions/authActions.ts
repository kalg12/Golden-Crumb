'use server';

import { cookies } from 'next/headers';
import { connectToDatabase } from '@/lib/db';
import { hashPassword, verifyPassword, signToken, verifyToken } from '@/lib/crypto';
import { Customer } from '@/models/Customer';
import { User } from '@/models/User';

const SESSION_COOKIE = 'golden_crumb_session';

/**
 * Server Action: Authenticate a user (admin/staff) or customer, setting a session cookie.
 */
export async function loginAction(
  email: string,
  password: string,
  isStaff: boolean
): Promise<{ success: boolean; error?: string; name?: string; role?: string }> {
  try {
    await connectToDatabase();

    const normEmail = email.trim().toLowerCase();

    // 1. Staff authentication pathway
    if (isStaff) {
      // Bootstrap default admin if empty
      if (normEmail === 'admin@golden-crumb.com' && password === 'admin123') {
        const adminExists = await User.findOne({ email: normEmail });
        if (!adminExists) {
          const passHash = await hashPassword(password);
          const defaultAdmin = new User({
            name: 'Bakery Admin',
            email: normEmail,
            role: 'admin',
            password: passHash,
          });
          await defaultAdmin.save();
        }
      }

      const user = await User.findOne({ email: normEmail });
      if (!user || !user.password) {
        return { success: false, error: 'Invalid email or password' };
      }

      const passwordValid = await verifyPassword(password, user.password);
      if (!passwordValid) {
        return { success: false, error: 'Invalid email or password' };
      }

      // Generate staff session token
      const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7; // 7 days expiration
      const token = await signToken({
        userId: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        exp,
      });

      const cookieStore = await cookies();
      cookieStore.set({
        name: SESSION_COOKIE,
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      });

      return { success: true, name: user.name, role: user.role };
    }

    // 2. Customer authentication pathway
    const customer = await Customer.findOne({ email: normEmail });
    if (!customer) {
      return {
        success: false,
        error: 'No profile found with this email. Create an account during checkout first.',
      };
    }

    if (!customer.password) {
      return {
        success: false,
        error: 'This profile is not registered. Submit an order with a password to register.',
      };
    }

    const passwordValid = await verifyPassword(password, customer.password);
    if (!passwordValid) {
      return { success: false, error: 'Invalid password' };
    }

    // Generate customer session token
    const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7;
    const token = await signToken({
      userId: customer._id.toString(),
      email: customer.email,
      name: customer.name,
      role: 'customer',
      exp,
    });

    const cookieStore = await cookies();
    cookieStore.set({
      name: SESSION_COOKIE,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return { success: true, name: customer.name, role: 'customer' };
  } catch (error: unknown) {
    console.error('Login action error:', error);
    const errMsg = error instanceof Error ? error.message : 'Login failed';
    return { success: false, error: errMsg };
  }
}

/**
 * Server Action: Log out the current user, clearing session cookies.
 */
export async function logoutAction(): Promise<{ success: boolean }> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  return { success: true };
}

/**
 * Helper: Query active session details from server.
 */
export async function getCurrentSession(): Promise<{
  isLoggedIn: boolean;
  userId?: string;
  email?: string;
  name?: string;
  role?: string;
}> {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get(SESSION_COOKIE);
    if (!cookie || !cookie.value) {
      return { isLoggedIn: false };
    }

    const payload = await verifyToken(cookie.value);
    if (!payload) {
      return { isLoggedIn: false };
    }

    return {
      isLoggedIn: true,
      userId: payload.userId as string,
      email: payload.email as string,
      name: payload.name as string,
      role: payload.role as string,
    };
  } catch (err) {
    console.error('Session retrieval error:', err);
    return { isLoggedIn: false };
  }
}
