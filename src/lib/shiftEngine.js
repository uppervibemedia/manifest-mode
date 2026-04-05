/**
 * Shift Engine — two-layer Daily Shift system
 *
 * STABLE LAYER (7–14 day cadence):  key habits, future self identity theme
 * DYNAMIC LAYER (daily):            mindset focus, affirmation, action challenge, visualization, evening reflection prompt
 *
 * Stable layer refreshes early when:
 *  - overall_score changes by ≥10 pts vs when habits were last set
 *  - primary focus changes
 *  - evening reviews show consistent low scores (avg ≤2 for 3+ days)
 *  - no checkins for 5+ days (consistency break)
 */

import { base44 } from "@/api/base44Client";

// ─── Daily content banks ──────────────────────────────────────────────────────

const MINDSET_FOCUSES = [
  "Act from identity, not mood. Today you are who your future self needs you to be.",
  "The gap between where you are and where you're going closes one decision at a time.",
  "Stop auditing your progress. Start compounding your action.",
  "Your environment is either working for you or against you. Design it intentionally.",
  "Discomfort is the price of growth. Seek it, don't avoid it.",
  "Energy flows where attention goes. Guard your focus today.",
  "You are not building habits. You are building an identity.",
  "Small consistent actions are more powerful than intense sporadic effort.",
  "The version of you that already has this wouldn't hesitate. Act like them.",
  "Standards, not motivation, create lasting change. What is your standard today?",
  "Clarity precedes success. Know exactly what you're building today.",
  "Your future self is watching every decision you make right now.",
  "Eliminate one thing today that your future self would be embarrassed by.",
  "You become what you repeatedly do. Today is another vote for your new identity.",
  "The present moment is where transformation is built — not in plans, but in action.",
  "Urgency without anxiety. Move with purpose, not panic.",
  "Protect your morning. What you do in the first hour shapes everything that follows.",
  "Your standards are your ceiling. Raise them and the results follow.",
  "Compare yourself only to who you were yesterday. You are in competition with no one.",
  "Every time you do the hard thing, you close the gap between your current and future self.",
  "The most powerful question today: 'Would the version of me I'm becoming do this?'",
];

const AFFIRMATIONS = [
  "I am actively becoming the version of me that naturally attracts the life I'm building.",
  "My daily discipline is compounding. Every action is building my future reality.",
  "I no longer operate from the old version of myself. My identity is evolving.",
  "I am worthy of everything in my vision. I am closing the gap daily.",
  "My habits, thoughts, and standards are aligned with the life I am stepping into.",
  "I act from clarity, not from fear. I move toward my vision with confidence.",
  "I am not waiting for the right time. I am the right time.",
  "Consistency is my competitive advantage. I show up even when I don't feel like it.",
  "I am the architect of my reality. I design it daily with my choices.",
  "What I do today is building who I become tomorrow.",
  "I release resistance and move forward with certainty.",
  "My energy, my focus, and my actions are all pointed toward my vision.",
  "I am not trying to change my life. I am changing who I am at my core.",
  "I deserve the life I am building. I take full responsibility for creating it.",
  "I am operating at a level that my future self would be proud of.",
  "Every challenge I face is evidence that I am growing past my old limits.",
  "My future self already exists. I am simply aligning my present with that reality.",
  "I choose discipline over comfort. I choose vision over distraction.",
  "I am magnetic to opportunities because I am aligned with my highest self.",
  "Today I act as if the life I want is already mine — because it is becoming mine.",
  "I build my future with every hour I give to my purpose.",
];

const ACTION_CHALLENGES = [
  "Do the one thing you've been postponing for 3+ days. Do it before noon.",
  "Reach out to one person who is living the life you want. Study their path.",
  "Audit your top 3 distractions and eliminate one for the rest of today.",
  "Block 60 minutes of deep, phone-free work on your most important goal.",
  "Write down 3 decisions your future self would make differently than your current self.",
  "Set your environment for success: clean your workspace, remove what pulls you off track.",
  "Take one action today that scares the current version of you but excites your future self.",
  "Identify one habit you've been inconsistent with. Commit to doing it today — no exceptions.",
  "Say no to one low-priority request or distraction today.",
  "Write a 3-sentence letter from your future self to your current self.",
  "Track every hour of your time today. Notice where your energy actually goes.",
  "Spend 20 minutes learning something directly aligned with your primary goal.",
  "Identify one belief that is limiting your progress and write its replacement.",
  "Do something physical today that stretches your current capacity.",
  "Invest in one thing that supports your future self — a book, course, or tool.",
  "Observe one pattern in your behavior today. Ask: is this who I'm becoming?",
  "Tell one person about one specific goal you're committed to achieving.",
  "Remove one source of mental noise from your environment today.",
  "Schedule your top priority for tomorrow — put it in your calendar right now.",
  "Ask yourself at noon: 'Am I operating as my future self right now?' Adjust accordingly.",
  "Create a 3-day action sprint toward your most critical goal. Define day one today.",
];

const VISUALIZATIONS = [
  "Close your eyes. See yourself 12 months from now living the life you're building. What does your morning look like? How do you feel in your body? What decisions are easy that feel hard today?",
  "Visualize yourself completing today's most important habit — fully, with focus and ease. Feel the satisfaction of follow-through before it happens.",
  "Picture the life inside your vision board as already real. Walk through one day. What are you wearing? Where are you? Who are you with?",
  "See the version of you that has already achieved your primary goal. Watch how they carry themselves, how they speak, how they make decisions.",
  "Visualize the moment you hit your biggest milestone. Feel the emotion fully. Let it anchor you to your purpose today.",
  "Close your eyes and picture your ideal work environment — the energy, the focus, the output. Step into that version of your day right now.",
  "Imagine looking back on this exact period of your life with pride. What did you do consistently during this season that changed everything?",
  "See yourself making your most important decision of the day with total clarity and confidence. You already know what your future self would choose.",
  "Visualize your body, your health, and your energy at the peak of alignment. What habits made that possible?",
  "Picture the financial reality you are building — not just the number, but the feeling of security, freedom, and generosity it gives you.",
  "See yourself in 5 years handing a copy of your story to someone who needs it. What did you do in this season that made the story worth telling?",
  "Visualize the relationship you want — the love, the depth, the ease. What version of you does that relationship require?",
  "Close your eyes. Imagine waking up tomorrow as your future self. What is the very first thing they do?",
  "See yourself executing today with total focus. No distraction. No resistance. Pure forward motion. That version of you is available right now.",
  "Visualize closing the alignment gap. Every good decision today makes that gap smaller. See it shrinking with each action you take.",
  "Imagine the person you're becoming standing beside the person you are today. What would they tell you? What would they change?",
  "See your vision board come to life — every image, every goal, every standard becoming real. Feel the gratitude of already being there.",
  "Visualize yourself doing the hard thing today with full commitment. See the outcome. Own it before it happens.",
  "Picture the compound effect of 90 more days like today. Who would you be? What would be different?",
  "Imagine standing at the edge of a breakthrough. You are one consistent week away. See yourself on the other side.",
  "See yourself completely at peace with where you are going — certain, grounded, and fully committed to the path.",
];

const EVENING_REFLECTIONS = [
  "Where did you close the gap between who you are and who you're becoming today?",
  "What decision today was most aligned with your future self? What decision wasn't?",
  "What would have made today a 10/10 in your growth? What was missing?",
  "Identify the moment today where you chose comfort over progress. What will you do differently?",
  "Name one thing you did today that your past self wouldn't have done. Notice that.",
  "What habit did you execute with full commitment today? Which one slipped?",
  "Where did you operate from fear today, and where did you operate from vision?",
  "What are you most proud of from today? What do you want to build on tomorrow?",
  "What did today teach you about who you're becoming?",
  "If your future self reviewed your day, what would they say?",
  "What energy did you bring to the people around you today?",
  "What was the hardest thing you did today? Did you do it?",
  "Where did you let distractions steal time that belonged to your vision?",
  "What new standard did you demonstrate today?",
  "How close to your ideal self did you live today, on a scale of 1–10? What closes the gap?",
  "What belief did you act from today — abundance or scarcity?",
  "What's one thing you'll do first tomorrow to carry today's momentum forward?",
  "Were your actions today in alignment with your goals, or just with your mood?",
  "What did you say yes to today that deserved a no?",
  "What conversation, habit, or environment drained your energy today? How will you protect against it?",
  "Where did you feel most alive and most like your future self today?",
];

// ─── Deterministic daily index ────────────────────────────────────────────────
// Produces a consistent value for a given user + date, so the same content
// shows all day but changes tomorrow.

function dailyIndex(userEmail, dateStr, length) {
  let hash = 0;
  const seed = `${userEmail}::${dateStr}`;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % length;
}

// ─── Should habits refresh? ───────────────────────────────────────────────────

function shouldRefreshHabits({ lastHabitDate, latestScore, storedScore, primaryFocus, storedFocus, recentEveningScores, lastCheckinDate }) {
  if (!lastHabitDate) return true;

  const daysSinceSet = Math.floor((Date.now() - new Date(lastHabitDate).getTime()) / 86400000);

  // Max 14 days — always refresh
  if (daysSinceSet >= 14) return true;

  // Score shifted significantly (≥10 pts)
  if (latestScore && storedScore && Math.abs(latestScore - storedScore) >= 10) return true;

  // Primary focus changed
  if (primaryFocus && storedFocus && primaryFocus !== storedFocus) return true;

  // Consistency break — no checkin for 5+ days
  if (lastCheckinDate) {
    const daysSinceCheckin = Math.floor((Date.now() - new Date(lastCheckinDate).getTime()) / 86400000);
    if (daysSinceCheckin >= 5) return true;
  }

  // Evening reviews showing repeated weakness (avg ≤2 over last 3+ scored days)
  if (recentEveningScores.length >= 3) {
    const avg = recentEveningScores.reduce((a, b) => a + b, 0) / recentEveningScores.length;
    if (avg <= 2) return true;
  }

  // Minimum 7 days before any routine refresh
  if (daysSinceSet < 7) return false;

  return false;
}

// ─── Build stable habits from analysis ───────────────────────────────────────

function buildStableHabits(analysis, profile) {
  const base = analysis?.habit_upgrades || [];
  const extras = analysis?.action_plan?.slice(0, 2) || [];
  const all = [...base, ...extras];
  // Shorten and dedupe
  const seen = new Set();
  return all
    .map(h => h.split(" — ")[0].replace(/^\d+\.\s*/, "").trim())
    .filter(h => { if (seen.has(h.toLowerCase())) return false; seen.add(h.toLowerCase()); return true; })
    .slice(0, 3);
}

// ─── Main: get or build today's shift ────────────────────────────────────────

export async function getTodaysShift(userEmail, today) {
  const [plans, analyses, profiles, scores, recentCheckins, eveningJournals] = await Promise.all([
    base44.entities.DailyShiftPlan.filter({ user_email: userEmail, plan_date: today }),
    base44.entities.AIAnalysis.filter({ user_email: userEmail }, "-created_date", 1),
    base44.entities.UserProfile.filter({ user_email: userEmail }),
    base44.entities.ScoreHistory.filter({ user_email: userEmail }, "-created_date", 2),
    base44.entities.DailyCheckIn.filter({ user_email: userEmail }, "-created_date", 1),
    base44.entities.JournalEntry.filter({ user_email: userEmail, entry_type: "checkin" }, "-created_date", 12),
  ]);

  const analysis = analyses[0] || null;
  const profile = profiles[0] || null;
  const latestScore = scores[0]?.overall_score || null;

  // Parse recent evening scores (action/identity/emotional checkin entries with "Score: X/5")
  const recentEveningScores = eveningJournals
    .filter(e => e.category === "action" && e.response_text?.startsWith("Score:"))
    .map(e => parseInt(e.response_text.replace("Score:", "").trim()))
    .filter(n => !isNaN(n))
    .slice(0, 5);

  const lastCheckinDate = recentCheckins[0]?.checkin_date || null;

  // ── Dynamic layer: always fresh, deterministic per day ──
  const mi = dailyIndex(userEmail, today, MINDSET_FOCUSES.length);
  const ai = dailyIndex(userEmail + "a", today, AFFIRMATIONS.length);
  const aci = dailyIndex(userEmail + "ac", today, ACTION_CHALLENGES.length);
  const vi = dailyIndex(userEmail + "v", today, VISUALIZATIONS.length);
  const eri = dailyIndex(userEmail + "er", today, EVENING_REFLECTIONS.length);

  const dynamicLayer = {
    mindset_focus: MINDSET_FOCUSES[mi],
    affirmation: AFFIRMATIONS[ai],
    action_challenge: ACTION_CHALLENGES[aci],
    visualization_prompt: VISUALIZATIONS[vi],
    reflection_prompt: EVENING_REFLECTIONS[eri],
  };

  // ── If we already have today's plan, just update the dynamic fields ──
  if (plans[0]) {
    const existing = plans[0];
    // Update dynamic fields if they differ (they should change each day)
    const needsUpdate =
      existing.mindset_focus !== dynamicLayer.mindset_focus ||
      existing.affirmation !== dynamicLayer.affirmation;

    if (needsUpdate) {
      const updated = await base44.entities.DailyShiftPlan.update(existing.id, dynamicLayer);
      return { ...existing, ...dynamicLayer };
    }
    return existing;
  }

  // ── Build stable habits layer ──
  // Look for most recent plan to reuse habits if still valid
  const recentPlans = await base44.entities.DailyShiftPlan.filter({ user_email: userEmail }, "-created_date", 3);
  const lastPlan = recentPlans[0] || null;

  const storedScore = lastPlan?.habits?.length ? (scores[1]?.overall_score || latestScore) : null;
  const storedFocus = lastPlan?.mindset_focus; // not the focus, but we use it as proxy for last plan date
  const lastHabitDate = lastPlan?.plan_date || null;

  const needsHabitRefresh = shouldRefreshHabits({
    lastHabitDate,
    latestScore,
    storedScore,
    primaryFocus: profile?.primary_focus,
    storedFocus: null, // not tracked separately yet — rely on date/score logic
    recentEveningScores,
    lastCheckinDate,
  });

  const stableHabits = needsHabitRefresh || !lastPlan?.habits?.length
    ? buildStableHabits(analysis, profile)
    : (lastPlan.habits || []);

  // ── Create today's plan ──
  const newPlan = await base44.entities.DailyShiftPlan.create({
    user_email: userEmail,
    plan_date: today,
    habits: stableHabits,
    ...dynamicLayer,
    is_completed: false,
    completed_habits: [],
  });

  return newPlan;
}