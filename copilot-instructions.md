# Project AI Instructions

## Purpose

This project is called **Scan Mulcher Goblin**. It is a playful Angular app that:

- Opens the camera
- Reads labels using Tesseract.js
- Extracts text and numbers
- Saves results to a storage provider (Dropbox for now, but swappable later)

## Coding Style

- Use Angular v22 standalone components
- Use TailwindCSS for styling
- Prefer clean, readable code
- Avoid unnecessary abstractions
- Keep functions small and focused

## File Generation Rules

- When generating code, include imports
- Use correct Angular v22 syntax
- Use TypeScript strict mode
- Use async/await for async operations
- Use dependency injection where appropriate

## Architecture Rules

- No backend required
- All OCR happens in the browser
- Storage provider must be abstracted behind a service
- The app must allow replacing Dropbox with another provider later

## Naming Conventions

- Components: `SomethingComponent`
- Services: `SomethingService`
- Files: kebab-case
- Variables: camelCase

## What Copilot Should Do

- Suggest Angular components, services, and utilities
- Generate Tailwind-friendly HTML
- Help with Tesseract.js integration
- Help with Dropbox API calls
- Help with refactoring and improvements

## What Copilot Should NOT Do

- Do not generate backend code unless explicitly asked
- Do not assume a specific storage provider
- Do not use deprecated Angular APIs

## Example Tasks for Copilot

- "Generate a camera component"
- "Create a service for OCR using Tesseract.js"
- "Create a storage service interface"
- "Implement DropboxStorageService"
- "Write Tailwind markup for the scanner UI"
