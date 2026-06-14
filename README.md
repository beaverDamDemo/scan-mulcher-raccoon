# Scan Mulcher Goblin

Scan Mulcher Goblin is a browser-first scanner app built with Angular 22. It captures label images from camera or upload, runs OCR in the browser, shows a cleaned preview, and saves scan artifacts to Dropbox.

## What This App Does

- Captures images from phone or desktop camera
- Supports manual image upload
- Runs OCR locally in the browser using Tesseract.js
- Filters OCR text to keep only the useful receipt fields
- Saves image + OCR result to Dropbox using a provider abstraction

## OCR Filtering Rules

Before preview and save, OCR output is curated so the app keeps only useful fields:

- Keeps item name
- Keeps item number
- Keeps item price (optional)
- Keeps Lokacija line (optional)
- Drops top noise text when structure is recognized
- Drops footer line containing Agri Store parts sezana

This means the user preview and Dropbox payload both use filtered output, not raw OCR noise.

## Tech Stack

- Angular 22 (SSR-capable app build)
- Tailwind CSS 4
- Tesseract.js for OCR
- Dropbox API for storage

## Requirements

- Node.js 20+
- npm 11+
- A Dropbox access token with required file scopes
- For phone camera testing: HTTPS tunnel (Cloudflare Tunnel or ngrok)

## Install

```bash
npm install
```

## Run Locally (Desktop)

```bash
npm start
```

Open:

- http://localhost:4200

## Phone Camera Testing (Recommended)

Mobile browsers require HTTPS for camera access. Use the local server + tunnel workflow.

### 1. Start app on LAN host

```bash
npm run start:phone
```

### 2. Expose localhost with Cloudflare Tunnel

```bash
npm run tunnel
```

Copy the HTTPS URL printed by cloudflared (for example, a trycloudflare.com URL) and open it on your phone.

## Alternative Phone Testing with ngrok

If you prefer ngrok, use this flow.

### 1. Install and set up ngrok

- Download: https://ngrok.com/download
- Docs: https://ngrok.com/docs/getting-started/

### 2. Start local app

```bash
npm run start:phone
```

### 3. Start ngrok tunnel

```bash
ngrok http 4200
```

### 4. Copy the live preview URL

In ngrok terminal output, copy the HTTPS forwarding URL shown on the Forwarding line, for example:

```text
Forwarding  https://abc123.ngrok-free.app -> http://localhost:4200
```

Use that https://...ngrok-free.app URL on your phone.

## Dropbox Token Setup (In-App)

Token configuration is browser-local:

- Open settings using the gear button
- Paste Dropbox token
- Save token

The token is stored in localStorage on that device only. It is not hardcoded in source code.

## Available Scripts

- npm start: Start Angular dev server
- npm run start:dev: Same as start
- npm run start:phone: Start dev server for phone/LAN testing
- npm run build: Production build
- npm run watch: Build in watch mode
- npm test: Run unit tests
- npm run tunnel: Start Cloudflare Tunnel to localhost:4200

## Build

```bash
npm run build
```

Build output is generated in dist/scan-mulcher-raccoon.

## Test

```bash
npm test
```

## Troubleshooting

### Camera not opening on phone

- Make sure you are using an HTTPS tunnel URL, not plain HTTP
- Keep both dev server and tunnel terminals running

### Storage says token missing

- Open settings via gear button
- Confirm token was saved
- Ensure Dropbox token has required file scopes

### OCR quality is poor

- Improve lighting and focus
- Fill more of the frame with the label
- Avoid motion blur before capture

## Angular CLI Reference

- Angular CLI docs: https://angular.dev/tools/cli
