import { removePhotos } from '../utils/photos.js';

export async function notFound(_req, res) {
  res.status(404).json({ message: 'Route not found.' });
}

export async function errorHandler(error, req, res, _next) {
  if (req.files?.length) await removePhotos(req.files).catch(() => {});
  if (error.name === 'ValidationError') {
    return res.status(400).json({ message: Object.values(error.errors).map((item) => item.message).join(', ') });
  }
  if (error.name === 'CastError') return res.status(400).json({ message: 'Invalid value provided.' });
  if (error.code === 11000) return res.status(409).json({ message: 'A record with that value already exists.' });
  if (error.name === 'MulterError') {
    const message = error.code === 'LIMIT_FILE_SIZE' ? 'Each photo must be 5 MB or smaller.' : 'Upload up to 10 photos per request.';
    return res.status(400).json({ message });
  }
  if (error.message === 'Only image files can be uploaded.') return res.status(400).json({ message: error.message });
  if (error instanceof SyntaxError && 'body' in error) return res.status(400).json({ message: 'Request body must contain valid JSON.' });
  console.error(error);
  res.status(500).json({ message: 'Something went wrong on the server.' });
}
