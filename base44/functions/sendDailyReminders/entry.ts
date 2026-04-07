import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// Converts a local HH:MM time in a given IANA timezone to the current UTC hour/minute
function getLocalTimeInTimezone(timezone) {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const parts = formatter.formatToParts(now);
    const hour = parseInt(parts.find(p => p.type === 'hour').value);
    const minute = parseInt(parts.find(p => p.type === 'minute').value);
    return { hour, minute };
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Allow scheduled call (no user) — use service role
    const profiles = await base44.asServiceRole.entities.UserProfile.list();

    let morningCount = 0;
    let eveningCount = 0;

    for (const profile of profiles) {
      if (!profile.user_email) continue;

      const timezone = profile.timezone || 'America/New_York';
      const localTime = getLocalTimeInTimezone(timezone);
      if (!localTime) continue;

      const { hour, minute } = localTime;
      // Only fire within the same clock-minute as configured
      const pad = (n) => String(n).padStart(2, '0');
      const currentHHMM = `${pad(hour)}:${pad(minute)}`;

      const APP_URL = Deno.env.get('APP_URL') || 'https://manifestmode.app';

      const reminders = [
        {
          enabled: profile.morning_intention_enabled,
          time: profile.morning_intention_time,
          subject: '☀️ Time for Your Morning Alignment',
          body: `Good morning!\n\nYour Morning Alignment Check-In is waiting. Take a moment to set your intention, express gratitude, and commit to your one goal for today.\n\nOpen Manifest Mode to begin: ${APP_URL}/daily-shift\n\n✦ Manifest Mode`,
          counter: 'morning',
        },
        {
          enabled: profile.midday_alignment_enabled,
          time: profile.midday_alignment_time,
          subject: '🔄 Midday Emotion Reset',
          body: `Hey!\n\nIt's time for your Midday Emotion Alignment reset. Pause, breathe, and realign with who you're becoming.\n\nOpen Manifest Mode: ${APP_URL}/daily-shift\n\n✦ Manifest Mode`,
          counter: 'morning',
        },
        {
          enabled: profile.evening_reflection_enabled,
          time: profile.evening_reflection_time,
          subject: '🌙 Time for Your Evening Review',
          body: `Good evening!\n\nYour Evening Alignment Review is ready. Reflect on how aligned your actions, identity, and emotions were today.\n\nOpen Manifest Mode to complete it: ${APP_URL}/daily-shift\n\n✦ Manifest Mode`,
          counter: 'evening',
        },
        {
          enabled: profile.morning_emotion_enabled,
          time: profile.morning_emotion_time,
          subject: '🌅 Morning Emotion Alignment',
          body: `Good morning!\n\nStart your day by tuning into your emotions. Your Morning Emotion Alignment session is ready.\n\nOpen Manifest Mode: ${APP_URL}/daily-shift\n\n✦ Manifest Mode`,
          counter: 'morning',
        },
        {
          enabled: profile.evening_emotion_enabled,
          time: profile.evening_emotion_time,
          subject: '🌙 Evening Emotion Alignment',
          body: `Good evening!\n\nTime to close the loop on your emotions for today. Your Evening Emotion Alignment is waiting.\n\nOpen Manifest Mode: ${APP_URL}/daily-shift\n\n✦ Manifest Mode`,
          counter: 'evening',
        },
      ];

      for (const reminder of reminders) {
        if (reminder.enabled && reminder.time && currentHHMM === reminder.time) {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: profile.user_email,
            subject: reminder.subject,
            body: reminder.body,
          });
          if (reminder.counter === 'morning') morningCount++;
          else eveningCount++;
        }
      }
    }

    return Response.json({ success: true, morning_sent: morningCount, evening_sent: eveningCount });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});