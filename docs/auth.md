# Authentication Coding Standards

## Overview

This document outlines the authentication standards and guidelines for the Lifting Diary application. **All authentication in this application MUST use Clerk.** This ensures secure, scalable, and maintainable user authentication across the entire application.

## Authentication Library: Clerk

### RULE: Clerk is the Single Source of Truth

**Clerk is the ONLY authentication provider for this application.** All user authentication, session management, and user data must flow through Clerk.

Clerk provides:
- Secure user authentication and session management
- Built-in UI components for sign-up, sign-in, and user management
- Server-side user verification and token validation
- Multi-platform support (web, mobile, API)
- GDPR and SOC 2 compliance

## Current User Access

### Getting the Current User

**RULE: Always use `getCurrentUser()` from `@/auth/current-user` to access the authenticated user.**

The `getCurrentUser()` function is the single entry point for accessing the current authenticated user's information in Server Components and Server Actions.

```typescript
// ✅ CORRECT
import { getCurrentUser } from '@/auth/current-user'

export async function getWorkouts() {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')
  
  return db
    .select()
    .from(workouts)
    .where(eq(workouts.userId, user.id))
}
```

### User Object Structure

The `getCurrentUser()` function returns a user object with the following properties:

```typescript
interface User {
  id: string                    // Clerk user ID
  email: string                 // Primary email address
  firstName?: string            // First name (if provided)
  lastName?: string             // Last name (if provided)
  imageUrl?: string             // Profile image URL
  createdAt: Date              // Account creation timestamp
  updatedAt: Date              // Last update timestamp
}
```

## Client-Side Authentication UI

### Using Clerk Components

Clerk provides pre-built UI components for common authentication flows. Use these components instead of building custom auth UI.

#### SignIn Component

```tsx
'use client'

import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <SignIn />
    </div>
  )
}
```

#### SignUp Component

```tsx
'use client'

import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <SignUp />
    </div>
  )
}
```

#### UserButton Component

Display the user profile button in the app header:

```tsx
'use client'

import { UserButton } from '@clerk/nextjs'

export function AppHeader() {
  return (
    <header className="flex justify-between items-center p-4">
      <h1>Lifting Diary</h1>
      <UserButton />
    </header>
  )
}
```

### Clerk Middleware

Clerk provides Next.js middleware for protecting routes and redirecting unauthenticated users.

```typescript
// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/workouts(.*)',
  '/settings(.*)',
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

## Server-Side Authentication

### Protecting Server Components

Server Components automatically have access to authentication context via `getCurrentUser()`.

```tsx
// app/dashboard/page.tsx - SERVER COMPONENT
import { getCurrentUser } from '@/auth/current-user'

export default async function DashboardPage() {
  const user = await getCurrentUser()
  
  // This is safe in a Server Component - auth happens server-side
  if (!user) {
    return <div>Please sign in</div>
  }
  
  return (
    <div>
      <h1>Welcome, {user.email}</h1>
    </div>
  )
}
```

### Protecting Server Actions

Always call `getCurrentUser()` at the beginning of Server Actions to ensure only authenticated users can execute them.

```typescript
// app/dashboard/actions.ts
'use server'

import { getCurrentUser } from '@/auth/current-user'
import { createWorkout } from '@/data/workouts'

export async function createWorkoutAction(formData: FormData) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')
  
  const name = formData.get('name')
  const duration = formData.get('duration')
  
  return createWorkout({
    userId: user.id,
    name: String(name),
    duration: Number(duration),
  })
}
```

## Security Best Practices

### Rule 1: Never Trust Client-Provided User IDs

**ALWAYS use the authenticated user's ID from `getCurrentUser()`, never trust user IDs sent from the client.**

```typescript
// ✅ CORRECT - Use authenticated user's ID
export async function getUserWorkouts() {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')
  
  return db
    .select()
    .from(workouts)
    .where(eq(workouts.userId, user.id))
}

// ❌ WRONG - Trusts client-provided userId
export async function getUserWorkouts(userId: string) {
  return db
    .select()
    .from(workouts)
    .where(eq(workouts.userId, userId))
}
```

### Rule 2: Verify Ownership Before Returning Data

For operations on specific resources, always verify the current user owns the resource before returning or modifying it.

```typescript
// ✅ CORRECT - Verifies user owns the workout
export async function getWorkoutById(workoutId: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')
  
  const workout = await db
    .select()
    .from(workouts)
    .where(
      and(
        eq(workouts.id, workoutId),
        eq(workouts.userId, user.id)
      )
    )
    .then(rows => rows[0] || null)
  
  if (!workout) throw new Error('Not found')
  return workout
}

// ❌ WRONG - Doesn't verify user owns the workout
export async function getWorkoutById(workoutId: string) {
  return db
    .select()
    .from(workouts)
    .where(eq(workouts.id, workoutId))
    .then(rows => rows[0] || null)
}
```

### Rule 3: Handle Unauthorized Access

Always handle the case where a user is not authenticated or not authorized to access a resource.

```typescript
// ✅ CORRECT - Handles both unauthorized and not-found cases
export async function deleteWorkout(workoutId: string) {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }
  
  const workout = await getWorkoutById(workoutId)
  if (!workout) {
    throw new Error('Workout not found')
  }
  
  await db
    .delete(workouts)
    .where(eq(workouts.id, workoutId))
}
```

## Environment Configuration

### Required Environment Variables

The following environment variables must be configured for Clerk to work:

```
# .env.local
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_publishable_key
CLERK_SECRET_KEY=your_secret_key
```

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Public key for frontend Clerk initialization (prefix `NEXT_PUBLIC_` makes it available in browser)
- `CLERK_SECRET_KEY`: Secret key for server-side Clerk operations (never expose to browser)

Obtain these keys from your Clerk dashboard.

## Resources

- [Clerk Documentation](https://clerk.com/docs)
- [Clerk for Next.js](https://clerk.com/docs/quickstarts/nextjs)
- [Clerk Components](https://clerk.com/docs/components/overview)
- [Clerk Middleware](https://clerk.com/docs/references/nextjs/clerk-middleware)
- [Clerk Server-Side Functions](https://clerk.com/docs/references/backend/overview)

## Summary

| Task | Approach | ✅/❌ |
|------|----------|-------|
| Get current authenticated user | Use `getCurrentUser()` from `@/auth/current-user` | ✅ |
| Display sign-in UI | Use Clerk `<SignIn />` component | ✅ |
| Display user profile | Use Clerk `<UserButton />` component | ✅ |
| Protect routes | Use Clerk middleware in `middleware.ts` | ✅ |
| Verify user in Server Action | Call `getCurrentUser()` at start | ✅ |
| Trust client-provided user IDs | Never | ❌ |
| Use custom auth solution | Never | ❌ |
| Store passwords manually | Never | ❌ |

Remember: **Clerk handles all authentication. Use `getCurrentUser()` in Server Components and Server Actions. Never implement custom auth logic.**
