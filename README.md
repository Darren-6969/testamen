# Memodise

This repository is split into four runnable projects:

- `api` - Express API, default port `3001`
- `backend_admin` - admin Next.js app, default port `3000`
- `backend_customer` - customer Next.js app, default port `3002`
- `landing_page` - public landing Next.js app, default port `3003`

## Root Commands

Run these from the repository root:

```bash
npm run api
npm run backend_admin
npm run backend_customer
npm run landing_page
```

On Windows PowerShell, if `npm` is blocked by execution policy, use `npm.cmd`:

```bash
npm.cmd run api
npm.cmd run backend_admin
npm.cmd run backend_customer
npm.cmd run landing_page
```

## Build Commands

```bash
npm run build:backend_admin
npm run build:backend_customer
npm run build:landing_page
```
