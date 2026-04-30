const fs = require('fs');
const path = require('path');

const isServerless = () => Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

const getUploadsDir = () => {
  if (isServerless()) {
    // Vercel/AWS Lambda: only /tmp is writable (ephemeral).
    return path.join('/tmp', 'uploads');
  }
  // Local / traditional server: keep uploads inside the backend folder.
  return path.resolve(__dirname, '..', '..', 'uploads');
};

const ensureUploadsDir = () => {
  const uploadsDir = getUploadsDir();
  try {
    fs.mkdirSync(uploadsDir, { recursive: true });
  } catch (_error) {
    // If it fails (e.g., read-only FS), let callers handle the error path.
  }
  return uploadsDir;
};

module.exports = {
  getUploadsDir,
  ensureUploadsDir,
};

