import { base44 } from "@/api/base44Client";

// ── Helpers ────────────────────────────────────────────────────────────────────

function dateStr(d) {
  return d.toISOString().split("T")[0];
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return dateStr(d);
}

// ── Streak calculation ─────────────────────────────────────────────────────────

/**
 * Returns how many consecutive days ending yesterday (or today if includeToday)
 * a given date array covers.
 */
function calcStreak(sortedDates, includeToday = false) {
  if (!sortedDates || sortedDates.length === 0) return 0;
  const today = dateStr(new Date());
  const yesterday = daysAgo(1);

  const set = new Set(sortedDates);
  let streak = 0;
  let check = includeToday && set.has(today) ? today : yesterday;

  while (set.has(check)) {
    streak++;
    const d = new Date(check);
    d.setDate(d.getDate() - 1);
    check = dateStr(d);
  }
  // If today is completed, count it too if we started from yesterday
  if (!includeToday && set.has(today)) streak++;
  return streak;
}

// ── Main loader ────────────────────────────────────────────────────────────────

export async function loadShiftStats(userEmail) {
  const today = dateStr(new Date());
  const weekStart = daysAgo(6); // last 7 days

  const [checkins, eveningEntries, scores] = await Promise.all([
    base44.entities.DailyCheckIn.filter({ user_email: userEmail }, "-checkin_date", 60),
    base44.entities.JournalEntry.filter({ user_email: userEmail }, "-created_date", 100),
    base44.entities.ScoreHistory.filter({ user_email: userEmail }, "-created_date", 10),
  ]);

  // Morning dates (from DailyCheckIn)
  const morningDates = checkins.map(c => c.checkin_date).filter(Boolean);

  // Evening dates — entries with entry_type=checkin and category=action
  const eveningDates = [
    ...new Set(
      eveningEntries
        .filter(e => e.entry_type === "checkin" && e.category === "action")
        .map(e => e.created_date?.split("T")[0])
        .filter(Boolean)
    ),
  ];

  // Full-day dates = morning AND evening on same day
  const morningSet = new Set(morningDates);
  const eveningSet = new Set(eveningDates);
  const fullDayDates = [...morningSet].filter(d => eveningSet.has(d));

  // Streaks
  const morningStreak = calcStreak(morningDates, true);
  const eveningStreak = calcStreak(eveningDates, true);
  const fullDayStreak = calcStreak(fullDayDates, true);
  const shiftStreak = Math.max(morningStreak, fullDayStreak);

  // Today's completion (0–3: plan always counts as done if it exists)
  const morningDoneToday = morningSet.has(today);
  const eveningDoneToday = eveningSet.has(today);
  const completedToday = (morningDoneToday ? 1 : 0) + (eveningDoneToday ? 1 : 0);
  const totalSteps = 2;

  // Shift Wins for today
  const wins = [];
  if (morningDoneToday) wins.push({ label: "Morning Locked In", desc: "You started with intention." });
  if (eveningDoneToday) wins.push({ label: "Aligned Finish", desc: "You closed the day with self-awareness." });
  if (morningDoneToday && eveningDoneToday) wins.push({ label: "Future Self Follow-Through", desc: "Full alignment — morning to night." });
  if (shiftStreak >= 3) wins.push({ label: "Built Momentum", desc: `${shiftStreak} days of consistent alignment.` });
  if (shiftStreak === 1 && (morningDoneToday || eveningDoneToday)) wins.push({ label: "Reset Started", desc: "Every streak starts with one day." });

  // Momentum state — based on last 7 days
  const last7 = Array.from({ length: 7 }, (_, i) => daysAgo(i));
  const completedDaysLast7 = last7.filter(d => morningSet.has(d) || eveningSet.has(d)).length;
  let momentum;
  if (completedDaysLast7 >= 6) momentum = "locked_in";
  else if (completedDaysLast7 >= 3) momentum = "building";
  else momentum = "low";

  // Weekly summary (last 7 days)
  const daysCompletedThisWeek = last7.filter(d => fullDayDates.includes(d)).length;
  const weeklyConsistency = Math.round((completedDaysLast7 / 7) * 100);

  // Score movement this week
  const recentScores = scores.filter(s => s.created_date >= weekStart);
  const scoreMovement =
    recentScores.length >= 2
      ? recentScores[0].overall_score - recentScores[recentScores.length - 1].overall_score
      : null;

  // Strongest / weakest from latest score
  let strongestArea = null;
  let weakestArea = null;
  if (scores[0]) {
    const s = scores[0];
    const areas = [
      { label: "Mindset", val: s.mindset_score },
      { label: "Discipline", val: s.discipline_score },
      { label: "Health", val: s.health_score },
      { label: "Financial", val: s.financial_score },
      { label: "Confidence", val: s.confidence_score },
      { label: "Environment", val: s.environment_score },
    ].filter(a => a.val != null);
    if (areas.length) {
      strongestArea = areas.reduce((a, b) => (a.val > b.val ? a : b)).label;
      weakestArea = areas.reduce((a, b) => (a.val < b.val ? a : b)).label;
    }
  }

  // Is it end of week (Sunday)?
  const dayOfWeek = new Date().getDay(); // 0 = Sun
  const showWeeklySummary = dayOfWeek === 0 || daysCompletedThisWeek === 7;

  return {
    streaks: { morning: morningStreak, evening: eveningStreak, fullDay: fullDayStreak, shift: shiftStreak },
    todayProgress: { completed: completedToday, total: totalSteps },
    wins,
    momentum,
    weekly: {
      show: showWeeklySummary,
      daysCompleted: daysCompletedThisWeek,
      consistency: weeklyConsistency,
      strongestArea,
      weakestArea,
      scoreMovement,
    },
  };
}