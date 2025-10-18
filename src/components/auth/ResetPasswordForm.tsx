import { useState } from 'react';

export function ResetPasswordForm() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error?.message || 'Wystąpił błąd podczas wysyłania linku');
        setLoading(false);
        return;
      }

      setSuccess(true);
    } catch {
      setError('Wystąpił błąd podczas wysyłania linku');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
        <h3 className="text-lg font-semibold text-green-900 mb-2">Sprawdź swoją skrzynkę email</h3>
        <p className="text-green-700 mb-4">
          Jeśli konto z adresem <strong>{email}</strong> istnieje, wysłaliśmy link do resetowania hasła.
        </p>
        <p className="text-sm text-green-600">
          Link będzie ważny przez 1 godzinę. Jeśli nie widzisz wiadomości, sprawdź folder spam.
        </p>
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
        <p className="mt-1 text-xs text-neutral-500">Wyślemy link do resetowania hasła na ten adres email</p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Wysyłanie...' : 'Wyślij link resetujący'}
      </button>
    </form>
  );
}
