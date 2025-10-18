interface ResultActionsProps {
  onAcceptAndStart: () => void;
  onSaveForLater: () => void;
  onSkip: () => void;
  onRegenerateWithSameParams: () => void;
  isSubmitting: boolean;
}

export function ResultActions({
  onAcceptAndStart,
  onSaveForLater,
  onSkip,
  onRegenerateWithSameParams,
  isSubmitting,
}: ResultActionsProps) {
  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      {/* Primary Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onAcceptAndStart}
          disabled={isSubmitting}
          className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          <span>✓</span>
          <span>Akceptuję i zaczynam</span>
        </button>
        <button
          onClick={onSaveForLater}
          disabled={isSubmitting}
          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          <span>💾</span>
          <span>Zapisz na później</span>
        </button>
      </div>

      {/* Secondary Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onSkip}
          disabled={isSubmitting}
          className="flex-1 px-4 py-2 bg-neutral-100 text-neutral-900 rounded-lg font-medium hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          <span>⏭️</span>
          <span>Pomiń</span>
        </button>
        <button
          onClick={onRegenerateWithSameParams}
          disabled={isSubmitting}
          className="flex-1 px-4 py-2 bg-neutral-100 text-neutral-900 rounded-lg font-medium hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          <span>🔄</span>
          <span>Wygeneruj ponownie</span>
        </button>
      </div>
    </div>
  );
}
