// Na svakih 5 minuta proverava YouTube kanal (novi videi, pregledi)
import { runRefresh } from '../../src/core.mjs';
import { makeEnv } from '../../src/env.mjs';

export default async () => {
  try {
    const s = await runRefresh(makeEnv());
    console.log('refresh', JSON.stringify(s));
  } catch (e) {
    console.log('refresh failed', e && e.message);
  }
};

export const config = { schedule: '*/5 * * * *' };
