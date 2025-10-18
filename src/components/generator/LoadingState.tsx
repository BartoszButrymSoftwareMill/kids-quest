interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = 'Generuję quest...' }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 border-4 border-neutral-200 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-t-primary border-transparent rounded-full animate-spin"></div>
      </div>
      <p className="text-lg text-neutral-700 font-medium">{message}</p>
    </div>
  );
}
