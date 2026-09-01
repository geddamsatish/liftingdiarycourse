# Data Mutations Architecture

## CRITICAL REQUIREMENTS

**ALL data mutations in this application MUST follow this architecture:**

1. **Database operations** → wrapped in helper functions in `/src/data` directory
2. **Helper functions** → encapsulate Drizzle ORM calls (never use raw SQL)
3. **Server Actions** → defined in colocated `actions.ts` files
4. **Parameters** → typed (NOT FormData), validated with Zod
5. **Security** → every mutation MUST verify user ownership/authorization

### ❌ What NOT to Do

- **DO NOT** make direct database calls from Server Actions
- **DO NOT** use `FormData` as Server Action parameters
- **DO NOT** skip Zod validation for Server Action inputs
- **DO NOT** create mutations in Route Handlers
- **DO NOT** perform mutations in Client Components
- **DO NOT** use raw SQL queries
- **DO NOT** bypass user ownership checks
- **DO NOT** use `redirect()` from `next/navigation` inside Server Actions

### ✅ What TO Do

- **ALWAYS** wrap DB operations in `/data` helper functions
- **ALWAYS** define Server Actions in colocated `actions.ts` files
- **ALWAYS** use typed parameters for Server Actions
- **ALWAYS** validate inputs with Zod schemas
- **ALWAYS** verify user ownership before mutations
- **ALWAYS** use Drizzle ORM for database operations
- **ALWAYS** handle redirects client-side after Server Action resolves

## Architecture Overview

```
User Action (Form Submit, Button Click)
        ↓
   Server Action (actions.ts)
        ↓
Zod Validation
        ↓
Data Helper Function (src/data/*.ts)
        ↓
Drizzle ORM Query
        ↓
Database
```

## Pattern 1: Data Helper Functions

All database mutations must be abstracted into helper functions in `/src/data`.

### File Organization

```
src/
├── data/
│   ├── workouts.ts          # Queries + mutations for workouts
│   ├── exercises.ts         # Queries + mutations for exercises
│   ├── users.ts             # Queries + mutations for users
│   └── [domain].ts          # One file per domain
```

### Helper Function Pattern

```typescript
// src/data/workouts.ts
import { db } from '@/db'
import { workouts } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { getCurrentUser } from '@/auth/current-user'

// ✅ Mutation helper - encapsulates Drizzle ORM
export async function createWorkout(data: {
  name: string
  duration: number
  notes?: string
}) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')
  
  return db.insert(workouts).values({
    userId: user.id,
    name: data.name,
    duration: data.duration,
    notes: data.notes,
    createdAt: new Date(),
  })
}

// ✅ Mutation helper - verify ownership before updating
export async function updateWorkout(id: string, data: {
  name?: string
  duration?: number
  notes?: string
}) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')
  
  // Verify ownership
  const workout = await db
    .select()
    .from(workouts)
    .where(and(eq(workouts.id, id), eq(workouts.userId, user.id)))
    .then(rows => rows[0])
  
  if (!workout) throw new Error('Workout not found or unauthorized')
  
  return db
    .update(workouts)
    .set({
      ...(data.name !== undefined && { name: data.name }),
      ...(data.duration !== undefined && { duration: data.duration }),
      ...(data.notes !== undefined && { notes: data.notes }),
    })
    .where(eq(workouts.id, id))
}

// ✅ Mutation helper - verify ownership before deleting
export async function deleteWorkout(id: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')
  
  // Verify ownership
  const workout = await db
    .select()
    .from(workouts)
    .where(and(eq(workouts.id, id), eq(workouts.userId, user.id)))
    .then(rows => rows[0])
  
  if (!workout) throw new Error('Workout not found or unauthorized')
  
  return db.delete(workouts).where(eq(workouts.id, id))
}
```

## Pattern 2: Server Actions with Zod Validation

Server Actions must be defined in colocated `actions.ts` files with typed parameters and Zod validation.

### File Organization

```
app/
├── dashboard/
│   ├── page.tsx           # Page component
│   ├── actions.ts         # Server Actions for this page
│   └── components/
│       ├── WorkoutForm.tsx
│       └── WorkoutList.tsx
```

### Server Action Pattern

```typescript
// app/dashboard/actions.ts
'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createWorkout, updateWorkout, deleteWorkout } from '@/data/workouts'

// ✅ Define Zod schema for validation
const CreateWorkoutSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  duration: z.number().int().positive('Duration must be positive'),
  notes: z.string().optional(),
})

// ✅ Type the input using Zod.infer
type CreateWorkoutInput = z.infer<typeof CreateWorkoutSchema>

// ✅ Server Action with typed parameters (NOT FormData)
export async function createWorkoutAction(input: CreateWorkoutInput) {
  // Validate input with Zod
  const validated = CreateWorkoutSchema.parse(input)
  
  try {
    await createWorkout(validated)
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// ✅ Update action with Zod validation
const UpdateWorkoutSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255).optional(),
  duration: z.number().int().positive().optional(),
  notes: z.string().optional(),
})

type UpdateWorkoutInput = z.infer<typeof UpdateWorkoutSchema>

export async function updateWorkoutAction(input: UpdateWorkoutInput) {
  const validated = UpdateWorkoutSchema.parse(input)
  const { id, ...updates } = validated
  
  try {
    await updateWorkout(id, updates)
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// ✅ Delete action with Zod validation
const DeleteWorkoutSchema = z.object({
  id: z.string().uuid(),
})

type DeleteWorkoutInput = z.infer<typeof DeleteWorkoutSchema>

export async function deleteWorkoutAction(input: DeleteWorkoutInput) {
  const validated = DeleteWorkoutSchema.parse(input)
  
  try {
    await deleteWorkout(validated.id)
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
```

## Pattern 3: Handling Redirects (Client-Side Only)

**RULE: NEVER use `redirect()` from `next/navigation` inside Server Actions.**

Redirects must be handled by the Client Component after the Server Action resolves. This allows:
- Proper error handling before redirecting
- User feedback on success/failure
- Conditional navigation based on response

### ❌ WRONG - Using redirect() in Server Action

```typescript
// ❌ DO NOT DO THIS
import { redirect } from 'next/navigation'

export async function createWorkoutAction(input: CreateWorkoutInput) {
  try {
    await createWorkout(input)
    revalidatePath('/dashboard')
    redirect('/dashboard') // ❌ WRONG - redirects inside Server Action
  } catch (error) {
    return { success: false, error: error.message }
  }
}
```

### ✅ CORRECT - Client-Side Redirect After Server Action

```typescript
// Server Action - Only returns success/error status
export async function createWorkoutAction(input: CreateWorkoutInput) {
  try {
    await createWorkout(input)
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Client Component - Handles redirect after Server Action resolves
'use client'

import { useRouter } from 'next/navigation'

export function WorkoutForm() {
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    const result = await createWorkoutAction({
      name: formData.name,
      date: formData.date,
    })

    if (result.success) {
      router.push('/dashboard') // ✅ CORRECT - redirect in Client Component
    } else {
      setError(result.error)
    }
  }

  return <form onSubmit={handleSubmit}>...</form>
}
```

## Pattern 4: Using Server Actions in Forms

Call Server Actions with typed arguments from Client Components.

### Client Component Pattern

```tsx
// app/dashboard/components/WorkoutForm.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createWorkoutAction } from '../actions'

type CreateWorkoutInput = {
  name: string
  duration: number
  notes?: string
}

export function WorkoutForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    setError(null)

    try {
      // ✅ Pass typed object to Server Action (NOT FormData)
      const result = await createWorkoutAction({
        name: String(formData.get('name')),
        duration: Number(formData.get('duration')),
        notes: formData.get('notes') 
          ? String(formData.get('notes'))
          : undefined,
      })

      if (!result.success) {
        setError(result.error)
      } else {
        // ✅ Redirect client-side after successful Server Action
        router.push('/dashboard')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={(e) => {
      e.preventDefault()
      handleSubmit(new FormData(e.currentTarget))
    }}>
      <input 
        name="name" 
        placeholder="Workout name"
        required 
      />
      <input 
        name="duration" 
        type="number"
        placeholder="Duration (minutes)"
        required 
      />
      <textarea 
        name="notes" 
        placeholder="Notes (optional)" 
      />
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Creating...' : 'Create Workout'}
      </button>
      {error && <div className="text-red-500">{error}</div>}
    </form>
  )
}
```

## Security: User Ownership Verification

### CRITICAL: Every Mutation Must Verify User Ownership

Every data mutation helper function MUST:

1. **Authenticate the user**: Call `getCurrentUser()` to get the authenticated user
2. **Verify authorization**: Check that the user owns the resource being modified
3. **Throw on unauthorized**: Reject the mutation if unauthorized

### Example: Secure Mutations

```typescript
// ✅ CORRECT - Verifies user ownership
export async function updateWorkout(id: string, data: any) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')
  
  // Verify ownership before updating
  const workout = await db
    .select()
    .from(workouts)
    .where(
      and(
        eq(workouts.id, id),
        eq(workouts.userId, user.id)
      )
    )
    .then(rows => rows[0])
  
  if (!workout) throw new Error('Workout not found or unauthorized')
  
  // Safe to update - user owns this workout
  return db.update(workouts).set(data).where(eq(workouts.id, id))
}

// ❌ WRONG - Trusts client userId
export async function updateWorkout(id: string, userId: string, data: any) {
  // This allows attackers to modify any user's workouts!
  return db
    .update(workouts)
    .set(data)
    .where(and(eq(workouts.id, id), eq(workouts.userId, userId)))
}

// ❌ WRONG - No ownership check
export async function updateWorkout(id: string, data: any) {
  // Anyone can modify any workout!
  return db
    .update(workouts)
    .set(data)
    .where(eq(workouts.id, id))
}
```

## Zod Validation Best Practices

### Schema Definition Rules

1. **Be specific**: Define all required fields and their types
2. **Add constraints**: Use min/max, regex patterns, enums
3. **Handle optionals**: Use `.optional()` for optional fields
4. **Custom messages**: Provide clear validation error messages
5. **Reusable schemas**: Define schemas at module level

### Example: Comprehensive Schema

```typescript
import { z } from 'zod'

// ✅ Comprehensive schema with validation
const WorkoutSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(255, 'Name is too long')
    .trim(),
  
  duration: z
    .number()
    .int('Duration must be a whole number')
    .positive('Duration must be greater than 0')
    .max(1440, 'Duration cannot exceed 24 hours'),
  
  date: z
    .string()
    .datetime()
    .or(z.date()),
  
  notes: z
    .string()
    .max(1000, 'Notes cannot exceed 1000 characters')
    .optional(),
  
  category: z
    .enum(['strength', 'cardio', 'flexibility', 'sport'])
    .optional(),
})

// Extract typed inputs for reuse
export type Workout = z.infer<typeof WorkoutSchema>

// In Server Action:
export async function createWorkoutAction(input: unknown) {
  const validated = WorkoutSchema.parse(input)
  // validated is now fully typed and guaranteed valid
}
```

## Error Handling

### In Data Helpers

```typescript
// Throw meaningful errors
export async function updateWorkout(id: string, data: any) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized - no user session')
  
  const workout = await db.select().from(workouts)
    .where(and(eq(workouts.id, id), eq(workouts.userId, user.id)))
    .then(rows => rows[0])
  
  if (!workout) throw new Error('Workout not found')
  
  try {
    return await db.update(workouts).set(data).where(eq(workouts.id, id))
  } catch (error) {
    throw new Error('Failed to update workout')
  }
}
```

### In Server Actions

```typescript
export async function updateWorkoutAction(input: UpdateWorkoutInput) {
  try {
    const validated = UpdateWorkoutSchema.parse(input)
    await updateWorkout(validated.id, validated)
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: 'Validation failed',
        issues: error.errors
      }
    }
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
```

## Summary: Data Mutation Flow

| Layer | Responsibility | Example |
|-------|-----------------|---------|
| **Client Component** | Collect user input, call Server Action | `<form>`, input handling |
| **Server Action** | Validate with Zod, call helper | `createWorkoutAction()` |
| **Data Helper** | Verify ownership, call Drizzle | `createWorkout()` |
| **Drizzle ORM** | Execute database query | `db.insert().values()` |
| **Database** | Store/modify data | PostgreSQL |

## Checklist for New Mutations

- [ ] Created Zod schema for validation
- [ ] Created typed input type from schema
- [ ] Created data helper in `/src/data/[domain].ts`
- [ ] Helper verifies user ownership with `getCurrentUser()`
- [ ] Helper uses Drizzle ORM (no raw SQL)
- [ ] Created Server Action in colocated `actions.ts`
- [ ] Server Action validates input with Zod
- [ ] Server Action calls data helper
- [ ] Server Action calls `revalidatePath()` to refresh UI
- [ ] Error handling implemented in Server Action
- [ ] Tested with invalid/unauthorized inputs

## Reference

- [Zod Documentation](https://zod.dev)
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [Drizzle ORM Mutations](https://orm.drizzle.team/docs/insert)
- [Next.js Revalidation](https://nextjs.org/docs/app/api-reference/functions/revalidatePath)
