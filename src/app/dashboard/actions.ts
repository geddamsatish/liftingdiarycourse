"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getWorkoutsByDate, createWorkout } from "@/data/workouts";

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
    await createWorkout({
      name: validated.name,
      date: new Date(validated.date),
    });
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
