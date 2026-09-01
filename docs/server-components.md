# Server Components Coding Standards

## Overview

This document outlines the coding standards for Server Components in this Next.js 15 project. Server Components are the default in Next.js 15 and should be used for data fetching, accessing sensitive data, and rendering content on the server.

## CRITICAL: Async Params in Next.js 15

**RULE: In Next.js 15+, `params` is a Promise and MUST be awaited.**

This is a breaking change from Next.js 14 and earlier. Failing to await `params` will result in `TypeError: Cannot destructure property from undefined`.

### ❌ WRONG - Not awaiting params

```typescript
// ❌ DO NOT DO THIS - will error
export default function Page({ params }: { params: { id: string } }) {
  const { id } = params; // params is undefined!
  return <div>{id}</div>;
}
```

### ✅ CORRECT - Awaiting params

```typescript
// ✅ CORRECT - params is awaited
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <div>{id}</div>;
}
```

## Pattern: Dynamic Route Pages

All dynamic route pages (those with `[slug]` segments) must follow this pattern:

### File Structure

```
src/app/
├── dashboard/
│   ├── workout/
│   │   └── [workoutId]/
│   │       └── page.tsx     # Server Component
```

### Page Component Pattern

```typescript
import { SomeAction } from "@/app/dashboard/actions";
import { SomeComponent } from "@/components/dashboard/some-component";
import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{
    workoutId: string;
  }>;
}

export default async function Page({ params }: PageProps) {
  // ✅ ALWAYS await params at the start
  const { workoutId } = await params;

  // ✅ Validate param types immediately
  const workoutIdNumber = parseInt(workoutId, 10);
  if (isNaN(workoutIdNumber)) {
    redirect("/dashboard");
  }

  // ✅ Fetch data server-side
  const result = await getWorkoutAction(workoutIdNumber);

  // ✅ Handle errors/not found with redirect
  if (!result.success) {
    redirect("/dashboard");
  }

  const workout = result.data;

  // ✅ Render with fetched data
  return (
    <div>
      <SomeComponent initialData={workout} />
    </div>
  );
}
```

## Pattern: Sequential Page with SearchParams

For pages that use both `params` and `searchParams`, both must be awaited:

```typescript
interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string; sort?: string }>;
}

export default async function Page({ params, searchParams }: PageProps) {
  // ✅ Await both params and searchParams
  const { id } = await params;
  const { tab = "overview", sort = "date" } = await searchParams;

  // Rest of component...
}
```

## Pattern: Data Fetching in Server Components

### Fetching Data Server-Side

```typescript
// ✅ CORRECT - Fetch in Server Component
export default async function Page({ params }: PageProps) {
  const { id } = await params;

  // ✅ Call server-side data fetch directly
  const data = await getDataById(id); // From @/data/...

  // ✅ Or call Server Action
  const result = await getDataAction(id); // From @/app/.../actions.ts

  if (!result.success) {
    redirect("/fallback");
  }

  return <ClientComponent data={result.data} />;
}
```

### ❌ DO NOT Fetch in Client Components

```typescript
// ❌ WRONG - Do not fetch data in client components
"use client";

export function ClientComponent() {
  const [data, setData] = useState(null);

  useEffect(() => {
    // ❌ This is less efficient than server-side fetching
    fetchData().then(setData);
  }, []);

  return <div>{data}</div>;
}
```

## Type Safety with Params

### Using TypeScript Generics

```typescript
// ✅ Type your params interface clearly
interface PageProps {
  params: Promise<{
    workoutId: string;
  }>;
}

export default async function Page({ params }: PageProps) {
  const { workoutId } = await params;
  // workoutId is typed as string
}
```

### Validating Param Types

```typescript
// ✅ Always validate and convert params
export default async function Page({ params }: PageProps) {
  const { workoutId } = await params;

  // Validate type conversion
  const id = parseInt(workoutId, 10);
  if (isNaN(id)) {
    redirect("/dashboard");
  }

  // Now 'id' is safely a number
  const workout = await getWorkoutById(id);
}
```

## Error Handling in Server Components

### Redirect on Not Found

```typescript
import { redirect } from "next/navigation";

export default async function Page({ params }: PageProps) {
  const { id } = await params;

  // ✅ Use redirect for not found scenarios
  const data = await getDataById(id);
  if (!data) {
    redirect("/dashboard");
  }

  return <div>{data.name}</div>;
}
```

### Using notFound()

```typescript
import { notFound } from "next/navigation";

export default async function Page({ params }: PageProps) {
  const { id } = await params;

  const data = await getDataById(id);
  if (!data) {
    // ✅ Use notFound() for 404 pages
    // Requires a not-found.tsx file in the directory
    notFound();
  }

  return <div>{data.name}</div>;
}
```

### Try-Catch for Errors

```typescript
// ✅ Handle unexpected errors gracefully
export default async function Page({ params }: PageProps) {
  try {
    const { id } = await params;
    const data = await getDataById(id);
    
    if (!data) {
      redirect("/dashboard");
    }

    return <div>{data.name}</div>;
  } catch (error) {
    // Log error or handle gracefully
    console.error("Failed to load data:", error);
    redirect("/dashboard");
  }
}
```

## Passing Data to Client Components

### Serialize Data Before Passing

```typescript
// ✅ CORRECT - Pass serializable data to Client Components
export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const data = await getDataById(id);

  // ✅ Pass plain objects (Date objects will be serialized)
  return <ClientComponent initialData={data} />;
}
```

### ❌ DO NOT Pass Non-Serializable Objects

```typescript
// ❌ WRONG - Cannot pass functions or class instances
export default async function Page() {
  const handler = () => console.log("click");

  // ❌ This will error - functions are not serializable
  return <ClientComponent onClick={handler} />;
}
```

## Metadata in Server Components

### Generating Metadata

```typescript
import { Metadata } from "next";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const data = await getDataById(parseInt(id, 10));

  return {
    title: `${data.name} - Lifting Diary`,
    description: data.description,
  };
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const data = await getDataById(parseInt(id, 10));

  return <div>{data.name}</div>;
}
```

## Best Practices

### ✅ DO

- **Await params immediately** at the start of the component
- **Validate param types** before using them
- **Fetch data server-side** in the page component
- **Use redirect()** for not-found or unauthorized access
- **Pass serializable data** to client components
- **Use Metadata API** for dynamic page titles and meta tags
- **Handle errors gracefully** with try-catch or redirect
- **Type params** with TypeScript interfaces

### ❌ DO NOT

- **Forget to await params** — this is the most common mistake
- **Use useState/useEffect** in Server Components
- **Call client-only APIs** like localStorage or window
- **Pass functions or non-serializable objects** to Client Components
- **Skip validation** of param values before using them
- **Use optional chaining** without proper type safety on params
- **Render Client Components** without "use client" directive

## Checklist for New Dynamic Pages

- [ ] Params interface includes `Promise<{...}>`
- [ ] Params are awaited with `await params` at the top
- [ ] Param values are validated before use
- [ ] Type conversions are validated (e.g., parseInt with isNaN check)
- [ ] Data is fetched server-side
- [ ] Not found / unauthorized access is handled with redirect()
- [ ] Data passed to Client Components is serializable
- [ ] Error handling is implemented
- [ ] Page is tested with invalid/missing params

## References

- [Next.js 15 Upgrade Guide - Dynamic Props](https://nextjs.org/docs/app/building-your-application/upgrading/version-15)
- [Server Components - Next.js Documentation](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Dynamic Routes - Next.js Documentation](https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes)
- [notFound vs redirect - Next.js Docs](https://nextjs.org/docs/app/api-reference/functions/not-found)
