import React from 'react';
import { WorkoutPlanMap, DailyRecordsMap } from '../types';
import { iso, planned, isComplete } from '../constants';

interface MonthlyStatsProps {
  viewDate: Date;
  selectedDate: string;
  plans: WorkoutPlanMap;
  records: DailyRecordsMap;
}

export const MonthlyStats: React.FC<MonthlyStatsProps> = ({
  viewDate,
  selectedDate,
  plans,
  records,
}) => {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

  const ds = Array.from({ length: totalDaysInMonth }, (_, i) =>
    iso(new Date(year, month, i + 1))
  );

  const sleep = ds.filter((d) => records[d]?.sleepGoal).length;
  const trainDays = ds.filter((d) => planned(d, plans)).length;
  const training = ds.filter((d) => planned(d, plans) && isComplete(d, plans, records[d])).length;
  const logged = ds.filter(
    (d) =>
      records[d] &&
      (records[d].sleepGoal ||
        records[d].bed ||
        records[d].done?.length ||
        records[d].lessonTitle ||
        records[d].lesson ||
        records[d].note)
  ).length;

  const sleepPercent = totalDaysInMonth ? Math.round((sleep / totalDaysInMonth) * 100) : 0;
  const workoutPercent = trainDays ? Math.round((training / trainDays) * 100) : 0;

  // Streak calculation: starting from today backwards
  let streak = 0;
  const dCursor = new Date();
  while (records[iso(dCursor)]?.sleepGoal) {
    streak++;
    dCursor.setDate(dCursor.getDate() - 1);
  }

  // Week strip calculation for selected date
  const monday = new Date(selectedDate + 'T12:00:00');
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));

  const weekCols = Array.from({ length: 7 }, (_, i) => {
    const x = new Date(monday);
    x.setDate(x.getDate() + i);
    const k = iso(x);
    const r = records[k];
    const p = planned(k, plans);
    const percent = p
      ? ((r?.done?.filter((id) => p.items.some((it) => it[0] === id)).length || 0) /
          p.items.length) *
        100
      : 0;
    const completed = isComplete(k, plans, r);
    const dayLabel = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'][i];

    return (
      <div className="week-col" key={k}>
        <small>{dayLabel}</small>
        <b>
          {r?.sleepGoal ? '🌙' : '·'}
          {p && completed ? ' ✓' : ''}
        </b>
        <div className="mini">
          <i style={{ width: `${percent}%` }} />
        </div>
      </div>
    );
  });

  return (
    <section className="card stats">
      <h3 className="section-title">Bu ayın ritmi</h3>
      <div className="stats-grid">
        <div className="stat">
          <div className="stat-label">Uyku hedefi</div>
          <div className="stat-value" id="sleepStat">
            {sleep}/{totalDaysInMonth}
          </div>
          <div className="stat-foot" id="sleepFoot">
            %{sleepPercent} gün hedefinde yatış
          </div>
          <div className="progress">
            <i id="sleepProgress" style={{ width: `${sleepPercent}%` }} />
          </div>
        </div>

        <div className="stat">
          <div className="stat-label">Antrenman</div>
          <div className="stat-value" id="workoutStat">
            {training}/{trainDays}
          </div>
          <div className="stat-foot" id="workoutFoot">
            %{workoutPercent} planlı gün tamamlandı
          </div>
          <div className="progress">
            <i id="workoutProgress" style={{ width: `${workoutPercent}%` }} />
          </div>
        </div>

        <div className="stat">
          <div className="stat-label">Seri</div>
          <div className="stat-value" id="streakStat">
            {streak} 🔥
          </div>
          <div className="stat-foot">üst üste uyku hedefi</div>
        </div>

        <div className="stat">
          <div className="stat-label">Kayıtlı gün</div>
          <div className="stat-value" id="loggedStat">
            {logged}
          </div>
          <div className="stat-foot">uyku veya egzersiz kaydı</div>
        </div>
      </div>

      <div className="week-strip" id="weekStrip">
        {weekCols}
      </div>
    </section>
  );
};
