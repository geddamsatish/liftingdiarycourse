import { CreateWorkoutForm } from "@/components/dashboard/create-workout-form";

export default function NewWorkoutPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">
            New Workout
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Start logging your workout by entering a name and date.
          </p>
        </div>

        <CreateWorkoutForm />
      </div>
    </div>
  );
}
