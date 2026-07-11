import Koa from 'koa';
import { koaBody } from 'koa-body';
import fs from 'fs';
import path from 'path';
import { createReadStream } from 'fs';
import { fileURLToPath } from 'url';
import { cors } from './middleware/cors';
import { tasksRouter } from './routes/tasks';
import { goodstuffRouter } from './routes/goodstuff';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const UPLOADS_DIR = path.resolve(__dirname, '../../uploads/covers');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const app  = new Koa();
const PORT = 3001;

const IMAGE_MIME: Record<string, string> = {
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png':  'image/png',
  '.webp': 'image/webp',
  '.gif':  'image/gif',
  '.avif': 'image/avif',
};

app.use(cors);

app.use(koaBody({
  jsonLimit: '10mb',
  multipart: true,
  formidable: {
    uploadDir:      UPLOADS_DIR,
    keepExtensions: true,
    maxFileSize:    10 * 1024 * 1024,
  },
}));

// Serve uploaded cover images
app.use(async (ctx, next) => {
  if (!ctx.path.startsWith('/api/covers/')) { await next(); return; }

  const filename = path.basename(decodeURIComponent(ctx.path.replace('/api/covers/', '')));
  const filepath = path.join(UPLOADS_DIR, filename);

  if (!fs.existsSync(filepath)) { ctx.status = 404; ctx.body = { error: 'Not found' }; return; }

  ctx.type = IMAGE_MIME[path.extname(filename).toLowerCase()] ?? 'image/jpeg';
  ctx.set('Cache-Control', 'public, max-age=86400');
  ctx.body = createReadStream(filepath);
});

app.use(tasksRouter.routes());
app.use(tasksRouter.allowedMethods());
app.use(goodstuffRouter.routes());
app.use(goodstuffRouter.allowedMethods());

app.listen(PORT, () => {
  console.log(`Taskden API  →  http://localhost:${PORT}`);
});
