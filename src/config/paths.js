import path from 'node:path';
import {fileURLToPath} from 'node:url';

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

export const EXPORT_DIR = path.join(PROJECT_ROOT, 'exports');
export const BACKUPS_DIR = path.join(EXPORT_DIR, 'backups');