# GitHub Clone

A full-stack GitHub-style application with a React frontend and an Express backend. Users can create accounts, sign in, manage repositories, and create and manage issues for their repositories.

The repository also contains a small command-line workflow for storing local commits and optionally pushing or pulling them from an AWS S3 bucket.

## Features

- User signup and login
- JWT-based authentication for protected requests
- Dashboard with repository search
- Repository creation, listing, detail view, deletion, and visibility toggling
- Issue creation, editing, closing/reopening, listing, and deletion
- User profile with repository listing
- Follow/unfollow endpoint and profile control
- MongoDB persistence
- Optional Socket.IO server setup
- Local Git-like commands:
  - Initialize a local repository
  - Stage a file
  - Create a commit
  - Push commits to S3
  - Pull commits from S3
  - Revert a local commit

## Tech stack

### Frontend

- React 19
- Vite
- React Router
- Axios
- Primer React and Primer Octicons
- `@uiw/react-heat-map`

### Backend

- Node.js
- Express 5
- MongoDB native driver and Mongoose
- JSON Web Tokens (`jsonwebtoken`)
- `bcrypt` for password hashing
- Socket.IO
- `yargs` for command-line commands
- AWS SDK v2 for the optional S3 commit workflow

## Project structure

```text
.
├── Backend/
│   ├── config/          AWS configuration
│   ├── controllers/     HTTP handlers and CLI operations
│   ├── middleware/      JWT and ownership authorization
│   ├── models/          Mongoose models
│   ├── routes/          Express routers
│   ├── index.js         Backend entry point
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/  Authentication, dashboard, repository, and profile UI
│   │   ├── api.js       API base URL and auth header helpers
│   │   ├── Routes.jsx   Application routes
│   │   └── authContext.jsx
│   ├── package.json
│   └── .env.example
└── .gitignore
```

## How the application works

The frontend sends requests to the backend URL configured by `VITE_API_URL`. Signup and login return a JWT and user ID, which the frontend stores in `localStorage`. Protected requests send the token in an `Authorization: Bearer <token>` header.

The backend connects to the `gitClone` MongoDB database. User records are stored with hashed passwords. Repository and issue data are stored through the Mongoose models in `Backend/models`.

Repository and issue mutations require authentication. Repository and issue ownership middleware prevents users from modifying resources they do not own.

## Setup and installation

Clone the repository and install dependencies separately for the two applications:

```bash
git clone https://github.com/sudharshan994/github-clone.git
cd github-clone

cd Backend
npm install

cd ../frontend
npm install
```

Do not commit `.env` files. The root `.gitignore` excludes environment files, dependency folders, build output, and local `.apnaGit`/`.sudhagit` directories.

## Environment variables

### Backend

Create `Backend/.env` from `Backend/.env.example`:

```env
PORT=3001
MONGODB_URI=YOUR_MONGODB_URI
JWT_SECRET_KEY=YOUR_JWT_SECRET
CLIENT_ORIGIN=http://localhost:5174

# Only needed for the S3 push/pull commands:
AWS_REGION=YOUR_AWS_REGION
S3_BUCKET=YOUR_S3_BUCKET
AWS_ACCESS_KEY_ID=YOUR_AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY=YOUR_AWS_SECRET_ACCESS_KEY
```

`JWT_SECRET` is also accepted by the backend as a fallback, but `JWT_SECRET_KEY` is the documented variable.

For production, set `CLIENT_ORIGIN` to the exact frontend origin, such as:

```env
CLIENT_ORIGIN=https://your-frontend-domain.example
```

The MongoDB URI must start with `mongodb://` or `mongodb+srv://`. If the password contains reserved URL characters, URL-encode them before placing the URI in the environment variable.

### Frontend

Create `frontend/.env` from `frontend/.env.example`:

```env
VITE_API_URL=http://localhost:3001
```

The value should be the backend origin without a trailing slash. For a deployed frontend, use the deployed backend URL instead.

## Running locally

Start the backend from `Backend`:

```bash
npm start
```

This runs `node index.js start`. The server listens on the `PORT` value from `Backend/.env`.

In a second terminal, start the frontend from `frontend`:

```bash
npm run dev
```

The Vite development server normally runs on port `5173`; if that port is occupied, Vite may choose another port. Keep `CLIENT_ORIGIN` aligned with the actual frontend origin.

Other frontend scripts are:

```bash
npm run build
npm run lint
npm run preview
```

`Backend/package.json` currently defines only the `start` script.

## Backend API

All routes are served from the backend root. Protected routes require a bearer token.

### User routes

```text
POST   /signup
POST   /login
GET    /allUsers
GET    /userProfile/:id
PUT    /updateProfile/:id       Protected
DELETE /deleteProfile/:id       Protected
PATCH  /userProfile/:id/follow  Protected
```

### Repository routes

```text
POST   /repo/create             Protected
GET    /repo/all
GET    /repo/:id
GET    /repo/name/:name
GET    /repo/user/:userID       Protected
PUT    /repo/update/:id        Protected and owner-only
DELETE /repo/delete/:id        Protected and owner-only
PATCH  /repo/toggle/:id        Protected and owner-only
```

### Issue routes

```text
POST   /issue/create            Protected
GET    /issue/all
GET    /issue/:id
PUT    /issue/update/:id       Protected and owner-authorized
DELETE /issue/delete/:id       Protected and owner-authorized
```

The backend root endpoint is:

```text
GET /
```

It returns `Welcome!` and can be used as a simple deployment health check.

## Local Git-like commands

These commands are implemented by `Backend/index.js` through `yargs`. Run them from the directory where the local `.apnaGit` directory should be created.

```bash
node Backend/index.js init
node Backend/index.js add path/to/file
node Backend/index.js commit "Commit message"
node Backend/index.js push
node Backend/index.js pull
node Backend/index.js revert COMMIT_ID
```

`init` creates `.apnaGit/commits`, `.apnaGit/staging`, and `.apnaGit/config.json`. The `push` and `pull` commands use the AWS and S3 environment variables listed above.

## Deployment

The project is deployed as two services:

- Frontend on Vercel
- Backend on Render

Current deployment URLs:

- Frontend: https://github-clone-o5bhlhk3u-sudharshan7207417137-9478s-projects.vercel.app
- Backend health check: https://github-clone-backend-iz4o.onrender.com

For the frontend deployment:

```text
Root Directory: frontend
Install Command: npm install
Build Command: npm run build
Output Directory: dist
```

Set this Vercel environment variable:

```env
VITE_API_URL=https://your-render-backend.example
```

For the Render backend deployment:

```text
Root Directory: Backend
Build Command: npm install
Start Command: npm start
```

Set the backend variables from the Backend section, including the exact Vercel origin in `CLIENT_ORIGIN`. Never put `MONGODB_URI`, `JWT_SECRET_KEY`, or AWS credentials in the frontend project.

## Implementation notes and current limitations

- MongoDB is used by both the native MongoDB user controller and the Mongoose repository/issue models.
- The backend configures DNS servers for MongoDB SRV resolution when `DNS_SERVERS` is not supplied.
- The Socket.IO server is initialized in `Backend/index.js` and accepts a `joinRoom` event. The current frontend does not use Socket.IO.
- The profile page currently displays fixed follower/following labels rather than calculated counts.
- The dashboard includes a static “Upcoming Events” list.
- Repository visibility is stored and can be toggled. The current public repository read handlers do not apply visibility filtering, so visibility should not be treated as a complete access-control boundary yet.
- There is no automated test script in either `package.json`. The available frontend checks are `npm run lint` and `npm run build`.

## Future improvements

- Add automated backend and frontend tests.
- Enforce visibility filtering in public repository and issue reads.
- Replace the profile’s fixed follower/following labels with values from MongoDB.
- Replace the static dashboard events with stored or removed event data.
- Add pagination and consistent error response formats for larger repository and issue lists.
- Migrate the optional S3 integration from AWS SDK v2 to the AWS SDK v3 packages.

## Author and contributions

The repository is maintained by [sudharshan994](https://github.com/sudharshan994). Contributions can be made through GitHub issues and pull requests.
