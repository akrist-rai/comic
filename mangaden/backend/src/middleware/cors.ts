import type { Context, Next } from 'koa';

export async function cors(ctx: Context, next: Next) {
  ctx.set('Access-Control-Allow-Origin',  'http://localhost:5173');
  ctx.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  ctx.set('Access-Control-Allow-Headers', 'Content-Type');

  if (ctx.method === 'OPTIONS') {
    ctx.status = 204;
    return;
  }

  await next();
}
