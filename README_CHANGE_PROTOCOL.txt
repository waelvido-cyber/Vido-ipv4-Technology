VIDO Technology — Changeable Build V2

IMMUTABLE FOUNDATION:
VIDO_FOUNDATION_LOCKED_V1.md is the permanent foundation contract. Do not edit it as part of feature work.

WORKFLOW FOR EVERY FUTURE CHANGE:
1. Read the latest VIDO_CHANGEABLE_BUILD ZIP and its README.
2. Read the immutable foundation contract.
3. Modify only the latest changeable build.
4. Preserve every foundation feature.
5. Run scripts/audit.mjs and syntax checks.
6. Produce a new VIDO_CHANGEABLE_BUILD_VN.zip.

V2 ENGINE COMPONENTS:
- 300 questions (0001–0300) across 30 skills, 10 per skill.
- Question-specific progressive help and Show Answer.
- Adaptive Learning + Spaced Repetition with local event history.
- Optional PostgreSQL backend for accounts, state sync, mastery/events.
- Optional AI Tutor backend integration through /api/tutor.
- Cisco-style simulator state engine: device registry, subnet-aware ping, CLI training commands, routing/ARP/MAC state.
- Content audit script.
- Mobile viewport hooks and responsive foundation.

BACKEND SETUP:
1. Copy .env.example to .env and set secure values.
2. Create PostgreSQL database.
3. Run backend/schema.sql against the database.
4. npm install
5. npm run server
6. Open http://localhost:3000

AI:
The frontend falls back to local Socratic guidance if AI is not configured. A real AI response requires AI_API_URL, AI_API_KEY and AI_MODEL on the server.

MOBILE QA:
The code contains mobile viewport detection and structural checks. Real Safari/Chrome device testing still requires physical/emulated devices; this build does not claim those external tests were executed here.
