## CCTV Guardian (webapp)

Clean Next.js (App Router, TS, Tailwind) app to visualize owner-enrolled cameras on a world map. No scanning, no default/bruteforce. You control enrollment and consent.

Key commands

- Dev server: pnpm dev
- DB migrations: pnpm db:generate && pnpm db:push
- One check pass: pnpm worker:run

Setup

1) Copy .env.example to .env.local and set DATABASE_URL
2) Install deps in CCTV-Guardian folder
3) Generate/push DB, then run dev

Add a sample camera

curl -X POST http://localhost:3000/api/cameras \
  -H "content-type: application/json" \
  -d '{
    "name":"Lab Cam",
    "ip":"127.0.0.1",
    "port":8554,
    "protocol":"rtsp",
    "lat":48.137, "lng":11.575,
    "authorized":true,
    "consentProof":"owned lab device"
  }'

Then run once: pnpm worker:run
