import { useState } from 'react';

export function LogoutButton() {
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (response.ok) {
        window.location.href = '/login';
      }
    } catch (err) {
      console.error('Logout error:', err);
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="px-4 py-2 text-neutral-700 hover:text-red-600 transition-colors disabled:opacity-50"
    >
      {loading ? 'Wylogowywanie...' : 'Wyloguj się'}
    </button>
  );
}
