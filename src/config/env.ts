const PORT = Number(process.env.PORT) || 4000;

const DATABASE_URL = process.env.DATABASE_URL;

const JWT_SECRET = process.env.JWT_SECRET;

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
  REDIS_URL: process.env.REDIS_URL,
};
