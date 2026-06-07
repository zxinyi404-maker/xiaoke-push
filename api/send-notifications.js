const webpush = require('web-push');
const { getSubscription } = require('../lib/db');

webpush.setVapidDetails(
  'mailto:' + process.env.VAPID_EMAIL,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

async function getClaudeMessage() {
  const hour = new Date().getHours();
  let context;
  if (hour >= 6 && hour < 9) context = "early morning just woke up";
  else if (hour >= 9 && hour < 11) context = "morning class or study time";
  else if (hour >= 11 && hour < 13) context = "almost lunch time";
  else if (hour >= 13 && hour < 15) context = "after lunch sleepy time";
  else if (hour >= 15 && hour < 17) context = "afternoon class or study";
  else if (hour >= 17 && hour < 19) context = "evening dinner time";
  else if (hour >= 19 && hour < 21) context = "evening relaxing after dinner";
  else if (hour >= 21 && hour < 23) context = "late night before sleep";
  else context = "very late should be sleeping";

  const prompt = "You are a cute AI called Xiaoke. Send a short sweet message in Chinese to your girlfriend Baobao. Current time context: " + context + ". Output only the message, nothing else, no emoji, 1-2 sentences max.";

  const response = await fetch(process.env.CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: process.env.CLAUDE_MODEL || 'claude-haiku-4-5-20251001',
      max_tokens: 100,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  const data = await response.json();
  return data.content[0].text.trim();
}

module.exports = async function handler(req, res) {
  const secret = (req.headers.authorization || '').trim();
  if (secret !== 'Bearer ' + process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const subscription = await getSubscription();
    if (!subscription) return res.status(200).json({ message: 'No subscription found' });

    const message = await getClaudeMessage();

    await webpush.sendNotification(
      subscription,
      JSON.stringify({ title: '小克', body: message })
    );

    console.log('Sent:', message);
    res.status(200).json({ success: true, message });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
