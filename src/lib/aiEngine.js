// AI Analysis Engine - generates personalized insights from assessment data

export function generateAnalysis(form) {
  const avg = (keys) => {
    const vals = keys.map(k => form[k]).filter(v => typeof v === "number");
    return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 5;
  };

  const mindsetRaw = avg(["confidence_level", "self_image", "emotional_state"]);
  const disciplineRaw = avg(["discipline_level", "consistency_level", "productivity_level"]);
  const healthRaw = avg(["energy_level", "sleep_quality", "fitness_habits"]);
  const financialRaw = avg(["financial_habits"]);
  const confidenceRaw = avg(["confidence_level", "self_image"]);
  const environmentRaw = avg(["stress_level"]);

  // Stress is inverse
  const stressInverse = 11 - (form.stress_level || 5);

  const toScore = (raw) => Math.min(100, Math.round((raw / 10) * 100));
  const mindset_score = toScore(mindsetRaw);
  const discipline_score = toScore(disciplineRaw);
  const health_score = toScore(healthRaw);
  const financial_score = toScore(financialRaw);
  const confidence_score = toScore(confidenceRaw);
  const environment_score = toScore(stressInverse);

  const overall_score = Math.round(
    (mindset_score * 0.2 + discipline_score * 0.2 + health_score * 0.2 +
      financial_score * 0.15 + confidence_score * 0.15 + environment_score * 0.1)
  );

  // Generate insights based on scores
  const strengths = [];
  const blocks = [];

  if (mindset_score >= 65) strengths.push("Your mindset is operating at a level that supports growth");
  else blocks.push("Your thought patterns are creating friction with your desired reality");

  if (discipline_score >= 65) strengths.push("Your discipline creates a reliable foundation for progress");
  else blocks.push("Inconsistent daily actions are widening the gap between you and your vision");

  if (health_score >= 65) strengths.push("Your physical state gives you the energy to execute on your goals");
  else blocks.push("Low energy and poor health habits are limiting your capacity to show up fully");

  if (financial_score >= 65) strengths.push("Your financial habits align with building long-term wealth");
  else blocks.push("Your current relationship with money is misaligned with financial freedom");

  if (confidence_score >= 65) strengths.push("Your self-belief is strong enough to take bold action");
  else blocks.push("Self-doubt is causing you to underinvest in your own potential");

  const limitingBeliefsMap = {
    low_confidence: "I'm not ready yet — the right time will come",
    low_discipline: "I've tried before and failed, so I'm probably not capable",
    low_financial: "Money is hard and success is for other people, not me",
    low_health: "I don't have the energy or willpower to change my lifestyle",
    low_mindset: "My circumstances are responsible for where I am",
  };

  const limiting_beliefs = [];
  const replacement_beliefs = [];

  if (confidence_score < 60) {
    limiting_beliefs.push("I'm not yet the kind of person who achieves this level of success");
    replacement_beliefs.push("I am actively becoming the version of me who naturally operates at this level");
  }
  if (discipline_score < 60) {
    limiting_beliefs.push("I've started before and didn't follow through — I lack the discipline");
    replacement_beliefs.push("Every day I show up is proof that my discipline is being built. I am consistent.");
  }
  if (financial_score < 60) {
    limiting_beliefs.push("Wealth and financial freedom are reserved for people with better opportunities");
    replacement_beliefs.push("I am developing the mindset, skills, and habits that make financial abundance my default state");
  }
  if (mindset_score < 60) {
    limiting_beliefs.push("My past defines my future — I carry too much baggage to change");
    replacement_beliefs.push("My past is data, not destiny. Every morning is a new opportunity to operate differently.");
  }
  if (limiting_beliefs.length < 3) {
    limiting_beliefs.push("I need everything to be perfect before I can move forward seriously");
    replacement_beliefs.push("Imperfect action taken today creates more momentum than perfect plans never started");
  }

  const habit_upgrades = [];
  if (discipline_score < 70) habit_upgrades.push("Build a non-negotiable 60-minute morning routine before any screens");
  if (health_score < 70) habit_upgrades.push("Move your body intentionally for 30 minutes, 5 days per week — no exceptions");
  if (financial_score < 70) habit_upgrades.push("Review and track your finances every Sunday — money flows where attention goes");
  if (mindset_score < 70) habit_upgrades.push("Read or listen to 20 minutes of growth content daily to rewire your thinking");
  if (confidence_score < 70) habit_upgrades.push("Take one uncomfortable action every day that your future self would be proud of");
  while (habit_upgrades.length < 3) habit_upgrades.push("Spend 10 minutes each night reviewing what you accomplished and what's next");

  const affirmations = [
    "I am becoming the version of me that naturally attracts the life I'm building toward",
    "My daily discipline is compounding. Every action I take is building my future reality",
    "I no longer think like the old version of myself. My identity is evolving daily",
    "I am worthy of everything in my vision board. I am actively closing the gap",
    "My habits, thoughts, and standards are aligned with the life I am stepping into",
  ];

  const action_plan = [
    `Define your top 3 non-negotiable daily habits and execute them before noon tomorrow`,
    `Write a letter from your future self, 3 years from now, describing your current daily life`,
    `Audit one area of your life that is the biggest misalignment — and take one action to shift it today`,
    `Identify one relationship or environment draining your energy and begin creating distance`,
    `Set your phone to silent for 2 hours tomorrow morning and use that time to move toward your vision`,
  ];

  const identity_shifts = [
    `Shift from reacting to your circumstances to designing your daily environment intentionally`,
    `Move from someone who consumes content about success to someone who executes on it`,
    `Release the identity of someone who almost has it together — become someone who is fully committed`,
  ];

  const weakest = Math.min(mindset_score, discipline_score, health_score, financial_score);
  const weakestArea =
    weakest === mindset_score ? "mindset alignment" :
    weakest === discipline_score ? "daily discipline" :
    weakest === health_score ? "physical health habits" : "financial alignment";

  const insight_summary = `Your current Reality Match Score is ${overall_score}/100. Your strongest alignment is in ${
    strengths[0] ? strengths[0].toLowerCase() : "your commitment to growth"
  }. Your most critical area for focus is ${weakestArea}.`;

  const strengths_summary = strengths.slice(0, 2).join(". ") || "You have a foundation to build from — your awareness is your first strength.";
  const misalignment_summary = blocks.slice(0, 2).join(". ") || "Focus on consistency and daily execution to close the alignment gap.";

  const daily_focus = habit_upgrades[0]?.split(" — ")[0] || "Execute with intention. Every action is a vote for your future self.";

  const future_self_statement = `Someone who operates with clarity, discipline, and confidence — who has built ${
    form.income_range?.includes("$200") || form.income_range?.includes("$500") ? "significant financial freedom" : "intentional financial growth"
  }, maintains a high-energy lifestyle, and shows up daily as the best version of themselves.`;

  return {
    overall_score,
    mindset_score,
    discipline_score,
    financial_score,
    health_score,
    confidence_score,
    environment_score,
    insight_summary,
    strengths_summary,
    misalignment_summary,
    limiting_beliefs: limiting_beliefs.slice(0, 3),
    replacement_beliefs: replacement_beliefs.slice(0, 3),
    habit_upgrades: habit_upgrades.slice(0, 3),
    daily_focus,
    future_self_statement,
    affirmations,
    action_plan,
    identity_shifts,
  };
}