# Palm Backend

## Technical Documentations
https://docs.google.com/document/d/1YjHWyv0LyxX8PFLTPvY4yytJAzz36RrXCosyDe1LXB8/edit?usp=sharing

## Project Description

Palm is a real-time customer support chat backend built with Node.js, Express, MongoDB, Redis, and TypeScript. It exposes REST and WebSocket (Socket.IO) APIs to support:

- Real-time messaging between users and agents
- Push notifications for offline users via Firebase Cloud Messaging (FCM)
- WebRTC signaling (offer/answer exchange) for audio/video calls

This service stores chat history and user credentials in MongoDB and uses Redis for caching frequently accessed data.

## Prerequisites

Before you begin, ensure you have the following installed on your machine:

- **Node.js** v20.3.0 or higher
- **npm** v9.6.7 or higher (bundled with Node.js)
- **MongoDB** v6.0 or later (local or remote)
- **Redis** v7.x or later (local or remote)
- A **Firebase** project with Cloud Messaging enabled

## Getting Started

Clone the repository and install dependencies:

```bash
git clone git@github.com:sanjayAdhikari/palm-call.git
cd palm-call
npm install
```

### Configuration

1. Copy your firebase admin-sdk json file as same filename as below: 
   ```bash
   src/config/firebase-adminsdk.json
   
2. Copy the example environment file and update values:
   ```bash
   cp .env.example .env
   ```
3. Open `.env` and set:
    - `MONGODB_URI` (e.g. `mongodb://localhost:27017/palm`)
    - `REDIS_URL` (e.g. `redis://localhost:6379`)
    - `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`
    - any other application secrets or ports

### Seed Database (Optional)

If you need initial data (e.g., admin user), run:
```bash
npm run seed
```

### Running the Backend

- **Development** (with hot-reloading):
  ```bash
  npm run dev
  ```
- **Production**:
  ```bash
  npm run build
  npm start
  ```

The server will start on the port defined in your `.env` (default: `5000`).

## Project Structure

```text
palm-call/
├── src/
│   ├── app.ts           # App initialization and middleware setup
│   ├── server.ts        # HTTP & Socket.IO server bootstrap
│   ├── config/          # Environment constants and route URLs
│   ├── controller/      # Express route handlers
│   ├── database/        # MongoDB connection and models
│   │   ├── connection.ts
│   │   ├── model/
│   │   └── repository/
│   ├── interface/       # TypeScript interfaces and types
│   ├── middleware/      # Authentication, validation, logging
│   ├── route/           # Route definitions
│   ├── service/         # Business logic and external integrations
│   └── utils/           # Helpers (e.g., JWT, error formatting)
├── .env.example             # Example environment variables
├── .env                     # Production Environment variables
├── .env.dev             # Development environment variables
├── .gitignore
├── package.json
├── tsconfig.json
├── Dockerfile
├── docker-compose.yml   # Redis & MongoDB for local development
└── README.md            # This file
```

## License

MIT License

