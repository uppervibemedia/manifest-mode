// Identity Engine — Manifest Mode alignment points & level system
// Feels like identity evolution, not a game. Premium, serious, aspirational.

export const IDENTITY_LEVELS = [
  {
    level: 0,
    title: "Aware",
    subtitle: "You see the gap between where you are and who you're becoming.",
    pointsRequired: 0,
    pointsToNext: 200,
    color: "#a78bfa",
    glow: "rgba(167,139,250,0.2)",
    symbol: "◈",
  },
  {
    level: 1,
    title: "Aligned",
    subtitle: "Your daily actions are beginning to match your vision.",
    pointsRequired: 200,
    pointsToNext: 500,
    color: "#60a5fa",
    glow: "rgba(96,165,250,0.2)",
    symbol: "◆",
  },
  {
    level: 2,
    title: "Disciplined",
    subtitle: "You execute consistently, even when motivation is absent.",
    pointsRequired: 700,
    pointsToNext: 800,
    color: "#34d399",
    glow: "rgba(52,211,153,0.2)",
    symbol: "⬡",
  },
  {
    level: 3,
    title: "Activated",
    subtitle: "Your identity is shifting. The old version no longer fits.",
    pointsRequired: 1500,
    pointsToNext: 1000,
    color: "#fbbf24",
    glow: "rgba(251,191,36,0.25)",
    symbol: "✦",
  },
  {
    level: 4,
    title: "Embodied",
    subtitle: "You live as your future self. The gap has nearly closed.",
    pointsRequired: 2500,
    pointsToNext: 1500,
    color: "#f9a8d4",
    glow: "rgba(249,168,212,0.2)",
    symbol: "◉",
  },
  {
    level: 5,
    title: "Manifest Mode",
    subtitle: "You are the vision. Your reality reflects who you've become.",
    pointsRequired: 4000,
    pointsToNext: null,
    color: "#fbbf24",
    glow: "rgba(212,175,55,0.35)",
    symbol: "✦✦",
  },
];

export const POINT_VALUES = {
  HABIT_COMPLETE: 10,
  ALL_HABITS_COMPLETE: 25, // bonus when all habits done in a day
  DAILY_CHECKIN: 20,
  JOURNAL_ENTRY: 15,
  STREAK_7: 50,
  STREAK_14: 100,
  STREAK_30: 200,
  SCORE_IMPROVEMENT: 75,
  WEEKLY_HABIT_RATE_80: 40, // awarded weekly if rate >= 80%
};

export const BADGES = [
  // Consistency
  { id: "first_habit", title: "First Step", desc: "Completed your first habit", icon: "🌱", color: "#34d399", category: "consistency" },
  { id: "streak_7", title: "Seven Days", desc: "7-day consecutive streak", icon: "🔥", color: "#f97316", category: "consistency" },
  { id: "streak_14", title: "Fortnight", desc: "14-day consecutive streak", icon: "⚡", color: "#fbbf24", category: "consistency" },
  { id: "streak_30", title: "The Month", desc: "30-day consecutive streak", icon: "🏛️", color: "#60a5fa", category: "consistency" },
  { id: "habits_100", title: "Century", desc: "100 total habit completions", icon: "💯", color: "#a78bfa", category: "consistency" },
  { id: "habits_500", title: "500 Reps", desc: "500 total habit completions", icon: "⬡", color: "#fbbf24", category: "discipline" },
  // Discipline
  { id: "first_checkin", title: "Self-Aware", desc: "Completed your first check-in", icon: "◈", color: "#818cf8", category: "discipline" },
  { id: "checkins_7", title: "Daily Practice", desc: "7 daily check-ins logged", icon: "📿", color: "#60a5fa", category: "discipline" },
  { id: "checkins_30", title: "30 Days Logged", desc: "30 check-ins completed", icon: "🗓️", color: "#34d399", category: "discipline" },
  { id: "weekly_perfect", title: "Perfect Week", desc: "100% habit completion for 7 days", icon: "✦", color: "#fbbf24", category: "discipline" },
  // Mindset
  { id: "first_journal", title: "Inner Work", desc: "Wrote your first journal entry", icon: "📖", color: "#c084fc", category: "mindset" },
  { id: "journal_10", title: "Reflective", desc: "10 journal entries written", icon: "🌙", color: "#818cf8", category: "mindset" },
  { id: "journal_30", title: "Deep Practice", desc: "30 journal entries written", icon: "🧠", color: "#a78bfa", category: "mindset" },
  // Progress
  { id: "first_score", title: "Reality Check", desc: "Completed first assessment", icon: "◆", color: "#60a5fa", category: "progress" },
  { id: "score_improved", title: "Momentum", desc: "Improved Reality Match Score", icon: "📈", color: "#34d399", category: "progress" },
  { id: "score_75", title: "High Alignment", desc: "Reached a score of 75+", icon: "🎯", color: "#fbbf24", category: "progress" },
  { id: "score_90", title: "Peak State", desc: "Reached a score of 90+", icon: "✦", color: "#fbbf24", category: "progress" },
  // Identity
  { id: "level_1", title: "Aligned", desc: "Reached Aligned identity level", icon: "◆", color: "#60a5fa", category: "identity" },
  { id: "level_3", title: "Activated", desc: "Reached Activated identity level", icon: "✦", color: "#fbbf24", category: "identity" },
  { id: "level_5", title: "Manifest Mode", desc: "Reached the highest identity level", icon: "✦✦", color: "#fbbf24", category: "identity" },
];

export function getLevelForPoints(points) {
  const sorted = [...IDENTITY_LEVELS].reverse();
  return sorted.find(l => points >= l.pointsRequired) || IDENTITY_LEVELS[0];
}

export function getProgressToNextLevel(points) {
  const current = getLevelForPoints(points);
  if (!current.pointsToNext) return 100; // max level
  const pointsIntoLevel = points - current.pointsRequired;
  return Math.min(100, Math.round((pointsIntoLevel / current.pointsToNext) * 100));
}

export function getPointsToNextLevel(points) {
  const current = getLevelForPoints(points);
  if (!current.pointsToNext) return 0;
  return current.pointsRequired + current.pointsToNext - points;
}

export function computeEarnedBadges(profile, scores) {
  const earned = [];
  const tc = profile.total_habits_completed || 0;
  const ci = profile.total_checkins || 0;
  const je = profile.total_journal_entries || 0;
  const streak = profile.streak_count || 0;
  const ap = profile.alignment_points || 0;
  const latestScore = scores?.[0]?.overall_score || 0;
  const prevScore = scores?.[1]?.overall_score;

  if (tc >= 1) earned.push("first_habit");
  if (tc >= 100) earned.push("habits_100");
  if (tc >= 500) earned.push("habits_500");
  if (streak >= 7) earned.push("streak_7");
  if (streak >= 14) earned.push("streak_14");
  if (streak >= 30) earned.push("streak_30");
  if (ci >= 1) earned.push("first_checkin");
  if (ci >= 7) earned.push("checkins_7");
  if (ci >= 30) earned.push("checkins_30");
  if (je >= 1) earned.push("first_journal");
  if (je >= 10) earned.push("journal_10");
  if (je >= 30) earned.push("journal_30");
  if (scores?.length >= 1) earned.push("first_score");
  if (prevScore && latestScore > prevScore) earned.push("score_improved");
  if (latestScore >= 75) earned.push("score_75");
  if (latestScore >= 90) earned.push("score_90");
  if (ap >= IDENTITY_LEVELS[1].pointsRequired) earned.push("level_1");
  if (ap >= IDENTITY_LEVELS[3].pointsRequired) earned.push("level_3");
  if (ap >= IDENTITY_LEVELS[5].pointsRequired) earned.push("level_5");

  return earned;
}

export async function awardPoints(profile, pointType, base44Client) {
  if (!profile?.id) return profile;
  const points = POINT_VALUES[pointType] || 0;
  const currentPoints = profile.alignment_points || 0;
  const newPoints = currentPoints + points;
  const newLevel = getLevelForPoints(newPoints).level;
  const updated = await base44Client.entities.UserProfile.update(profile.id, {
    alignment_points: newPoints,
    identity_level: newLevel,
  });
  return updated;
}