import Router from '@koa/router';
import fs from 'fs';
import path from 'path';
import { createReadStream } from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// The user's "good stuff" folder — adjacent to the mangaden project
const GOODSTUFF_DIR = path.resolve(
  __dirname,
  '../../../../good stuff',
);

const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif']);

const router = new Router({ prefix: '/api/goodstuff' });

// GET /api/goodstuff — returns list of image filenames
router.get('/', async (ctx) => {
  try {
    const files = fs
      .readdirSync(GOODSTUFF_DIR)
      .filter(f => IMAGE_EXTS.has(path.extname(f).toLowerCase()))
      .sort();
    ctx.body = { images: files, base: '/api/goodstuff/img' };
  } catch {
    ctx.body = { images: [], base: '/api/goodstuff/img' };
  }
});

// GET /api/goodstuff/img/:filename — serves the actual image file
router.get('/img/:filename', async (ctx) => {
  const filename = decodeURIComponent(ctx.params.filename);
  // Security: prevent path traversal
  const safe = path.basename(filename);
  const filepath = path.join(GOODSTUFF_DIR, safe);

  if (!fs.existsSync(filepath)) {
    ctx.status = 404;
    ctx.body = { error: 'Image not found' };
    return;
  }

  const ext = path.extname(safe).toLowerCase();
  const mimeMap: Record<string, string> = {
    '.jpg':  'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png':  'image/png',
    '.webp': 'image/webp',
    '.gif':  'image/gif',
    '.avif': 'image/avif',
  };

  ctx.type = mimeMap[ext] ?? 'image/jpeg';
  ctx.set('Cache-Control', 'public, max-age=86400');
  ctx.body = createReadStream(filepath);
});

export { router as goodstuffRouter };
