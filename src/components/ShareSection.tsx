import React from 'react';
import { WorkoutPlanMap, DailyRecordsMap } from '../types';
import { buildWeeklySummary, buildReportHtml } from '../constants';

interface ShareSectionProps {
  selectedDate: string;
  plans: WorkoutPlanMap;
  records: DailyRecordsMap;
  onNotice: (msg: string) => void;
}

export const ShareSection: React.FC<ShareSectionProps> = ({
  selectedDate,
  plans,
  records,
  onNotice,
}) => {
  const handleCopySummary = async () => {
    const summaryText = buildWeeklySummary(selectedDate, plans, records);
    try {
      await navigator.clipboard.writeText(summaryText);
      onNotice('Haftalık özet panoya kopyalandı');
    } catch {
      const ta = document.createElement('textarea');
      ta.value = summaryText;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      onNotice('Haftalık özet kopyalandı');
    }
  };

  const handleDownloadTxt = () => {
    const summaryText = buildWeeklySummary(selectedDate, plans, records);
    const blob = new Blob([summaryText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ritim-haftalik-ozet.txt';
    a.click();
    URL.revokeObjectURL(url);
    onNotice('Metin özeti indirildi');
  };

  const handleDownloadReport = () => {
    const htmlReport = buildReportHtml(selectedDate, plans, records);
    const blob = new Blob([htmlReport], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ritim-antrenor-raporu.html';
    a.click();
    URL.revokeObjectURL(url);
    onNotice('Antrenör raporu indirildi');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <section className="card share">
      <h3 className="section-title">Antrenörle paylaş</h3>
      <p>
        Bu haftanın uyku ve egzersiz raporunu indirip antrenörüne gönder. Rapor başka tarayıcıda
        açılır; yalnızca sen gönderince paylaşılır.
      </p>
      <div className="share-actions">
        <button
          className="btn primary"
          id="downloadReport"
          style={{ gridColumn: 'span 2' }}
          onClick={handleDownloadReport}
          type="button"
        >
          ↗ Antrenör raporunu indir
        </button>
        <button
          className="btn"
          id="copyWeek"
          onClick={handleCopySummary}
          type="button"
        >
          ▣ Özeti kopyala
        </button>
        <button
          className="btn"
          id="printWeek"
          onClick={handlePrint}
          type="button"
        >
          ⤓ Yazdır / PDF
        </button>
        <button
          className="btn"
          id="downloadWeek"
          style={{ gridColumn: 'span 2' }}
          onClick={handleDownloadTxt}
          type="button"
        >
          ↓ Metin dosyası indir
        </button>
      </div>
    </section>
  );
};
