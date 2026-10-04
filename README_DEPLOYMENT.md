# VIDO Technology — Deployment

## Static frontend
The production frontend is `index.html` with `manifest.webmanifest` and `service-worker.js`.

### GitHub Pages
1. Upload the contents of this build to the repository root (or the configured Pages directory).
2. Enable GitHub Pages for the repository/branch.
3. Verify that `index.html`, `manifest.webmanifest`, `service-worker.js`, and the icon assets are served from the same scope.
4. After a real asset change, update the cache version in `service-worker.js`.

## Verification
Run from the project root:

```bash
npm test
```

Or specify the HTML file explicitly:

```bash
node scripts/audit.mjs index.html
```

The audit must pass before a build is treated as final.


## V11 Admin Foundation
Set these server environment variables in production:
- DATABASE_URL
- JWT_SECRET (long random secret)
- OWNER_EMAIL
- OWNER_PASSWORD (strong unique password)

The Admin panel is available only after backend authentication and an admin role check. Approximate city/country should only be populated by a trusted reverse proxy or a compliant geolocation service; the app does not attempt to determine a user's precise address.
