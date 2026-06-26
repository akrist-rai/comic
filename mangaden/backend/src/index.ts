import Koa from 'koa';
import { koaBody } from 'koa-body';
import { cors } from './middleware/cors';
import { mangaRouter } from './routes/manga';

const app  = new Koa();
const PORT = 3001;

app.use(cors);
// ── Body size limit ───────────────────────────────────────────────────────────
// koa-body's default JSON limit is 1 MB.
// A base64-encoded cover image is ~33% larger than the raw file — a typical
// 600 KB JPEG becomes ~800 KB of text. We raise the limit to 10 MB to be safe.
app.use(koaBody({ jsonLimit: '10mb' }));
app.use(mangaRouter.routes());
app.use(mangaRouter.allowedMethods());

app.listen(PORT, () => {
  console.log(`MangaDen API  →  http://localhost:${PORT}`);
});
