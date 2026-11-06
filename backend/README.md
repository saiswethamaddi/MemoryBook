# My Memory Book API

This folder contains the Node.js and Express API. MongoDB stores each memory and its photo filenames; the actual image files are saved in `uploads/` while developing.

## Setup

1. Install Node.js (LTS) and start MongoDB locally, or create a MongoDB Atlas database.
2. In a terminal, change to the `backend` folder and install its packages:

   ```bash
   cd Memory-book/backend
   npm install
   ```

3. Copy `.env.example` to `.env`. Set `MONGODB_URI` to your local MongoDB URL or Atlas connection string. Keep `.env` private.
4. Start the API:

   ```bash
   npm run dev
   ```

The API listens on `http://localhost:5000`. Visit `/api/health` to check that the server is running. The database must be available before the server starts.

## Routes

All responses are JSON. Memories are returned newest first. Use `multipart/form-data` when sending photos; the photo field is named `photos` and accepts up to 10 image files (5 MB each).

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/memories` | List memories; optional `search`, `location`, `dateFrom`, `dateTo` query parameters |
| GET | `/api/memories/:id` | Get one memory and all its details |
| POST | `/api/memories` | Create a memory; send fields `title`, `location`, `date`, `notes`, `importantPerson`, plus `photos` files |
| PUT | `/api/memories/:id` | Update supplied fields, append `photos`, and optionally remove photos |
| DELETE | `/api/memories/:id` | Delete a memory and its saved photo files |

For `PUT`, send the filenames to remove as a `removePhotoFilenames` field (repeat that field for multiple filenames, or provide a JSON array when sending JSON). Existing photo objects include their filename. Newly uploaded files are added to the photos array.

Image paths in returned memory objects are relative, for example `/uploads/<filename>`. Open them at `http://localhost:5000/uploads/<filename>`.

## Main files

- `server.js` loads environment settings, connects to MongoDB and starts Express.
- `src/config/db.js` contains the Mongoose database connection.
- `src/models/Memory.js` defines and validates saved memory fields.
- `src/routes/memoryRoutes.js` maps REST endpoints to controller functions.
- `src/controllers/memoryController.js` implements listing, searching/filtering, and CRUD.
- `src/middleware/upload.js` configures Multer storage and upload limits.
- `src/middleware/errorHandler.js` returns readable validation and upload errors.
- `src/utils/photos.js` saves photo metadata and removes image files when requested.
- `src/app.js` configures CORS, static photo access and API routes.
