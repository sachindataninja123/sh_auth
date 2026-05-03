import dotenv from "dotenv";
dotenv.config();

if (!process.env.MONGO_URL) {
  throw new Error("MONGO_URL is not defined in environment variable");
}

if (!process.env.PORT) {
  throw new Error("PORT is not defined in environment variable");
}
if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in environment variable");
}
if (!process.env.JWT_REFRESH_SECRET) {
  throw new Error("JWT_REFRESH_SECRET is not defined in environment variable");
}


const config = {
  MONGO_URL: process.env.MONGO_URL,
  PORT: process.env.PORT,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_REFRESH_SECRET : process.env.JWT_REFRESH_SECRET
};

export default config;
