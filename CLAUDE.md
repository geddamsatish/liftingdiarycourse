# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Lifting Diary** web application built with Next.js 16, React 19, TypeScript, and Tailwind CSS. The project is in early development stages, currently using the default create-next-app template structure.

## Common Development Commands

### Running the Development Server
```bash
npm run dev
```
Starts the Next.js development server at `http://localhost:3000` with hot-reload enabled.

### Building for Production
```bash
npm run build
```
Compiles the TypeScript and creates an optimized production build.

### Starting Production Server
```bash
npm start
```
Runs the production-built application.

### Linting
```bash
npm run lint
```
Runs ESLint to check for code quality issues. The project uses Next.js ESLint config with Core Web Vitals and TypeScript support.

## Project Structure

```  
src/
├── app/
│   ├── page.tsx          # Home page component (App Router)
│   ├── layout.tsx        # Root layout wrapper (metadata, fonts, body)
│   ├── globals.css       # Global styles with Tailwind directives
│   └── favicon.ico       # Site icon
public/
├── next.svg
└── vercel.svg
```

### Architecture Overview

- **App Router**: Uses Next.js 16 App Router (`src/app/` directory) for file-based routing
- **Styling**: Tailwind CSS v4 with PostCSS for utility-first CSS styling
- **Type Safety**: Full TypeScript with strict mode enabled
- **Fonts**: Geist font family (sans + mono variants) loaded via next/font/google

## Key Technologies & Versions

| Technology | Version | Notes |
|------------|---------|-------|
| Next.js    | 16.3.3  | App Router, built-in optimizations |
| React      | 19.2.8  | Latest React with concurrent features |
| TypeScript | ^5      | Strict mode enabled |
| Tailwind   | ^4      | Utility-first CSS framework |
| ESLint     | ^9      | With Next.js config (Core Web Vitals + TypeScript) |

## Important Configuration Files

- **tsconfig.json**: TypeScript compiler options with path alias `@/*` → `./src/*`
- **next.config.ts**: Next.js configuration (currently minimal)
- **eslint.config.mjs**: ESLint rules (Next.js defaults + TypeScript)
- **postcss.config.mjs**: PostCSS config for Tailwind processing

## Development Notes

- **Module Imports**: Use the `@/` alias when importing from `src/` (e.g., `import Component from '@/components/...'`)
- **Dark Mode**: The project includes dark mode CSS classes (e.g., `dark:bg-black`) in the Tailwind setup
- **Responsive Design**: Tailwind breakpoints are used throughout (sm:, md:, etc.)
- **Next.js Image Optimization**: The `Image` component from `next/image` is used for optimized image loading

## When to Start Developing

After cloning or checking out the code:
1. Run `npm install` (if node_modules doesn't exist)
2. Run `npm run dev`
3. Open `http://localhost:3000`
4. Begin editing `src/app/page.tsx` for main page changes

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
