const STORAGE_KEY = 'indusecc_offline_queue_v1';

const readQueue = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const writeQueue = (queue) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
};

export const enqueueOfflineRequest = (config) => {
  const queue = readQueue();
  queue.push({
    url: config.url,
    method: config.method,
    data: config.data ?? null,
    headers: config.headers ?? {},
    params: config.params ?? {},
    queuedAt: new Date().toISOString(),
  });
  writeQueue(queue);
};

export const flushOfflineQueue = async () => {
  if (!navigator.onLine) return { sent: 0, failed: 0 };
  const queue = readQueue();
  if (!queue.length) return { sent: 0, failed: 0 };

  const remaining = [];
  let sent = 0;
  let failed = 0;

  for (const item of queue) {
    try {
      const token = localStorage.getItem('token');
      const baseURL = import.meta.env.VITE_API_URL || '/api/';
      const cleanBase = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL;
      const cleanUrl = item.url.startsWith('/') ? item.url : `/${item.url}`;
      const absoluteUrl = `${cleanBase}${cleanUrl}`;

      const response = await fetch(absoluteUrl, {
        method: item.method?.toUpperCase() || 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: item.data ? JSON.stringify(item.data) : undefined,
      });
      if (!response.ok) throw new Error('queued request failed');
      sent += 1;
    } catch {
      failed += 1;
      remaining.push(item);
    }
  }

  writeQueue(remaining);
  return { sent, failed };
};

export const setupOfflineQueueSync = () => {
  window.addEventListener('online', () => {
    flushOfflineQueue().catch(() => {});
  });
};
