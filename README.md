# Daily Tracker Frontend

React frontend for the Daily Tracker application.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Deployment

For production deployment, build the app and serve the `dist` directory using a web server like Nginx or deploy to platforms like Vercel, Netlify, etc.

The frontend expects the backend API to be available at `/api` (proxied during development). In production, you may need to configure your web server to proxy API requests to your backend server.
