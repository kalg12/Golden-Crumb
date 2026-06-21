import { Suspense } from 'react';
import { LoginForm } from './LoginForm';

export const metadata = {
  title: 'Log In - Golden Crumb',
  description: 'Access your Golden Crumb profile or baking staff dashboard.',
};

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#F0E0D0] dark:bg-[#482612] py-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="w-full max-w-md">
        <Suspense fallback={
          <div className="bg-[#FFF7EC] dark:bg-[#5A3019] p-8 rounded-2xl border border-primary/10 shadow-lg text-center font-serif text-lg">
            Loading portal...
          </div>
        }>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
