import { useState } from 'react';

interface RegisterFormProps {
  redirectTo?: string;
}

export function RegisterForm({ redirectTo = '/dashboard' }: RegisterFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (password !== confirmPassword) {
      setError('Hasła nie są identyczne');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, confirmPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error?.message || 'Wystąpił błąd podczas rejestracji');
        setLoading(false);
        return;
      }

      setSuccess(true);

      if (data.needsEmailConfirmation) {
        setNeedsConfirmation(true);
      } else {
        // Redirect on success if no email confirmation needed
        setTimeout(() => {
          window.location.href = redirectTo;
        }, 1500);
      }
    } catch {
      setError('Wystąpił błąd podczas rejestracji');
      setLoading(false);
    }
  };

  if (success && needsConfirmation) {
    return (
      <div className="p-6 bg-green-50 border border-green-200 rounded-lg" data-testid="email-confirmation-message">
        <h3 className="text-lg font-semibold text-green-900 mb-2">Sprawdź swoją skrzynkę email</h3>
        <p className="text-green-700">
          Wysłaliśmy link aktywacyjny na adres <strong>{email}</strong>. Kliknij w link, aby aktywować konto.
        </p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="p-6 bg-green-50 border border-green-200 rounded-lg text-center" data-testid="success-message">
        <h3 className="text-lg font-semibold text-green-900 mb-2">Konto utworzone!</h3>
        <p className="text-green-700">Przekierowujemy Cię do aplikacji...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div
          className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm"
          data-testid="error-message"
        >
          {error}
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-2">
          Adres email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="twoj@email.pl"
          disabled={loading}
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-2">
          Hasło
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="••••••••"
          disabled={loading}
        />
        <p className="mt-1 text-xs text-neutral-500">Minimum 6 znaków</p>
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-700 mb-2">
          Potwierdź hasło
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          minLength={6}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="••••••••"
          disabled={loading}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Tworzenie konta...' : 'Utwórz konto'}
      </button>
    </form>
  );
}
