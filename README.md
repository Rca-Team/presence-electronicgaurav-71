
# Presence - Facial Recognition Attendance System

## Project info

An advanced attendance management system powered by facial recognition technology.

## Features

- Real-time attendance tracking with facial recognition
- Dashboard with attendance analytics and insights
- User registration and management
- Secure authentication
- Department-based tracking and reporting

## Technologies Used

- React
- TypeScript
- Tailwind CSS
- shadcn/ui components
- Supabase for backend and authentication
- Face-api.js for facial recognition

## Getting Started

Follow these steps to get the project running locally:

```sh
# Step 1: Clone the repository
git clone <REPOSITORY_URL>

# Step 2: Navigate to the project directory
cd presence

# Step 3: Install the necessary dependencies
npm i

# Step 4: Create a .env file with your environment variables
# Use .env.example as a template

# Step 5: Start the development server
npm run dev
```

## Deployment on Vercel

### Required Environment Variables

Make sure to set the following environment variables in your Vercel project settings:

- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `VITE_FIREBASE_API_KEY`: Firebase API key
- `VITE_FIREBASE_AUTH_DOMAIN`: Firebase auth domain
- `VITE_FIREBASE_PROJECT_ID`: Firebase project ID
- `VITE_FIREBASE_STORAGE_BUCKET`: Firebase storage bucket
- `VITE_FIREBASE_MESSAGING_SENDER_ID`: Firebase messaging sender ID
- `VITE_FIREBASE_APP_ID`: Firebase app ID

### Deploy to Vercel

1. Push your code to a GitHub repository
2. Log in to Vercel and create a new project
3. Import your GitHub repository
4. Configure the environment variables
5. Deploy!

## Made by Gaurav

© 2024 Presence. All rights reserved.
