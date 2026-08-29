# UI Coding Standards

## Overview

This document outlines the coding standards and guidelines for all UI development in the Lifting Diary application. All team members must adhere to these standards to maintain consistency and code quality across the project.

## Component Library

### shadcn/ui Components Only

**RULE: Only use shadcn/ui components for the entire UI. Absolutely NO custom components should be created.**

All UI elements must be built using the official shadcn/ui component library. This ensures:
- Consistent design language across the application
- Maintainability and predictability
- Community support and ongoing updates
- Accessible components by default

### When You Need a Component

1. Check the [shadcn/ui component library](https://ui.shadcn.com/docs/components) first
2. Use the component exactly as documented
3. Customize using Tailwind CSS utility classes and component props
4. **Do NOT create wrapper components or custom variants** — use shadcn/ui props and Tailwind classes instead

### Acceptable Use Cases

- **Using shadcn/ui components**: ✅ All cases
- **Wrapping a shadcn/ui component for styling**: ✅ Yes, use Tailwind utilities
- **Extending a shadcn/ui component via props**: ✅ Yes, leverage component API
- **Creating a custom component**: ❌ Never — find or request a shadcn/ui alternative

## Installation & Setup

### Adding New shadcn/ui Components

Use the shadcn/ui CLI to install components:

```bash
npx shadcn-ui@latest add [component-name]
```

This automatically:
- Downloads the component source
- Adds it to your project
- Ensures proper dependencies are installed

Never manually copy component code.

## Date Formatting

### Using date-fns

All date formatting must be done using the `date-fns` library. This ensures consistent, locale-aware date handling across the application.

### Required Date Format

Dates must be formatted with **ordinal suffixes** and the following pattern:

```
[Day with ordinal suffix] [Month (abbreviated)] [Year]
```

**Examples:**
- `1st Sept 2025`
- `2nd Aug 2025`
- `3rd Jan 2025`
- `4th Jun 2026`
- `21st Oct 2024`
- `22nd Dec 2025`
- `23rd Mar 2026`
- `31st May 2025`


