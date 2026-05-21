import { useHousehold } from '../context/HouseholdContext';
import {
  DAILY_RITUAL_ITEMS,
  formatLastActive,
  isRitualDayComplete,
  lastSevenDays,
  ritualProgress,
  todayKey,
} from '../lib/household/dailyRitual';

export function DailyRitual() {
  const {
    state,
    toggleRitual,
    getTodayRituals,
    ritualStreak,
    recordActivity,
  } = useHousehold();

  const today = todayKey();
  const todayRituals = getTodayRituals();
  const progress = ritualProgress(todayRituals);
  const complete = isRitualDayComplete(todayRituals);
  const week = lastSevenDays();

  return (
    <section className="daily-ritual">
      <div className="ritual-header">
        <div>
          <h2>Daily commitment</h2>
          <p className="section-hint">
            ~3 minutes · self-reported holdings only · no broker login
          </p>
        </div>
        <div className="ritual-streak-box">
          <span className="streak-num">{ritualStreak}</span>
          <span className="streak-label">day streak</span>
        </div>
      </div>

      <div className="week-dots" aria-label="Last 7 days activity">
        {week.map((date) => {
          const done = isRitualDayComplete(state.ritualCompletions[date]);
          const partial =
            !done && ritualProgress(state.ritualCompletions[date]).done > 0;
          const isToday = date === today;
          return (
            <div
              key={date}
              className={`week-dot ${done ? 'complete' : partial ? 'partial' : ''} ${isToday ? 'today' : ''}`}
              title={`${date}${done ? ' — core ritual done' : ''}`}
            >
              <span className="dot-day">
                {new Date(date + 'T12:00:00').toLocaleDateString('en-GB', {
                  weekday: 'narrow',
                })}
              </span>
            </div>
          );
        })}
      </div>

      <div className="ritual-progress-bar">
        <div
          className="ritual-progress-fill"
          style={{ width: `${(progress.done / progress.total) * 100}%` }}
        />
      </div>
      <p className="ritual-progress-text">
        {complete ? (
          <span className="up">Core ritual complete for today — nice.</span>
        ) : (
          <>
            {progress.done}/{progress.total} steps · finish <strong>refresh</strong> +{' '}
            <strong>note</strong> to keep your streak
          </>
        )}
      </p>

      <ul className="ritual-checklist">
        {DAILY_RITUAL_ITEMS.map((item) => {
          const checked = !!todayRituals[item.id];
          return (
            <li key={item.id}>
              <label className="ritual-check">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => {
                    toggleRitual(item.id);
                    recordActivity();
                  }}
                />
                <span className="ritual-check-label">{item.label}</span>
                <span className="ritual-check-hint">{item.hint}</span>
              </label>
            </li>
          );
        })}
      </ul>

      <div className="member-activity">
        {state.members.map((m) => (
          <span key={m.id} className="member-activity-pill">
            <span
              className="activity-dot"
              style={{ background: m.color }}
              aria-hidden
            />
            {m.name}: {formatLastActive(state.memberLastActive[m.id])}
          </span>
        ))}
      </div>
    </section>
  );
}
