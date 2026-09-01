"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getWorkoutsByDate, createWorkout, getWorkoutById, updateWorkout } from "@/data/workouts";

export async function fetchWorkoutsByDate(dateString: string) {
  return await getWorkoutsByDate(dateString);
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
