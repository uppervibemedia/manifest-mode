import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // This function is called by a scheduled automation — no user auth needed
    // Use service role to check all users for missed habits
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = yesterday.toISOString().split("T")[0];

    // Get all active habits
    const habits = await base44.asServiceRole.entities.Habit.list('-created_date', 200);
    const activeHabits = habits.filter(h => h.is_active);

    if (activeHabits.length === 0) {
      return Response.json({ message: "No active habits found", reminded: 0 });
    }

    // Get yesterday's logs
    const allLogs = await base44.asServiceRole.entities.HabitLog.filter({ log_date: yStr }, '-created_date', 500);

    // Group habits by user
    const userMap = {};
    for (const habit of activeHabits) {
      if (!userMap[habit.user_email]) userMap[habit.user_email] = [];
      userMap[habit.user_email].push(habit);
    }

    let remindedCount = 0;

    for (const [email, userHabits] of Object.entries(userMap)) {
      const userLogs = allLogs.filter(l => l.user_email === email && l.completed);
      const completedIds = new Set(userLogs.map(l => l.habit_id));
      const missedHabits = userHabits.filter(h => !completedIds.has(h.id));

      if (missedHabits.length === 0) continue;

      // Send reminder email
      const missedNames = missedHabits.slice(0, 3).map(h => `• ${h.title}`).join('\n');
      const moreCount = missedHabits.length > 3 ? `\n+${missedHabits.length - 3} more` : '';

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: email,
        subject: `⚡ ${missedHabits.length} habit${missedHabits.length > 1 ? 's' : ''} missed yesterday — bounce back today`,
        body: `You missed ${missedHabits.length} habit${missedHabits.length > 1 ? 's' : ''} yesterday:\n\n${missedNames}${moreCount}\n\nYour future self is built one day at a time. Today is a fresh start — show up and close the gap.\n\nOpen your Habit Tracker to check them off today.\n\n✦ Manifest Mode`,
      });

      remindedCount++;
    }

    return Response.json({ message: "Reminders sent", reminded: remindedCount });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});