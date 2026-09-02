import { getWorkoutsByDate } from "@/data/workouts";
import { fetchWorkoutsByDate } from "./actions";
import { WorkoutList } from "@/components/dashboard/workout-list";

export const dynamic = "force-dynamic";

interface DashboardPageProps {
  searchParams: Promise<{ date?: string }>;
}

function parseDateParam(value: string | undefined): Date | null {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const { date } = await searchParams;
  const initialDate = parseDateParam(date) ?? new Date();
  const initialWorkouts = await getWorkoutsByDate(initialDate);

  return (
    <div className="p-4 md:p-8">
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
          initialDate={initialDate}
          onDateChange={fetchWorkoutsByDate}
        />
      </div>
    </div>
  );
}
