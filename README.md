# Fantasy Golf Live Dashboard

A deployable React/Vite front end for your fantasy golf league.

## Setup

1. Install dependencies:
   npm install

2. Optional: create a `.env` file if you want to override the default JSON endpoint:
   VITE_DATA_URL=https://script.google.com/macros/s/your-app-script-id/exec

3. Run locally:
   npm run dev

4. Build for production:
   npm run build

## Deploy to Vercel

1. Create a new GitHub repo and upload these files.
2. In Vercel, import the repo.
3. Framework preset: Vite.
4. Optional environment variable:
   VITE_DATA_URL = your Apps Script URL
5. Deploy.

## Notes

- The app is read-only.
- It expects the Apps Script JSON structure you already built.
- If the endpoint cannot be reached, the app shows fallback data.
