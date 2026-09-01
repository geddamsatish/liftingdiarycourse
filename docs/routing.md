# Routing Coding Standards

## Overview

This document outlines the routing architecture and standards for the Lifting Diary application. **All application routes MUST be accessed via `/dashboard` and protected by Next.js middleware to ensure only authenticated users can access protected routes.**

## Routing Architecture

### RULE: Dashboard-First Architecture

**All feature routes MUST be nested under `/dashboard`.** This creates a single entry point for the application and ensures centralized protection.

```
src/app/
├── page.tsx                           # Public home/landing page
├── auth/                              # Public auth pages (sign-in, sign-up)
│   ├── sign-in/page.tsx
│   └── sign-up/page.tsx
└── dashboard/                         # PROTECTED: All authenticated features
    ├── page.tsx                       # Dashboard home
    ├── workouts/                      # Workout management
    │   ├── page.tsx                   # Workouts list
    │   ├── [workoutId]/
    │   │   └── page.tsx               # Workout details
    │   └── new/
    │       └── page.tsx               # Create new workout
    ├── settings/                      # User settings
    │   └── page.tsx
    └── layout.tsx                     # Shared dashboard layout
```

## Route Protection via Middleware

### RULE: Use Clerk Middleware for Route Protection

**Route protection MUST be implemented in `middleware.ts` using Clerk's `clerkMiddleware` and `createRouteMatcher`.** Do NOT implement route protection in individual page components.

```typescript
// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}
```

**What this does:**
- `isProtectedRoute` matches all routes under `/dashboard` and any nested paths
- `auth.protect()` redirects unauthenticated users to Clerk's sign-in page
- Public routes (home, sign-in, sign-up) remain accessible without authentication

### When to Update Middleware

Add new routes to the `isProtectedRoute` matcher ONLY when:
1. Creating a new top-level protected feature route (e.g., `/notifications(.*)`)
2. The route requires authentication to function

```typescript
// Example: Protecting multiple feature areas
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/api/protected(.*)',  // Protected API routes
])
```

## Public vs. Protected Routes

### Public Routes (No Authentication Required)

These routes are accessible to anyone, including unauthenticated users:

- `/` — Home/landing page
- `/auth/sign-in` — Sign-in page
- `/auth/sign-up` — Sign-up page

### Protected Routes (Authentication Required)

These routes require users to be authenticated. Middleware automatically redirects unauthenticated users:

- `/dashboard` — Dashboard home page
- `/dashboard/workouts` — Workouts list and management
- `/dashboard/settings` — User settings

## Page Component Standards

### Protected Page Components

Protected pages (under `/dashboard`) should assume the user is authenticated. The middleware handles protection before the page is rendered.

```tsx
// ✅ CORRECT - Protected page under /dashboard
// src/app/dashboard/workouts/page.tsx
import { getCurrentUser } from '@/auth/current-user'

export default async function WorkoutsPage() {
  const user = await getCurrentUser()
  // Note: middleware guarantees 'user' is not null
  // Still fetch to get user ID for data queries
  
  return (
    <div>
      <h1>Workouts</h1>
      {/* Page content */}
    </div>
  )
}
```

### Public Page Components

Public pages should handle the case where a user may or may not be authenticated.

```tsx
// ✅ CORRECT - Public home page
// src/app/page.tsx
import { getCurrentUser } from '@/auth/current-user'
import Link from 'next/link'

export default async function HomePage() {
  const user = await getCurrentUser()
  
  return (
    <div>
      <h1>Lifting Diary</h1>
      {user ? (
        <Link href="/dashboard">Go to Dashboard</Link>
      ) : (
        <Link href="/auth/sign-in">Sign In</Link>
      )}
    </div>
  )
}
```

## Layout Structure

### Dashboard Layout

Use a shared `layout.tsx` under `/dashboard` for common UI elements like headers, navigation, and sidebars.

```tsx
// src/app/dashboard/layout.tsx
import { getCurrentUser } from '@/auth/current-user'
import { DashboardHeader } from '@/components/dashboard/header'
import { DashboardNav } from '@/components/dashboard/nav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()
  
  return (
    <div className="flex h-screen">
      <DashboardNav user={user} />
      <div className="flex-1 flex flex-col">
        <DashboardHeader user={user} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
```

### Nested Layouts

For sub-sections under dashboard, create additional layouts as needed:

```tsx
// src/app/dashboard/workouts/layout.tsx
export default function WorkoutsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="space-y-4">
      {/* Workouts-specific layout */}
      {children}
    </div>
  )
}
```

## Dynamic Routes

### Using Dynamic Route Segments

Use square brackets `[paramName]` for dynamic segments. Use `(groupName)` for route groups that don't appear in the URL.

```
/dashboard/workouts/[workoutId]/page.tsx        # Matches /dashboard/workouts/123
/dashboard/(settings)/layout.tsx                 # Route group (optional)
/dashboard/workouts/[workoutId]/edit/page.tsx  # Nested dynamic route
```

### Handling Async Params in Dynamic Routes

In Next.js 15+, route parameters are async. Always await them in page components:

```tsx
// ✅ CORRECT - Await params
// src/app/dashboard/workouts/[workoutId]/page.tsx
export default async function WorkoutDetailPage({
  params,
}: {
  params: Promise<{ workoutId: string }>
}) {
  const { workoutId } = await params
  
  return (
    <div>
      <h1>Workout {workoutId}</h1>
    </div>
  )
}
```

```tsx
// ❌ WRONG - Don't destructure params directly
export default async function WorkoutDetailPage({
  params: { workoutId },
}: {
  params: { workoutId: string }
}) {
  // This may fail in Next.js 15+
}
```

## URL Naming Conventions

### Route Naming Rules

1. **Use lowercase** for all URL segments
2. **Use hyphens** (kebab-case) for multi-word segments
3. **Use descriptive names** that clearly indicate the route's purpose

```
✅ CORRECT:
/dashboard/new-workout
/dashboard/workout-history
/dashboard/user-settings

❌ WRONG:
/dashboard/NewWorkout        # PascalCase
/dashboard/new_workout       # snake_case
/dashboard/nw               # Unclear abbreviation
```

### Dynamic Segment Naming

For dynamic segments, use singular, descriptive names:

```
✅ CORRECT:
/dashboard/workouts/[workoutId]/edit
/dashboard/settings/[settingKey]

❌ WRONG:
/dashboard/workouts/[id]           # Too generic
/dashboard/workouts/[workout]      # Should match file name pattern
```

## Redirects and Navigation

### Rule: Use `redirect()` Only in Server Actions

**Do NOT use `redirect()` in page components or middleware.** Redirects belong in Server Actions and event handlers.

```typescript
// ✅ CORRECT - Redirect in Server Action
'use server'

import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/auth/current-user'

export async function createWorkout(formData: FormData) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')
  
  const workout = await db.insert(workouts).values({...})
  
  redirect(`/dashboard/workouts/${workout.id}`)
}
```

```tsx
// ❌ WRONG - Using redirect() in page component
export default async function CreatePage() {
  const redirect = redirect
  // Don't do this
}
```

### Client-Side Navigation

For client-side navigation in Client Components, use Next.js `useRouter`:

```tsx
'use client'

import { useRouter } from 'next/navigation'

export function WorkoutCard({ workoutId }: { workoutId: string }) {
  const router = useRouter()
  
  return (
    <button
      onClick={() => router.push(`/dashboard/workouts/${workoutId}`)}
    >
      View Workout
    </button>
  )
}
```

## Error Handling

### Not Found Routes

Create a `not-found.tsx` file in route segments to handle 404s:

```tsx
// src/app/dashboard/workouts/[workoutId]/not-found.tsx
export default function NotFound() {
  return (
    <div className="text-center py-12">
      <h2 className="text-2xl font-bold">Workout Not Found</h2>
      <p className="text-gray-600">The workout you're looking for doesn't exist.</p>
    </div>
  )
}
```

### Error Routes

Create an `error.tsx` file to handle runtime errors:

```tsx
// src/app/dashboard/workouts/[workoutId]/error.tsx
'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="text-center py-12">
      <h2 className="text-2xl font-bold">Something went wrong</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  )
}
```

## Best Practices

### 1. Keep Routes Shallow

Avoid deeply nested routes. Maximum nesting depth should be 3-4 levels:

```
✅ GOOD:
/dashboard/workouts/[workoutId]/edit

❌ AVOID:
/dashboard/workouts/[workoutId]/details/history/[date]/logs
```

### 2. Use Server Components by Default

Pages under `/dashboard` should be Server Components by default. Only use Client Components (`'use client'`) when necessary for interactivity.

```tsx
// ✅ CORRECT - Server Component by default
export default async function WorkoutsPage() {
  const workouts = await getWorkouts()
  return <WorkoutsList workouts={workouts} />
}
```

### 3. Group Related Routes

Use route groups to organize related features without affecting the URL structure:

```
src/app/dashboard/(workout-management)/
  ├── workouts/
  ├── history/
  └── layout.tsx    # Shared layout for workout features
```

### 4. Collocate Components with Routes

Keep components close to where they're used. Create a `_components` folder alongside route files:

```
src/app/dashboard/workouts/
├── page.tsx
├── _components/
│   ├── workout-card.tsx
│   └── workout-list.tsx
└── [workoutId]/
    ├── page.tsx
    └── _components/
        └── workout-details.tsx
```

## Security Checklist

- ✅ All protected routes are under `/dashboard` and covered by middleware
- ✅ Middleware uses `createRouteMatcher` with `/dashboard(.*)`
- ✅ No route protection logic in page components
- ✅ All data queries verify user ownership
- ✅ Sensitive data is NOT logged or exposed in error messages
- ✅ API routes that read user data also use middleware protection

## Summary

| Task | Approach | ✅/❌ |
|------|----------|-------|
| Protect routes | Use Clerk middleware with `createRouteMatcher` | ✅ |
| Organize features | Nest under `/dashboard` | ✅ |
| Handle dynamic routes | Await params in page components | ✅ |
| Redirect after action | Use `redirect()` in Server Actions | ✅ |
| Name routes | Use lowercase, kebab-case segments | ✅ |
| Create shared layout | Use `/dashboard/layout.tsx` | ✅ |
| Protect in page component | Never | ❌ |
| Use params without await | Never | ❌ |
| Redirect in middleware | Never | ❌ |
| Use uppercase URLs | Never | ❌ |

Remember: **All protected routes go under `/dashboard`. Middleware handles authentication. Keep routes organized and shallow.**
