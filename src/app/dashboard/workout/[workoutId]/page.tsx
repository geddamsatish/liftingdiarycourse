import { getWorkoutAction } from "@/app/dashboard/actions";
import { EditWorkoutForm } from "@/components/dashboard/edit-workout-form";
import { redirect } from "next/navigation";

interface EditWorkoutPageProps {
  params: Promise<{
    workoutId: string;
  }>;
}

export default async function EditWorkoutPage({
  params,
}: EditWorkoutPageProps) {
  const { workoutId } = await params;
  const workoutIdNumber = parseInt(workoutId, 10);

  if (isNaN(workoutIdNumber)) {
    redirect("/dashboard");
  }

  const result = await getWorkoutAction(workoutIdNumber);

  if (!result.success) {
    redirect("/dashboard");
  }

  const workout = result.data;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6">
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
          initialName={workout.name}
          initialDate={new Date(workout.date)}
        />
      </div>
    </div>
  );
}
