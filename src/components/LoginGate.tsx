import React, { useState } from 'react';
import { getSupabaseConfig, getSupabase } from '../config';
import { Profile } from '../types';

interface LoginGateProps {
  onSuccess: (profile: Profile, sessionToken?: string) => void;
  onDemoAthleteLogin: () => void;
  onDemoAdminLogin: () => void;
}

export const LoginGate: React.FC<LoginGateProps> = ({
  onSuccess,
  onDemoAthleteLogin,
  onDemoAdminLogin,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { isReady } = getSupabaseConfig();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!isReady) {
      setErrorMsg('Supabase bilgileri eksik. Demo moduyla devam edebilirsiniz.');
      return;
    }

    const client = getSupabase();
    if (!client) {
      setErrorMsg('Supabase bağlantısı kurulamadı.');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await client.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error || !data.session) {
        setErrorMsg('Giriş yapılamadı. E-posta ve şifreni kontrol et.');
        setLoading(false);
        return;
      }

      // Fetch user profile
      const { data: profileData, error: profileErr } = await client
        .from('profiles')
        .select('id,email,full_name,role')
        .eq('id', data.session.user.id)
        .single();

      if (profileErr || !profileData) {
        // Fallback or create temporary athlete profile
        const fallbackProfile: Profile = {
          id: data.session.user.id,
          email: data.session.user.email || email,
          full_name: (data.session.user.user_metadata?.full_name as string) || email.split('@')[0],
          role: 'athlete',
        };
        onSuccess(fallbackProfile, data.session.access_token);
      } else {
        onSuccess(profileData as Profile, data.session.access_token);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Bağlantı hatası oluştu.';
      setErrorMsg(`Giriş başarısız: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="login-gate">
      <form className="card login-card" onSubmit={handleLogin}>
        <div className="brand">
          <div className="logo">✦</div>
          <div>
            <h1>Ritim</h1>
            <p>UYKU & ANTRENMAN TAKİBİ</p>
          </div>
        </div>

        <h2>Hesabına giriş yap</h2>

        <label>
          E-posta
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            placeholder="ornek@email.com"
            required
            disabled={loading}
          />
        </label>

        <label>
          Şifre
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            placeholder="••••••••"
            required
            disabled={loading}
          />
        </label>

        <button className="btn primary" type="submit" disabled={loading}>
          {loading ? 'Giriş yapılıyor…' : 'Giriş yap'}
        </button>

        {errorMsg && (
          <p className="login-error" role="status">
            {errorMsg}
          </p>
        )}

        <small>Hesapları yönetici oluşturur.</small>

        {/* Quick Demo Access for Testing / Offline Evaluation */}
        <div style={{ marginTop: '12px', borderTop: '1px solid var(--line)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600 }}>
            Hızlı Deneme / Test Girişi:
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="btn"
              style={{ flex: 1, fontSize: '11px', padding: '8px 10px' }}
              onClick={onDemoAthleteLogin}
            >
              🏃 Sporcu (Kıvanç)
            </button>
            <button
              type="button"
              className="btn"
              style={{ flex: 1, fontSize: '11px', padding: '8px 10px' }}
              onClick={onDemoAdminLogin}
            >
              ⚙ Yönetici
            </button>
          </div>
        </div>
      </form>
    </section>
  );
};
