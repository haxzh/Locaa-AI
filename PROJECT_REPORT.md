# Locaa AI / ai-clipper Project Report

Generated: 2026-04-06

## Overview

This workspace contains Locaa AI, an AI-powered video dubbing and multi-platform publishing product built with a Flask backend and a React + Vite frontend. The project focuses on turning source videos into dubbed, branded, publish-ready content with support for dubbing, clip generation, editing preferences, metadata generation, publishing, team collaboration, and account/profile management.

The current repository state reflects a working handoff after a broad audit and cleanup pass. The latest validation run reported no code errors.

## What The Product Does

The application is designed to support the full workflow for creator-facing video automation:

- Download or ingest source video content.
- Transcribe and translate speech.
- Generate natural-sounding dubbed audio with gender-aware voice selection.
- Produce clips, reels, and full-video derivatives.
- Apply branding such as logos, overlays, and watermarks.
- Generate context-aware titles, descriptions, and tags.
- Publish to connected social platforms.
- Manage team invites and collaboration for business users.

## Architecture

### Backend

The backend is a Flask application organized under `backend/` with core processing logic in `backend/core/` and database utilities in `backend/database/`.

Key areas include:

- `backend/app.py` for application bootstrapping and request orchestration.
- `backend/core/tts_generator.py` for voice synthesis and voice selection.
- `backend/core/video_dubber.py` for dubbing pipeline orchestration.
- `backend/core/reel_generator.py` and `backend/core/clip_generator.py` for output variants.
- `backend/core/branding_engine.py` and `backend/core/branding_routes.py` for logo and watermark handling.
- `backend/core/publishing_routes.py` for platform selection and publish jobs.
- `backend/core/invite_routes.py` and `backend/core/email_handler.py` for team collaboration.
- `backend/core/ai_routes.py` for AI generation features already documented in the repo.

The backend stack includes Flask, SQLAlchemy, JWT auth, Flask-Mail, FFmpeg-based media processing, Whisper-based transcription, OpenAI TTS, and translation utilities.

### Frontend

The frontend is a React app under `frontend/src/` using Vite, React Router, Axios, and animation/styling utilities.

Important UI surfaces include:

- `frontend/src/components/ProjectSettings.jsx` for editing, branding, publishing, metadata, and upload workflows.
- `frontend/src/components/TeamCollaboration.jsx` for invites, pending actions, history, and fallback invite links.
- `frontend/src/components/DashboardAdvanced.jsx`, `frontend/src/components/analytics.jsx`, and `frontend/src/components/SupportDocs.jsx` for profile and tier rendering.
- `frontend/src/components/CreateJob.jsx` for job creation.

## Major Product Capabilities

### 1. Natural Dubbing

The TTS layer was corrected so voice selection is based on profile metadata and gender-aware mapping rather than treating metadata strings as direct voice IDs. This makes the dubbed output feel more human and less robotic, while keeping male/female speakers aligned with more appropriate voices.

### 2. Editing And Branding

Editing and branding settings are no longer just UI. The app now carries branding configuration through the processing flow, including:

- aspect ratio selection,
- overlay and watermark settings,
- summary length / clipping preferences,
- logo upload and application,
- per-job branding overrides.

### 3. Publishing Flow

The publish experience was wired so the user can select from real connected platforms instead of a static list. Publishing uses actual integrations and passes through job context and metadata.

### 4. AI Metadata

Title, description, and tag generation now use the actual job/video context rather than generic placeholders. The logic is designed to produce metadata that matches the content and can fall back to viral-style tags when needed.

### 5. Profile And Subscription Display

The UI now shows the full profile name and the actual subscription tier across the dashboard, analytics, and support screens instead of hardcoded labels such as Pro Plan.

### 6. Team Collaboration

The invite flow was expanded to support sending invites, viewing pending invites, revoke actions, invite history, accept/decline handling, and fallback manual invite links when email delivery is unavailable.

### 7. Logo Upload

The branding logo upload path was connected so the UI, backend upload endpoint, and processing flow work together. This removed the gap between visible controls and actual saved branding configuration.

## Recent Implementation Notes

The latest audit and stabilization pass surfaced one real frontend compile issue in `frontend/src/components/CreateJob.jsx`. That issue was fixed by adding the missing icon import and correcting a JSX apostrophe/lint problem.

The same audit also revealed environment-related unresolved imports in the editor, which were addressed by installing backend dependencies and configuring the workspace Python interpreter in `.vscode/settings.json`.

## Validation Status

The workspace was validated after the fixes and environment setup. The final diagnostic run reported no errors.

Important note:

- Package installation reported version-compatibility warnings for `rdt` and `torchvision`.
- Those warnings were environment alignment notes, not active application code errors.

## Current Repository State

The repository currently includes a large set of generated media artifacts under `videos/` and temporary processing output under `videos/temp/` and `videos/temp_reels/`. These files reflect actual processing runs and are not part of the application source itself.

The source code changes in the app are now in a stable handoff state, with the primary product flows patched and validated.

## Setup Notes

The workspace was configured to use the project Python environment so editor diagnostics and backend analysis point at the same interpreter. Backend dependencies were installed successfully from the project requirements file.

If you need to reproduce the working environment, the main setup points are:

- use the backend virtual environment or configured Python interpreter,
- install dependencies from `backend/requirements.txt`,
- ensure FFmpeg is available on the machine,
- run the backend and frontend separately during local development.

## Suggested Follow-Up

1. Clean or ignore large generated media outputs if they are not meant to be committed.
2. Consider normalizing the `rdt` / `torch` / `torchvision` environment if those packages are used in a production workflow.
3. Keep the report in sync if future feature work changes the dubbing, publishing, or branding pipeline.

## Reference Files

- [README.md](README.md)
- [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)
- [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)
- [backend/app.py](backend/app.py)
- [frontend/src/components/ProjectSettings.jsx](frontend/src/components/ProjectSettings.jsx)
- [frontend/src/components/TeamCollaboration.jsx](frontend/src/components/TeamCollaboration.jsx)
