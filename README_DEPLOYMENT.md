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
