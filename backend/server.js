import 'dotenv/config';
import app from './src/app.js';
import connectDB from './src/config/db.js';

const port = Number(process.env.PORT) || 5000;

try {
  await connectDB();
  app.listen(port, () => console.log(`Memory Book API running on http://localhost:${port}`));
} catch (error) {
  console.error('MongoDB/API Error:', error);
  console.error('Cause:', error.cause);
  process.exit(1);
}
