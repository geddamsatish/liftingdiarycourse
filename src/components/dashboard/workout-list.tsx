"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface Exercise {
  id: number;
  name: string;
  sets: Array<{
    setNumber: number;
    reps: number;
    weight: number;
  }>;
}

interface Workout {
  id: number;
  name: string | null;
  date: Date;
  exercises: Exercise[];
}

interface WorkoutListProps {
  initialWorkouts: Workout[];
  initialDate: Date;
  onDateChange: (dateString: string) => Promise<Workout[]>;
}

export function WorkoutList({
  initialWorkouts,
  initialDate,
  onDateChange,
}: WorkoutListProps) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate);
  const [workouts, setWorkouts] = useState<Workout[]>(initialWorkouts);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatDateWithOrdinal = (date: Date) => {
    return format(date, "do MMM yyyy");
  };

  const handleDateChange = async (date: Date | undefined) => {
    if (!date) return;
    setSelectedDate(date);
    setIsLoading(true);
    setError(null);
    try {
      const dateString = date.toISOString().split('T')[0];
      const newWorkouts = await onDateChange(dateString);
      setWorkouts(newWorkouts);
    } catch (err) {
      setError("Failed to load workouts for this date");
      setWorkouts([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="text-lg">Select Date</CardTitle>
        </CardHeader>
        <CardContent>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formatDateWithOrdinal(selectedDate)}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateChange}
                disabled={isLoading}
              />
            </PopoverContent>
          </Popover>
        </CardContent>
      </Card>

      <div className="lg:col-span-3">
        <Card>
          <CardHeader>
            <CardTitle>Workouts - {formatDateWithOrdinal(selectedDate)}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-slate-500 dark:text-slate-400">
                  Loading...
                </p>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-red-500 dark:text-red-400">
                  {error}
                </p>
              </div>
            ) : workouts.length > 0 ? (
              <div className="space-y-4">
                {workouts.map((workout) => (
                  <div key={workout.id}>
                    <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg mb-3">
                      <h3 className="font-semibold text-slate-900 dark:text-slate-50 mb-3">
                        {workout.name || "Untitled Workout"}
                      </h3>
                      <div className="space-y-2">
                        {workout.exercises.map((exercise) => (
                          <div
                            key={exercise.id}
                            className="pl-4 border-l-2 border-slate-300 dark:border-slate-600"
                          >
                            <p className="font-medium text-slate-900 dark:text-slate-50 text-sm">
                              {exercise.name}
                            </p>
                            <div className="space-y-1 mt-1">
                              {exercise.sets.map((set) => (
                                <p
                                  key={`${exercise.id}-${set.setNumber}`}
                                  className="text-xs text-slate-600 dark:text-slate-400"
                                >
                                  Set {set.setNumber}: {set.reps} reps ×{" "}
                                  {set.weight} lbs
                                </p>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <p className="text-slate-500 dark:text-slate-400">
                  No workouts logged for this date
                </p>
                <Button
                  onClick={() => {
                    const dateParam = selectedDate.toISOString();
                    router.push(`/dashboard/workout/new?date=${dateParam}`);
                  }}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Log Workout
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
