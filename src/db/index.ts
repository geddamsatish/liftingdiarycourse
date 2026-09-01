import { drizzle } from 'drizzle-orm/neon-http';
import { neonConfig } from '@neondatabase/serverless';

neonConfig.fetchOptions = { cache: 'no-store' };

const db = drizzle(process.env.DATABASE_URL!);

export default db;
