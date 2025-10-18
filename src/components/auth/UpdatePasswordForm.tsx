import { useState } from 'react';

export function UpdatePasswordForm() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
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

    if (password.length < 6) {
      setError('Hasło musi mieć co najmniej 6 znaków');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/update-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password, confirmPassword }),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error?.message || 'Wystąpił błąd podczas zmiany hasła');
        setLoading(false);
        return;
      }

      setSuccess(true);

      // Redirect to dashboard after 1.5 seconds
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1500);
    } catch {
      setError('Wystąpił błąd podczas zmiany hasła');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="p-6 bg-green-50 border border-green-200 rounded-lg text-center">
        <h3 className="text-lg font-semibold text-green-900 mb-2">Hasło zostało zmienione!</h3>
        <p className="text-green-700">Przekierowujemy Cię do aplikacji...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>}

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-2">
          Nowe hasło
        </label>
        <input
          id="password"
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
          Potwierdź nowe hasło
        </label>
        <input
          id="confirmPassword"
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
        {loading ? 'Zmiana hasła...' : 'Zmień hasło'}
      </button>
    </form>
  );
}
