import { getWorkoutsByDate } from "@/data/workouts";
import { fetchWorkoutsByDate } from "./actions";
import { WorkoutList } from "@/components/dashboard/workout-list";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const today = new Date();
  const initialWorkouts = await getWorkoutsByDate(today);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-2">
            Lifting Diary
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Track your workouts and progress
          </p>
        </div>

        <WorkoutList
          initialWorkouts={initialWorkouts}
          initialDate={today}
          onDateChange={fetchWorkoutsByDate}
        />
      </div>
    </div>
  );
}
