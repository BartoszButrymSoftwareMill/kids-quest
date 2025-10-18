import { useEffect, useState } from 'react';
import type { ApiError } from '../../types';
import { isRateLimitError } from '../../lib/view-models/generator.types';

interface ErrorStateProps {
  error: ApiError;
  onRetry: () => void;
  onBackToForm: () => void;
  canRetry: boolean;
}

export function ErrorState({ error, onRetry, onBackToForm, canRetry }: ErrorStateProps) {
  const [countdown, setCountdown] = useState<number | null>(isRateLimitError(error) ? error.retry_after || 60 : null);

  useEffect(() => {
    if (countdown === null || countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => (prev && prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  const canRetryNow = canRetry && (countdown === null || countdown <= 0);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-6 max-w-md mx-auto px-4">
      {/* Error Alert */}
      <div className="w-full rounded-lg border border-red-200 bg-red-50 p-6">
        <div className="flex items-start gap-3">
          <svg
            className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-red-900 mb-1">
              {isRateLimitError(error) ? 'Zbyt wiele prób' : 'Błąd generacji'}
            </h3>
            <p className="text-sm text-red-800">{error.message}</p>
            {countdown !== null && countdown > 0 && (
              <p className="text-sm text-red-700 mt-2">Spróbuj za {countdown} sekund</p>
            )}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3 w-full">
        <button
          onClick={onRetry}
          disabled={!canRetryNow}
          className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {canRetryNow ? 'Spróbuj ponownie' : `Poczekaj (${countdown}s)`}
        </button>
        <button
          onClick={onBackToForm}
          className="flex-1 px-4 py-2 bg-neutral-100 text-neutral-900 rounded-md font-medium hover:bg-neutral-200 transition-colors"
        >
          Powrót do formularza
        </button>
      </div>
    </div>
  );
}
