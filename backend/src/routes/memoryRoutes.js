import { Router } from 'express';
import { createMemory, deleteMemory, getMemories, getMemory, updateMemory } from '../controllers/memoryController.js';
import upload from '../middleware/upload.js';

const router = Router();
router.route('/').get(getMemories).post(upload.array('photos', 10), createMemory);
router.route('/:id').get(getMemory).put(upload.array('photos', 10), updateMemory).delete(deleteMemory);
export default router;
