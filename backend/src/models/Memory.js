import mongoose from 'mongoose';

const photoSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  path: { type: String, required: true },
  originalName: { type: String, required: true },
}, { _id: false });

const memorySchema = new mongoose.Schema({
  title: { type: String, required: [true, 'Title is required'], trim: true, maxlength: 120 },
  location: { type: String, trim: true, maxlength: 120, default: '' },
  date: { type: Date, required: [true, 'Date is required'] },
  notes: { type: String, trim: true, maxlength: 5000, default: '' },
  importantPerson: { type: String, trim: true, maxlength: 120, default: '' },
  photos: { type: [photoSchema], default: [] },
}, { timestamps: true });

export default mongoose.model('Memory', memorySchema);
