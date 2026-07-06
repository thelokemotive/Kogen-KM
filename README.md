# ⛰️ Kogen KM

**The trail running & mountain biking platform for Harrow Appi International School.**

A private, school-only "Strava" — every kilometre run and every metre climbed by students and
staff adds up on term, year and all-time leaderboards, and pushes the whole school along a
shared virtual journey (Appi → Morioka → Tokyo → … → Harrow, London 🇬🇧).

## What it does

- **🔒 School-only access** — accounts can only be created with an allowed school email domain
  (`ALLOWED_EMAIL_DOMAINS`, default `harrowappi.jp`). Every page, photo, GPX file and map is
  behind login. Nothing is public.
- **📡 GPX uploads for everyone** — students log activities by uploading a GPX file exported
  from any watch or app (Garmin, Apple Watch, Strava, Suunto, COROS, Fitbit…). Distance,
  elevation gain, moving time and pace are computed server-side with GPS-noise smoothing.
- **✍️ Manual & bulk entry for verified staff** — instructors with the Staff role can type in
  distance/elevation directly, and log a whole academy session for many athletes at once:
  search all registered users, tick names, enter one distance and climb, done.
- **🚩 Fair-play review queue** — suspicious uploads (running at car speed, walking pace,
  missing timestamps, absurd distances, hand-made files, duplicate files) are automatically
  **flagged** and don't count until staff approve them. Staff can download and inspect any
  GPX. Walking pace is flagged too — this is not a stepometer race.
- **🏆 Leaderboards** — distance *and* vertical crowns, per term (Autumn / Spring), per school
  year and all-time, with separate student and staff boards, filterable by sport.
- **🗾 The School Journey** — collective totals mapped onto milestones the students actually
  know: laps of the track, down to Appi Kogen village, Morioka, Tokyo, the length of Japan,
  Harrow in London, around the Earth; climbing from the APPI gondola vertical through
  Hachimantai and Iwate-san to Fuji, Everest and the International Space Station.
- **🏅 Badges** — auto-awarded milestones (First Tracks, Morioka, Century Club, Iwate-san,
  Everester, To Space…).
- **🙌 Kudos & profiles** — a minimal, safeguarding-friendly social layer: profile photo, a
  short bio, favourite place to run, badges, stats and kudos. Deliberately **no comments/DMs**.
- **📸 Photos** — staff-uploaded only. Instructors tag a student and the photo appears on that
  student's profile, visible to school members only.
- **🗺️ School heat map** — every uploaded route drawn on one map (members only). Set
  `DISABLE_MAPS=1` to turn all maps off for strictest privacy (map *tiles* are fetched from
  openstreetmap.org; no personal data is ever sent, but tile requests reveal the rough map
  area being viewed).
- **📱 Phone + laptop native feel** — responsive layout with a bottom tab bar on phones, and a
  PWA manifest so it installs to the home screen ("Add to Home Screen"). Simple English
  throughout, written for EAL students.

## Roles

| Role | How you get it | Can do |
|---|---|---|
| **Student** | default on signup | Upload GPX, kudos, edit own profile, delete own activities |
| **Staff** | promoted by an admin (or listed in `STAFF_EMAILS`) | + manual entry, bulk session entry, review queue, inspect/approve/reject any upload, upload photos |
| **Admin** | listed in `ADMIN_EMAILS` (or promoted) | + manage accounts & roles, deactivate users, edit term dates |

Verify instructors by promoting them in **Staff → Admin panel** after they sign up.

## Running it

```bash
cp .env.example .env    # set your domains and admin emails
npm install
npm run build
npm start               # http://localhost:3000
```

Data (SQLite database, GPX files, photos) lives in `DATA_DIR` (default `./data`) — one folder
to back up. Deploy anywhere that gives you a persistent disk and HTTPS: a small VPS, Fly.io,
Render, or a school server behind a reverse proxy. (Serverless platforms without persistent
disks won't work as-is because of SQLite + file uploads.)

The first admin: put your email in `ADMIN_EMAILS` *before* signing up, then create your
account normally.

## Safeguarding notes

- Signup restricted to school email domains; admin can deactivate any account instantly.
- All content (activities, maps, photos, profiles) requires login; uploaded files are served
  through an authenticated route, never as public static files.
- Photos of students are uploaded by staff only; staff can delete any photo.
- No free-text messaging between users — reactions are limited to kudos.
- GPX files are retained so staff can audit any claimed activity ("you're welcome to check").
- Passwords are bcrypt-hashed; sessions are HttpOnly cookies. Run behind HTTPS in production.

## Tech

Next.js 15 (App Router) · SQLite (`better-sqlite3`) · Leaflet + OpenStreetMap · no external
services required. Winter term (ski/snowboard) is deliberately out of scope for now — the
schema's `sport` field makes it a small addition later.
