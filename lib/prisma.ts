import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  dbConnected?: boolean;
};

let prisma: PrismaClient;
let dbConnected = false;

if (process.env.DATABASE_URL) {
  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      // Lower timeouts for quick check if database is down
      connectionTimeoutMillis: 2000, 
    });
    
    // Test pool connection immediately on init to avoid blocking operations later
    pool.on("error", (err) => {
      console.warn("Database pool connection error:", err.message);
      globalForPrisma.dbConnected = false;
    });

    const adapter = new PrismaPg(pool);
    
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = new PrismaClient({ adapter });
    }
    prisma = globalForPrisma.prisma;
    dbConnected = true;
  } catch (error) {
    console.warn("Failed to initialize Prisma database client, using fallback mock memory database. Error:", error);
    prisma = new PrismaClient(); // Fallback without adapter to prevent undefined, though it will fail if queried
    dbConnected = false;
  }
} else {
  console.warn("DATABASE_URL is not set. Using fallback mock memory database.");
  prisma = new PrismaClient();
  dbConnected = false;
}

export { prisma, dbConnected };
export default prisma;
