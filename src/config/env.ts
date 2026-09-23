const PORT = Number(process.env.PORT) || 4000;

const DATABASE_URL = process.env.DATABASE_URL;

const JWT_SECRET = process.env.JWT_SECRET;
const MEDIA_ENCRYPTION_KEY = process.env.MEDIA_ENCRYPTION_KEY;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined");
}

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined");
}

export const env = {
  PORT,
  DATABASE_URL,
  JWT_SECRET,
  MEDIA_ENCRYPTION_KEY,
  REDIS_URL: process.env.REDIS_URL,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
};
