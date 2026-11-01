import React from 'react';
import { WorkoutPlanMap, DailyRecordsMap } from '../types';
import { monthNames, iso, planned, isComplete, isPartial } from '../constants';

interface CalendarViewProps {
  viewDate: Date;
  selectedDate: string;
  plans: WorkoutPlanMap;
  records: DailyRecordsMap;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onSelectDate: (dateStr: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  viewDate,
  selectedDate,
  plans,
  records,
  onPrevMonth,
  onNextMonth,
  onSelectDate,
}) => {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const monthLabel = `${monthNames[month]} ${year}`;

  const firstDayOfMonth = new Date(year, month, 1);
  const offset = (firstDayOfMonth.getDay() + 6) % 7; // Monday = 0
  const startDate = new Date(year, month, 1 - offset);

  const todayStr = iso(new Date());

  const days = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    const key = iso(d);
    const r = records[key];
    const p = planned(key, plans);
    const isOutside = d.getMonth() !== month;
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    const isToday = key === todayStr;
    const isSelected = key === selectedDate;

    const completed = isComplete(key, plans, r);
    const partial = isPartial(key, plans, r);
    const statusText = p ? (completed ? '✓ Tamam' : partial ? 'Kısmi' : 'Antrenman') : '';

    const classNames = [
      'day',
      isOutside ? 'outside' : '',
      isWeekend ? 'weekend' : '',
      isToday ? 'today' : '',
      isSelected ? 'selected' : '',
    ]
      .filter(Boolean)
      .join(' ');

    days.push(
      <button
        key={key}
        className={classNames}
        data-date={key}
        onClick={() => onSelectDate(key)}
        type="button"
      >
        <span className="daynum">{d.getDate()}</span>
        <span className="daytag">{statusText}</span>
        <span className="dots">
          {r?.sleepGoal && <i className="dot sleep" title="Uyku hedefi" />}
          {p && completed && <i className="dot workout" title="Antrenman tamam" />}
          {p && partial && <i className="dot partial" title="Kısmi tamamlandı" />}
        </span>
      </button>
    );
  }

  return (
    <section className="card calendar">
      <div className="monthbar">
        <div className="monthlabel" id="monthLabel">
          {monthLabel}
        </div>
        <div className="monthnav">
          <button
            className="btn btn-icon"
            onClick={onPrevMonth}
            id="prevMonth"
            aria-label="Önceki ay"
            type="button"
          >
            ‹
          </button>
          <button
            className="btn btn-icon"
            onClick={onNextMonth}
            id="nextMonth"
            aria-label="Sonraki ay"
            type="button"
          >
            ›
          </button>
        </div>
      </div>

      <div className="weekdays">
        <span>PTS</span>
        <span>SAL</span>
        <span>ÇAR</span>
        <span>PER</span>
        <span>CUM</span>
        <span>CMT</span>
        <span>PAZ</span>
      </div>

      <div className="days" id="days">
        {days}
      </div>

      <div className="legend">
        <span>
          <i />
          Uyku hedefi tuttu
        </span>
        <span>
          <i />
          Antrenman tamam
        </span>
        <span>
          <i />
          Kısmen tamamlandı
        </span>
      </div>
    </section>
  );
};
