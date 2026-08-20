const PING_INTERVAL_MS = 10 * 60 * 1000;

export function startKeepAwake(): NodeJS.Timeout | null {
  const base = process.env.RENDER_EXTERNAL_URL;

  if (!base) return null;

  const target = base.replace(/\/+$/, '') + '/api/health';

  const timer = setInterval(() => {
    fetch(target)
      .then((response) => {
        if (!response.ok) console.warn('[keepawake] health returned ' + response.status);
      })
      .catch((error) => {
        console.warn('[keepawake] ping failed: ' + String((error as Error).message));
      });
  }, PING_INTERVAL_MS);

  timer.unref?.();

  console.log('[keepawake] pinging ' + target + ' every 10 minutes');

  return timer;
}
