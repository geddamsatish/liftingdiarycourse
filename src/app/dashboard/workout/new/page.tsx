import { CreateWorkoutForm } from "@/components/dashboard/create-workout-form";

interface NewWorkoutPageProps {
  searchParams: Promise<{
    date?: string;
  }>;
}

export default async function NewWorkoutPage({
  searchParams,
}: NewWorkoutPageProps) {
  const params = await searchParams;
  let initialDate: Date | undefined;

  if (params.date) {
    initialDate = new Date(params.date);
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
            New Workout
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Start logging your workout by entering a name, date and start time.
          </p>
        </div>

        <CreateWorkoutForm initialDate={initialDate} />
      </div>
    </div>
  );
}
