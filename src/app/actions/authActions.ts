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
      // Bootstrap the first admin from env-configured credentials, only while
      // no staff users exist yet. Prevents a guessable hardcoded account.
      const bootstrapEmail = process.env.ADMIN_BOOTSTRAP_EMAIL?.trim().toLowerCase();
      const bootstrapPassword = process.env.ADMIN_BOOTSTRAP_PASSWORD;

      if (
        bootstrapEmail &&
        bootstrapPassword &&
        normEmail === bootstrapEmail &&
        password === bootstrapPassword
      ) {
        const userCount = await User.countDocuments({});
        if (userCount === 0) {
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

/**
 * Server Action: Get all staff users (excludes passwords, admin only).
 */
export async function getStaffUsersAction(): Promise<{
  success: boolean;
  users?: { _id: string; name: string; email: string; role: 'admin' | 'kitchen' | 'courier'; createdAt: string }[];
  error?: string;
}> {
  try {
    const session = await getCurrentSession();
    if (!session.isLoggedIn || session.role !== 'admin') {
      return { success: false, error: 'Unauthorized. Administrator access required.' };
    }

    await connectToDatabase();
    const users = await User.find({}).sort({ createdAt: -1 }).lean();
    
    const serializedUsers = users.map((u) => ({
      _id: u._id.toString(),
      name: u.name,
      email: u.email,
      role: u.role as 'admin' | 'kitchen' | 'courier',
      createdAt: u.createdAt instanceof Date ? u.createdAt.toISOString() : new Date().toISOString(),
    }));

    return { success: true, users: serializedUsers };
  } catch (err) {
    console.error('getStaffUsersAction error:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Failed to query staff users' };
  }
}

/**
 * Server Action: Create a new staff user (admin only).
 */
export async function createStaffUserAction(
  name: string,
  email: string,
  password: string,
  role: 'admin' | 'kitchen' | 'courier'
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getCurrentSession();
    if (!session.isLoggedIn || session.role !== 'admin') {
      return { success: false, error: 'Unauthorized. Administrator access required.' };
    }

    if (!name.trim() || !email.trim() || !password.trim()) {
      return { success: false, error: 'Name, email, and password are required.' };
    }

    await connectToDatabase();
    const normEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({ email: normEmail });
    if (existingUser) {
      return { success: false, error: 'A staff member with this email already exists.' };
    }

    const passHash = await hashPassword(password);
    const newUser = new User({
      name: name.trim(),
      email: normEmail,
      role,
      password: passHash,
    });

    await newUser.save();
    return { success: true };
  } catch (err) {
    console.error('createStaffUserAction error:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Failed to create staff user' };
  }
}

/**
 * Server Action: Update a staff user (admin only).
 */
export async function updateStaffUserAction(
  userId: string,
  name: string,
  email: string,
  role: 'admin' | 'kitchen' | 'courier',
  password?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getCurrentSession();
    if (!session.isLoggedIn || session.role !== 'admin') {
      return { success: false, error: 'Unauthorized. Administrator access required.' };
    }

    if (!userId) {
      return { success: false, error: 'User ID is required.' };
    }

    await connectToDatabase();
    const user = await User.findById(userId);
    if (!user) {
      return { success: false, error: 'User not found.' };
    }

    const normEmail = email.trim().toLowerCase();
    if (normEmail !== user.email) {
      const emailTaken = await User.findOne({ email: normEmail });
      if (emailTaken) {
        return { success: false, error: 'A staff member with this email already exists.' };
      }
    }

    // Prevent changing role of the last admin
    if (user.role === 'admin' && role !== 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return { success: false, error: 'Cannot demote the last administrator.' };
      }
    }

    user.name = name.trim();
    user.email = normEmail;
    user.role = role;

    if (password && password.trim()) {
      user.password = await hashPassword(password);
    }

    await user.save();
    return { success: true };
  } catch (err) {
    console.error('updateStaffUserAction error:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Failed to update staff user' };
  }
}

/**
 * Server Action: Delete a staff user (admin only).
 */
export async function deleteStaffUserAction(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getCurrentSession();
    if (!session.isLoggedIn || session.role !== 'admin') {
      return { success: false, error: 'Unauthorized. Administrator access required.' };
    }

    if (!userId) {
      return { success: false, error: 'User ID is required.' };
    }

    // Prevent deleting themselves
    if (session.userId === userId) {
      return { success: false, error: 'You cannot delete your own administrator account.' };
    }

    await connectToDatabase();
    const user = await User.findById(userId);
    if (!user) {
      return { success: false, error: 'User not found.' };
    }

    // Prevent deleting the last admin
    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return { success: false, error: 'You cannot delete the last administrator.' };
      }
    }

    await User.findByIdAndDelete(userId);
    return { success: true };
  } catch (err) {
    console.error('deleteStaffUserAction error:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Failed to delete staff user' };
  }
}
