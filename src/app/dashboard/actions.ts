"use server";

import { getWorkoutsByDate } from "@/data/workouts";

export async function fetchWorkoutsByDate(dateString: string) {
  return await getWorkoutsByDate(dateString);
}
