import os
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime

app = FastAPI(
    title="Afuom HQ API",
    description="Remote Farm Management OS - FastAPI Backend",
    version="1.2.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Data Models ---
class Plot(BaseModel):
    id: str
    name: str
    sizeAcres: float
    currentCrop: str
    growthStage: str
    growthWeek: int
    healthStatus: str
    soilPh: float
    nitrogenLevelPpm: int
    phosphorousPpm: int
    potassiumPpm: int
    moisturePct: int
    organicMatterPct: float

class PlotUpdate(BaseModel):
    growthStage: Optional[str] = None
    growthWeek: Optional[int] = None
    healthStatus: Optional[str] = None
    soilPh: Optional[float] = None
    nitrogenLevelPpm: Optional[int] = None
    moisturePct: Optional[int] = None

class Farm(BaseModel):
    id: str
    name: str
    location: str
    sizeAcres: float
    crop: str
    totalPlants: int
    productionSystem: str
    managerName: str
    workerCount: int
    overallHealth: str
    plots: List[Plot]

class Equipment(BaseModel):
    id: str
    name: str
    category: str
    status: str  # Available, In Use, Maintenance
    currentPlot: Optional[str] = None
    assignedWorker: Optional[str] = None

class InventoryItem(BaseModel):
    id: str
    name: str
    category: str  # Fertilizer, Chemical, Hardware, Seeds
    stockQuantity: float
    unit: str  # kg, L, pcs
    reorderLevel: float
    unitCostUsd: float
    status: str  # In Stock, Low Stock Warning

class ProtocolCreate(BaseModel):
    name: str
    category: str
    crop: str
    growthStage: str
    applicableFarmId: str
    applicablePlotId: Optional[str] = None
    instructions: str
    products: List[str]
    applicationRate: str
    waterVolume: str
    applicationMethod: str
    frequency: str
    ppeRequired: List[str]

class Protocol(ProtocolCreate):
    id: str
    createdBy: str
    createdAt: str

class TaskCreate(BaseModel):
    protocolId: str
    protocolName: str
    farmId: str
    farmName: str
    plotId: str
    plotName: str
    category: str
    instructions: str
    assignedWorkerName: str
    priority: str
    scheduledDate: str
    scheduledTime: str
    ppeRequired: List[str]
    requiresPhotoEvidence: bool = True
    targetQuantity: Optional[str] = None
    equipmentId: Optional[str] = None
    equipmentName: Optional[str] = None

class TaskEvidence(BaseModel):
    photoUrl: str
    quantityCompleted: str
    notes: str
    timestamp: str

class Task(TaskCreate):
    id: str
    status: str  # Scheduled, In Progress, Evidence Submitted, Verified, Rejected
    evidence: Optional[TaskEvidence] = None
    verificationNotes: Optional[str] = None
    verifiedAt: Optional[str] = None
    reworkReason: Optional[str] = None

class TaskAssign(BaseModel):
    workerName: str

class TaskVerify(BaseModel):
    verificationNotes: str

class TaskReject(BaseModel):
    reworkReason: str

class ProblemReport(BaseModel):
    farmId: str
    plotName: str
    description: str

class ProblemAlert(ProblemReport):
    id: str
    status: str  # Active, In Progress, Resolved
    reportedAt: str
    reportedBy: str
    actionTaken: Optional[str] = None

class AlertAction(BaseModel):
    actionType: str
    actionNotes: str

class InspectionCreate(BaseModel):
    farmId: str
    farmName: str
    plotId: str
    plotName: str
    inspectorName: str
    cropHealthRating: int
    irrigationRating: int
    nutritionRating: int
    pestRating: int
    sanitationRating: int
    harvestRating: int
    observations: str
    recommendedAction: Optional[str] = None

class Inspection(InspectionCreate):
    id: str
    date: str

class Worker(BaseModel):
    id: str
    name: str
    roleTitle: str
    tasksAssigned: int
    tasksCompleted: int
    compliancePct: int
    status: str

class TimelineEvent(BaseModel):
    id: str
    farmId: str
    timestamp: str
    category: str
    title: str
    description: str
    actorRole: str
    actorName: str

# --- Database ---
EQUIPMENT_DB: List[Equipment] = [
    Equipment(id="eq-1", name="Venturi Fertigation Injector", category="Fertigation", status="Available"),
    Equipment(id="eq-2", name="High-Pressure Drip Pump 15-HP", category="Irrigation", status="In Use", currentPlot="Plot B (Flowering)", assignedWorker="Kwaku Bonsu"),
    Equipment(id="eq-3", name="Motorized Knapsack Sprayer", category="Scouting & Spraying", status="Available"),
    Equipment(id="eq-4", name="Field Utility Tractor & Disc Harrow", category="Tillage", status="Maintenance")
]

INVENTORY_DB: List[InventoryItem] = [
    InventoryItem(id="inv-1", name="Calcium Nitrate (15.5-0-0 + 26% CaO)", category="Fertilizer", stockQuantity=150.0, unit="kg", reorderLevel=30.0, unitCostUsd=1.20, status="In Stock"),
    InventoryItem(id="inv-2", name="Potassium Nitrate (13-0-46)", category="Fertilizer", stockQuantity=85.0, unit="kg", reorderLevel=25.0, unitCostUsd=1.50, status="In Stock"),
    InventoryItem(id="inv-3", name="Neem Oil Extract (Azadirachtin 1%)", category="Chemical", stockQuantity=4.5, unit="L", reorderLevel=5.0, unitCostUsd=8.00, status="Low Stock Warning"),
    InventoryItem(id="inv-4", name="Copper Hydroxide 77% WP", category="Chemical", stockQuantity=22.0, unit="kg", reorderLevel=10.0, unitCostUsd=4.50, status="In Stock"),
    InventoryItem(id="inv-5", name="Inline Drip Emitter (2.0 L/h)", category="Hardware", stockQuantity=450.0, unit="pcs", reorderLevel=100.0, unitCostUsd=0.25, status="In Stock")
]
FARMS_DB: List[Farm] = [
    Farm(
        id="f-1",
        name="John's Tomato Farm",
        location="Dodowa, Greater Accra Region",
        sizeAcres=2.5,
        crop="Fresh Market Tomato (Ananya F1)",
        totalPlants=8000,
        productionSystem="Open Field Drip Systems",
        managerName="Kwame Mensah",
        workerCount=5,
        overallHealth="Attention",
        plots=[
            Plot(id="p-101", name="Plot A (Vegetative)", sizeAcres=0.8, currentCrop="Tomato", growthStage="Vegetative", growthWeek=7, healthStatus="Good", soilPh=6.5, nitrogenLevelPpm=45, phosphorousPpm=35, potassiumPpm=210, moisturePct=65, organicMatterPct=3.8),
            Plot(id="p-102", name="Plot B (Flowering)", sizeAcres=0.8, currentCrop="Tomato", growthStage="Flowering", growthWeek=10, healthStatus="Attention", soilPh=6.2, nitrogenLevelPpm=22, phosphorousPpm=28, potassiumPpm=180, moisturePct=58, organicMatterPct=3.2),
            Plot(id="p-103", name="Plot C (Fruiting & Ripening)", sizeAcres=0.6, currentCrop="Tomato", growthStage="Fruiting", growthWeek=13, healthStatus="Critical", soilPh=5.9, nitrogenLevelPpm=18, phosphorousPpm=22, potassiumPpm=150, moisturePct=42, organicMatterPct=2.9),
            Plot(id="p-104", name="Nursery & High Tunnel", sizeAcres=0.3, currentCrop="Tomato Seedlings", growthStage="Nursery", growthWeek=3, healthStatus="Good", soilPh=6.6, nitrogenLevelPpm=50, phosphorousPpm=40, potassiumPpm=240, moisturePct=75, organicMatterPct=4.5),
        ]
    ),
    Farm(
        id="f-2",
        name="Volta Basin Organic Farm",
        location="Ada Foah, Volta Region",
        sizeAcres=4.0,
        crop="Habanero Pepper & Sweet Bell",
        totalPlants=12000,
        productionSystem="Drip Fertigation & Shade Mesh",
        managerName="Emmanuel Tetteh",
        workerCount=8,
        overallHealth="Good",
        plots=[
            Plot(id="p-201", name="Pepper Sector 1", sizeAcres=2.0, currentCrop="Habanero Pepper", growthStage="Vegetative", growthWeek=5, healthStatus="Good", soilPh=6.8, nitrogenLevelPpm=48, phosphorousPpm=38, potassiumPpm=220, moisturePct=62, organicMatterPct=4.1),
            Plot(id="p-202", name="Pepper Sector 2", sizeAcres=2.0, currentCrop="Sweet Bell Pepper", growthStage="Flowering", growthWeek=9, healthStatus="Good", soilPh=6.7, nitrogenLevelPpm=42, phosphorousPpm=36, potassiumPpm=205, moisturePct=60, organicMatterPct=3.9)
        ]
    )
]

WORKERS_DB: List[Worker] = [
    Worker(id="w-1", name="Kofi Osei", roleTitle="Senior Field Hand", tasksAssigned=18, tasksCompleted=17, compliancePct=94, status="Active On Field"),
    Worker(id="w-2", name="Ama Serwaa", roleTitle="Pest & Disease Scout", tasksAssigned=22, tasksCompleted=22, compliancePct=100, status="Active On Field"),
    Worker(id="w-3", name="Kwaku Bonsu", roleTitle="Irrigation Specialist", tasksAssigned=15, tasksCompleted=14, compliancePct=93, status="Active On Field"),
    Worker(id="w-4", name="Yaa Asantewaa", roleTitle="General Worker", tasksAssigned=12, tasksCompleted=11, compliancePct=91, status="Off Duty"),
]

PROTOCOLS_DB: List[Protocol] = [
    Protocol(
        id="prot-1",
        name="Tomato Flowering Calcium & Nitrogen Boost",
        category="Nutrition",
        crop="Tomato",
        growthStage="Flowering",
        applicableFarmId="f-1",
        applicablePlotId="p-102",
        instructions="Flush main lines for 15 mins. Inject prescribed Calcium Nitrate and Potassium Nitrate via Venturi injector.",
        products=["Calcium Nitrate (15.5-0-0 + 26% CaO)", "Potassium Nitrate (13-0-46)"],
        applicationRate="2.5 kg Calcium Nitrate + 1.8 kg Potassium Nitrate per 1,000 plants",
        waterVolume="1,200 Liters via Drip Irrigation",
        applicationMethod="Drip Fertigation (Venturi Injector)",
        frequency="Every 7 Days",
        ppeRequired=["Rubber Gloves", "Safety Goggles", "Boots"],
        createdBy="Dr. Lobos (Head Agronomist)",
        createdAt="2026-09-28"
    ),
    Protocol(
        id="prot-2",
        name="Whitefly & Thrips Integrated Scouting",
        category="Pest & Disease",
        crop="Tomato",
        growthStage="Flowering",
        applicableFarmId="f-1",
        applicablePlotId="p-103",
        instructions="Inspect 20 random leaves per plot. Capture sticky trap photo evidence. Apply Neem Oil if count > 3/leaf.",
        products=["Neem Oil Extract (Azadirachtin 1%)"],
        applicationRate="5ml Neem Oil per Liter water",
        waterVolume="200 Liters Spray",
        applicationMethod="Foliar Spray",
        frequency="Twice Weekly Scouting",
        ppeRequired=["N95 Respirator Mask", "Chemical Gloves"],
        createdBy="Dr. Lobos (Head Agronomist)",
        createdAt="2026-09-30"
    ),
    Protocol(
        id="prot-3",
        name="Drip Main Line Flushing & Venturi Calibration",
        category="Irrigation",
        crop="Tomato",
        growthStage="Vegetative",
        applicableFarmId="f-1",
        applicablePlotId="p-101",
        instructions="Open sub-main flush valves for 10 mins. Check manifold operating pressure (target 1.5 - 1.8 Bar).",
        products=["Clean Water Flush"],
        applicationRate="Full Line Flush Cycle",
        waterVolume="800 Liters",
        applicationMethod="Drip Sub-Main Flush",
        frequency="Bi-Weekly",
        ppeRequired=["Protective Boots", "Work Gloves"],
        createdBy="Dr. Lobos (Head Agronomist)",
        createdAt="2026-09-25"
    ),
    Protocol(
        id="prot-4",
        name="Post-Harvest Field Sanitation & Solarization",
        category="Sanitation",
        crop="Tomato",
        growthStage="Fruiting",
        applicableFarmId="f-1",
        applicablePlotId="p-103",
        instructions="Clear fallen fruit debris from plant bases. Spray Copper Hydroxide to sanitize soil surface.",
        products=["Copper Hydroxide 77% WP"],
        applicationRate="20g per 15 Liters water",
        waterVolume="150 Liters Spray",
        applicationMethod="Foliar & Base Spray",
        frequency="Post-Harvest Cycle",
        ppeRequired=["Chemical Respirator", "Rubber Gloves", "Goggles"],
        createdBy="Dr. Lobos (Head Agronomist)",
        createdAt="2026-09-22"
    )
]

TASKS_DB: List[Task] = [
    Task(
        id="task-101",
        protocolId="prot-1",
        protocolName="Tomato Flowering Calcium & Nitrogen Boost",
        farmId="f-1",
        farmName="John's Tomato Farm",
        plotId="p-102",
        plotName="Plot B (Flowering)",
        category="Nutrition",
        instructions="Inject Calcium & Potassium Nitrate via Venturi system into Plot B drip lines. Verify pressure gauge reads 1.5 Bar.",
        assignedWorkerName="Kofi Osei (Senior Field Hand)",
        priority="High",
        scheduledDate="2026-10-03",
        scheduledTime="07:30 AM",
        ppeRequired=["Rubber Gloves", "Safety Goggles", "Boots"],
        requiresPhotoEvidence=True,
        targetQuantity="1,200 Plants Fertigated",
        status="Scheduled"
    ),
    Task(
        id="task-102",
        protocolId="prot-2",
        protocolName="Whitefly & Thrips Integrated Scouting",
        farmId="f-1",
        farmName="John's Tomato Farm",
        plotId="p-103",
        plotName="Plot C (Fruiting)",
        category="Pest & Disease",
        instructions="Inspect lower leaf canopy for whitefly adults. Capture sticky trap photo evidence.",
        assignedWorkerName="Ama Serwaa (Scout)",
        priority="High",
        scheduledDate="2026-10-03",
        scheduledTime="09:00 AM",
        ppeRequired=["N95 Respirator Mask", "Chemical Gloves"],
        requiresPhotoEvidence=True,
        targetQuantity="20 Leaf Samples",
        status="Evidence Submitted",
        evidence=TaskEvidence(
            photoUrl="https://images.unsplash.com/photo-1592417817098-8f3d6eb247a5?w=500&q=80",
            quantityCompleted="20 Leaf Samples (Avg 4 Whiteflies/leaf)",
            notes="Whitefly cluster near southern edge of Plot C. Neem foliar spray recommended.",
            timestamp="09:45 AM"
        )
    ),
    Task(
        id="task-103",
        protocolId="prot-3",
        protocolName="Drip Main Line Flushing & Venturi Calibration",
        farmId="f-1",
        farmName="John's Tomato Farm",
        plotId="p-101",
        plotName="Plot A (Vegetative)",
        category="Irrigation",
        instructions="Open line end-caps for 10 minutes to clear silt buildup.",
        assignedWorkerName="Kwaku Bonsu (Irrigation)",
        priority="Medium",
        scheduledDate="2026-10-03",
        scheduledTime="11:00 AM",
        ppeRequired=["Protective Boots", "Work Gloves"],
        requiresPhotoEvidence=False,
        targetQuantity="4 Drip Lines Flushed",
        status="Verified",
        verifiedAt="11:30 AM",
        verificationNotes="Audit completed by Manager Kwame. Pressure optimal at 1.7 Bar."
    )
]

ALERTS_DB: List[ProblemAlert] = [
    ProblemAlert(
        id="alert-1",
        farmId="f-1",
        plotName="Plot C (Fruiting)",
        description="Drip irrigation line pressure dropped below 0.8 Bar. Pump pressure fluctuating near valve B2.",
        status="Active",
        reportedAt="Today, 08:15 AM",
        reportedBy="Kofi Osei (Field Hand)"
    ),
    ProblemAlert(
        id="alert-2",
        farmId="f-1",
        plotName="Nursery & High Tunnel",
        description="Temperature spike to 34°C inside seedling tunnel. Vent shade mesh adjustment required.",
        status="Active",
        reportedAt="Today, 10:00 AM",
        reportedBy="Ama Serwaa (Pest Scout)"
    )
]

INSPECTIONS_DB: List[Inspection] = [
    Inspection(
        id="insp-101",
        date="2026-10-02",
        farmId="f-1",
        farmName="John's Tomato Farm",
        plotId="p-102",
        plotName="Plot B (Flowering)",
        inspectorName="Dr. Lobos (Head Agronomist)",
        cropHealthRating=4,
        irrigationRating=5,
        nutritionRating=3,
        pestRating=4,
        sanitationRating=5,
        harvestRating=4,
        observations="Flowering cluster density is strong (4-5 flowers per truss). Nitrogen levels in upper leaves require calcium boost.",
        recommendedAction="Dispatch Calcium Nitrate fertigation protocol prot-1."
    ),
    Inspection(
        id="insp-102",
        date="2026-10-01",
        farmId="f-1",
        farmName="John's Tomato Farm",
        plotId="p-103",
        plotName="Plot C (Fruiting)",
        inspectorName="Dr. Lobos (Head Agronomist)",
        cropHealthRating=3,
        irrigationRating=3,
        nutritionRating=3,
        pestRating=2,
        sanitationRating=4,
        harvestRating=4,
        observations="Early whitefly signs on underside of mature leaves. Potassium drawdown noted during fruit sizing stage.",
        recommendedAction="Increase scouting frequency and execute Neem foliar treatment."
    )
]

TIMELINE_DB: List[TimelineEvent] = [
    TimelineEvent(
        id="tl-1",
        farmId="f-1",
        timestamp="Today, 11:30 AM",
        category="Audit",
        title="Drip Line Flushing Verified by Manager",
        description="Kwame Mensah audited Plot A line flush. Manifold operating pressure verified at 1.7 Bar.",
        actorRole="manager",
        actorName="Kwame Mensah"
    ),
    TimelineEvent(
        id="tl-2",
        farmId="f-1",
        timestamp="Today, 09:45 AM",
        category="Task",
        title="Photo Evidence Uploaded for Pest Scouting",
        description="Worker Ama Serwaa uploaded sticky trap photo for Plot C (Whitefly cluster detected).",
        actorRole="worker",
        actorName="Ama Serwaa"
    ),
    TimelineEvent(
        id="tl-3",
        farmId="f-1",
        timestamp="Today, 08:15 AM",
        category="Alert",
        title="Emergency Irrigation Pressure Alert Dispatched",
        description="Kofi Osei reported drip line pressure drop in Plot C.",
        actorRole="worker",
        actorName="Kofi Osei"
    ),
    TimelineEvent(
        id="tl-4",
        farmId="f-1",
        timestamp="Yesterday, 04:00 PM",
        category="Protocol",
        title="Agronomic Protocol Published by Dr. Lobos",
        description="Dr. Lobos published Tomato Flowering Calcium & Nitrogen Boost protocol for Plot B.",
        actorRole="agronomist",
        actorName="Dr. Lobos"
    )
]

# --- REST ENDPOINTS ---
@app.get("/api/agronomist/summary")
def get_agronomist_summary():
    return {
        "agronomistName": "Dr. Lobos",
        "totalFarms": len(FARMS_DB),
        "healthyFarms": 1,
        "attentionFarms": 1,
        "totalProtocols": len(PROTOCOLS_DB),
        "totalTasks": len(TASKS_DB),
        "scheduledTasks": sum(1 for t in TASKS_DB if t.status == "Scheduled"),
        "submittedTasks": sum(1 for t in TASKS_DB if t.status == "Evidence Submitted"),
        "verifiedTasks": sum(1 for t in TASKS_DB if t.status == "Verified"),
        "totalInspections": len(INSPECTIONS_DB)
    }

@app.get("/api/manager/summary")
def get_manager_summary():
    return {
        "managerName": "Kwame Mensah",
        "farmName": "John's Tomato Farm",
        "totalTasksToday": len(TASKS_DB),
        "scheduledTasks": sum(1 for t in TASKS_DB if t.status == "Scheduled"),
        "submittedPendingAudit": sum(1 for t in TASKS_DB if t.status == "Evidence Submitted"),
        "verifiedTasks": sum(1 for t in TASKS_DB if t.status == "Verified"),
        "rejectedTasks": sum(1 for t in TASKS_DB if t.status == "Rejected"),
        "activeAlertsCount": sum(1 for a in ALERTS_DB if a.status == "Active"),
        "workersActiveCount": len(WORKERS_DB)
    }

@app.get("/api/workers")
def get_workers(): return WORKERS_DB

@app.get("/api/alerts")
def get_alerts(): return ALERTS_DB

@app.post("/api/alerts/{alert_id}/action")
def take_alert_action(alert_id: str, payload: AlertAction):
    for alert in ALERTS_DB:
        if alert.id == alert_id:
            alert.status = "In Progress"
            alert.actionTaken = f"{payload.actionType}: {payload.actionNotes}"
            TIMELINE_DB.insert(0, TimelineEvent(
                id=f"tl-{len(TIMELINE_DB)+1}", farmId=alert.farmId, timestamp="Just now",
                category="Alert", title=f"Manager Triage: Alert Actioned for {alert.plotName}",
                description=f"Manager Kwame Mensah actioned issue: {payload.actionNotes}",
                actorRole="manager", actorName="Kwame Mensah"
            ))
            return alert
    raise HTTPException(status_code=404, detail="Alert not found")

@app.get("/api/farms")
def get_farms(): return FARMS_DB

@app.put("/api/plots/{plot_id}")
def update_plot_metrics(plot_id: str, payload: PlotUpdate):
    for farm in FARMS_DB:
        for plot in farm.plots:
            if plot.id == plot_id:
                if payload.growthStage: plot.growthStage = payload.growthStage
                if payload.growthWeek: plot.growthWeek = payload.growthWeek
                if payload.healthStatus: plot.healthStatus = payload.healthStatus
                if payload.soilPh: plot.soilPh = payload.soilPh
                if payload.nitrogenLevelPpm: plot.nitrogenLevelPpm = payload.nitrogenLevelPpm
                if payload.moisturePct: plot.moisturePct = payload.moisturePct
                return plot
    raise HTTPException(status_code=404, detail="Plot not found")

@app.get("/api/protocols")
def get_protocols(): return PROTOCOLS_DB

@app.post("/api/protocols")
def create_protocol(payload: ProtocolCreate):
    new_prot = Protocol(id=f"prot-{len(PROTOCOLS_DB)+101}", createdBy="Dr. Lobos (Head Agronomist)", createdAt=datetime.now().strftime("%Y-%m-%d"), **payload.model_dump())
    PROTOCOLS_DB.insert(0, new_prot)
    TIMELINE_DB.insert(0, TimelineEvent(
        id=f"tl-{len(TIMELINE_DB)+1}", farmId=payload.applicableFarmId, timestamp="Just now",
        category="Protocol", title=f"New Protocol Published: {payload.name}",
        description=f"Agronomist published protocol for stage '{payload.growthStage}'.",
        actorRole="agronomist", actorName="Dr. Lobos"
    ))
    return new_prot

@app.get("/api/equipment")
def get_equipment(): return EQUIPMENT_DB

@app.get("/api/inventory")
def get_inventory(): return INVENTORY_DB

@app.get("/api/export/harvest-csv")
def export_harvest_csv():
    from fastapi.responses import Response
    csv_content = "Farm Name,Location,Crop Variety,Acreage,Expected Yield (kg),Projected Revenue (USD),Current Output (kg),Input Cost ROI\n"
    csv_content += "John's Tomato Farm,Dodowa,Fresh Market Tomato (Ananya F1),2.5,10000,$24500,1240,3.8x\n"
    csv_content += "Volta Basin Organic Farm,Ada Foah,Habanero & Sweet Bell,4.0,16000,$38000,2400,4.1x\n"
    return Response(content=csv_content, media_type="text/csv", headers={"Content-Disposition": "attachment; filename=afuom_hq_harvest_revenue_report.csv"})

@app.get("/api/export/soil-csv")
def export_soil_csv():
    from fastapi.responses import Response
    csv_content = "Farm ID,Plot ID,Plot Name,Growth Stage,Soil pH,Nitrogen (PPM),Phosphorous (PPM),Potassium (PPM),Moisture Pct,Health Status\n"
    for farm in FARMS_DB:
        for plot in farm.plots:
            csv_content += f"{farm.id},{plot.id},{plot.name},{plot.growthStage},{plot.soilPh},{plot.nitrogenLevelPpm},{plot.phosphorousPpm},{plot.potassiumPpm},{plot.moisturePct},{plot.healthStatus}\n"
    return Response(content=csv_content, media_type="text/csv", headers={"Content-Disposition": "attachment; filename=afuom_hq_soil_test_history.csv"})

@app.get("/api/tasks")
def get_tasks(): return TASKS_DB

@app.post("/api/tasks")
def dispatch_task(payload: TaskCreate):
    # Equipment Overlap / Conflict Engine
    if payload.equipmentId:
        for eq in EQUIPMENT_DB:
            if eq.id == payload.equipmentId:
                if eq.status == "In Use":
                    raise HTTPException(
                        status_code=400,
                        detail=f"CONFLICT DETECTED: Machinery '{eq.name}' is already IN USE at {eq.currentPlot or 'another plot'} by {eq.assignedWorker or 'another worker'}!"
                    )
                elif eq.status == "Maintenance":
                    raise HTTPException(
                        status_code=400,
                        detail=f"EQUIPMENT UNAVAILABLE: '{eq.name}' is under maintenance!"
                    )
                eq.status = "In Use"
                eq.currentPlot = payload.plotName
                eq.assignedWorker = payload.assignedWorkerName

    new_task = Task(id=f"task-{len(TASKS_DB)+101}", status="Scheduled", **payload.model_dump())
    TASKS_DB.insert(0, new_task)
    TIMELINE_DB.insert(0, TimelineEvent(
        id=f"tl-{len(TIMELINE_DB)+1}", farmId=payload.farmId, timestamp="Just now",
        category="Task", title=f"Task Dispatched to {payload.plotName}",
        description=f"Task '{payload.protocolName}' assigned to {payload.assignedWorkerName}." + (f" Equipment reserved: {payload.equipmentName}." if payload.equipmentName else ""),
        actorRole="agronomist", actorName="Dr. Lobos"
    ))
    return new_task

@app.post("/api/tasks/{task_id}/assign")
def assign_worker(task_id: str, payload: TaskAssign):
    for task in TASKS_DB:
        if task.id == task_id:
            task.assignedWorkerName = payload.workerName
            return task
    raise HTTPException(status_code=404, detail="Task not found")

@app.post("/api/tasks/{task_id}/evidence")
def submit_evidence(task_id: str, payload: TaskEvidence):
    for task in TASKS_DB:
        if task.id == task_id:
            task.status = "Evidence Submitted"
            task.evidence = payload
            TIMELINE_DB.insert(0, TimelineEvent(
                id=f"tl-{len(TIMELINE_DB)+1}", farmId=task.farmId, timestamp="Just now",
                category="Task", title=f"Photo Evidence Uploaded for {task.plotName}",
                description=f"Worker submitted proof: '{payload.quantityCompleted}'.",
                actorRole="worker", actorName="Kofi Osei"
            ))
            return task
    raise HTTPException(status_code=404, detail="Task not found")

@app.post("/api/tasks/{task_id}/verify")
def verify_task(task_id: str, payload: TaskVerify):
    for task in TASKS_DB:
        if task.id == task_id:
            task.status = "Verified"
            task.verificationNotes = payload.verificationNotes
            task.verifiedAt = datetime.now().strftime("%I:%M %p")
            
            # Release equipment if assigned
            if task.equipmentId:
                for eq in EQUIPMENT_DB:
                    if eq.id == task.equipmentId:
                        eq.status = "Available"
                        eq.currentPlot = None
                        eq.assignedWorker = None

            # Deduct stock inventory for nutrition/chemical tasks
            if task.category == "Nutrition" and len(INVENTORY_DB) > 0:
                INVENTORY_DB[0].stockQuantity = max(0.0, INVENTORY_DB[0].stockQuantity - 2.5)
            elif task.category == "Pest & Disease" and len(INVENTORY_DB) > 2:
                INVENTORY_DB[2].stockQuantity = max(0.0, INVENTORY_DB[2].stockQuantity - 0.5)
                if INVENTORY_DB[2].stockQuantity <= INVENTORY_DB[2].reorderLevel:
                    INVENTORY_DB[2].status = "Low Stock Warning"
                    ALERTS_DB.insert(0, ProblemAlert(
                        id=f"alert-{len(ALERTS_DB)+1}", farmId=task.farmId, plotName="Stock Room",
                        description=f"LOW STOCK WARNING: '{INVENTORY_DB[2].name}' reached {INVENTORY_DB[2].stockQuantity} {INVENTORY_DB[2].unit}. Reorder threshold is {INVENTORY_DB[2].reorderLevel} {INVENTORY_DB[2].unit}.",
                        status="Active", reportedAt="Just now", reportedBy="System Inventory Ledger"
                    ))

            TIMELINE_DB.insert(0, TimelineEvent(
                id=f"tl-{len(TIMELINE_DB)+1}", farmId=task.farmId, timestamp="Just now",
                category="Task", title=f"Task Verified by Manager",
                description=f"Manager Kwame Mensah verified work for '{task.protocolName}' on {task.plotName}. Input stock auto-deducted.",
                actorRole="manager", actorName="Kwame Mensah"
            ))
            return task
    raise HTTPException(status_code=404, detail="Task not found")

@app.post("/api/tasks/{task_id}/reject")
def reject_task(task_id: str, payload: TaskReject):
    for task in TASKS_DB:
        if task.id == task_id:
            task.status = "Rejected"
            task.reworkReason = payload.reworkReason
            TIMELINE_DB.insert(0, TimelineEvent(
                id=f"tl-{len(TIMELINE_DB)+1}", farmId=task.farmId, timestamp="Just now",
                category="Task", title=f"Task Rejected - Rework Required",
                description=f"Manager Kwame Mensah requested rework: {payload.reworkReason}",
                actorRole="manager", actorName="Kwame Mensah"
            ))
            return task
    raise HTTPException(status_code=404, detail="Task not found")

@app.get("/api/inspections")
def get_inspections(): return INSPECTIONS_DB

@app.post("/api/inspections")
def create_inspection(payload: InspectionCreate):
    new_insp = Inspection(id=f"insp-{len(INSPECTIONS_DB)+101}", date=datetime.now().strftime("%Y-%m-%d"), **payload.model_dump())
    INSPECTIONS_DB.insert(0, new_insp)
    return new_insp

@app.get("/api/timeline")
def get_timeline(): return TIMELINE_DB

@app.get("/api/weekly-report")
def get_weekly_report():
    return {
        "farmName": "John's Tomato Farm",
        "weekRange": "Sept 28 – Oct 4, 2026",
        "totalTasks": 103,
        "completedTasks": 96,
        "completionRatePct": 93,
        "irrigationCycles": 7,
        "fertilizerApplications": 2,
        "harvestQuantityKg": 1240,
        "issuesSummary": ["Whitefly cluster detected in Plot C", "Pump pressure fluctuated in Plot B"],
        "agronomistRemarks": "Crop growth and vegetative vigor remain satisfactory across Plot A and Nursery."
    }

@app.post("/api/report-problem")
def report_problem(payload: ProblemReport):
    new_alert = ProblemAlert(
        id=f"alert-{len(ALERTS_DB)+1}", farmId=payload.farmId, plotName=payload.plotName,
        description=payload.description, status="Active", reportedAt="Just now", reportedBy="Kofi Osei (Field Hand)"
    )
    ALERTS_DB.insert(0, new_alert)
    return {"status": "Alert dispatched to Manager"}

# Mount frontend directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(BASE_DIR, "..", "frontend")
app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=3000, reload=True)
