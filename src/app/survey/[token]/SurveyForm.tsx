'use client';

import { useState } from 'react';
import { Loader2, Star } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { submitSurveyAction } from '@/app/actions/surveyActions';

interface SurveyFormProps {
  token: string;
}

const RATING_LABELS: Record<number, string> = {
  1: 'Not great',
  2: 'Could be better',
  3: 'Good',
  4: 'Really good',
  5: 'Loved it!',
};

export function SurveyForm({ token }: SurveyFormProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (rating === 0) {
      setError('Please select a rating.');
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const res = await submitSurveyAction(token, rating, feedback);
      if (res.success) {
        setSubmitted(true);
      } else {
        setError(res.error || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card className="mt-8">
        <CardContent className="p-8 text-center">
          <h2 className="font-serif text-xl font-bold text-foreground">
            Thank You!
          </h2>
          <p className="mt-2 text-secondary-foreground">
            We appreciate you sharing your feedback with us.
          </p>
        </CardContent>
      </Card>
    );
  }

  const displayRating = hoverRating || rating;

  return (
    <Card className="mt-8">
      <CardContent className="p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2">
            <Label className="text-sm font-medium text-foreground">
              Rate your experience
            </Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  onMouseEnter={() => setHoverRating(value)}
                  onMouseLeave={() => setHoverRating(0)}
                  aria-label={`Rate ${value} out of 5`}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={cn(
                      'size-8',
                      value <= displayRating
                        ? 'fill-primary text-primary'
                        : 'fill-none text-muted-foreground/40'
                    )}
                  />
                </button>
              ))}
            </div>
            {displayRating > 0 && (
              <p className="text-sm font-medium text-primary">
                {RATING_LABELS[displayRating]}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="survey-feedback">
              Anything you&rsquo;d like to share?{' '}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Textarea
              id="survey-feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="What did you like? What could we improve?"
              rows={4}
            />
          </div>

          {error && (
            <p className="text-sm font-medium text-destructive">{error}</p>
          )}

          <Button type="submit" size="lg" disabled={submitting}>
            {submitting && <Loader2 className="size-4 animate-spin" />}
            {submitting ? 'Submitting...' : 'Submit Feedback'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
