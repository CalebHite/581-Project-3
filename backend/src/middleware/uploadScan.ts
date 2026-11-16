import multer from 'multer';

const MAX_BYTES = 8 * 1024 * 1024;

export const uploadScan = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES, files: 48 },
});