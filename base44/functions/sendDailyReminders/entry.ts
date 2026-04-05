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

      // Morning reminder
      if (profile.morning_reminder_enabled && profile.morning_reminder_time) {
        if (currentHHMM === profile.morning_reminder_time) {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: profile.user_email,
            subject: '☀️ Time for Your Morning Alignment',
            body: `Good morning!\n\nYour Morning Alignment Check-In is waiting. Take a moment to set your intention, express gratitude, and commit to your one goal for today.\n\nOpen Manifest Mode to begin: ${Deno.env.get('APP_URL') || 'https://manifestmode.app'}/daily-shift\n\n✦ Manifest Mode`,
          });
          morningCount++;
        }
      }

      // Evening reminder
      if (profile.evening_reminder_enabled && profile.evening_reminder_time) {
        if (currentHHMM === profile.evening_reminder_time) {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: profile.user_email,
            subject: '🌙 Time for Your Evening Review',
            body: `Good evening!\n\nYour Evening Alignment Review is ready. Reflect on how aligned your actions, identity, and emotions were today.\n\nOpen Manifest Mode to complete it: ${Deno.env.get('APP_URL') || 'https://manifestmode.app'}/daily-shift\n\n✦ Manifest Mode`,
          });
          eveningCount++;
        }
      }
    }

    return Response.json({ success: true, morning_sent: morningCount, evening_sent: eveningCount });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});