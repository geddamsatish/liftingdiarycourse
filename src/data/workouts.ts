import { getCurrentUser } from "@/auth/current-user";
import db from "@/db";
import {
  workoutsTable,
  workoutExercisesTable,
  exercisesTable,
  setsTable,
} from "@/db/schema";
import { eq, and, gte, lt } from "drizzle-orm";

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
        .where(eq(workoutExercisesTable.workoutId, workout.id));

      const exercisesWithSets = await Promise.all(
        exercises.map(async ({ workout_exercises, exercises }) => {
          const sets = await db
            .select()
            .from(setsTable)
            .where(eq(setsTable.workoutExerciseId, workout_exercises.id));

          return {
            id: exercises.id,
            name: exercises.name,
            sets: sets.map((set) => ({
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
