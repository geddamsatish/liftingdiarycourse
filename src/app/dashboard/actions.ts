"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getWorkoutsByDate, createWorkout, getWorkoutById, updateWorkout, addExerciseToWorkout, addSetToExercise } from "@/data/workouts";

export async function fetchWorkoutsByDate(dateString: string) {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return await getWorkoutsByDate(date);
}

const CreateWorkoutSchema = z.object({
  name: z.string().max(255).optional(),
  date: z.string().datetime(),
});

type CreateWorkoutInput = z.infer<typeof CreateWorkoutSchema>;

export async function createWorkoutAction(input: CreateWorkoutInput) {
  const validated = CreateWorkoutSchema.parse(input);

  try {
    const workout = await createWorkout({
      name: validated.name,
      date: new Date(validated.date),
    });
    revalidatePath("/dashboard");
    return { success: true, data: { id: workout.id } };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getWorkoutAction(id: number) {
  try {
    const workout = await getWorkoutById(id);
    return { success: true, data: workout };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

const UpdateWorkoutSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().max(255).optional(),
  date: z.string().datetime(),
});

type UpdateWorkoutInput = z.infer<typeof UpdateWorkoutSchema>;

export async function updateWorkoutAction(input: UpdateWorkoutInput) {
  const validated = UpdateWorkoutSchema.parse(input);

  try {
    await updateWorkout(validated.id, {
      name: validated.name,
      date: new Date(validated.date),
    });
    revalidatePath("/dashboard");
    revalidatePath(`/dashboard/workout/${validated.id}`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

const AddExerciseSchema = z.object({
  workoutId: z.number().int().positive(),
  exerciseName: z.string().trim().min(1).max(255),
});

type AddExerciseInput = z.infer<typeof AddExerciseSchema>;

export async function addExerciseToWorkoutAction(input: AddExerciseInput) {
  const validated = AddExerciseSchema.parse(input);
  try {
    const exercise = await addExerciseToWorkout(validated.workoutId, validated.exerciseName);
    revalidatePath("/dashboard");
    revalidatePath(`/dashboard/workout/${validated.workoutId}`);
    return { success: true, data: exercise };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

const AddSetSchema = z.object({
  workoutId: z.number().int().positive(),
  workoutExerciseId: z.number().int().positive(),
  reps: z.number().int().positive().max(999),
  weight: z.number().nonnegative().max(9999.99),
});

type AddSetInput = z.infer<typeof AddSetSchema>;

export async function addSetToExerciseAction(input: AddSetInput) {
  const validated = AddSetSchema.parse(input);
  try {
    const set = await addSetToExercise(validated.workoutExerciseId, {
      reps: validated.reps,
      weight: validated.weight,
    });
    revalidatePath("/dashboard");
    revalidatePath(`/dashboard/workout/${validated.workoutId}`);
    return { success: true, data: set };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
