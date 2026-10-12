// Pravi "env.KV" (kao na Cloudflare-u) preko Netlify Blobs, da ostatak koda ostane isti.
import { getStore } from '@netlify/blobs';

export function makeEnv() {
  const store = getStore({ name: 'syntax-site', consistency: 'strong' });
  return {
    KV: {
      get: (key) => store.get(key, { type: 'text' }),
      put: (key, value) => store.set(key, value),
      delete: (key) => store.delete(key),
      list: async ({ prefix } = {}) => {
        const { blobs } = await store.list({ prefix });
        return { keys: (blobs || []).map((b) => ({ name: b.key })), list_complete: true, cursor: '' };
      },
    },
  };
}

export function makeCtx(context) {
  return {
    waitUntil: (p) => {
      if (context && typeof context.waitUntil === 'function') context.waitUntil(p);
      else Promise.resolve(p).catch(() => {});
    },
  };
}
