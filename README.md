# Shared Schedule App

React web app for sharing schedules, favorite places, and diary entries.
Each user signs up/logs in locally and data is persisted in the browser via localStorage.

## Features
- **Sign up & Login** - create an account with name, email, password.
- **Home (Schedule)**
  - Monthly calendar with per-day events.
  - Floating + button opens an add-event modal (title, memo, image, location).
  - Apply the latest selection from the Places tab directly into the event location.
  - Shared todo list shown below the calendar.
- **Favorites (Places)** - search OpenStreetMap locations and see results on the map.
- **Diary** - pick a date, write/save an entry, and browse past notes.
- **Header Burger Menu** - quick access to My Page & logout.
- **Bottom Tab Bar** - quick nav for home, places, diary, and menu (My Page) similar to a mobile app.
- **Local Persistence** - schedules, todos, and diaries stay in localStorage.

## Tech Stack
- React 18 + TypeScript
- Vite 7
- React Leaflet + OpenStreetMap tiles
- Plain CSS styling

## Running Locally
1. npm install
2. npm run dev

Open the http://localhost:5173 URL shown in the terminal.

> **Note**
> Place search uses the OpenStreetMap Nominatim API. For production you should follow the usage policy and consider rate limiting/caching.
