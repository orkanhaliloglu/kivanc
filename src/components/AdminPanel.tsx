import React, { useState, useEffect } from 'react';
import { Profile, WorkoutPlanMap, WorkoutPlan } from '../types';
import { getSupabase } from '../config';
import { STORE_KEY } from '../constants';

interface AdminPanelProps {
  profiles: Profile[];
  selectedUserId: string;
  plans: WorkoutPlanMap;
  onClose: () => void;
  onSelectUser: (userId: string) => void;
  onRefreshProfiles: () => Promise<void>;
  onSaveAdminPlan: (userId: string, weekday: number, plan: WorkoutPlan) => Promise<boolean>;
  onNotice: (msg: string) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  profiles,
  selectedUserId,
  plans,
  onClose,
  onSelectUser,
  onRefreshProfiles,
  onSaveAdminPlan,
  onNotice,
}) => {
  const [adminStatus, setAdminStatus] = useState('');

  // Create User State
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [creatingUser, setCreatingUser] = useState(false);

  // Reset Password State
  const [resetTargetUser, setResetTargetUser] = useState(selectedUserId);
  const [resetPassword, setResetPassword] = useState('');
  const [resetConfirm, setResetConfirm] = useState('');
  const [resetStatus, setResetStatus] = useState('');
  const [resetKind, setResetKind] = useState<'error' | 'success' | ''>('');
  const [resetting, setResetting] = useState(false);

  // Plan Editor State
  const [planDay, setPlanDay] = useState(1);
  const [planLabel, setPlanLabel] = useState('');
  const [planItemsJson, setPlanItemsJson] = useState('[]');

  const athletes = profiles.filter((p) => p.role !== 'admin');

  useEffect(() => {
    if (selectedUserId) {
      setResetTargetUser(selectedUserId);
    } else if (athletes.length > 0) {
      setResetTargetUser(athletes[0].id);
    }
  }, [selectedUserId, athletes]);

  useEffect(() => {
    const p = plans[planDay] || { label: '', items: [] };
    setPlanLabel(p.label || '');
    setPlanItemsJson(JSON.stringify(p.items || [], null, 2));
  }, [planDay, plans]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminStatus('Kullanıcı oluşturuluyor…');
    setCreatingUser(true);

    const client = getSupabase();
    if (!client) {
      setAdminStatus('Demo modunda yeni kullanıcı oluşturuldu.');
      setCreatingUser(false);
      return;
    }

    try {
      const body = {
        full_name: newUserName.trim(),
        email: newUserEmail.trim(),
        password: newUserPassword,
      };

      const { data, error } = await client.functions.invoke('admin-create-user', { body });
      if (error) {
        let detail = error.message;
        try {
          const res = error.context;
          if (res && typeof res.clone === 'function') {
            const payload = await res.clone().json();
            if (payload?.error) detail = payload.error;
            else if (payload?.message) detail = payload.message;
          }
        } catch {
          // ignore
        }
        setAdminStatus(`Kullanıcı oluşturulamadı: ${detail}`);
        return;
      }

      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      setAdminStatus(`${data?.full_name || data?.email || 'Kullanıcı'} hesabı oluşturuldu.`);
      onNotice('Kullanıcı başarıyla oluşturuldu.');
      await onRefreshProfiles();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Bağlantı hatası';
      setAdminStatus(`Kullanıcı oluşturulamadı: ${msg}`);
    } finally {
      setCreatingUser(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTargetUser) {
      setResetStatus('Şifresi değiştirilecek hesabı seç.');
      setResetKind('error');
      return;
    }
    if (resetPassword !== resetConfirm) {
      setResetStatus('Yeni şifreler aynı değil.');
      setResetKind('error');
      return;
    }
    if (resetPassword.length < 8) {
      setResetStatus('Şifre en az 8 karakter olmalıdır.');
      setResetKind('error');
      return;
    }

    setResetting(true);
    const target = profiles.find((p) => p.id === resetTargetUser);
    setResetStatus(`${target?.email || 'Seçilen hesap'} için şifre güncelleme isteği gönderildi…`);
    setResetKind('');

    const client = getSupabase();
    if (!client) {
      setResetStatus(`Demo modunda şifre güncellendi: ${target?.email || 'seçilen hesap'}.`);
      setResetKind('success');
      setResetting(false);
      return;
    }

    try {
      const { data, error } = await client.functions.invoke('admin-create-user', {
        body: {
          action: 'reset-password',
          user_id: resetTargetUser,
          password: resetPassword,
        },
      });

      if (error) {
        let detail = error.message;
        try {
          const res = error.context;
          if (res && typeof res.clone === 'function') {
            const payload = await res.clone().json();
            if (payload?.error) detail = payload.error;
            else if (payload?.message) detail = payload.message;
          }
        } catch {
          // ignore
        }
        setResetStatus(`Güncelleme başarısız: ${detail}`);
        setResetKind('error');
        return;
      }

      if (data?.success !== true) {
        setResetStatus('Sunucudan doğrulanmış başarı yanıtı alınamadı.');
        setResetKind('error');
        return;
      }

      setResetPassword('');
      setResetConfirm('');
      setResetStatus(`Şifre güncellendi: ${target?.email || 'seçilen hesap'}. Bu e-posta ve yeni şifreyle giriş yapılabilir.`);
      setResetKind('success');
      onNotice('Sporcu şifresi güncellendi.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Bağlantı hatası';
      setResetStatus(`İstek tamamlanamadı: ${msg}`);
      setResetKind('error');
    } finally {
      setResetting(false);
    }
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTargetUser) {
      setAdminStatus('Önce kullanıcı seç.');
      return;
    }

    let parsedItems: [string, string][];
    try {
      parsedItems = JSON.parse(planItemsJson);
      if (!Array.isArray(parsedItems) || parsedItems.some((x) => !Array.isArray(x) || x.length !== 2)) {
        throw new Error('Hareketler [["id","ad"]] biçiminde olmalı.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'JSON format hatası';
      setAdminStatus(`JSON geçersiz: ${msg}`);
      return;
    }

    const planType: 'upper' | 'legs' | 'mobility' =
      planDay === 1 || planDay === 4 ? 'upper' : planDay === 2 || planDay === 5 || planDay === 6 ? 'legs' : 'mobility';

    const success = await onSaveAdminPlan(resetTargetUser, planDay, {
      type: planType,
      label: planLabel.trim(),
      items: parsedItems,
    });

    if (success) {
      const target = profiles.find((p) => p.id === resetTargetUser);
      setAdminStatus(`Antrenman planı ${target?.full_name || target?.email || ''} için kaydedildi.`);
      onNotice('Plan kaydedildi.');
    } else {
      setAdminStatus('Plan kaydedilemedi.');
    }
  };

  const handleImportLegacy = async () => {
    if (!resetTargetUser) {
      setAdminStatus('Önce aktarılacak kullanıcıyı seç.');
      return;
    }
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) {
      setAdminStatus('Bu tarayıcıda aktarılacak eski kayıt bulunamadı.');
      return;
    }
    let old: Record<string, { done?: string[]; sleepGoal?: boolean; bed?: string; lessonTitle?: string; lesson?: string; note?: string }>;
    try {
      old = JSON.parse(raw);
    } catch {
      setAdminStatus('Eski kayıtlar okunamadı.');
      return;
    }

    const client = getSupabase();
    if (!client) {
      setAdminStatus('Demo modunda eski veriler aktarıldı.');
      return;
    }

    try {
      const { data: existing, error } = await client
        .from('daily_records')
        .select('record_date')
        .eq('user_id', resetTargetUser);

      if (error) {
        setAdminStatus(`Mevcut kayıtlar okunamadı: ${error.message}`);
        return;
      }

      const seen = new Set((existing || []).map((r) => r.record_date));
      const rows = Object.entries(old)
        .filter(([date]) => !seen.has(date))
        .map(([record_date, data]) => ({
          user_id: resetTargetUser,
          record_date,
          data: { ...data, done: Array.isArray(data.done) ? data.done : [] },
        }));

      if (!rows.length) {
        setAdminStatus('Aktarılacak yeni gün yok; mevcut kayıtlar korunuyor.');
        return;
      }

      const { error: saveError } = await client
        .from('daily_records')
        .upsert(rows, { onConflict: 'user_id,record_date' });

      if (saveError) {
        setAdminStatus(`Aktarım başarısız: ${saveError.message}`);
        return;
      }

      setAdminStatus(`${rows.length} günlük eski kayıt seçili hesaba aktarıldı.`);
      onNotice(`${rows.length} günlük kayıt aktarıldı.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Bilinmeyen hata';
      setAdminStatus(`Aktarım hatası: ${msg}`);
    }
  };

  return (
    <section className="card admin-panel" id="adminPanel">
      <div className="admin-head">
        <div>
          <div className="eyebrow">Yönetici alanı</div>
          <h2>Kullanıcılar ve içerikler</h2>
        </div>
        <button className="btn" onClick={onClose} id="closeAdmin" type="button">
          Takvime dön
        </button>
      </div>

      <div className="admin-grid">
        {/* Create User Form */}
        <form className="admin-box" onSubmit={handleCreateUser} id="createUserForm">
          <h3>Kullanıcı oluştur</h3>
          <label>
            Ad soyad
            <input
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              required
              maxLength={80}
              placeholder="Sporcu adı soyadı"
            />
          </label>
          <label>
            E-posta
            <input
              type="email"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              required
              placeholder="ornek@kulup.com"
            />
          </label>
          <label>
            Geçici şifre
            <input
              type="password"
              minLength={8}
              value={newUserPassword}
              onChange={(e) => setNewUserPassword(e.target.value)}
              required
              placeholder="En az 8 karakter"
            />
          </label>
          <button className="btn primary" type="submit" disabled={creatingUser}>
            {creatingUser ? 'Ekleniyor…' : 'Kullanıcı ekle'}
          </button>
          <small>Kullanıcı giriş yaptıktan sonra şifresini değiştirebilir.</small>
        </form>

        {/* User Management */}
        <div className="admin-box user-management">
          <h3>Kullanıcılar</h3>
          <div className="user-directory" id="userDirectory" aria-live="polite">
            {athletes.length === 0 ? (
              <p className="empty">Henüz sporcu hesabı bulunmuyor.</p>
            ) : (
              athletes.map((ath) => (
                <div className="user-directory-row" key={ath.id}>
                  <div>
                    <strong>{ath.full_name || 'İsimsiz kullanıcı'}</strong>
                    <small>{ath.email}</small>
                  </div>
                  <button
                    className="btn"
                    type="button"
                    onClick={() => {
                      setResetTargetUser(ath.id);
                      onSelectUser(ath.id);
                    }}
                  >
                    Kayıtları gör
                  </button>
                </div>
              ))
            )}
          </div>

          <label>
            Kayıtlarını görüntüle
            <select
              value={resetTargetUser}
              onChange={(e) => {
                setResetTargetUser(e.target.value);
                onSelectUser(e.target.value);
              }}
            >
              {athletes.length === 0 ? (
                <option value="">Henüz sporcu hesabı yok</option>
              ) : (
                athletes.map((ath) => (
                  <option value={ath.id} key={ath.id}>
                    {ath.full_name || ath.email} · {ath.email}
                  </option>
                ))
              )}
            </select>
          </label>

          <button
            className="btn"
            type="button"
            id="loadUser"
            onClick={() => onSelectUser(resetTargetUser)}
          >
            Seçili kullanıcının kayıtlarını aç
          </button>
          <button
            className="btn"
            type="button"
            id="importLegacy"
            onClick={handleImportLegacy}
          >
            Bu tarayıcıdaki eski kayıtları seçili hesaba aktar
          </button>
          <small>Eski cihaz verilerini bir kez taşıma içindir.</small>
        </div>

        {/* Reset Password Form */}
        <form className="admin-box" onSubmit={handleResetPassword} id="resetUserPasswordForm">
          <h3>Kullanıcı şifresini değiştir</h3>
          <label>
            Hesap
            <select
              value={resetTargetUser}
              onChange={(e) => setResetTargetUser(e.target.value)}
            >
              {athletes.length === 0 ? (
                <option value="">Henüz sporcu hesabı yok</option>
              ) : (
                athletes.map((ath) => (
                  <option value={ath.id} key={ath.id}>
                    {ath.full_name || ath.email} · {ath.email}
                  </option>
                ))
              )}
            </select>
          </label>
          <label>
            Yeni şifre
            <input
              type="password"
              minLength={8}
              autoComplete="new-password"
              required
              value={resetPassword}
              onChange={(e) => setResetPassword(e.target.value)}
            />
          </label>
          <label>
            Yeni şifre tekrar
            <input
              type="password"
              minLength={8}
              autoComplete="new-password"
              required
              value={resetConfirm}
              onChange={(e) => setResetConfirm(e.target.value)}
            />
          </label>
          <button className="btn primary" type="submit" disabled={resetting}>
            {resetting ? 'Güncelleniyor…' : 'Şifreyi güncelle'}
          </button>
          {resetStatus && (
            <p className={`admin-status reset-password-status ${resetKind}`} role="status">
              {resetStatus}
            </p>
          )}
          <small>
            Başarı mesajı göründüğünde yeni şifre hesaba uygulanmıştır. Kullanıcı bu e-posta ve yeni şifreyle giriş yapabilir.
          </small>
        </form>

        {/* Workout Plan Editor */}
        <form className="admin-box plan-editor" onSubmit={handleSavePlan} id="planForm">
          <h3>Antrenman içerikleri</h3>
          <label>
            Haftanın günü
            <select value={planDay} onChange={(e) => setPlanDay(Number(e.target.value))}>
              <option value="1">Pazartesi</option>
              <option value="2">Salı</option>
              <option value="3">Çarşamba</option>
              <option value="4">Perşembe</option>
              <option value="5">Cuma</option>
              <option value="6">Cumartesi</option>
              <option value="7">Pazar</option>
            </select>
          </label>
          <label>
            Plan başlığı
            <input
              value={planLabel}
              onChange={(e) => setPlanLabel(e.target.value)}
              required
            />
          </label>
          <label>
            Hareketler (JSON: [[&quot;id&quot;, &quot;ad&quot;]])
            <textarea
              rows={7}
              value={planItemsJson}
              onChange={(e) => setPlanItemsJson(e.target.value)}
              required
            />
          </label>
          <button className="btn primary" type="submit">
            Planı kaydet
          </button>
        </form>
      </div>

      {adminStatus && (
        <p className="admin-status" id="adminStatus" role="status">
          {adminStatus}
        </p>
      )}
    </section>
  );
};
