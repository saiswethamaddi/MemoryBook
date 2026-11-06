import mongoose from 'mongoose';
import Memory from '../models/Memory.js';
import { removePhotos, uploadedPhoto } from '../utils/photos.js';

const isValidId = (id) => mongoose.isValidObjectId(id);

export async function createMemory(req, res, next) {
  try {
    const memory = await Memory.create({ ...req.body, photos: (req.files || []).map(uploadedPhoto) });
    res.status(201).json(memory);
  } catch (error) { next(error); }
}

export async function getMemories(req, res, next) {
  try {
    const { search, location, dateFrom, dateTo } = req.query;
    const filter = {};
    if (search?.trim()) {
      const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [{ title: { $regex: escaped, $options: 'i' } }, { importantPerson: { $regex: escaped, $options: 'i' } }];
    }
    if (location?.trim()) filter.location = { $regex: location.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
    if (dateFrom || dateTo) {
      filter.date = {};
      if (dateFrom) filter.date.$gte = new Date(dateFrom);
      if (dateTo) filter.date.$lte = new Date(`${dateTo}T23:59:59.999Z`);
      if (Object.values(filter.date).some((date) => Number.isNaN(date.getTime()))) return res.status(400).json({ message: 'Date filters must be valid dates.' });
    }
    const memories = await Memory.find(filter).sort({ date: -1, createdAt: -1 });
    res.json(memories);
  } catch (error) { next(error); }
}

export async function getMemory(req, res, next) {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ message: 'Invalid memory id.' });
    const memory = await Memory.findById(req.params.id);
    if (!memory) return res.status(404).json({ message: 'Memory not found.' });
    res.json(memory);
  } catch (error) { next(error); }
}

export async function updateMemory(req, res, next) {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ message: 'Invalid memory id.' });
    const memory = await Memory.findById(req.params.id);
    if (!memory) return res.status(404).json({ message: 'Memory not found.' });

    const { title, location, date, notes, importantPerson, removePhotoFilenames } = req.body;
    for (const [key, value] of Object.entries({ title, location, date, notes, importantPerson })) {
      if (value !== undefined) memory[key] = value;
    }
    const removeNames = removePhotoFilenames === undefined ? [] :
      Array.isArray(removePhotoFilenames) ? removePhotoFilenames : [removePhotoFilenames];
    const removed = memory.photos.filter((photo) => removeNames.includes(photo.filename));
    memory.photos = memory.photos.filter((photo) => !removeNames.includes(photo.filename));
    memory.photos.push(...(req.files || []).map(uploadedPhoto));
    await memory.save();
    await removePhotos(removed);
    res.json(memory);
  } catch (error) { next(error); }
}

export async function deleteMemory(req, res, next) {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ message: 'Invalid memory id.' });
    const memory = await Memory.findByIdAndDelete(req.params.id);
    if (!memory) return res.status(404).json({ message: 'Memory not found.' });
    await removePhotos(memory.photos);
    res.json({ message: 'Memory and its photos were deleted.' });
  } catch (error) { next(error); }
}
