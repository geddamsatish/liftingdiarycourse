import { getCurrentUser } from "@/auth/current-user";
import db from "@/db";
import {
  workoutsTable,
  workoutExercisesTable,
  exercisesTable,
  setsTable,
} from "@/db/schema";
import { eq, and, gte, lt } from "drizzle-orm";
import { findOrCreateExerciseByName } from "./exercises";

export async function createWorkout(data: {
  name?: string;
  date: Date;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const result = await db
    .insert(workoutsTable)
    .values({
      userId: user.id,
      name: data.name || null,
      date: data.date,
    })
    .returning();

  return result[0];
}

async function verifyWorkoutOwnership(workoutId: number, userId: string) {
  const workout = await db
    .select()
    .from(workoutsTable)
    .where(and(eq(workoutsTable.id, workoutId), eq(workoutsTable.userId, userId)))
    .then((rows) => rows[0]);
  if (!workout) throw new Error("Workout not found or unauthorized");
  return workout;
}

export async function getWorkoutById(id: number) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const workout = await db
    .select()
    .from(workoutsTable)
    .where(and(eq(workoutsTable.id, id), eq(workoutsTable.userId, user.id)))
    .then((rows) => rows[0]);

  if (!workout) throw new Error("Workout not found or unauthorized");

  const exercises = await db
    .select()
    .from(workoutExercisesTable)
    .innerJoin(
      exercisesTable,
      eq(workoutExercisesTable.exerciseId, exercisesTable.id)
    )
    .where(eq(workoutExercisesTable.workoutId, workout.id))
    .orderBy(workoutExercisesTable.order);

  const exercisesWithSets = await Promise.all(
    exercises.map(async ({ workout_exercises, exercises }) => {
      const sets = await db
        .select()
        .from(setsTable)
        .where(eq(setsTable.workoutExerciseId, workout_exercises.id));

      return {
        id: exercises.id,
        workoutExerciseId: workout_exercises.id,
        name: exercises.name,
        sets: sets.map((set) => ({
          id: set.id,
          setNumber: set.setNumber,
          reps: set.reps,
          weight: parseFloat(set.weight as string),
        })),
      };
    })
  );

  return {
    id: workout.id,
    name: workout.name,
    date: workout.date,
    exercises: exercisesWithSets,
  };
}

export async function updateWorkout(
  id: number,
  data: {
    name?: string;
    date?: Date;
  }
) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const workout = await db
    .select()
    .from(workoutsTable)
    .where(and(eq(workoutsTable.id, id), eq(workoutsTable.userId, user.id)))
    .then((rows) => rows[0]);

  if (!workout) throw new Error("Workout not found or unauthorized");

  await db
    .update(workoutsTable)
    .set({
      ...(data.name !== undefined && { name: data.name || null }),
      ...(data.date !== undefined && { date: data.date }),
    })
    .where(eq(workoutsTable.id, id));
}
export async function getWorkoutsByDate(date: Date) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const workouts = await db
    .select()
    .from(workoutsTable)
    .where(
      and(
        eq(workoutsTable.userId, user.id),
        gte(workoutsTable.date, startOfDay),
        lt(workoutsTable.date, new Date(endOfDay.getTime() + 1))
      )
    );

  const workoutsWithExercises = await Promise.all(
    workouts.map(async (workout) => {
    const exercises = await db
        .select()
        .from(workoutExercisesTable)
        .innerJoin(
          exercisesTable,
          eq(workoutExercisesTable.exerciseId, exercisesTable.id)
        )
        .where(eq(workoutExercisesTable.workoutId, workout.id))
        .orderBy(workoutExercisesTable.order);

      const exercisesWithSets = await Promise.all(
        exercises.map(async ({ workout_exercises, exercises }) => {
          const sets = await db
            .select()
            .from(setsTable)
            .where(eq(setsTable.workoutExerciseId, workout_exercises.id));

          return {
            id: exercises.id,
            workoutExerciseId: workout_exercises.id,
            name: exercises.name,
            sets: sets.map((set) => ({
              id: set.id,
              setNumber: set.setNumber,
              reps: set.reps,
              weight: parseFloat(set.weight as string),
            })),
          };
        })
      );

      return {
        id: workout.id,
        name: workout.name,
        date: workout.date,
        exercises: exercisesWithSets,
      };
    })
  );

  return workoutsWithExercises;
}

export async function addExerciseToWorkout(workoutId: number, exerciseName: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  await verifyWorkoutOwnership(workoutId, user.id);

  const exercise = await findOrCreateExerciseByName(exerciseName);

  const existing = await db
    .select({ id: workoutExercisesTable.id })
    .from(workoutExercisesTable)
    .where(eq(workoutExercisesTable.workoutId, workoutId));

  const [row] = await db
    .insert(workoutExercisesTable)
    .values({ workoutId, exerciseId: exercise.id, order: existing.length + 1 })
    .returning();

  return { id: exercise.id, workoutExerciseId: row.id, name: exercise.name, sets: [] };
}

export async function addSetToExercise(
  workoutExerciseId: number,
  data: { reps: number; weight: number }
) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  const owned = await db
    .select({ id: workoutExercisesTable.id })
    .from(workoutExercisesTable)
    .innerJoin(workoutsTable, eq(workoutExercisesTable.workoutId, workoutsTable.id))
    .where(
      and(
        eq(workoutExercisesTable.id, workoutExerciseId),
        eq(workoutsTable.userId, user.id)
      )
    )
    .then((rows) => rows[0]);
  if (!owned) throw new Error("Exercise not found or unauthorized");

  const existingSets = await db
    .select({ id: setsTable.id })
    .from(setsTable)
    .where(eq(setsTable.workoutExerciseId, workoutExerciseId));

  const [row] = await db
    .insert(setsTable)
    .values({
      workoutExerciseId,
      setNumber: existingSets.length + 1,
      reps: data.reps,
      weight: data.weight.toFixed(2),
    })
    .returning();

  return { id: row.id, setNumber: row.setNumber, reps: row.reps, weight: parseFloat(row.weight as string) };
}
