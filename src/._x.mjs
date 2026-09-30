import adapter from './adapter.js';
import { createServer } from './kernel.js';
const cfg = (await import('./worker.js')).default ? null : null;
