# Data Fetching Architecture

## CRITICAL REQUIREMENT: Server Components Only

**ALL data fetching in this application MUST be done via Server Components. This is non-negotiable.**

### ❌ What NOT to Do

- **DO NOT** fetch data in Route Handlers (API routes)
- **DO NOT** fetch data in Client Components
- **DO NOT** fetch data directly from `useEffect` or client-side hooks
- **DO NOT** use client-side fetch calls to endpoints
- **DO NOT** bypass this pattern for any reason

### ✅ What TO Do

- **ALWAYS** fetch data in Server Components
- **ALWAYS** pass fetched data as props to child components
- Use Server Components as the data layer for your application

## Pattern: Server Component Data Fetching

### Correct Implementation

```tsx
// app/dashboard/page.tsx - SERVER COMPONENT
import { getWorkouts } from '@/data/workouts'

export default async function DashboardPage() {
  const workouts = await getWorkouts()
  
  return (
    <div>
      <WorkoutList workouts={workouts} />
    </div>
  )
}

// components/WorkoutList.tsx - CLIENT COMPONENT
'use client'

export function WorkoutList({ workouts }) {
  return (
    <ul>
      {workouts.map(workout => (
        <li key={workout.id}>{workout.name}</li>
      ))}
    </ul>
  )
}
```

## Database Query Helpers: The `/data` Directory

All database queries must be abstracted into helper functions in the `/data` directory.

### File Organization

```
src/
├── data/
│   ├── workouts.ts
│   ├── users.ts
│   ├── exercises.ts
│   └── [domain].ts
```

### Helper Function Pattern

```typescript
// src/data/workouts.ts
import { db } from '@/db'
import { workouts } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { getCurrentUser } from '@/auth/current-user'

// Get workouts for the current user ONLY
export async function getWorkouts() {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')
  
  return db
    .select()
    .from(workouts)
    .where(eq(workouts.userId, user.id))
}

// Get a specific workout by ID (must verify ownership)
export async function getWorkoutById(id: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')
  
  return db
    .select()
    .from(workouts)
    .where(eq(workouts.id, id) && eq(workouts.userId, user.id))
    .then(rows => rows[0] || null)
}
```

## Security: User Data Isolation

### CRITICAL: Enforce User Ownership on All Queries

Every database query helper function MUST:

1. **Authenticate the user**: Call `getCurrentUser()` to get the authenticated user
2. **Verify authorization**: Check that the user has permission to access the requested resource
3. **Filter by user**: Always filter query results to only data owned by the current user

### Example: Secure Data Access

```typescript
// ✅ CORRECT - Always filters by userId
export async function getUserExercises(userId?: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')
  
  // Use authenticated user's ID, ignore any passed parameter
  return db
    .select()
    .from(exercises)
    .where(eq(exercises.userId, user.id))
}

// ❌ WRONG - Trusts client-provided userId
export async function getUserExercises(userId: string) {
  // This allows attackers to fetch any user's data!
  return db
    .select()
    .from(exercises)
    .where(eq(exercises.userId, userId))
}

// ❌ WRONG - No user filtering at all
export async function getAllExercises() {
  return db
    .select()
    .from(exercises)
    // No userId filter = anyone can see everyone's data!
}
```

## Using Drizzle ORM: NEVER Raw SQL

All database queries must use Drizzle ORM. Raw SQL is prohibited.

### Drizzle Basics

```typescript
import { db } from '@/db'
import { workouts } from '@/db/schema'
import { eq, and, or, gt, lt } from 'drizzle-orm'

// SELECT
const allWorkouts = await db.select().from(workouts)

// SELECT with WHERE
const userWorkouts = await db
  .select()
  .from(workouts)
  .where(eq(workouts.userId, userId))

// SELECT with multiple conditions
const recentUserWorkouts = await db
  .select()
  .from(workouts)
  .where(
    and(
      eq(workouts.userId, userId),
      gt(workouts.createdAt, new Date('2025-01-01'))
    )
  )

// INSERT
await db.insert(workouts).values({
  userId,
  name: 'Morning Run',
  duration: 30,
})

// UPDATE
await db
  .update(workouts)
  .set({ duration: 45 })
  .where(eq(workouts.id, workoutId))

// DELETE
await db
  .delete(workouts)
  .where(eq(workouts.id, workoutId))
```

### Reference

- [Drizzle ORM Documentation](https://orm.drizzle.team)
- [Drizzle Select Queries](https://orm.drizzle.team/docs/select)
- [Drizzle Where Conditions](https://orm.drizzle.team/docs/select#filtering)
- [Drizzle Mutations](https://orm.drizzle.team/docs/insert)

## Mutations in Server Components

For form submissions and data modifications, use Server Actions (Next.js feature):

```typescript
// app/dashboard/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { createWorkout } from '@/data/workouts'

export async function createWorkoutAction(formData: FormData) {
  const name = formData.get('name')
  const duration = formData.get('duration')
  
  await createWorkout({
    name: String(name),
    duration: Number(duration),
  })
  
  revalidatePath('/dashboard')
}
```

```tsx
// app/dashboard/page.tsx - SERVER COMPONENT
import { createWorkoutAction } from './actions'

export default function DashboardPage() {
  return (
    <form action={createWorkoutAction}>
      <input name="name" placeholder="Workout name" required />
      <input name="duration" type="number" placeholder="Minutes" required />
      <button type="submit">Create</button>
    </form>
  )
}
```

## Summary

| Context | Data Fetching | ✅/❌ |
|---------|---------------|-------|
| Server Component | Server-side queries via `/data` helpers | ✅ |
| Server Action | Server-side queries via `/data` helpers | ✅ |
| Client Component | Accept as props from Server Component | ✅ |
| Route Handler | ❌ Never fetch data here | ❌ |
| useEffect hook | ❌ Never fetch data here | ❌ |
| Client function | ❌ Never fetch data here | ❌ |

Remember: **Data fetching belongs in Server Components, not Route Handlers or Client Components.**
