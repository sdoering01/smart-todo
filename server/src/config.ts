import "dotenv/config";

export const NODE_ENV = process.env.NODE_ENV || "development";
let port = Number(process.env.PORT);
export const PORT = Number.isNaN(port) ? 3000 : port;
export const DATABASE_CONNECTION_URL = process.env.DATABASE_CONNECTION_URL || "postgresql://postgres:postgres@localhost:5432/postgres";
