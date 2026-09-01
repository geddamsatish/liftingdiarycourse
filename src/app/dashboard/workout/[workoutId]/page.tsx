import { getWorkoutAction } from "@/app/dashboard/actions";
import { EditWorkoutForm } from "@/components/dashboard/edit-workout-form";
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
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
            Edit Workout
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
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
    </div>
  );
}
