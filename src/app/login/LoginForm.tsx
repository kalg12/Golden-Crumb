'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { LogIn, User, ShieldAlert, ArrowLeft, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { loginAction } from '@/app/actions/authActions';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL flags
  const initialIsStaff = searchParams.get('staff') === 'true';
  const redirectPath = searchParams.get('redirect') || null;

  const [isStaff, setIsStaff] = useState(initialIsStaff);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await loginAction(email, password, isStaff);
      if (res.success) {
        // Redirect to target path or defaults
        if (redirectPath) {
          router.push(redirectPath);
        } else if (isStaff) {
          router.push('/admin');
        } else {
          router.push('/my-orders');
        }
        router.refresh();
      } else {
        setError(res.error || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      console.error(err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#FFF7EC] dark:bg-[#482612] p-8 rounded-2xl border border-primary/10 shadow-lg flex flex-col gap-6 text-[#4A2718] dark:text-[#F7EADD]">
      <div className="text-center flex flex-col gap-1.5">
        <h2 className="font-serif text-2xl font-black uppercase tracking-tight">
          GOLDEN CRUMB
        </h2>
        <p className="text-xs text-muted-foreground">
          {isStaff ? 'Staff & Administrator Portal' : 'Customer Account Login'}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex bg-[#F8EBDD] dark:bg-[#5A3019] p-1 rounded-xl border border-primary/5">
        <button
          type="button"
          onClick={() => {
            setIsStaff(false);
            setError(null);
          }}
          className={cn(
            'flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5',
            !isStaff
              ? 'bg-[#D49A55] text-[#FFF7EC] shadow-sm'
              : 'hover:bg-[#D49A55]/10 text-inherit'
          )}
        >
          <User className="size-3.5" /> Customer
        </button>
        <button
          type="button"
          onClick={() => {
            setIsStaff(true);
            setError(null);
          }}
          className={cn(
            'flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5',
            isStaff
              ? 'bg-[#D49A55] text-[#FFF7EC] shadow-sm'
              : 'hover:bg-[#D49A55]/10 text-inherit'
          )}
        >
          <LogIn className="size-3.5" /> Baking Staff
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-600 p-3.5 rounded-xl text-xs flex items-start gap-2.5 leading-relaxed">
          <ShieldAlert className="size-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Inputs Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="login-email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Email Address
          </label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="hello@example.com"
            className="w-full bg-[#F8EBDD]/60 dark:bg-[#5A3019]/40 border border-[#D49A55]/20 rounded-xl py-2 px-3.5 text-sm focus:outline-none focus:border-[#D49A55] placeholder-muted-foreground/60"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="login-password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Password
          </label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            className="w-full bg-[#F8EBDD]/60 dark:bg-[#5A3019]/40 border border-[#D49A55]/20 rounded-xl py-2 px-3.5 text-sm focus:outline-none focus:border-[#D49A55] placeholder-muted-foreground/60"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 mt-2 bg-[#D49A55] hover:bg-[#D49A55]/90 disabled:opacity-50 text-[#FFF7EC] font-bold rounded-xl text-sm transition-all shadow-sm flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="size-4 animate-spin" />}
          {loading ? 'Authenticating...' : 'Sign In'}
        </button>
      </form>

      <div className="flex justify-between items-center text-xs mt-2 border-t border-primary/5 pt-4">
        <Link
          href="/"
          className="text-muted-foreground hover:text-primary transition-all flex items-center gap-1"
        >
          <ArrowLeft className="size-3" /> Back to Store
        </Link>
        <a
          href="/order"
          className="text-primary font-semibold hover:underline"
        >
          Place an Order
        </a>
      </div>
    </div>
  );
}
