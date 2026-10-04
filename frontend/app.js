// Afuom HQ Frontend Logic — Agronomist & Manager Engine
let currentRole = 'agronomist';
let farms = [];
let selectedFarmId = 'f-1';
let protocols = [];
let tasks = [];
let inspections = [];
let timeline = [];
let agronomistSummary = {};
let managerSummary = {};
let workers = [];
let alerts = [];
let equipment = [];
let inventory = [];

let currentTaskToReject = null;
let currentTaskToReassign = null;

const ROLE_PROFILES = {
  agronomist: {
    name: 'Dr. Lobos',
    role: 'Head Agronomist',
    icon: 'fa-user-doctor',
    welcome: 'Welcome back, Dr. Lobos!',
    sub: "Multi-Farm Agronomic Command Center — John's Tomato Farm (Dodowa)",
    defaultTab: 'command-center'
  },
  manager: {
    name: 'Kwame Mensah',
    role: 'Operations Manager',
    icon: 'fa-user-tie',
    welcome: 'Welcome back, Kwame!',
    sub: "Farm Operations & Emergency Triage Command — John's Tomato Farm (Dodowa)",
    defaultTab: 'command-console'
  },
  worker: {
    name: 'Kofi Osei',
    role: 'Senior Field Hand',
    icon: 'fa-helmet-safety',
    welcome: 'Welcome back, Kofi!',
    sub: "Daily Field Tasks & Photo Proof Duty Console",
    defaultTab: 'my-tasks'
  },
  owner: {
    name: 'John Mensah',
    role: 'Farm Owner',
    icon: 'fa-chart-pie',
    welcome: 'Welcome back, Mr. Mensah!',
    sub: "Executive Farm Performance & Compliance Suite",
    defaultTab: 'executive-dashboard'
  }
};

async function loadData() {
  try {
    const [farmsRes, protRes, taskRes, inspRes, timeRes, agroRes, mgrRes, workRes, alertRes, eqRes, invRes] = await Promise.all([
      fetch('/api/farms'),
      fetch('/api/protocols'),
      fetch('/api/tasks'),
      fetch('/api/inspections'),
      fetch('/api/timeline'),
      fetch('/api/agronomist/summary'),
      fetch('/api/manager/summary'),
      fetch('/api/workers'),
      fetch('/api/alerts'),
      fetch('/api/equipment'),
      fetch('/api/inventory')
    ]);

    farms = await farmsRes.json();
    protocols = await protRes.json();
    tasks = await taskRes.json();
    inspections = await inspRes.json();
    timeline = await timeRes.json();
    agronomistSummary = await agroRes.json();
    managerSummary = await mgrRes.json();
    workers = await workRes.json();
    alerts = await alertRes.json();
    equipment = await eqRes.json();
    inventory = await invRes.json();

    renderAll();
  } catch (err) {
    console.error('Error fetching farm data:', err);
  }
}

// Service Worker & Offline Sync Engine
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js').catch(err => console.log('SW registration skipped:', err));
}

function updateNetworkBadge() {
  const badge = document.getElementById('network-status-badge');
  if (!badge) {
    if (navigator.onLine) syncOfflineSubmissions();
    return;
  }
  if (navigator.onLine) {
    badge.className = 'badge badge-green';
    badge.innerHTML = '<i class="fa-solid fa-wifi"></i> Network: Online';
    syncOfflineSubmissions();
  } else {
    badge.className = 'badge badge-amber';
    badge.innerHTML = '<i class="fa-solid fa-plane-slash"></i> Network: Offline (Queued)';
  }
}

window.addEventListener('online', updateNetworkBadge);
window.addEventListener('resize', () => {
  if (window.innerWidth > 900) {
    const sidebar = document.getElementById('app-sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');
    if (sidebar) sidebar.classList.remove('open');
    if (backdrop) backdrop.classList.remove('open');
  }
});

document.addEventListener('DOMContentLoaded', () => {
  loadData();
  updateLiveClock();
  updateNetworkBadge();
  setInterval(updateLiveClock, 60000);
});

function toggleMobileSidebar() {
  const sidebar = document.getElementById('app-sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  if (sidebar) sidebar.classList.toggle('open');
  if (backdrop) backdrop.classList.toggle('open');
}

function updateLiveClock() {
  const clockEl = document.getElementById('current-time');
  if (!clockEl) return;
  const now = new Date();
  clockEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' GMT';
}

function switchRole(role) {
  currentRole = role;
  
  // Reset scroll to top of page on role switch
  window.scrollTo(0, 0);
  
  // 1. Update Role Pills active state
  document.querySelectorAll('.role-pill').forEach(btn => btn.classList.remove('active'));
  const activePill = document.getElementById(`role-pill-${role}`);
  if (activePill) activePill.classList.add('active');

  // 2. Hide all role navigation groups and show active role nav group in sidebar
  document.querySelectorAll('.role-nav-group').forEach(group => group.style.display = 'none');
  const activeNavGroup = document.getElementById(`${role}-nav-group`);
  if (activeNavGroup) activeNavGroup.style.display = 'block';

  // 3. Hide all role sections in workspace and show active role section
  document.querySelectorAll('.role-section').forEach(sec => sec.style.display = 'none');
  const roleView = document.getElementById(`${role}-view`);
  if (roleView) roleView.style.display = 'block';

  // 4. Update Profile Base Card at sidebar bottom & Welcome Banner
  const profile = ROLE_PROFILES[role] || ROLE_PROFILES.agronomist;
  
  const avatarEl = document.getElementById('sidebar-user-avatar');
  if (avatarEl) avatarEl.innerHTML = `<i class="fa-solid ${profile.icon}"></i>`;

  const nameEl = document.getElementById('sidebar-user-name');
  if (nameEl) nameEl.textContent = profile.name;

  const roleTitleEl = document.getElementById('sidebar-user-role');
  if (roleTitleEl) roleTitleEl.textContent = profile.role;

  const welcomeTitle = document.getElementById('welcome-title');
  if (welcomeTitle) welcomeTitle.textContent = profile.welcome;

  const welcomeSub = document.getElementById('welcome-sub');
  if (welcomeSub) welcomeSub.textContent = profile.sub;

  // 5. Close mobile drawer on switch
  const sidebar = document.getElementById('app-sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  if (sidebar) sidebar.classList.remove('open');
  if (backdrop) backdrop.classList.remove('open');

  // 6. Default to sub-tab
  switchSubTab(role, profile.defaultTab);

  renderAll();
}

function switchSubTab(role, tabId) {
  // Reset scroll to top of page on sub-tab switch
  window.scrollTo(0, 0);

  const roleNavGroup = document.getElementById(`${role}-nav-group`);
  if (roleNavGroup) {
    roleNavGroup.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    const activeNav = roleNavGroup.querySelector(`.nav-item[data-tab="${tabId}"]`);
    if (activeNav) activeNav.classList.add('active');
  }

  const section = document.getElementById(`${role}-view`);
  if (!section) return;

  const subContents = section.querySelectorAll('.sub-tab-content');
  subContents.forEach(content => content.style.display = 'none');

  const targetContent = document.getElementById(`${role}-${tabId}`);
  if (targetContent) targetContent.style.display = 'block';

  // Close mobile drawer on item select
  const sidebar = document.getElementById('app-sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  if (sidebar) sidebar.classList.remove('open');
  if (backdrop) backdrop.classList.remove('open');
}

function renderAll() {
  if (currentRole === 'agronomist') {
    renderAgronomistSummary();
    renderPlots();
    renderProtocols();
    renderInventory();
    renderInspections();
  } else if (currentRole === 'manager') {
    renderManagerSummary();
    renderAlerts();
    renderEquipment();
    renderManagerQueue();
    renderWorkersTable();
    renderVerifiedTasks();
  } else if (currentRole === 'worker') {
    renderWorkerTasks();
  } else if (currentRole === 'owner') {
    renderTimeline();
  }
}

function renderInventory() {
  const container = document.getElementById('inventory-container');
  if (!container) return;

  container.innerHTML = inventory.map(item => `
    <div class="card">
      <div class="card-header">
        <div>
          <span class="badge ${item.status === 'In Stock' ? 'badge-green' : 'badge-amber'}">
            <i class="fa-solid ${item.status === 'In Stock' ? 'fa-check' : 'fa-triangle-exclamation'}"></i> ${item.status}
          </span>
          <div class="card-title" style="margin-top: 6px;">${item.name}</div>
        </div>
      </div>
      <div class="kpi-figure" style="margin: 8px 0; color: ${item.stockQuantity <= item.reorderLevel ? 'var(--warning)' : 'var(--success)'};">
        ${item.stockQuantity} <span style="font-size: 14px; font-weight: 400; color: var(--text-muted);">${item.unit}</span>
      </div>
      <div class="ruled-list">
        <div class="ruled-list-item"><span>Category:</span><strong>${item.category}</strong></div>
        <div class="ruled-list-item"><span>Reorder Level:</span><strong>${item.reorderLevel} ${item.unit}</strong></div>
        <div class="ruled-list-item"><span>Unit Cost:</span><strong>$${item.unitCostUsd} / ${item.unit}</strong></div>
      </div>
    </div>
  `).join('');
}

function renderEquipment() {
  const container = document.getElementById('equipment-container');
  if (!container) return;

  container.innerHTML = equipment.map(eq => `
    <div class="card">
      <div class="card-header">
        <div>
          <span class="badge ${eq.status === 'Available' ? 'badge-green' : eq.status === 'In Use' ? 'badge-amber' : 'badge-red'}">
            <i class="fa-solid ${eq.status === 'Available' ? 'fa-circle-check' : 'fa-clock'}"></i> ${eq.status}
          </span>
          <div class="card-title" style="margin-top: 6px;"><i class="fa-solid fa-gear text-blue"></i> ${eq.name}</div>
        </div>
        <span class="badge badge-blue">${eq.category}</span>
      </div>
      <div class="ruled-list" style="margin-top: 10px;">
        <div class="ruled-list-item"><span>Current Location:</span><strong>${eq.currentPlot || 'Main Machinery Shed'}</strong></div>
        <div class="ruled-list-item"><span>Assigned Operator:</span><strong>${eq.assignedWorker || 'None (Available)'}</strong></div>
      </div>
    </div>
  `).join('');
}

/* AGRONOMIST RENDERING */
function renderAgronomistSummary() {
  if (!agronomistSummary) return;
  document.getElementById('stat-farms').textContent = agronomistSummary.totalFarms || 2;
  document.getElementById('stat-farms-breakdown').textContent = `${agronomistSummary.healthyFarms || 1} Healthy · ${agronomistSummary.attentionFarms || 1} Attention`;
  document.getElementById('stat-protocols').textContent = agronomistSummary.totalProtocols || 4;
  document.getElementById('stat-tasks').textContent = agronomistSummary.totalTasks || 2;
  document.getElementById('stat-inspections').textContent = agronomistSummary.totalInspections || 1;
}

function loadFarmPlots(farmId) {
  selectedFarmId = farmId;
  renderPlots();
}

function renderPlots() {
  const container = document.getElementById('plots-container');
  if (!container) return;

  const currentFarm = farms.find(f => f.id === selectedFarmId) || farms[0];
  if (!currentFarm) return;

  container.innerHTML = currentFarm.plots.map(p => `
    <div class="card">
      <div class="card-header">
        <div class="card-title">${p.name}</div>
        <span class="badge ${p.healthStatus === 'Good' ? 'badge-green' : p.healthStatus === 'Attention' ? 'badge-amber' : 'badge-red'}">
          <i class="fa-solid ${p.healthStatus === 'Good' ? 'fa-circle-check' : 'fa-triangle-exclamation'}"></i> ${p.healthStatus}
        </span>
      </div>

      <div style="color: var(--text-muted); margin-bottom: 8px;">
        Growth Stage: <strong>${p.growthStage}</strong> (Week ${p.growthWeek || 10})
      </div>

      <div class="ruled-list" style="margin-bottom: 12px;">
        <div class="ruled-list-item"><span>Soil pH:</span><strong>${p.soilPh}</strong></div>
        <div class="ruled-list-item"><span>Nitrogen Level:</span><strong style="color: ${p.nitrogenLevelPpm < 30 ? 'var(--warning)' : 'var(--success)'};">${p.nitrogenLevelPpm} ppm</strong></div>
        <div class="ruled-list-item"><span>Soil Moisture:</span><strong>${p.moisturePct}%</strong></div>
        <div class="ruled-list-item"><span>Plot Area:</span><strong>${p.sizeAcres} Acres</strong></div>
      </div>

      <button class="btn btn-secondary" style="width: 100%; justify-content: center;" onclick="openEditPlotModal('${p.id}', '${p.name}', '${p.growthStage}', ${p.growthWeek || 10}, ${p.soilPh}, ${p.nitrogenLevelPpm}, ${p.moisturePct})">
        <i class="fa-solid fa-pen-to-square"></i> Edit Soil Test
      </button>
    </div>
  `).join('');
}

function renderProtocols() {
  const container = document.getElementById('protocols-container');
  if (!container) return;

  container.innerHTML = protocols.map(p => `
    <div class="card" style="display: flex; flex-direction: column; justify-content: space-between;">
      <div>
        <div class="card-header">
          <div>
            <span class="badge badge-green">${p.category}</span>
            <div class="card-title" style="margin-top: 6px;">${p.name}</div>
          </div>
          <span class="badge badge-blue">Stage: ${p.growthStage}</span>
        </div>
        <p style="color: var(--text); margin: 10px 0;">${p.instructions}</p>

        <div class="ruled-list" style="background: var(--surface-raised); padding: 12px; border-radius: var(--radius); border: 1px solid var(--border);">
          <div class="ruled-list-item"><span>Prescribed Products:</span><strong>${p.products.join(', ')}</strong></div>
          <div class="ruled-list-item"><span>Dosage Rate:</span><strong>${p.applicationRate}</strong></div>
          <div class="ruled-list-item"><span>Water Volume:</span><strong>${p.waterVolume}</strong></div>
          <div class="ruled-list-item"><span>Application Method:</span><strong>${p.applicationMethod}</strong></div>
          <div class="ruled-list-item"><span>Required PPE:</span><strong>${p.ppeRequired.join(', ')}</strong></div>
        </div>
      </div>

      <div style="margin-top: 16px; display: flex; justify-content: space-between; align-items: center;">
        <span style="color: var(--primary); font-weight: 600;"><i class="fa-solid fa-user-doctor"></i> By ${p.createdBy}</span>
        <button class="btn" onclick="openDispatchModal('${p.id}', '${p.name}')">
          <i class="fa-solid fa-paper-plane"></i> Dispatch Task →
        </button>
      </div>
    </div>
  `).join('');
}

function renderInspections() {
  const container = document.getElementById('inspections-container');
  if (!container) return;

  if (inspections.length === 0) {
    container.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 20px;">No farm inspections recorded yet.</div>`;
    return;
  }

  container.innerHTML = inspections.map(i => `
    <div class="card" style="border-left: 4px solid var(--primary);">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div class="card-title"><i class="fa-solid fa-clipboard-check text-green"></i> Inspection: ${i.plotName} (${i.farmName})</div>
        <span style="color: var(--primary); font-weight: 600;">Date: ${i.date}</span>
      </div>
      <div class="ruled-list" style="margin: 10px 0;">
        <div class="ruled-list-item"><span>Crop Vigor Rating:</span><strong>${i.cropHealthRating} / 5 ★</strong></div>
        <div class="ruled-list-item"><span>Nutrition Rating:</span><strong>${i.nutritionRating} / 5 ★</strong></div>
        <div class="ruled-list-item"><span>Pest & Disease Control:</span><strong>${i.pestRating} / 5 ★</strong></div>
      </div>
      <div style="color: var(--text); background: var(--surface-raised); padding: 10px; border-radius: var(--radius); border: 1px solid var(--border);">
        <strong>Agronomic Field Observations:</strong> "${i.observations}"
      </div>
    </div>
  `).join('');
}

/* FARM MANAGER RENDERING */
function renderManagerSummary() {
  if (!managerSummary) return;
  document.getElementById('mgr-stat-pending').textContent = managerSummary.submittedPendingAudit || 1;
  document.getElementById('mgr-stat-verified').textContent = managerSummary.verifiedTasks || 1;
  document.getElementById('mgr-stat-workers').textContent = managerSummary.workersActiveCount || 4;
  document.getElementById('mgr-stat-alerts').textContent = managerSummary.activeAlertsCount || 1;
}

function renderAlerts() {
  const container = document.getElementById('alerts-container');
  const badge = document.getElementById('active-alerts-badge');
  if (!container) return;

  const activeAlerts = alerts.filter(a => a.status === 'Active');
  if (badge) badge.textContent = `${activeAlerts.length} Emergency Active`;

  if (activeAlerts.length === 0) {
    container.innerHTML = `<div style="text-align: center; color: var(--success); padding: 20px;"><i class="fa-solid fa-check"></i> Zero active farm emergency alerts.</div>`;
    return;
  }

  container.innerHTML = activeAlerts.map(a => `
    <div class="card" style="background: var(--badge-red-bg); border-color: var(--danger-border);">
      <div style="display: flex; justify-content: space-between; align-items: center; color: var(--danger-text);">
        <div class="card-title" style="color: var(--danger-text);"><i class="fa-solid fa-triangle-exclamation"></i> Emergency Alert: ${a.plotName}</div>
        <span style="color: var(--text-muted);">Reported: ${a.reportedAt} by ${a.reportedBy}</span>
      </div>
      <p style="color: var(--danger-text); margin: 10px 0; font-weight: 500;">${a.description}</p>
      
      <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 12px;">
        <button class="btn btn-secondary" onclick="actionAlert('${a.id}', 'Acknowledge', 'Manager Kwame Mensah acknowledged issue.')">
          <i class="fa-solid fa-check"></i> Acknowledge
        </button>
        <button class="btn btn-danger" onclick="actionAlert('${a.id}', 'Dispatch', 'Dispatched Kwaku Bonsu to inspect irrigation pump.')">
          <i class="fa-solid fa-helmet-safety"></i> Dispatch Specialist
        </button>
      </div>
    </div>
  `).join('');
}

function renderManagerQueue() {
  const container = document.getElementById('verification-container');
  const badge = document.getElementById('pending-count-badge');
  if (!container) return;

  const pendingTasks = tasks.filter(t => t.status === 'Evidence Submitted');
  if (badge) badge.textContent = `${pendingTasks.length} Pending Audit`;

  if (pendingTasks.length === 0) {
    container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--success); padding: 24px;"><i class="fa-solid fa-circle-check"></i> All submitted worker photo evidence has been verified!</div>`;
    return;
  }

  container.innerHTML = pendingTasks.map(t => `
    <div class="card">
      <div class="card-header">
        <div>
          <span class="badge badge-amber">${t.category}</span>
          <div class="card-title" style="margin-top: 6px;">${t.protocolName}</div>
          <div style="color: var(--primary); margin-top: 2px;"><i class="fa-solid fa-location-dot"></i> ${t.plotName} · Worker: <strong>${t.assignedWorkerName}</strong></div>
        </div>
      </div>

      ${t.evidence?.photoUrl ? `
        <div style="position: relative; margin: 10px 0;">
          <img src="${t.evidence.photoUrl}" class="img-preview" alt="Submitted Proof" />
          <div style="position: absolute; bottom: 8px; left: 8px; font-size: 14px; background: rgba(0,0,0,0.75); color: #fff; padding: 4px 8px; border-radius: var(--radius);">
            <i class="fa-solid fa-camera"></i> Submitted at ${t.evidence.timestamp}
          </div>
        </div>
      ` : ''}

      <div class="ruled-list" style="background: var(--surface-raised); padding: 12px; border-radius: var(--radius); border: 1px solid var(--border);">
        <div class="ruled-list-item"><span>Quantity Reported:</span><strong>${t.evidence?.quantityCompleted || 'N/A'}</strong></div>
        <div class="ruled-list-item"><span>Worker Field Notes:</span><strong>"${t.evidence?.notes || ''}"</strong></div>
      </div>

      <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 14px;">
        <button class="btn btn-secondary" onclick="openReassignModal('${t.id}')">
          <i class="fa-solid fa-user-pen"></i> Reassign
        </button>
        <button class="btn btn-danger" onclick="openRejectModal('${t.id}')">
          <i class="fa-solid fa-xmark"></i> Reject Work
        </button>
        <button class="btn" onclick="verifyTask('${t.id}')">
          <i class="fa-solid fa-check"></i> Approve Work
        </button>
      </div>
    </div>
  `).join('');
}

function renderWorkersTable() {
  const tbody = document.getElementById('workers-body');
  if (!tbody) return;

  tbody.innerHTML = workers.map(w => `
    <tr>
      <td><strong>${w.name}</strong></td>
      <td>${w.roleTitle}</td>
      <td class="num">${w.tasksAssigned}</td>
      <td class="num">${w.tasksCompleted}</td>
      <td class="num"><strong style="color: ${w.compliancePct >= 95 ? 'var(--success)' : 'var(--warning)'};">${w.compliancePct}%</strong></td>
      <td><span class="badge ${w.status === 'Active On Field' ? 'badge-green' : 'badge-amber'}"><i class="fa-solid ${w.status === 'Active On Field' ? 'fa-circle-check' : 'fa-clock'}"></i> ${w.status}</span></td>
      <td>
        <button class="btn btn-secondary" style="min-height: 38px; padding: 4px 10px;" onclick="alert('Assigned task view for ${w.name}')">
          View Tasks
        </button>
      </td>
    </tr>
  `).join('');
}

function renderVerifiedTasks() {
  const tbody = document.getElementById('verified-tasks-body');
  if (!tbody) return;

  const verified = tasks.filter(t => t.status === 'Verified');
  tbody.innerHTML = verified.map(t => `
    <tr>
      <td><strong>${t.protocolName}</strong></td>
      <td>${t.plotName}</td>
      <td>${t.assignedWorkerName}</td>
      <td>${t.evidence?.quantityCompleted || 'Done'}</td>
      <td><span class="badge badge-green"><i class="fa-solid fa-circle-check"></i> Verified at ${t.verifiedAt || ''}</span></td>
    </tr>
  `).join('');
}

/* WORKER RENDERING */
function renderWorkerTasks() {
  const container = document.getElementById('worker-tasks-container');
  if (!container) return;

  const workerTasks = tasks.filter(t => t.status === 'Scheduled' || t.status === 'In Progress' || t.status === 'Rejected');
  
  if (workerTasks.length === 0) {
    container.innerHTML = `<div style="text-align: center; color: var(--success); padding: 24px;"><i class="fa-solid fa-circle-check"></i> No pending tasks assigned for today!</div>`;
    return;
  }

  container.innerHTML = workerTasks.map(t => `
    <div class="card" style="${t.status === 'Rejected' ? 'border-color: var(--danger);' : ''}">
      <div class="card-header">
        <div>
          <span class="badge badge-amber">${t.category}</span>
          <div class="card-title" style="margin-top: 6px;">${t.protocolName}</div>
          <div style="color: var(--text-muted); margin-top: 2px;"><i class="fa-solid fa-location-dot"></i> ${t.plotName} · Scheduled: <strong>${t.scheduledTime}</strong></div>
        </div>
        <span class="badge ${t.status === 'Rejected' ? 'badge-red' : 'badge-amber'}">
          <i class="fa-solid ${t.status === 'Rejected' ? 'fa-triangle-exclamation' : 'fa-clock'}"></i> ${t.status === 'Rejected' ? 'Rework Required' : t.priority + ' Priority'}
        </span>
      </div>

      ${t.equipmentName ? `
        <div style="background: var(--badge-blue-bg); border: 1px solid var(--badge-blue-border); padding: 10px; border-radius: var(--radius); color: var(--badge-blue-text); margin: 10px 0;">
          <strong><i class="fa-solid fa-tractor"></i> Assigned Machinery:</strong> ${t.equipmentName} (Reserved)
        </div>
      ` : ''}

      ${t.reworkReason ? `
        <div style="background: var(--badge-red-bg); border: 1px solid var(--badge-red-border); padding: 10px; border-radius: var(--radius); color: var(--badge-red-text); margin: 10px 0;">
          <strong>Manager Rework Request:</strong> "${t.reworkReason}"
        </div>
      ` : ''}

      <div class="ruled-list" style="margin: 10px 0;">
        <div class="ruled-list-item"><span>Required Safety Gear (PPE):</span><strong style="color: var(--warning);">${t.ppeRequired.join(', ')}</strong></div>
      </div>

      <div style="background: var(--surface-raised); padding: 12px; border-radius: var(--radius); border: 1px solid var(--border); color: var(--text); margin-bottom: 14px;">
        <strong>Agronomist Instructions:</strong><br>${t.instructions}
      </div>

      <div style="display: flex; gap: 10px;">
        <button class="btn btn-secondary" style="flex: 1;" onclick="printWorkOrder('${t.id}')">
          <i class="fa-solid fa-print"></i> Print Work Order
        </button>
        <button class="btn" style="flex: 2;" onclick="openEvidenceModal('${t.id}')">
          <i class="fa-solid fa-camera"></i> Submit Photo Proof
        </button>
      </div>
    </div>
  `).join('');
}

function printWorkOrder(taskId) {
  window.print();
}

/* OWNER RENDERING */
function renderTimeline() {
  const container = document.getElementById('timeline-container');
  if (!container) return;

  container.innerHTML = timeline.map(e => `
    <div class="card" style="border-left: 4px solid var(--primary);">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div class="card-title"><i class="fa-solid fa-circle-check text-green"></i> ${e.title}</div>
        <span style="color: var(--text-muted);">${e.timestamp}</span>
      </div>
      <div style="color: var(--text-muted); margin-top: 6px;">${e.description}</div>
      <div style="color: var(--primary); font-weight: 600; margin-top: 6px;">Logged by: ${e.actorName} (${e.actorRole.toUpperCase()})</div>
    </div>
  `).join('');
}

/* MODAL & API HANDLERS */
function openModal(id) {
  document.getElementById(id).style.display = 'flex';
}

function closeModal(id) {
  document.getElementById(id).style.display = 'none';
}

function openDispatchModal(protId, protName) {
  document.getElementById('task-prot-id').value = protId;
  document.getElementById('task-prot-name').value = protName;
  openModal('task-modal');
}

function openEditPlotModal(plotId, plotName, stage, week, ph, n, moisture) {
  document.getElementById('edit-plot-id').value = plotId;
  document.getElementById('edit-plot-name').value = plotName;
  document.getElementById('edit-plot-stage').value = stage;
  document.getElementById('edit-plot-week').value = week;
  document.getElementById('edit-plot-ph').value = ph;
  document.getElementById('edit-plot-n').value = n;
  document.getElementById('edit-plot-moisture').value = moisture;
  openModal('edit-plot-modal');
}

function openRejectModal(taskId) {
  currentTaskToReject = taskId;
  document.getElementById('reject-task-id').value = taskId;
  openModal('reject-modal');
}

function openReassignModal(taskId) {
  currentTaskToReassign = taskId;
  document.getElementById('reassign-task-id').value = taskId;
  openModal('reassign-modal');
}

function openEvidenceModal(taskId) {
  document.getElementById('evidence-task-id').value = taskId;
  openModal('evidence-modal');
}

async function verifyTask(taskId) {
  await fetch(`/api/tasks/${taskId}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ verificationNotes: 'Audited & Verified Excellent execution by Manager.' })
  });
  loadData();
}

async function submitTaskRejection(e) {
  e.preventDefault();
  const taskId = document.getElementById('reject-task-id').value;
  const reason = document.getElementById('reject-reason').value;

  await fetch(`/api/tasks/${taskId}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reworkReason: reason })
  });

  closeModal('reject-modal');
  loadData();
}

async function submitWorkerReassign(e) {
  e.preventDefault();
  const taskId = document.getElementById('reassign-task-id').value;
  const workerName = document.getElementById('reassign-worker-select').value;

  await fetch(`/api/tasks/${taskId}/assign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ workerName })
  });

  closeModal('reassign-modal');
  loadData();
}

async function actionAlert(alertId, actionType, notes) {
  await fetch(`/api/alerts/${alertId}/action`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ actionType, actionNotes: notes })
  });
  loadData();
}

async function submitProtocol(e) {
  e.preventDefault();
  const name = document.getElementById('prot-name').value;
  const category = document.getElementById('prot-cat').value;
  const growthStage = document.getElementById('prot-stage').value;
  const instructions = document.getElementById('prot-inst').value;
  const products = document.getElementById('prot-prod').value.split(',').map(s => s.trim());
  const applicationRate = document.getElementById('prot-rate').value;
  const waterVolume = document.getElementById('prot-vol').value;
  const applicationMethod = document.getElementById('prot-method').value;
  const ppeRequired = document.getElementById('prot-ppe').value.split(',').map(s => s.trim());

  await fetch('/api/protocols', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name, category, crop: 'Tomato', growthStage, applicableFarmId: 'f-1',
      instructions, products, applicationRate, waterVolume,
      applicationMethod, frequency: 'Weekly', ppeRequired
    })
  });

  closeModal('protocol-modal');
  loadData();
}

async function submitDispatchTask(e) {
  e.preventDefault();
  const protocolId = document.getElementById('task-prot-id').value;
  const protocolName = document.getElementById('task-prot-name').value;
  const plotId = document.getElementById('task-plot-select').value;
  const worker = document.getElementById('task-worker').value;
  const priority = document.getElementById('task-priority').value;
  const equipmentId = document.getElementById('task-equipment-select').value;

  const eqItem = equipment.find(eq => eq.id === equipmentId);
  const equipmentName = eqItem ? eqItem.name : null;

  const res = await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      protocolId, protocolName, farmId: 'f-1', farmName: "John's Tomato Farm",
      plotId, plotName: 'Plot B (Flowering)', category: 'Nutrition',
      instructions: 'Execute fertigation per protocol instructions.', assignedWorkerName: worker,
      priority, scheduledDate: '2026-10-03', scheduledTime: '08:00 AM',
      ppeRequired: ['Rubber Gloves', 'Boots'], requiresPhotoEvidence: true,
      equipmentId, equipmentName
    })
  });

  if (!res.ok) {
    const errData = await res.json();
    alert(`⚠️ MACHINERY CONFLICT ERROR:\n${errData.detail || 'Could not dispatch task'}`);
    return;
  }

  closeModal('task-modal');
  loadData();
}

async function submitInspection(e) {
  e.preventDefault();
  const plotId = document.getElementById('insp-plot-select').value;
  const health = parseInt(document.getElementById('insp-health').value);
  const irr = parseInt(document.getElementById('insp-irr').value);
  const obs = document.getElementById('insp-obs').value;

  await fetch('/api/inspections', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      farmId: 'f-1', farmName: "John's Tomato Farm", plotId, plotName: 'Plot B (Flowering)',
      inspectorName: 'Dr. Lobos (Head Agronomist)', cropHealthRating: health,
      irrigationRating: irr, nutritionRating: 4, pestRating: 4,
      sanitationRating: 4, harvestRating: 4, observations: obs
    })
  });

  closeModal('inspection-modal');
  loadData();
}

async function submitPlotMetrics(e) {
  e.preventDefault();
  const plotId = document.getElementById('edit-plot-id').value;
  const stage = document.getElementById('edit-plot-stage').value;
  const ph = parseFloat(document.getElementById('edit-plot-ph').value);
  const n = parseInt(document.getElementById('edit-plot-n').value);

  await fetch(`/api/plots/${plotId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ growthStage: stage, soilPh: ph, nitrogenLevelPpm: n })
  });

  closeModal('edit-plot-modal');
  loadData();
}

async function submitEvidence(e) {
  e.preventDefault();
  const taskId = document.getElementById('evidence-task-id').value;
  const quantity = document.getElementById('evidence-qty').value;
  const notes = document.getElementById('evidence-notes').value;
  const photoUrl = document.getElementById('evidence-img-preview').src;

  const payload = { photoUrl, quantityCompleted: quantity, notes, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };

  if (!navigator.onLine) {
    const queue = JSON.parse(localStorage.getItem('offline_task_queue') || '[]');
    queue.push({ taskId, payload });
    localStorage.setItem('offline_task_queue', JSON.stringify(queue));

    const targetTask = tasks.find(t => t.id === taskId);
    if (targetTask) {
      targetTask.status = 'Evidence Submitted';
      targetTask.evidence = payload;
    }
    closeModal('evidence-modal');
    alert('📶 OFFLINE WORK ORDER SAVED: Photo proof stored locally. Will auto-sync when network returns!');
    renderAll();
    return;
  }

  await fetch(`/api/tasks/${taskId}/evidence`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  closeModal('evidence-modal');
  loadData();
}

async function syncOfflineSubmissions() {
  const queue = JSON.parse(localStorage.getItem('offline_task_queue') || '[]');
  if (queue.length === 0) return;

  for (const item of queue) {
    try {
      await fetch(`/api/tasks/${item.taskId}/evidence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.payload)
      });
    } catch (err) {
      console.error('Failed syncing offline item:', err);
    }
  }

  localStorage.removeItem('offline_task_queue');
  alert('🟢 NETWORK RESTORED: All queued offline work orders have been synced to the server!');
  loadData();
}

async function submitProblem(e) {
  e.preventDefault();
  const plotName = document.getElementById('prob-plot').value;
  const description = document.getElementById('prob-desc').value;

  await fetch('/api/report-problem', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ farmId: 'f-1', plotName, description })
  });

  closeModal('problem-modal');
  alert(`Alert Dispatched for ${plotName}!`);
  loadData();
}
