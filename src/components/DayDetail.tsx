import React from 'react';
import { WorkoutPlanMap, DailyRecordData } from '../types';
import { dayNames, monthNames, planned } from '../constants';

interface DayDetailProps {
  selectedDate: string;
  plans: WorkoutPlanMap;
  record: DailyRecordData;
  avatarUrl: string | null;
  saveState: string;
  onUpdateRecord: (updated: Partial<DailyRecordData>) => void;
  onToggleExercise: (id: string, checked: boolean) => void;
}

export const DayDetail: React.FC<DayDetailProps> = ({
  selectedDate,
  plans,
  record,
  avatarUrl,
  saveState,
  onUpdateRecord,
  onToggleExercise,
}) => {
  const date = new Date(selectedDate + 'T12:00:00');
  const dayName = dayNames[date.getDay()];
  const monthName = monthNames[date.getMonth()];
  const selectedLabel = `${dayName}, ${date.getDate()} ${monthName}`;

  const currentPlan = planned(selectedDate, plans);
  const planLabel = currentPlan ? currentPlan.label : 'Dinlenme günü';
  const planTypeClass = currentPlan ? currentPlan.type : 'rest';

  const sleepResult = record.bed
    ? record.bed <= '21:30'
      ? 'Hedef saatinde veya önce'
      : 'Hedeften sonra'
    : 'Yatış saatini kaydet';

  const completedCount = currentPlan
    ? record.done.filter((id) => currentPlan.items.some((i) => i[0] === id)).length
    : 0;

  const exerciseCountLabel = currentPlan
    ? `${completedCount}/${currentPlan.items.length} tamam`
    : 'Planlı egzersiz yok';

  const getSubheaderTitle = (type: string) => {
    if (type === 'upper') return 'GÜÇ VE CORE';
    if (type === 'legs') return 'ALT VÜCUT';
    return 'MOBİLİTE';
  };

  return (
    <section className="card detail">
      <div className="detail-head">
        <div>
          <div className="eyebrow">Günlük kayıt</div>
          <div className="selected-day-title">
            {avatarUrl && (
              <img
                id="profileAvatar"
                src={avatarUrl}
                alt="Sporcu profil fotoğrafı"
              />
            )}
            <h2 id="selectedLabel">{selectedLabel}</h2>
          </div>
        </div>
        <span className={`plan-pill ${planTypeClass}`}>{planLabel}</span>
      </div>

      {/* Sleep Block */}
      <div className="block">
        <div className="block-title">
          🌙 Uyku <small>Hedef: 21:30'da yatakta</small>
        </div>
        <div className="time-row">
          <input
            type="time"
            id="bedTime"
            aria-label="Yatağa giriş saati"
            value={record.bed}
            onChange={(e) => onUpdateRecord({ bed: e.target.value })}
          />
          <span className="sleep-result">{sleepResult}</span>
        </div>
        <label className="target-check" style={{ marginTop: '10px' }}>
          <input
            type="checkbox"
            id="sleepGoal"
            checked={record.sleepGoal}
            onChange={(e) => onUpdateRecord({ sleepGoal: e.target.checked })}
          />
          <span>21:30 hedefinde yatağa girdim</span>
        </label>
      </div>

      {/* Workout Block */}
      <div className="block">
        <div className="block-title">
          💪 Bugünkü antrenman <small>{exerciseCountLabel}</small>
        </div>
        <div id="exerciseList">
          {!currentPlan || currentPlan.items.length === 0 ? (
            <div className="empty">
              Bugün dinlenme günü. İstersen hafif yürüyüş veya esneme notu ekleyebilirsin.
            </div>
          ) : (
            currentPlan.items.map(([id, label], index) => {
              const isChecked = record.done.includes(id);
              return (
                <React.Fragment key={id}>
                  {index === 1 && (
                    <div
                      className="check-row"
                      style={{
                        color: '#a9c0d5',
                        fontSize: '10px',
                        fontWeight: 800,
                        paddingTop: '11px',
                        cursor: 'default',
                      }}
                    >
                      {getSubheaderTitle(currentPlan.type)}
                    </div>
                  )}
                  <label className={`check-row ${isChecked ? 'completed' : ''}`}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => onToggleExercise(id, e.target.checked)}
                    />
                    <span>{label}</span>
                  </label>
                </React.Fragment>
              );
            })
          )}
        </div>
      </div>

      {/* Lesson Block */}
      <div className="block">
        <div className="block-title">📚 Ders</div>
        <label style={{ display: 'grid', gap: '4px', fontSize: '11px', color: 'var(--muted)', fontWeight: 700 }}>
          Ders başlığı
          <input
            type="text"
            className="lesson-input"
            id="lessonTitle"
            maxLength={120}
            placeholder="Örn. Matematik"
            value={record.lessonTitle}
            onChange={(e) => onUpdateRecord({ lessonTitle: e.target.value })}
          />
        </label>
        <label style={{ display: 'grid', gap: '4px', marginTop: '10px', fontSize: '11px', color: 'var(--muted)', fontWeight: 700 }}>
          Ders notu
          <textarea
            className="note"
            id="lessonText"
            rows={4}
            placeholder="Bugün derste çalıştıklarını veya notlarını yaz..."
            value={record.lesson}
            onChange={(e) => onUpdateRecord({ lesson: e.target.value })}
          />
        </label>
      </div>

      {/* Note Block */}
      <div className="block">
        <div className="block-title">
          📝 Kısa not <small>İsteğe bağlı</small>
        </div>
        <textarea
          className="note"
          id="dayNote"
          placeholder="Enerji, uyku kalitesi veya antrenman notu..."
          value={record.note}
          onChange={(e) => onUpdateRecord({ note: e.target.value })}
        />
      </div>

      {/* Footer */}
      <div className="detail-foot">
        <span>Değişiklikler otomatik kaydedilir</span>
        <span>{saveState}</span>
      </div>
    </section>
  );
};
