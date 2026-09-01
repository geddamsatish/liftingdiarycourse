import { CreateWorkoutForm } from "@/components/dashboard/create-workout-form";

interface NewWorkoutPageProps {
  searchParams: Promise<{ date?: string }>;
}

function parseDateParam(value: string | undefined): Date | null {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

export default async function NewWorkoutPage({
  searchParams,
}: NewWorkoutPageProps) {
  const { date } = await searchParams;
  const initialDate = parseDateParam(date) ?? new Date();

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
            Log New Workout
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Record a new workout, even if you already logged one for this
            date.
          </p>
        </div>

        <CreateWorkoutForm initialDate={initialDate} returnDate={date} />
      </div>
    </div>
  );
}
