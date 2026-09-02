import db from "@/db";
import { exercisesTable } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function findOrCreateExerciseByName(name: string) {
  const trimmed = name.trim();
  await db.insert(exercisesTable).values({ name: trimmed }).onConflictDoNothing();
  return db
    .select()
    .from(exercisesTable)
    .where(eq(exercisesTable.name, trimmed))
    .then((rows) => rows[0]);
}
