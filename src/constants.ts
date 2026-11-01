import { WorkoutPlanMap, DailyRecordData } from './types';

export const STORE_KEY = 'ritim-tracker-v1';

export const dayNames = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

export const monthNames = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

export const defaultPlans: WorkoutPlanMap = {
  1: {
    type: 'upper',
    label: 'Üst vücut + core',
    items: [
      ['rope', '90 sn ip atlama'],
      ['quick', 'Cabukluluk ve sıçrama'],
      ['wide', 'Geniş kol şınav (10X2)'],
      ['narrow', 'Dar kol şınav (8X2)'],
      ['triceps', 'Arka kol (10X2)'],
      ['pullup', 'Barfiks (3X2)'],
      ['upper', 'Üst karın (25 sn)'],
      ['side', 'Yan karın (25 sn)'],
      ['lower', 'Alt karın (25 sn)'],
      ['plank1', 'Plank 1 (20 sn)'],
      ['plank2', 'Plank 2 (20 sn)'],
      ['plank3', 'Plank 3 (20 sn)'],
      ['mobility', 'Flaxbility ve mobilitiy'],
    ],
  },
  2: {
    type: 'legs',
    label: 'Denge + alt vücut',
    items: [
      ['rope', '90 sn ip atlama'],
      ['balance', 'Denge ve koordinasyon'],
      ['hip', 'Kalça (10X2)'],
      ['quad', 'On bacak [quadriceps] (10X2)'],
      ['ham', 'Arka bacak [hamstring] (10X2)'],
      ['calf', 'Calf (10X2)'],
      ['plank1', 'Plank 1 (20 sn)'],
      ['plank2', 'Plank 2 (20 sn)'],
      ['plank3', 'Plank 3 (20 sn)'],
      ['mobility', 'Flaxbility ve mobilitiy'],
    ],
  },
  3: {
    type: 'mobility',
    label: 'Esneklik + mobilite',
    items: [['mobility', 'Flaxbility ve mobilitiy']],
  },
  4: {
    type: 'upper',
    label: 'Üst vücut + core',
    items: [
      ['rope', '90 sn ip atlama'],
      ['quick', 'Cabukluluk ve sıçrama'],
      ['wide', 'Geniş kol şınav (10X2)'],
      ['narrow', 'Dar kol şınav (8X2)'],
      ['triceps', 'Arka kol (10X2)'],
      ['pullup', 'Barfiks (3X2)'],
      ['upper', 'Üst karın (25 sn)'],
      ['side', 'Yan karın (25 sn)'],
      ['lower', 'Alt karın (25 sn)'],
      ['plank1', 'Plank 1 (20 sn)'],
      ['plank2', 'Plank 2 (20 sn)'],
      ['plank3', 'Plank 3 (20 sn)'],
      ['mobility', 'Flaxbility ve mobilitiy'],
    ],
  },
  5: {
    type: 'legs',
    label: 'Denge + alt vücut',
    items: [
      ['rope', '90 sn ip atlama'],
      ['balance', 'Denge ve koordinasyon'],
      ['hip', 'Kalça (10X2)'],
      ['quad', 'On bacak [quadriceps] (10X2)'],
      ['ham', 'Arka bacak [hamstring] (10X2)'],
      ['calf', 'Calf (10X2)'],
      ['plank1', 'Plank 1 (20 sn)'],
      ['plank2', 'Plank 2 (20 sn)'],
      ['plank3', 'Plank 3 (20 sn)'],
      ['mobility', 'Flaxbility ve mobilitiy'],
    ],
  },
};

export function iso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function planned(dateStr: string, plans: WorkoutPlanMap) {
  const jsDay = new Date(dateStr + 'T12:00:00').getDay();
  const weekday = jsDay || 7;
  const p = plans[weekday];
  return p && p.items?.length ? p : null;
}

export function isComplete(dateStr: string, plans: WorkoutPlanMap, record?: DailyRecordData): boolean {
  const p = planned(dateStr, plans);
  if (!p || !record) return false;
  return p.items.every((x) => record.done?.includes(x[0]));
}

export function isPartial(dateStr: string, plans: WorkoutPlanMap, record?: DailyRecordData): boolean {
  const p = planned(dateStr, plans);
  if (!p || !record) return false;
  return record.done?.length > 0 && !isComplete(dateStr, plans, record);
}

export function esc(v: unknown): string {
  return String(v ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c)
  );
}

export function weekRange(selectedDateStr: string): [string, string] {
  const d = new Date(selectedDateStr + 'T12:00:00');
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  const a = iso(d);
  d.setDate(d.getDate() + 6);
  return [a, iso(d)];
}

export function buildWeeklySummary(
  selectedDateStr: string,
  plans: WorkoutPlanMap,
  records: Record<string, DailyRecordData>
): string {
  const [a, b] = weekRange(selectedDateStr);
  const start = new Date(a + 'T12:00:00');
  const end = new Date(b + 'T12:00:00');
  const lines: string[] = [
    'HAFTALIK UYKU, DERS & ANTRENMAN ÖZETİ',
    `${start.getDate()} ${monthNames[start.getMonth()]} – ${end.getDate()} ${monthNames[end.getMonth()]} ${start.getFullYear()}`,
    'Uyku hedefi: 21:30\n',
  ];

  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const k = iso(d);
    const r = records[k] || { done: [], sleepGoal: false, bed: '', lessonTitle: '', lesson: '', note: '' };
    const p = planned(k, plans);

    lines.push(
      `${dayNames[d.getDay()]} ${d.getDate()} ${monthNames[d.getMonth()]}`,
      `  Uyku: ${r.bed ? `yatağa giriş ${r.bed}` : 'kayıt yok'} · hedef ${r.sleepGoal ? '✓ tuttu' : '○ tutmadı / işaretlenmedi'}`
    );

    if (p) {
      const n = (r.done || []).filter((id) => p.items.some((it) => it[0] === id)).length;
      lines.push(
        `  Antrenman: ${p.label} · ${n}/${p.items.length} ${isComplete(k, plans, r) ? '✓ tamamlandı' : n ? '· kısmi' : '○ yapılmadı / işaretlenmedi'}`
      );
    } else {
      lines.push('  Antrenman: Dinlenme günü');
    }

    if (r.lessonTitle || r.lesson) {
      lines.push(`  Ders${r.lessonTitle ? ` · ${r.lessonTitle}` : ''}: ${r.lesson || 'Açıklama girilmedi'}`);
    }
    if (r.note) {
      lines.push(`  Not: ${r.note}`);
    }
  }

  return lines.join('\n');
}

export function buildReportHtml(
  selectedDateStr: string,
  plans: WorkoutPlanMap,
  records: Record<string, DailyRecordData>
): string {
  const [a, b] = weekRange(selectedDateStr);
  const start = new Date(a + 'T12:00:00');
  const end = new Date(b + 'T12:00:00');
  let cards = '';

  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const k = iso(d);
    const r = records[k] || { done: [], sleepGoal: false, bed: '', lessonTitle: '', lesson: '', note: '' };
    const p = planned(k, plans);
    const moves = p
      ? p.items
          .map(
            ([id, label]) =>
              `<li class="${r.done?.includes(id) ? 'done' : ''}"><span>${r.done?.includes(id) ? '✓' : '○'}</span>${esc(label)}</li>`
          )
          .join('')
      : '<li>Planlı antrenman yok · dinlenme günü</li>';
    const count = p ? (r.done || []).filter((id) => p.items.some((it) => it[0] === id)).length : 0;

    cards += `<article><header><h2>${dayNames[d.getDay()]}, ${d.getDate()} ${monthNames[d.getMonth()]}</h2><span class="badge">${
      p ? `${count}/${p.items.length} hareket` : 'Dinlenme'
    }</span></header><div class="sleep"><b>🌙 Uyku</b><span>${
      r.bed ? `Yatağa giriş: ${esc(r.bed)}` : 'Saat kaydı yok'
    } · 21:30 hedefi: ${r.sleepGoal ? 'işaretlendi' : 'işaretlenmedi'}</span></div>${
      r.lessonTitle || r.lesson
        ? `<div class="lesson"><b>📚 Ders${r.lessonTitle ? ` · ${esc(r.lessonTitle)}` : ''}</b><p>${
            r.lesson ? esc(r.lesson).replace(/\n/g, '<br>') : 'Açıklama girilmedi'
          }</p></div>`
        : ''
    }${p ? `<h3>💪 ${esc(p.label)}</h3><ul>${moves}</ul>` : ''}${
      r.note ? `<p class="note"><b>Not:</b> ${esc(r.note)}</p>` : ''
    }</article>`;
  }

  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Antrenör raporu · Ritim</title><style>body{max-width:760px;margin:28px auto;padding:0 14px;color:#203348;font:15px/1.5 system-ui}article{border:1px solid #dce5ed;border-radius:16px;padding:17px;margin:12px 0}header{display:flex;justify-content:space-between;align-items:center}.badge{background:#e2edf8;padding:4px 9px;border-radius:12px;font-size:12px;font-weight:700;color:#2c5b88}ul{list-style:none;padding:0;columns:2;margin:10px 0}li{display:flex;align-items:center;gap:6px;font-size:13px;margin:4px 0}li.done{color:#258062;font-weight:600}.sleep,.lesson{padding:10px 0;border-bottom:1px solid #ddd}.lesson p{white-space:pre-wrap;margin:6px 0}.note{background:#f4f7fa;padding:9px;border-radius:8px;font-size:13px;margin-top:10px}</style></head><body><h1>Ritim · Haftalık takip</h1><p>${start.getDate()} ${monthNames[start.getMonth()]} – ${end.getDate()} ${monthNames[end.getMonth()]} ${end.getFullYear()} · Uyku hedefi: 21:30</p>${cards}</body></html>`;
}
