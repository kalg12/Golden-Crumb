import type { Metadata } from 'next';
import Link from 'next/link';

import { Container } from '@/components/shared/Container';
import { Button } from '@/components/ui/button';
import { getSurveyByToken } from '@/app/actions/surveyActions';
import { SurveyForm } from './SurveyForm';

export const metadata: Metadata = {
  title: 'Share Your Feedback',
  robots: { index: false },
};

export default async function SurveyPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const result = await getSurveyByToken(token);

  if (!result.success || !result.survey) {
    return (
      <main className="flex flex-1 items-center justify-center py-20">
        <Container>
          <div className="mx-auto max-w-md text-center">
            <h1 className="font-serif text-2xl font-bold text-foreground">
              Survey Not Found
            </h1>
            <p className="mt-3 text-secondary-foreground">
              This feedback link is invalid or has expired.
            </p>
            <div className="mt-8">
              <Button asChild>
                <Link href="/">Back to Home</Link>
              </Button>
            </div>
          </div>
        </Container>
      </main>
    );
  }

  if (result.survey.respondedAt) {
    return (
      <main className="flex flex-1 items-center justify-center py-20">
        <Container>
          <div className="mx-auto max-w-md text-center">
            <h1 className="font-serif text-2xl font-bold text-foreground">
              Thanks Again, {result.survey.customerName}!
            </h1>
            <p className="mt-3 text-secondary-foreground">
              We already received your feedback for this order. We really
              appreciate you taking the time.
            </p>
            <div className="mt-8">
              <Button asChild>
                <Link href="/">Back to Home</Link>
              </Button>
            </div>
          </div>
        </Container>
      </main>
    );
  }

  return (
    <main className="flex-1 py-14 sm:py-20">
      <Container>
        <div className="mx-auto max-w-lg">
          <div className="text-center">
            <h1 className="font-serif text-2xl font-bold text-foreground sm:text-3xl">
              How Was Your Order, {result.survey.customerName}?
            </h1>
            <p className="mt-3 text-secondary-foreground">
              Your feedback helps us keep every batch golden. It only takes a
              minute.
            </p>
          </div>
          <SurveyForm token={token} />
        </div>
      </Container>
    </main>
  );
}
