import fs from 'node:fs/promises';
import path from 'node:path';
import { uploadDirectory } from '../middleware/upload.js';

export async function removePhotos(photos = []) {
  await Promise.all(photos.map(async (photo) => {
    const fullPath = path.resolve(uploadDirectory, photo.filename);
    if (path.dirname(fullPath) !== uploadDirectory) return;
    try { await fs.unlink(fullPath); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }));
}

export function uploadedPhoto(file) {
  return { filename: file.filename, path: `/uploads/${file.filename}`, originalName: file.originalname };
}
