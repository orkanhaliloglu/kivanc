import React, { useState, useEffect } from 'react';
import { WorkoutPlanMap, WorkoutPlan } from '../types';

interface SelfPlanPanelProps {
  plans: WorkoutPlanMap;
  onClose: () => void;
  onSavePlan: (weekday: number, plan: WorkoutPlan) => Promise<boolean>;
  onClearPlan: (weekday: number) => Promise<boolean>;
}

export const SelfPlanPanel: React.FC<SelfPlanPanelProps> = ({
  plans,
  onClose,
  onSavePlan,
  onClearPlan,
}) => {
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [label, setLabel] = useState<string>('');
  const [planType, setPlanType] = useState<'upper' | 'legs' | 'mobility'>('upper');
  const [items, setItems] = useState<[string, string][]>([]);
  const [status, setStatus] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    const current = plans[selectedDay] || { type: 'upper', label: '', items: [] };
    setLabel(current.label || '');
    setPlanType(current.type || 'upper');
    setItems(current.items ? [...current.items] : []);
    setStatus('');
  }, [selectedDay, plans]);

  const handleAddExercise = () => {
    const newId = `move-${crypto.randomUUID()}`;
    setItems((prev) => [...prev, [newId, '']]);
  };

  const handleUpdateItem = (index: number, newName: string) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = [copy[index][0], newName];
      return copy;
    });
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanItems = items.filter((x) => x[1].trim().length > 0);
    if (!cleanItems.length) {
      setStatus('Hareket kalmadı. Günü dinlenme yapmak için ilgili düğmeyi kullan.');
      return;
    }
    if (!label.trim()) {
      setStatus('Program başlığı gerekli.');
      return;
    }

    setSaving(true);
    setStatus('Kaydediliyor…');
    const success = await onSavePlan(selectedDay, {
      type: planType,
      label: label.trim(),
      items: cleanItems,
    });
    setSaving(false);
    if (success) {
      setStatus('Programın kaydedildi.');
    } else {
      setStatus('Kaydedilemedi. Lütfen tekrar deneyin.');
    }
  };

  const handleClear = async () => {
    setSaving(true);
    setStatus('Günü dinlenme olarak kaydediliyor…');
    const success = await onClearPlan(selectedDay);
    setSaving(false);
    if (success) {
      setLabel('Dinlenme günü');
      setItems([]);
      setStatus('Gün dinlenme olarak kaydedildi.');
    } else {
      setStatus('Gün planı değiştirilemedi.');
    }
  };

  return (
    <section className="card admin-panel self-plan-panel" id="selfPlanPanel">
      <div className="admin-head">
        <div>
          <div className="eyebrow">Kişisel program</div>
          <h2>Haftalık antrenmanını düzenle</h2>
        </div>
        <button className="btn" onClick={onClose} type="button">
          Kapat
        </button>
      </div>

      <form className="self-plan-form" onSubmit={handleSubmit}>
        <label>
          Haftanın günü
          <select
            value={selectedDay}
            onChange={(e) => setSelectedDay(Number(e.target.value))}
          >
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
          Program başlığı
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            maxLength={100}
            required
            placeholder="Örn. Üst vücut + core"
          />
        </label>

        <label>
          Program türü
          <select
            value={planType}
            onChange={(e) => setPlanType(e.target.value as 'upper' | 'legs' | 'mobility')}
          >
            <option value="upper">Üst vücut</option>
            <option value="legs">Alt vücut</option>
            <option value="mobility">Mobilite</option>
          </select>
        </label>

        <div className="self-exercise-editor">
          <div className="block-title">
            Hareketler <small>İsimleri düzenle, ekle veya kaldır</small>
          </div>
          <button
            className="btn primary add-exercise-btn"
            type="button"
            onClick={handleAddExercise}
          >
            ＋ Hareket ekle
          </button>
          <div id="selfExerciseRows">
            {items.map(([id, itemName], idx) => (
              <div className="self-exercise-row" key={id}>
                <input
                  className="self-exercise-name"
                  value={itemName}
                  onChange={(e) => handleUpdateItem(idx, e.target.value)}
                  maxLength={120}
                  aria-label="Hareket adı"
                  placeholder="Hareketin adını yazın..."
                />
                <button
                  className="btn remove-exercise"
                  type="button"
                  onClick={() => handleRemoveItem(idx)}
                >
                  Kaldır
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="self-plan-actions">
          <button className="btn primary" type="submit" disabled={saving}>
            Programı kaydet
          </button>
          <button
            className="btn"
            type="button"
            onClick={handleClear}
            disabled={saving}
          >
            Bu günü dinlenme yap
          </button>
        </div>
      </form>

      {status && (
        <p className="admin-status" role="status">
          {status}
        </p>
      )}
    </section>
  );
};
