"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  addExerciseToWorkoutAction,
  addSetToExerciseAction,
} from "@/app/dashboard/actions";

interface Set {
  id: number;
  setNumber: number;
  reps: number;
  weight: number;
}

interface Exercise {
  id: number;
  workoutExerciseId: number;
  name: string;
  sets: Set[];
}

interface LogWorkoutExercisesProps {
  workoutId: number;
  initialExercises: Exercise[];
}

export function LogWorkoutExercises({
  workoutId,
  initialExercises,
}: LogWorkoutExercisesProps) {
  const [exercises, setExercises] = useState<Exercise[]>(initialExercises);
  const [exerciseName, setExerciseName] = useState("");
  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const [exerciseError, setExerciseError] = useState<string | null>(null);

  const initializeSetFormState = () => {
    const initial: Record<
      number,
      { reps: string; weight: string; isLoading: boolean; error: string | null }
    > = {};
    initialExercises.forEach((ex) => {
      initial[ex.workoutExerciseId] = {
        reps: "",
        weight: "",
        isLoading: false,
        error: null,
      };
    });
    return initial;
  };

  const [setFormState, setSetFormState] = useState(initializeSetFormState());

  const handleAddExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingExercise(true);
    setExerciseError(null);

    try {
      const result = await addExerciseToWorkoutAction({
        workoutId,
        exerciseName,
      });

      if (!result.success) {
        setExerciseError(result.error || "Failed to add exercise");
      } else {
        setExercises([...exercises, result.data]);
        setSetFormState((prev) => ({
          ...prev,
          [result.data.workoutExerciseId]: {
            reps: "",
            weight: "",
            isLoading: false,
            error: null,
          },
        }));
        setExerciseName("");
      }
    } catch (err) {
      setExerciseError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsAddingExercise(false);
    }
  };

  const handleAddSet = async (
    e: React.FormEvent,
    workoutExerciseId: number
  ) => {
    e.preventDefault();
    const state = setFormState[workoutExerciseId];

    setSetFormState((prev) => ({
      ...prev,
      [workoutExerciseId]: { ...state, isLoading: true, error: null },
    }));

    try {
      const reps = parseInt(state.reps, 10);
      const weight = parseFloat(state.weight);

      if (isNaN(reps) || isNaN(weight)) {
        throw new Error("Invalid reps or weight");
      }

      const result = await addSetToExerciseAction({
        workoutId,
        workoutExerciseId,
        reps,
        weight,
      });

      if (!result.success) {
        setSetFormState((prev) => ({
          ...prev,
          [workoutExerciseId]: { ...state, error: result.error || "Failed to add set" },
        }));
      } else {
        setExercises((prev) =>
          prev.map((ex) =>
            ex.workoutExerciseId === workoutExerciseId
              ? { ...ex, sets: [...ex.sets, result.data] }
              : ex
          )
        );
        setSetFormState((prev) => ({
          ...prev,
          [workoutExerciseId]: {
            reps: "",
            weight: "",
            isLoading: false,
            error: null,
          },
        }));
      }
    } catch (err) {
      setSetFormState((prev) => ({
        ...prev,
        [workoutExerciseId]: {
          ...state,
          error: err instanceof Error ? err.message : "Unknown error",
        },
      }));
    } finally {
      setSetFormState((prev) => ({
        ...prev,
        [workoutExerciseId]: {
          ...(prev[workoutExerciseId] || {
            reps: "",
            weight: "",
            isLoading: false,
            error: null,
          }),
          isLoading: false,
        },
      }));
    }
  };

  return (
    <div className="space-y-6">
      {exercises.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            Exercises
          </h2>
          {exercises.map((exercise) => {
            const state = setFormState[exercise.workoutExerciseId] || {
              reps: "",
              weight: "",
              isLoading: false,
              error: null,
            };
            return (
              <Card key={exercise.workoutExerciseId}>
                <CardHeader>
                  <CardTitle className="text-lg">{exercise.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {exercise.sets.length > 0 && (
                    <div className="space-y-2">
                      {exercise.sets.map((set) => (
                        <p
                          key={set.id}
                          className="text-sm text-slate-600 dark:text-slate-400"
                        >
                          Set {set.setNumber}: {set.reps} reps × {set.weight} lbs
                        </p>
                      ))}
                    </div>
                  )}

                  <form
                    onSubmit={(e) => handleAddSet(e, exercise.workoutExerciseId)}
                    className="space-y-3 border-t pt-4"
                  >
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor={`reps-${exercise.workoutExerciseId}`} className="text-xs">
                          Reps
                        </Label>
                        <Input
                          id={`reps-${exercise.workoutExerciseId}`}
                          type="number"
                          placeholder="Reps"
                          value={state.reps}
                          onChange={(e) =>
                            setSetFormState((prev) => ({
                              ...prev,
                              [exercise.workoutExerciseId]: {
                                ...state,
                                reps: e.target.value,
                              },
                            }))
                          }
                          disabled={state.isLoading}
                          min="1"
                          max="999"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor={`weight-${exercise.workoutExerciseId}`} className="text-xs">
                          Weight (lbs)
                        </Label>
                        <Input
                          id={`weight-${exercise.workoutExerciseId}`}
                          type="number"
                          placeholder="Weight"
                          value={state.weight}
                          onChange={(e) =>
                            setSetFormState((prev) => ({
                              ...prev,
                              [exercise.workoutExerciseId]: {
                                ...state,
                                weight: e.target.value,
                              },
                            }))
                          }
                          disabled={state.isLoading}
                          step="0.5"
                          min="0"
                        />
                      </div>
                    </div>
                    {state.error && (
                      <p className="text-sm text-red-600 dark:text-red-400">
                        {state.error}
                      </p>
                    )}
                    <Button type="submit" disabled={state.isLoading} size="sm">
                      {state.isLoading ? "Adding..." : "Add Set"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Add Exercise</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddExercise} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="exercise-name">Exercise Name</Label>
              <Input
                id="exercise-name"
                placeholder="e.g., Bench Press, Squats, Deadlift"
                value={exerciseName}
                onChange={(e) => setExerciseName(e.target.value)}
                disabled={isAddingExercise}
                maxLength={255}
              />
            </div>
            {exerciseError && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {exerciseError}
              </p>
            )}
            <Button type="submit" disabled={isAddingExercise}>
              {isAddingExercise ? "Adding..." : "Add Exercise"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
