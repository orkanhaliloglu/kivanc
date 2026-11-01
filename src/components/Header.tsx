import React from 'react';
import { Profile } from '../types';

interface HeaderProps {
  profile: Profile;
  isAdmin: boolean;
  onToggleSelfPlan: () => void;
  onToggleAdmin: () => void;
  onTogglePassword: () => void;
  onShare: () => void;
  onGoToday: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  profile,
  isAdmin,
  onToggleSelfPlan,
  onToggleAdmin,
  onTogglePassword,
  onShare,
  onGoToday,
  onLogout,
}) => {
  const displayName = profile.full_name || profile.email;

  return (
    <header className="top">
      <div className="brand">
        <div className="logo">✦</div>
        <div>
          <h1>Ritim</h1>
          <p id="signedInLabel">{displayName} · UYKU & ANTRENMAN TAKVİMİ</p>
        </div>
      </div>
      <div className="top-actions">
        <button className="btn" onClick={onToggleSelfPlan} id="editMyPlan">
          💪 Programımı düzenle
        </button>

        {isAdmin && (
          <button className="btn" onClick={onToggleAdmin} id="adminToggle">
            ⚙ Yönetim paneli
          </button>
        )}

        <button className="btn" onClick={onTogglePassword} id="passwordToggle">
          Şifre değiştir
        </button>

        <button className="btn" onClick={onShare} id="shareTop">
          ↗ Antrenörle paylaş
        </button>

        <button
          className="btn btn-icon"
          onClick={onGoToday}
          id="todayBtn"
          title="Bugüne git"
          aria-label="Bugüne git"
        >
          ⌖
        </button>

        <button className="btn" onClick={onLogout} id="logoutBtn">
          Çıkış
        </button>
      </div>
    </header>
  );
};
