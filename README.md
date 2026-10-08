# MiniShopNg

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 22.2.0.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:8080/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Production deployment

The app is a static SPA served by nginx. The **backend is deployed separately** (another Railway service, e.g. `/mini-shop-api`); nginx exposes it on the same origin under `/api` so the browser only talks to the frontend domain. The multi-stage `Dockerfile` builds the app and serves it with nginx; `railway.json` configures the service.

### Railway

1. Push the repository to GitHub, then on [Railway](https://railway.com) create a project and **Deploy from GitHub repo** (the `Dockerfile` is detected automatically).
2. The container already defaults to the production backend:
   `API_UPSTREAM=https://mini-shop-api-production-d245.up.railway.app`
   (set the variable on the Railway service to override it, e.g. for a new deployment environment):

3. Generate a public domain for the frontend under **Networking**.

Notes:

- The app listens on a **fixed port 8080** everywhere (nginx `listen 0.0.0.0:8080`, healthcheck, Docker Compose `8080:8080`, Angular dev server). It matches Railway's default `PORT`, so no networking configuration is needed.
- `/api/*` is proxied to `API_UPSTREAM` (the `/api` prefix is stripped): `/api/products` → `https://<backend>.up.railway.app/products`. This keeps everything same-origin, so no CORS is needed.
- DNS is resolved lazily at request time: the frontend starts even if the backend is not reachable yet, but API calls fail until the backend is up.
- `railway.json` defines the healthcheck (`/`) and the restart policy.

### Local Docker / Compose

```bash
docker build -t mini-shop-ng .
docker run -d -p 8080:8080 -e API_UPSTREAM=http://host.docker.internal:3000 mini-shop-ng
# or, with the backend configured in docker-compose.yml
docker compose up --build   # app on http://localhost:8080
```

### Sub-path

Serving under a sub-path: build with `ng build --base-href /sub-path/`.

### CI

`.github/workflows/ci.yml` runs on every push and pull request: Prettier check,
unit tests, production build, and a Docker image build.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
