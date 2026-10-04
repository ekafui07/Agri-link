# 🌾 Afuom HQ — Remote Farm Operations OS

> **Manage farms. Anywhere.**

**Afuom HQ** is a lightweight, high-performance remote farm management operating system designed for professional agronomists, farm managers, field hands, and farm owners.

The name **Afuom** originates from the Akan language meaning *"On the Farm"* or *"In the Farmland"*, paired with **HQ** to represent a centralized digital command headquarters.

---

## 🎯 Core Value Proposition

Afuom HQ bridges the gap between agronomic science and field execution:
1. **Agronomists** turn expert knowledge into standardized, scientific protocols.
2. **Farm Managers** dispatch protocols into trackable daily tasks and audit photo proof.
3. **Field Workers** execute step-by-step checklists and upload photo evidence.
4. **Farm Owners** receive real-time operational compliance metrics, digital timelines, and automated weekly reports.

---

## 📁 Clean Directory Layout

All redundant legacy files have been cleaned out. The project is organized cleanly into `backend/` and `frontend/` folders:

```
Agri-link/
├── backend/               # Backend Python FastAPI application
│   └── main.py            # Async REST API endpoints & static frontend server
├── frontend/              # Clean Vanilla Frontend UI (Zero framework bloat)
│   ├── index.html         # HTML5 Single Page UI with Persona Switcher
│   ├── styles.css         # Dark Mode Glassmorphism & Static Icons (Font Awesome 6)
│   └── app.js             # Vanilla JS managing UI state & REST API calls
├── .agents/               # AI System Memory (System instructions)
│   └── AGENTS.md
├── AGENTS.md              # Persistent System Instructions for AI Agents
├── README.md              # Project Documentation & Architecture
├── requirements.txt       # Python dependencies (fastapi, uvicorn, pydantic)
└── venv/                  # Python virtual environment
```

---

## 🔄 The 4-Role Operational Workflow

```
                        AGRONOMIST 👨🏾‍🌾
                            │
              1. Builds Protocol & Dispatches Task
                            │
                            ▼
                      FARM MANAGER 👨🏾‍💼
                            │
              2. Assigns Worker to Task
                            │
                            ▼
                         WORKER 👷🏾
                            │
              3. Executes & Uploads Photo Evidence
                            │
                            ▼
                      FARM MANAGER 👨🏾‍💼
                            │
              4. Audits & Verifies Photo Evidence
                            │
                            ▼
                      FARM OWNER 👤
                            │
              5. Reviews Executive Dashboard & Weekly Report
```

---

## 🚀 How to Launch the Server

Because FastAPI serves both the **REST API** and the **Frontend UI**, run **ONE single command**:

```bash
# 1. Navigate to project root
cd ~/Agri-link

# 2. Activate Python virtual environment
source venv/bin/activate

# 3. Start unified server
uvicorn backend.main:app --host 0.0.0.0 --port 3000 --reload
```

### Browser Access

- 🌐 **Afuom HQ Web App**: [http://localhost:3000](http://localhost:3000)
- 📖 **Interactive OpenAPI API Docs**: [http://localhost:3000/docs](http://localhost:3000/docs)
