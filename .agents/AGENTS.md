# AGENTS.md — Afuom HQ Project Instructions & Core System Memory

This file serves as the permanent system instruction and project blueprint for AI Agents pair-programming on **Afuom HQ**.

---

## 🚨 MANDATORY SYSTEM DIRECTIVES

1. **NEVER USE ANIMATED ICONS ANYWHERE IN THIS PROJECT.**
   - Throughout all development, ALWAYS use real, crisp, static vector icons (Font Awesome 6 CSS classes like `<i class="fa-solid fa-wheat-awn"></i>`).
   - NEVER use spinning, pulsing, or animated icons/keyframes.

2. **STRICT SINGLE ICON STYLE DIRECTIVE**:
   - ONLY ONE icon style per element is permitted across the entire application.
   - ALWAYS use single static Font Awesome 6 vector icons (`<i class="fa-solid fa-..."></i>`).
   - NEVER combine emojis with icons or use emoji characters next to vector icons.

3. **TYPOGRAPHY MANDATE**:
   - ALWAYS use **[IBM Plex Sans](https://fonts.google.com/specimen/IBM+Plex+Sans)** across the entire app (`frontend/index.html` & `frontend/styles.css`).

4. **FULL-HEIGHT LEFT SIDEBAR APP SHELL MANDATE**:
   - The app uses a full-height, edge-to-edge left sidebar (`.app-sidebar`) spanning `100vh` without gaps or margins.
   - **Sidebar Top**: App branding (**Afuom HQ**) and 2x2 user role switcher grid.
   - **Sidebar Middle**: Organized section menu items (`.nav-item`) with active indicator lighting.
   - **Sidebar Base**: Anchored account profile badge (`.sidebar-base`) showing active user's Avatar, Name (e.g. *Dr. Lobos*), Role Title (e.g. *Head Agronomist*), and live connectivity indicator.
   - **Main Workspace**: Features clean top Welcome Header banner (`Welcome back, <User Name>!`).

5. **OUTDOOR HIGH-VISIBILITY SUNLIGHT CONTRAST MANDATE**:
   - The UI uses an **outdoor high-contrast solar color scheme** (`#ffffff` pure white primary text, `#091c10` solid dark emerald panel background, `#047857` solid green badges, `#b45309` solid amber badges, `#1d4ed8` solid blue badges, `#b91c1c` solid red badges) ensuring maximum readability under direct outdoor sunlight on field devices.
   - Top-right header time clock and system connected badge are permanently removed to keep the workspace header clean and high-contrast.

---

## 🎯 1. Project Overview & Identity

- **App Name**: **Afuom HQ**
- **Tagline**: *Manage farms. Anywhere.*
- **Name Origin**: *Afuom* (Akan language: "On the Farm" / "In the Farmland") + *HQ* (Digital Command Headquarters).

---

## 📁 2. Clean Project Architecture

- `backend/main.py`: Python FastAPI Backend REST API & static file server.
- `frontend/`: Vanilla HTML5 (`index.html`), CSS3 (`styles.css`), and JavaScript (`app.js`).
- `requirements.txt`: Python dependencies (`fastapi`, `uvicorn`, `pydantic`).
- `AGENTS.md`: Persistent system instructions.

---

## 🎨 3. Design & Typography Rules

1. **Typography**: **IBM Plex Sans** (`font-family: 'IBM Plex Sans', sans-serif;`)
2. **Colors & Dark Mode**:
   - Main Background: `#09100c` (Rich dark green-black)
   - Panel Background: `rgba(18, 30, 23, 0.85)` with border `rgba(52, 211, 153, 0.2)`
   - Primary Accent: `#10b981` (Emerald Green)
   - Warning/Pending Accent: `#f59e0b` (Amber)
   - Manager Accent: `#3b82f6` (Blue)
   - Owner Accent: `#a855f7` (Purple)

---

## 🚀 4. Phased Role Development Progress

1. ✅ **Phase 1: 👨🏾‍🌾 Agronomist (100% Fully Developed)**
2. ✅ **Phase 2: 👨🏾‍💼 Farm Manager (100% Fully Developed)**
3. ⏳ **Phase 3: 👷🏾 Field Worker (Next Focus)**
4. ⏳ **Phase 4: 👤 Farm Owner**
