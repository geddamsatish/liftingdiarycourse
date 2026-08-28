import {
  integer,
  numeric,
  pgTable,
  timestamp,
  varchar,
  index,
} from "drizzle-orm/pg-core";

export const exercisesTable = pgTable("exercises", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull().unique(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp()
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const workoutsTable = pgTable(
  "workouts",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: varchar({ length: 255 }).notNull(),
    date: timestamp().notNull().defaultNow(),
    name: varchar({ length: 255 }),
    createdAt: timestamp().notNull().defaultNow(),
  },
  (table) => [index("workouts_user_id_idx").on(table.userId)]
);

export const workoutExercisesTable = pgTable(
  "workout_exercises",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    workoutId: integer()
      .notNull()
      .references(() => workoutsTable.id, { onDelete: "cascade" }),
    exerciseId: integer()
      .notNull()
      .references(() => exercisesTable.id, { onDelete: "restrict" }),
    order: integer().notNull(),
  },
  (table) => [
    index("workout_exercises_workout_id_idx").on(table.workoutId),
    index("workout_exercises_exercise_id_idx").on(table.exerciseId),
  ]
);

export const setsTable = pgTable(
  "sets",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    workoutExerciseId: integer()
      .notNull()
      .references(() => workoutExercisesTable.id, { onDelete: "cascade" }),
    setNumber: integer().notNull(),
    reps: integer().notNull(),
    weight: numeric({ precision: 6, scale: 2 }).notNull(),
    createdAt: timestamp().notNull().defaultNow(),
  },
  (table) => [
    index("sets_workout_exercise_id_idx").on(table.workoutExerciseId),
  ]
);
