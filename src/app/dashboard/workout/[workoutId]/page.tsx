import { getWorkoutAction } from "@/app/dashboard/actions";
import { EditWorkoutForm } from "@/components/dashboard/edit-workout-form";
import { LogWorkoutExercises } from "@/components/dashboard/log-workout-exercises";
import { redirect } from "next/navigation";

interface EditWorkoutPageProps {
  params: Promise<{
    workoutId: string;
  }>;
  searchParams: Promise<{
    date?: string;
  }>;
}

export default async function EditWorkoutPage({
  params,
  searchParams,
}: EditWorkoutPageProps) {
  const { workoutId } = await params;
  const { date } = await searchParams;
  const workoutIdNumber = parseInt(workoutId, 10);

  if (isNaN(workoutIdNumber)) {
    redirect("/dashboard");
  }

  const result = await getWorkoutAction(workoutIdNumber);

  if (!result.success || !result.data) {
    redirect("/dashboard");
  }

  const workout = result.data;

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
            Workout Details
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Manage your workout information and log exercises.
          </p>
        </div>

        <div className="space-y-12">
          <div className="border-b border-slate-200 dark:border-slate-700 pb-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                Step 1: Workout Info
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Update the workout name and start time.
              </p>
            </div>
            <EditWorkoutForm
              workoutId={workoutIdNumber}
              initialName={workout?.name ?? null}
              initialDate={workout ? new Date(workout.date) : new Date()}
              returnDate={date}
            />
          </div>

          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                Step 2: Log Exercises & Sets
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Add exercises and log your sets.
              </p>
            </div>
            <LogWorkoutExercises
              workoutId={workoutIdNumber}
              initialExercises={workout?.exercises ?? []}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
