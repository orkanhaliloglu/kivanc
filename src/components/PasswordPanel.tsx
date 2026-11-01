import React, { useState } from 'react';
import { getSupabase } from '../config';

interface PasswordPanelProps {
  onClose: () => void;
  onNotice: (msg: string) => void;
}

export const PasswordPanel: React.FC<PasswordPanelProps> = ({ onClose, onNotice }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setStatus('Şifreler aynı değil.');
      return;
    }
    if (newPassword.length < 8) {
      setStatus('Şifre en az 8 karakter olmalıdır.');
      return;
    }

    setLoading(true);
    setStatus('Şifre güncelleniyor…');

    const client = getSupabase();
    if (!client) {
      // In demo mode or offline
      setStatus('Demo modu: Şifreniz yerel olarak güncellendi.');
      setLoading(false);
      onNotice('Şifreniz güncellendi.');
      return;
    }

    try {
      const { error } = await client.auth.updateUser({ password: newPassword });
      if (error) {
        setStatus(`Şifre güncellenemedi: ${error.message}`);
      } else {
        setStatus('Şifren güncellendi.');
        setNewPassword('');
        setConfirmPassword('');
        onNotice('Şifreniz başarıyla güncellendi.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Bilinmeyen hata';
      setStatus(`Hata: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card password-panel" id="passwordPanel">
      <form onSubmit={handleSubmit}>
        <h3>Şifre değiştir</h3>
        <label>
          Yeni şifre
          <input
            type="password"
            minLength={8}
            autoComplete="new-password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="En az 8 karakter"
          />
        </label>
        <label>
          Yeni şifre tekrar
          <input
            type="password"
            minLength={8}
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="En az 8 karakter"
          />
        </label>
        <button className="btn primary" type="submit" disabled={loading}>
          Şifreyi güncelle
        </button>
        <button className="btn" type="button" onClick={onClose}>
          Kapat
        </button>
        {status && <span role="status">{status}</span>}
      </form>
    </section>
  );
};
