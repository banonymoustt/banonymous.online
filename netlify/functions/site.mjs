// Prima SVE zahteve ka sajtu ( /, /v/ID, /info, /contact, /api/..., /admin/... )
import { handleRequest } from '../../src/core.mjs';
import { makeEnv, makeCtx } from '../../src/env.mjs';

export default async (request, context) => handleRequest(request, makeEnv(), makeCtx(context));

export const config = { path: '/*' };
