"use client"

import { useState } from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export default function DashboardPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  const formatDateWithOrdinal = (date: Date) => {
    return format(date, "do MMM yyyy")
  }

  const workouts = [
    {
      id: 1,
      name: "Bench Press",
      sets: 4,
      reps: 8,
      weight: 225,
      unit: "lbs",
    },
    {
      id: 2,
      name: "Squats",
      sets: 4,
      reps: 6,
      weight: 315,
      unit: "lbs",
    },
    {
      id: 3,
      name: "Deadlifts",
      sets: 3,
      reps: 5,
      weight: 405,
      unit: "lbs",
    },
  ]

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-2">
            Lifting Diary
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Track your workouts and progress
          </p>
        </div>

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
                    onSelect={(date) => date && setSelectedDate(date)}
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
                {workouts.length > 0 ? (
                  <div className="space-y-4">
                    {workouts.map((workout) => (
                      <div
                        key={workout.id}
                        className="flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      >
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-900 dark:text-slate-50">
                            {workout.name}
                          </h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {workout.sets} sets × {workout.reps} reps
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-slate-900 dark:text-slate-50">
                            {workout.weight} {workout.unit}
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            Weight
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-12">
                    <p className="text-slate-500 dark:text-slate-400">
                      No workouts logged for this date
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
