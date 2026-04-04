// Generate dynamic, personalized motivational messages based on user state
export function generateMotivation({
  streak = 0,
  habitCompletion = 0,
  totalHabits = 1,
  scoreTrend = 0,
  weakestArea = null,
  focusCategories = [],
  morningCheckinDone = false,
  identityLevel = 0,
  lastCheckinEnergy = 5,
}) {
  const messages = [];
  const now = new Date();
  const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);

  // ── STREAK-BASED MESSAGES ──
  if (streak >= 30) {
    messages.push(
      "30+ days of alignment. Your future is starting to recognize you.",
      "You're not just building a habit—you're reshaping your identity.",
      "This consistency is how legends are made. Keep going.",
      "Every aligned day compounds. You're exponential now."
    );
  } else if (streak >= 14) {
    messages.push(
      "Two weeks of alignment. Momentum is real now.",
      "Your nervous system is rewiring. Stay the course.",
      "Small aligned actions build powerful realities.",
      "You're past the critical threshold. Your identity is shifting."
    );
  } else if (streak >= 7) {
    messages.push(
      "One week aligned. You're proving it to yourself.",
      "Discipline today becomes freedom tomorrow.",
      "Seven days of decisions. That's the foundation.",
      "Your future self is watching. You're showing up."
    );
  } else if (streak > 0) {
    messages.push(
      "Your streak is alive. Protect it today.",
      "This momentum is fragile. One aligned day at a time.",
      "Restart your identity today. Start now.",
      "Day by day, you're becoming who you intend to be."
    );
  } else {
    messages.push(
      "Today is day one of your comeback.",
      "Restart your alignment today. Right now.",
      "Your future self is waiting for you to begin.",
      "One aligned choice today can restart your momentum."
    );
  }

  // ── HABIT COMPLETION MESSAGES ──
  if (habitCompletion === totalHabits && totalHabits > 0) {
    messages.push(
      "All habits complete. You're operating like your future self.",
      "Perfect day. This is what alignment looks like.",
      "Every habit done. That's the identity shift.",
      "You showed up fully today. That's the difference."
    );
  } else if (habitCompletion >= Math.ceil(totalHabits * 0.75)) {
    messages.push(
      "Most habits done. You're the majority of your future self.",
      "Strong execution today. Finish the last one.",
      "75% aligned. That's a powerful day.",
      "You're showing your future self who you are."
    );
  } else if (habitCompletion >= Math.ceil(totalHabits * 0.5)) {
    messages.push(
      "Half the habits done. You're halfway to aligned.",
      "You've started. That's the hardest part.",
      "Every habit logged gets easier. Keep going.",
      "50% of alignment is already done today."
    );
  }

  // ── SCORE TREND MESSAGES ──
  if (scoreTrend > 5) {
    messages.push(
      "Your score is rising. The gap is closing.",
      "Momentum is real. Your alignment is accelerating.",
      "This trend is not luck. It's daily choice.",
      "You're not just staying aligned—you're evolving."
    );
  } else if (scoreTrend < -5) {
    messages.push(
      "Your score dipped. Time to recommit to what works.",
      "Use this as data, not judgment. Align tomorrow.",
      "Small gaps become big if ignored. Choose aligned today.",
      "This is the moment. Recommit and watch it shift."
    );
  }

  // ── WEAK AREA MESSAGES (personalized leverage points) ──
  if (weakestArea) {
    const weakMessages = {
      mindset: "Your mindset is your next level. Build that today.",
      discipline: "Discipline is freedom. One aligned choice at a time.",
      financial: "Financial alignment starts with one decision today.",
      health: "Your body is your foundation. Move intentionally.",
      confidence: "Confidence comes from showing up. You are here.",
      environment: "Your environment shapes you. Control what you can.",
    };
    if (weakMessages[weakestArea]) {
      messages.push(weakMessages[weakestArea]);
    }
  }

  // ── FOCUS CATEGORY MESSAGES (personalized to their goals) ──
  if (focusCategories.length > 0) {
    const cat = focusCategories[0];
    const catMessages = {
      wealth: "Money respects alignment. Your financial future starts with your daily choices.",
      body: "Your future body is built in today's decisions. Move intentionally.",
      love: "Your future relationships are built on today's integrity.",
      business: "Your empire starts with one aligned day. This is it.",
      home: "Your sanctuary is built by consistent care. Start today.",
      lifestyle: "The life you want is created by who you become daily.",
      spiritual: "Your spirit knows what alignment feels like. Trust it.",
    };
    if (catMessages[cat]) {
      messages.push(catMessages[cat]);
    }
  }

  // ── MORNING CHECK-IN MESSAGES ──
  if (morningCheckinDone) {
    messages.push(
      "You started today with intention. Build on it.",
      "Morning alignment sets the tone. Your day is already better.",
      "You protected your morning. Now protect your momentum.",
      "Presence at dawn creates presence all day. You did that."
    );
  }

  // ── IDENTITY LEVEL MESSAGES ──
  if (identityLevel >= 4) {
    messages.push(
      "You're an advanced practitioner now. Act like it.",
      "This level requires consistency. You've earned it.",
      "Your identity is solid. Deepen it today.",
      "You're not new to this. You're building mastery."
    );
  } else if (identityLevel >= 2) {
    messages.push(
      "You're building real identity shifts. Keep compounding.",
      "This level is where change accelerates. Stay the course.",
      "You're past the beginner stage. Own it.",
      "Your identity work is working. Prove it today."
    );
  }

  // ── ENERGY-BASED MESSAGES ──
  if (lastCheckinEnergy <= 3) {
    messages.push(
      "Energy is low. Light habits only. Progress, not perfection.",
      "Rest is alignment too. Do what you can today.",
      "You're conserving energy wisely. That's wisdom.",
      "Low energy days test your identity. You've got this."
    );
  } else if (lastCheckinEnergy >= 8) {
    messages.push(
      "Your energy is high. Push past your usual limits today.",
      "This energy is a gift. Use it aligned.",
      "You're feeling it. This is when breakthroughs happen.",
      "Channel this energy into your biggest goal today."
    );
  }

  // ── UNIVERSAL TIMELESS MESSAGES (always available) ──
  messages.push(
    "Your future responds to who you become daily.",
    "Act like the version of you that you are becoming.",
    "Consistency is how your future self starts recognizing you.",
    "One aligned choice today can restart your momentum.",
    "Your decisions today vote for your future identity.",
    "This moment is where alignment happens.",
    "You're not preparing for change—you're becoming it.",
    "Every action aligns you or misaligns you. Choose.",
    "Your future isn't waiting. It's watching what you do now."
  );

  // Pick deterministically based on day, but weighted by state
  // Use dayOfYear + streak + habit completion as seed for variety
  const seed = dayOfYear + streak + habitCompletion;
  const index = seed % messages.length;
  
  return messages[index];
}