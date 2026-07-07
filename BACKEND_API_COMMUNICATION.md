# Backend Admin to API Communication Map

This document describes how `backend_admin` communicates with the `api` service based on the current code.

## Summary

`backend_admin` is a Next.js app. `api` is an Express app.

Most frontend calls are written as same-origin URLs like:

```ts
/api/auth/login
/api/users/modulelist
/api/setting/profile
```

Those requests first hit the Next.js app, then Next rewrites them to the Express API using `NEXT_PUBLIC_API_URL`.

Current configured API base:

```env
backend_admin/.env
NEXT_PUBLIC_API_URL=http://192.168.2.10:3001/api
```

So this frontend request:

```txt
http://localhost:3000/api/auth/login
```

is proxied by Next.js to:

```txt
http://192.168.2.10:3001/api/auth/login
```

## Main Connection Points

| Layer | File | What It Does |
| --- | --- | --- |
| Frontend env | `backend_admin/.env` | Defines `NEXT_PUBLIC_API_URL=http://192.168.2.10:3001/api` and enables real API mode with `NEXT_PUBLIC_API_ENABLED=TRUE`. |
| Next proxy | `backend_admin/next.config.ts` | Rewrites every `/api/:path*` request to `${NEXT_PUBLIC_API_URL}/:path*`. |
| Frontend calls | `backend_admin/app/**`, `backend_admin/components/**` | Uses `fetch()` and `axios` to call `/api/...` or direct `${NEXT_PUBLIC_API_URL}/...`. |
| Express server | `api/src/index.js` | Starts Express on `PORT` from `api/.env`, defaults to `3001`; installs JSON parser, cookies, CORS, static upload routes, and route modules. |
| API env | `api/.env` | Defines `PORT=3001`, `FRONTEND_URL=http://192.168.2.10:3000`, JWT secrets, DB settings, SMTP settings. |
| API auth middleware | `api/src/middleware/authMiddleware.js` | Reads JWT from cookies `token`, `access_token`, `auth_token`, or `Authorization: Bearer ...`. |
| API route mounting | `api/src/index.js` | Mounts Express routers under `/api/auth`, `/api/users`, `/api/customers`, etc. |

## Request Flow

### 1. Normal Same-Origin Proxy Flow

Used by most code.

```txt
Browser
  -> backend_admin on localhost:3000
  -> /api/...
  -> backend_admin/next.config.ts rewrite
  -> http://192.168.2.10:3001/api/...
  -> api/src/index.js
  -> api/src/routes/*.js
  -> api/src/controllers/*.js
```

Example:

| Step | File | Code Path |
| --- | --- | --- |
| Login form submits | `backend_admin/app/(auth)/hooks/useLoginForm.ts` | Calls `authService.login(...)`. |
| Login request is made | `backend_admin/app/services/authService.ts` | `fetch('/api/auth/login', { credentials: 'include' })`. |
| Next rewrites request | `backend_admin/next.config.ts` | `/api/auth/login` -> `${NEXT_PUBLIC_API_URL}/auth/login`. |
| Express receives request | `api/src/index.js` | `app.use('/api/auth', authRoutes)`. |
| Auth route handles it | `api/src/routes/auth.js` | `router.post('/login', login)`. |
| Controller validates login | `api/src/controllers/authController.js` | Checks DB, signs JWTs, sets cookies, returns JSON. |

### 2. Direct API URL Flow

Some frontend files call `process.env.NEXT_PUBLIC_API_URL` or hardcoded API URLs directly.

```txt
Browser
  -> http://192.168.2.10:3001/api/...
  -> Express CORS must allow the browser origin
```

This bypasses the Next rewrite. Cookies may behave differently because the browser is now talking to a different host/port.

Examples:

| File | Direct Call Pattern |
| --- | --- |
| `backend_admin/app/services/authService.ts` | `${process.env.NEXT_PUBLIC_API_URL}/auth/forgot-password`, `/auth/reset-password`, private `realLogin()` helper |
| `backend_admin/app/data/storage.ts` | Hardcoded `http://localhost:3001/api/plans-storage` |
| `backend_admin/app/module/customers/edit/page.tsx` | `${process.env.NEXT_PUBLIC_API_URL}/customers/:id/file/:field` and `${NEXT_PUBLIC_API_URL}/uploads/customers/...` |
| `backend_admin/app/module/feedback/edit/page.tsx` | `${process.env.NEXT_PUBLIC_API_URL}/activations/...` |
| `backend_admin/app/module/settings/background-images/page.tsx` | Builds URL from `API_BASE_URL` and calls `/api/background-images...` |
| `backend_admin/app/module/settings/referral-settings/page.tsx` | Builds URL from `API_BASE_URL` and calls `/api/referral-settings` |
| `backend_admin/app/module/settings/plans-storage/page.tsx` | Builds URL from `API_BASE_URL` and calls `/api/plans-storage` |

## Next.js Proxy Configuration

File: `backend_admin/next.config.ts`

```ts
const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

async rewrites() {
  return [
    {
      source: "/api/:path*",
      destination: `${apiUrl}/:path*`,
    },
  ];
}
```

Meaning:

| Browser Request | Rewritten Destination |
| --- | --- |
| `/api/auth/login` | `http://192.168.2.10:3001/api/auth/login` |
| `/api/users/modulelist` | `http://192.168.2.10:3001/api/users/modulelist` |
| `/api/setting/profile` | `http://192.168.2.10:3001/api/setting/profile` |
| `/api/customers/list` | `http://192.168.2.10:3001/api/customers/list` |

## Express API Server Setup

File: `api/src/index.js`

Important middleware:

| Code | Purpose |
| --- | --- |
| `app.use(express.json())` | Parses JSON request bodies. |
| `app.use(cookieParser())` | Reads cookies into `req.cookies`. |
| `app.use(cors({ ..., credentials: true }))` | Allows frontend origins and credentialed requests. |
| `app.use('/api/uploads/customers', express.static(...))` | Serves uploaded customer files. |
| `app.use('/uploads', express.static(...))` | Serves upload files without `/api` prefix. |
| `app.listen(PORT)` | Starts Express, currently `PORT=3001` from `api/.env`. |

Current CORS logic allows origins containing:

```txt
localhost
FRONTEND_URL host
FRONTEND_URL2 host
192.168.2.100
192.168.2.120
192.168.2.10
```

## Active API Mounts

These are mounted in `api/src/index.js`.

| Mount Path | Route File | Connected Endpoints |
| --- | --- | --- |
| `/api/health` | `api/src/index.js` | `GET /api/health` |
| `/api/auth` | `api/src/routes/auth.js` | `POST /register`, `POST /login`, `POST /refresh-token`, `POST /change-password`, `POST /forgot-password`, `POST /reset-password`, `POST /logout` |
| `/api/access` | `api/src/routes/access.js` | `POST /user-sub-access`, `POST /user-access`, `POST /modules` |
| `/api/users` | `api/src/routes/users.js` | `POST /`, `GET /modulelist`, `GET /check-username` |
| `/api/customers` | `api/src/routes/customers.js` | `POST /`, `GET /list`, `GET /modulelist`, `GET /me`, `GET /:id`, `DELETE /:id/file/:field`, `POST /public/register`, `PUT /:id`, `POST /add`, `POST /code`, `POST /name`, `DELETE /:id` |
| `/api/registration` | `api/src/routes/registration.js` | `GET /list`, `GET /:id`, `DELETE /:id` |
| `/api/deceased` | `api/src/routes/deceased.js` | `GET /list`, `DELETE /:id` |
| `/api/incidents` | `api/src/routes/incident.js` | `GET /`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id` |
| `/api/obituary` | `api/src/routes/obituary.js` | `GET /list`, `GET /:id` |
| `/api/feedback` | `api/src/routes/feedback.js` | `GET /list`, `POST /`, `DELETE /:id` |
| `/api/billing` | `api/src/routes/billing.js` | `GET /list` |
| `/api/public` | `api/src/routes/publicprayer.js` | `GET /`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id` |
| `/api/plans-storage` | `api/src/routes/plansStorage.js` | `GET /`, `PUT /` |
| `/api/report` | `api/src/routes/report.js` | `GET /list` |
| `/api/setting` | `api/src/routes/setting.js` | `GET /profile`, `PUT /profile`, `PUT /password`, `GET /roles`, `GET /roles/:roleId/modules`, `PUT /roles/:roleId/modules` |
| `/api/background-images` | `api/src/routes/backgroundimage.js` | `GET /`, `POST /upload`, `PATCH /:id`, `DELETE /:id` |
| `/api/referral-settings` | `api/src/routes/referralSettings.js` | `GET /`, `PUT /` |
| `/api/audit` | `api/src/routes/audit.js` | `GET /logs`, `POST /logs`, `GET /logs/excel` |

## Route Files That Exist But Are Not Mounted

These route files exist in `api/src/routes`, but `api/src/index.js` does not currently mount them:

| Route File | What It Defines | Current Status |
| --- | --- | --- |
| `api/src/routes/dashboard.js` | `/`, `/new-customers-monthly`, `/new-customers-latest`, `/summary`, `/installation-status`, `/pending-payments` | Not mounted, so `/api/dashboard/...` will not work unless added to `api/src/index.js`. |
| `api/src/routes/userManagement.js` | `/`, `/roles`, `/admin-roles`, `/roles/:id/permissions` | Not mounted, so `/api/user-management/...` will not work unless added to `api/src/index.js`. |

There are also many routes under `api/src/files-to-be-cleared`; those are not active unless explicitly required by `api/src/index.js`.

## Authentication Communication

### Login

| Step | File | Details |
| --- | --- | --- |
| User submits form | `backend_admin/app/(auth)/hooks/useLoginForm.ts` | Calls `authService.login(...)`. |
| Frontend sends login request | `backend_admin/app/services/authService.ts` | `fetch('/api/auth/login', { method: 'POST', credentials: 'include' })`. |
| Next proxies request | `backend_admin/next.config.ts` | `/api/auth/login` -> `${NEXT_PUBLIC_API_URL}/auth/login`. |
| API route receives it | `api/src/routes/auth.js` | `router.post('/login', login)`. |
| API creates tokens | `api/src/controllers/authController.js` | Generates access token and refresh token. |
| API sets cookies | `api/src/controllers/authController.js` | Sets `token`, `access_token`, `refreshToken`. |
| Frontend stores fallback cookies/session | `backend_admin/app/lib/session-expiration.ts` | Stores `token`, `access_token`, `auth_token`, optional `refreshToken`, and `session_expiry_at`. |

### Protected API Requests

| Step | File | Details |
| --- | --- | --- |
| Frontend calls protected endpoint | Various `backend_admin/app/data/*.ts` files | Uses `withCredentials: true` or `credentials: 'include'`. |
| API checks auth | `api/src/middleware/authMiddleware.js` | Reads JWT from `req.cookies.token`, `req.cookies.access_token`, `req.cookies.auth_token`, or `Authorization` header. |
| API sets current user | `api/src/middleware/authMiddleware.js` | `req.user = decoded`. |
| Controller uses current user | Example: `api/src/controllers/settingController.js` | Reads `req.user.userId`. |

### Refresh Session

| Step | File | Details |
| --- | --- | --- |
| Warning component refreshes token | `backend_admin/components/layout/SessionExpiryWarning.tsx` | `fetch('/api/auth/refresh-token', { method: 'POST', credentials: 'include' })`. |
| API refresh route | `api/src/routes/auth.js` | `router.post('/refresh-token', refreshToken)`. |
| API reads refresh cookie | `api/src/controllers/authController.js` | Reads `req.cookies.refreshToken`. |
| API returns new access token | `api/src/controllers/authController.js` | Sets `token`, `access_token`; returns `{ accessToken }`. |
| Frontend stores expiry | `backend_admin/app/lib/session-expiration.ts` | Decodes token expiry and updates `session_expiry_at`. |

### Unauthorized Handling

| File | Behavior |
| --- | --- |
| `backend_admin/components/layout/ClientLayout.tsx` | Installs global axios and fetch interceptors. If an API returns `401` and it is not an auth endpoint, it calls `handleSessionExpired()`. |
| `backend_admin/app/lib/session-expiration.ts` | Clears auth cookies/localStorage and redirects to `/login?reason=session-expired`. |

## Frontend Connection Files

These files make API calls or configure API communication.

| File | Connection Made |
| --- | --- |
| `backend_admin/next.config.ts` | Rewrites `/api/:path*` to `${NEXT_PUBLIC_API_URL}/:path*`. |
| `backend_admin/middleware.ts` | Reads auth cookies and redirects browser routes before pages load. This is not an API call, but it controls whether protected pages can be reached. |
| `backend_admin/components/layout/ClientLayout.tsx` | Installs global `fetch`/axios `401` handling. |
| `backend_admin/components/layout/MainLayout.tsx` | Calls logout endpoint `/api/auth/logout`; also loads modules/profile/notifications through imported data functions. |
| `backend_admin/components/layout/SessionExpiryWarning.tsx` | Calls `/api/auth/refresh-token` and `/api/auth/logout`. |
| `backend_admin/app/services/authService.ts` | Calls `/api/auth/login`; also has direct calls to `${NEXT_PUBLIC_API_URL}/auth/forgot-password`, `/auth/login`, `/auth/reset-password`. |
| `backend_admin/app/data/sidebar.ts` | Calls `/api/users/modulelist`. |
| `backend_admin/app/data/setting.ts` | Calls `/api/setting/profile`, `/api/setting/password`, `/api/setting/roles`, `/api/setting/roles/:roleId/modules`, plus several `/api/branches/mobile`, `/api/packages/mobile`, `/api/customers/mobile/...` endpoints that are not mounted in current `api/src/index.js`. |
| `backend_admin/app/data/users.ts` and `backend_admin/app/data/user.ts` | Calls `/api/users` and `/api/users/:id`. Current active backend only exposes `POST /api/users`, `GET /api/users/modulelist`, and `GET /api/users/check-username`. |
| `backend_admin/app/data/customers.ts` | Calls `/api/customers`, `/api/customers/list`, `/api/customers/:id`, `/api/customers/:id/file/:field`, `/api/customers/add`. |
| `backend_admin/app/(auth)/signup/variants/SignupVariant6.tsx` | Calls `/api/users/check-username` and `/api/customers/public/register`. |
| `backend_admin/app/data/deceased.ts` | Calls `/api/deceased/list`, `/api/deceased/:id`, `/api/deceased`. Current active backend has `GET /list` and `DELETE /:id`; create/update/detail calls may not match. |
| `backend_admin/app/data/incident.ts` | Calls `/api/incidents`, `/api/incidents/:id`; active backend supports these routes. |
| `backend_admin/app/data/feedback.ts` | Calls `/api/feedback/list`, `/api/feedback`, `/api/feedback/:id`; active backend supports list/create/delete, not detail/update. |
| `backend_admin/app/data/report.ts` | Calls `/api/report/list` and `/api/reports/:id`; active backend has `/api/report/list`, not `/api/reports/:id`. |
| `backend_admin/app/data/userLoginReport.ts` | Calls `/api/report/users/last-login` and export endpoint; active mounted `api/src/routes/report.js` does not show these paths. |
| `backend_admin/app/data/customerReport.ts` | Calls `/api/report/customer/...`; active mounted `api/src/routes/report.js` does not show these paths. |
| `backend_admin/app/data/storage.ts` | Calls hardcoded `http://localhost:3001/api/plans-storage`. |
| `backend_admin/app/module/settings/plans-storage/page.tsx` | Calls `/api/plans-storage` through configured base URL. |
| `backend_admin/app/module/settings/background-images/page.tsx` | Calls `/api/background-images` and `/api/background-images/upload`. |
| `backend_admin/app/module/settings/referral-settings/page.tsx` | Calls `/api/referral-settings`. |
| `backend_admin/app/data/notifications.ts` | Calls `/notifications/...` or `/api/notifications/...`; no active `/api/notifications` mount exists in `api/src/index.js`. |
| `backend_admin/app/data/userManagement.ts` | Calls `/api/user-management/...`; `api/src/routes/userManagement.js` exists but is not mounted. |
| `backend_admin/app/module/customers/edit/page.tsx` | Uses direct `${NEXT_PUBLIC_API_URL}/customers/:id/file/:field` and file URLs under `${NEXT_PUBLIC_API_URL}/uploads/customers/...`. |
| `backend_admin/components/input/Autocomplete.tsx` | Calls caller-provided API URL with `fetch()`. Example usage in `PaymentForm.tsx` passes `/api/customers/name` and `/api/customers/code`. |

## API Route Availability Notes

The frontend currently references some routes that do not appear to be active in `api/src/index.js`.

| Frontend Endpoint | Frontend Source | Backend Status |
| --- | --- | --- |
| `/api/dashboard/...` | `backend_admin/app/module/registration/page copy.tsx` | `api/src/routes/dashboard.js` exists, but is not mounted in `api/src/index.js`. |
| `/api/user-management/...` | `backend_admin/app/data/userManagement.ts` | `api/src/routes/userManagement.js` exists, but is not mounted. |
| `/api/notifications/...` | `backend_admin/app/data/notifications.ts` | Only found under `api/src/files-to-be-cleared`; not mounted. |
| `/api/staffs/...` | `backend_admin/app/data/staffs.ts` | Only found under `api/src/files-to-be-cleared`; not mounted. |
| `/api/devices/...` | `backend_admin/app/data/devices.ts` | Only found under `api/src/files-to-be-cleared`; not mounted. |
| `/api/activations/...` | `backend_admin/app/data/activation.ts` and some pages | Only found under `api/src/files-to-be-cleared`; not mounted. |
| `/api/invoices/...` | `backend_admin/app/data/invoices.ts`, `PaymentForm.tsx` | Only found under `api/src/files-to-be-cleared`; not mounted. |
| `/api/packages/mobile`, `/api/branches/mobile` | `backend_admin/app/data/setting.ts` | Only found under `api/src/files-to-be-cleared`; not mounted. |
| `/api/report/customer/...`, `/api/report/users/last-login` | report data files | Similar report route files exist under `files-to-be-cleared`, but active `api/src/routes/report.js` only exposes `/list`. |

## Static File Communication

| URL Pattern | Backend File | Purpose |
| --- | --- | --- |
| `/api/uploads/customers/...` | `api/src/index.js` | Serves `api/uploads/customers` statically. |
| `/uploads/...` | `api/src/index.js` | Serves `api/uploads` statically without `/api` prefix. |
| `${NEXT_PUBLIC_API_URL}/uploads/customers/...` | `backend_admin/app/module/customers/edit/page.tsx` | Builds customer document URLs. Since `NEXT_PUBLIC_API_URL` already ends in `/api`, this becomes `/api/uploads/customers/...`. |

## Important Practical Takeaways

1. Prefer calling `/api/...` from `backend_admin` instead of direct `${NEXT_PUBLIC_API_URL}/...` in browser code. The `/api/...` path keeps requests same-origin through the Next rewrite.
2. For protected API routes, include credentials:

```ts
axios.get('/api/setting/profile', { withCredentials: true });

fetch('/api/auth/logout', {
  method: 'POST',
  credentials: 'include',
});
```

3. If a frontend route returns `404`, check whether its route file is actually mounted in `api/src/index.js`.
4. If a frontend route returns `401`, check cookies and `api/src/middleware/authMiddleware.js`.
5. `backend_admin/middleware.ts` protects frontend pages. `api/src/middleware/authMiddleware.js` protects API routes. They are separate checks.

## Why `backend_admin` Can Still Show 404

The connection between `backend_admin` and `api` can be working correctly, but `backend_admin` will still show `app/not-found.tsx` when the browser navigates to a route that does not exist under `backend_admin/app`.

The most likely current cause is the sidebar module list.

| Step | File | What Happens |
| --- | --- | --- |
| `MainLayout` loads sidebar items | `backend_admin/components/layout/MainLayout.tsx` | Calls `fetchModuleList()` on mount. |
| Sidebar data is fetched | `backend_admin/app/data/sidebar.ts` | Calls `GET /api/users/modulelist`. |
| API returns module links | `api/src/routes/users.js` -> `api/src/controllers/userController.js` | `getUserModules()` reads `module.url` and `submodule.url` from the database and returns them as `href`. |
| User clicks sidebar item | `backend_admin/components/layout/MainLayout.tsx` | `router.push(item.href)`. |
| Next checks for page folder | `backend_admin/app/module/...` | If the folder/page does not exist, Next renders `backend_admin/app/not-found.tsx`. |

Current `backend_admin/app/module` folders include:

```txt
billing
customers
dashboard
deceased
feedback
incident
obituary
public
registration
report
setting
settings
staffs
storage
user
users
```

If the API returns links such as these, they will 404 because those folders do not exist:

```txt
/module/states-teams
/module/game-management
/module/match-management
/module/media-management
```

Those links come from the database through this query in `api/src/controllers/userController.js`:

```sql
SELECT
  m.id AS module_id,
  m.icon,
  m.display_name AS label,
  m.url AS href,
  s.id AS submodule_id,
  s.display_name AS sub_label,
  s.url AS sub_href
FROM module m
LEFT JOIN submodule s ON s.module_id = m.id
INNER JOIN users u ON u.id = $1
INNER JOIN role_module_access rma
  ON rma.module_id = m.id
 AND rma.role_id = u.role_id
 AND rma.view_access = true
ORDER BY m.id, s.id
```

So there are two fixes, depending on what the app is supposed to be:

1. Update the database `module.url` / `submodule.url` values to match real frontend routes.
2. Or create the missing frontend pages under `backend_admin/app/module/...`.

For example, if the database contains `/module/game-management`, then one matching frontend page would be:

```txt
backend_admin/app/module/game-management/page.tsx
```
