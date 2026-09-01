"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { createWorkoutAction } from "@/app/dashboard/actions";

interface CreateWorkoutFormProps {
  initialDate?: Date;
  returnDate?: string;
}

export function CreateWorkoutForm({
  initialDate,
  returnDate,
}: CreateWorkoutFormProps) {
  const router = useRouter();
  const dashboardHref = returnDate
    ? `/dashboard?date=${returnDate}`
    : "/dashboard";
  const [name, setName] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [startDateTime, setStartDateTime] = useState<Date>(
    initialDate || new Date()
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDateSelect = (newDate: Date | undefined) => {
    if (newDate) {
      const combined = new Date(newDate);
      combined.setHours(
        startDateTime.getHours(),
        startDateTime.getMinutes()
      );
      setStartDateTime(combined);
      setShowDatePicker(false);
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [hours, minutes] = e.target.value.split(":").map(Number);
    const updated = new Date(startDateTime);
    updated.setHours(hours, minutes, 0, 0);
    setStartDateTime(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await createWorkoutAction({
        name: name || undefined,
        date: startDateTime.toISOString(),
      });

      if (!result.success) {
        setError(result.error || "Failed to create workout");
      } else {
        router.push(dashboardHref);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>Create New Workout</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Workout Name (Optional)</Label>
            <Input
              id="name"
              placeholder="e.g., Chest Day, Leg Day"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={255}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label>Start Time</Label>
            <div className="space-y-3">
              <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDateTime && "text-muted-foreground"
                    )}
                    disabled={isLoading}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(startDateTime, "do MMM yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDateTime}
                    onSelect={handleDateSelect}
                    disabled={isLoading}
                  />
                </PopoverContent>
              </Popover>
              <Input
                type="time"
                value={format(startDateTime, "HH:mm")}
                onChange={handleTimeChange}
                disabled={isLoading}
              />
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-3">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? "Creating..." : "Create Workout"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(dashboardHref)}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
