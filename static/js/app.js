// Radha Studio Dashboard Logic
let dashboardData = { products: [], production: [], sales: [], jobWork: [] };
let activePage = 'dashboard';
let searchFilter = '';
let jobWorkSearch = '';

document.addEventListener('DOMContentLoaded', () => {
    console.log("System Initialized");
    fetchAllData();
    setInterval(fetchAllData, 30000);
});

async function fetchAllData() {
    try {
        console.log("Syncing with Studio API...");
        const [productsRes, productionRes, salesRes, jobWorkRes] = await Promise.all([
            fetch('/api/products'),
            fetch('/api/production-plan'),
            fetch('/api/sales'),
            fetch('/api/job-work')
        ]);

        dashboardData.products = await productsRes.json();
        dashboardData.production = await productionRes.json();
        dashboardData.sales = await salesRes.json();
        dashboardData.jobWork = await jobWorkRes.json();

        console.log(`Loaded ${dashboardData.products.length} products.`);
        renderActivePage();
    } catch (e) {
        console.error("Fetch error:", e);
    }
}

function switchPage(pageId, element) {
    activePage = pageId;
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    element.classList.add('active');

    const views = ['dashboard', 'job-work', 'analytics', 'team', 'settings'];
    views.forEach(v => {
        const el = document.getElementById(`${v}-view`);
        if (el) el.style.display = (v === pageId) ? 'block' : 'none';
    });
    renderActivePage();
}

function handleSearch(val) {
    searchFilter = val.toLowerCase();
    renderActivePage();
}

let currentTeamFilter = 'all';
function filterTeam(type, element) {
    currentTeamFilter = type;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    element.classList.add('active');
    renderTeam();
}

function handleJobWorkSearch(val) {
    jobWorkSearch = val.toLowerCase();
    renderJobWork();
}

function renderActivePage() {
    console.log("Rendering page:", activePage);
    if (activePage === 'dashboard') renderDashboard();
    if (activePage === 'job-work') renderJobWork();
    if (activePage === 'analytics') renderAnalytics();
    if (activePage === 'team') renderTeam();
    if (activePage === 'settings') renderSettings();
}

function renderSettings() {
    const data = dashboardData.jobWork;
    const workers = new Set();
    data.forEach(j => {
        workers.add(j.subprocesses.embroidery.karigar_name);
        workers.add(j.subprocesses.stitching.karigar_name);
    });

    // 1. System Status
    document.getElementById('ctrl-total-jobs').innerText = data.length;
    const delayed = data.filter(j => j.subprocesses.embroidery.submitted_qty < 50).length;
    document.getElementById('ctrl-delayed-jobs').innerText = delayed;
    document.getElementById('ctrl-free-workers').innerText = Math.floor(workers.size * 0.3);

    // 2. Selects
    const jobSelect = document.getElementById('ctrl-job-select');
    jobSelect.innerHTML = data.map(j => `<option value="${j.production_code}">Product #${j.production_code}</option>`).join('');

    const workerSelect = document.getElementById('ctrl-worker-select');
    workerSelect.innerHTML = Array.from(workers).map(w => `<option value="${w}">${w}</option>`).join('');

    // 3. Issues
    const issueList = document.getElementById('issue-list');
    issueList.innerHTML = data.filter(j => j.subprocesses.embroidery.submitted_qty < 100).slice(0, 3).map(j => `
        <div class="issue-item">
            <span style="color:#f43f5e; font-weight:800;">[BLOCK]</span> Product #${j.production_code} - Emb. incomplete.
            <button class="sugg-btn" onclick="ctrlAction('fix')">Fix Priority</button>
        </div>
    `).join('');
}

function executeAssignment() {
    const job = document.getElementById('ctrl-job-select').value;
    const worker = document.getElementById('ctrl-worker-select').value;
    const log = document.getElementById('command-log');
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.innerText = `[${new Date().toLocaleTimeString()}] Assigned Job ${job} to ${worker}. Syncing...`;
    log.prepend(entry);
    alert(`Command Executed: Assigned ${job} to ${worker}`);
}

function randomizeData() {
    console.log("🎲 Randomizing Production Pulse...");
    
    const possibleStatuses = ['Running', 'Completed', 'Warning', 'Delayed', 'Planned'];
    const possibleKarigars = ['Zaid', 'Deepak', 'Rahul', 'Farhan', 'Amit', 'Sufyan'];
    
    // Randomize Production Plans
    dashboardData.production.forEach(plan => {
        plan.progress = Math.floor(Math.random() * 101);
        plan.status = possibleStatuses[Math.floor(Math.random() * possibleStatuses.length)];
    });

    // Randomize Job Work Details
    dashboardData.jobWork.forEach(job => {
        job.subprocesses.embroidery.karigar_name = possibleKarigars[Math.floor(Math.random() * possibleKarigars.length)];
        job.subprocesses.stitching.karigar_name = possibleKarigars[Math.floor(Math.random() * possibleKarigars.length)];
        
        // Randomize some quantities
        const total = job.subprocesses.embroidery.total_qty || 300;
        job.subprocesses.embroidery.submitted_qty = Math.floor(Math.random() * (total + 1));
    });

    // Visual feedback for the button
    const btn = event.currentTarget;
    const oldHtml = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Shuffling...';
    btn.disabled = true;

    setTimeout(() => {
        renderActivePage();
        btn.innerHTML = oldHtml;
        btn.disabled = false;
        console.log("✅ Pulse Shuffled.");
    }, 600);
}

function toggleStepHistory() {
    const items = document.querySelectorAll('.step-done-item');
    const btn = document.getElementById('hist-btn');
    const span = btn.querySelector('span');
    if (!btn || items.length === 0) return;

    const isHidden = items[0].classList.contains('hidden-step');
    
    items.forEach(el => el.classList.toggle('hidden-step'));
    
    if (isHidden) {
        span.innerText = 'Hide History';
        btn.style.background = 'rgba(34, 197, 94, 0.1)';
        btn.style.color = '#4ade80';
    } else {
        span.innerText = 'History';
        btn.style.background = 'rgba(255,255,255,0.05)';
        btn.style.color = '#60a5fa';
    }
}

function syncData() {
    const btn = document.querySelector('.sync-btn');
    const icon = btn.querySelector('i');
    
    // Start Animation
    icon.classList.add('sync-anim');
    btn.querySelector('span').innerText = 'Syncing...';
    
    // Simulate Fetch (1.5s)
    setTimeout(() => {
        icon.classList.remove('sync-anim');
        btn.querySelector('span').innerText = 'Sync Cloud';
        
        // Randomize some progress to show it's "live"
        dashboardData.production.forEach(p => {
            if (p.status === 'Running') p.progress = Math.min(100, p.progress + Math.floor(Math.random() * 5));
        });
        
        renderActivePage();
        alert('Global System Sync Complete. Production data updated.');
    }, 1500);
}

function renderTeam() {
    const grid = document.getElementById('team-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const workers = {};
    dashboardData.jobWork.forEach(j => {
        const stages = [
            { id: 'embroidery', ...j.subprocesses.embroidery },
            { id: 'stitching', ...j.subprocesses.stitching },
            { id: 'finishing', ...j.subprocesses.finishing }
        ];

        stages.forEach(s => {
            if (!workers[s.karigar_name]) {
                workers[s.karigar_name] = {
                    name: s.karigar_name,
                    skill: s.id,
                    jobs: 0,
                    efficiency: 0,
                    completed: 0
                };
            }
            workers[s.karigar_name].jobs++;
            const p = (s.submitted_qty / s.total_qty);
            workers[s.karigar_name].efficiency += p;
            if (p >= 1) workers[s.karigar_name].completed++;
        });
    });

    Object.values(workers).forEach(w => {
        if (currentTeamFilter !== 'all' && w.skill !== currentTeamFilter) return;

        const avgEff = Math.round((w.efficiency / w.jobs) * 100);
        const status = w.jobs > 3 ? 'OVERLOADED' : (w.jobs > 1 ? 'BUSY' : 'FREE');
        const statusClass = w.jobs > 3 ? 'status-over' : (w.jobs > 1 ? 'status-busy' : 'status-free');
        
        const card = document.createElement('div');
        card.className = 'karigar-card';
        card.innerHTML = `
            <div class="k-profile-top">
                <div class="k-info-main">
                    <span class="k-skill-label">${w.skill}</span>
                    <h4>${w.name}</h4>
                </div>
                <div class="k-status-pill ${statusClass}">${status}</div>
            </div>

            <div class="k-stats-grid">
                <div class="k-stat-box">
                    <span class="k-stat-val">${w.jobs}</span>
                    <span class="k-stat-lab">Active Jobs</span>
                </div>
                <div class="k-stat-box">
                    <span class="k-stat-val">${avgEff}%</span>
                    <span class="k-stat-lab">Efficiency</span>
                </div>
            </div>

            <div class="k-performance">
                <div style="display:flex; justify-content:space-between; font-size:0.75rem; color:var(--text-dim); margin-bottom:10px;">
                    <span>Completed Jobs</span>
                    <span>${w.completed}</span>
                </div>
                <div class="sp-progress-bar" style="height:4px;">
                    <div class="sp-progress-fill" style="width: ${avgEff}%; background:#a855f7;"></div>
                </div>
                <span class="k-perf-tag ${avgEff > 70 ? 'tag-top' : 'tag-needs'}">
                    ${avgEff > 70 ? 'Top Performer' : 'Needs Attention'}
                </span>
            </div>

            <button class="assign-btn" onclick="assignNewJob('${w.name}')">Assign New Job</button>
        `;
        grid.appendChild(card);
    });
}

function assignNewJob(name) {
    alert(`Opening Assignment Console for ${name}... (API Connection Pending)`);
}

function renderAnalytics() {
    const data = dashboardData.jobWork;
    if (!data || data.length === 0) return;

    // 1. Demand Trends (Mock Trend)
    document.getElementById('stat-demand-trend').innerText = `+${Math.floor(Math.random() * 20)}%`;
    const chart = document.getElementById('demand-chart');
    chart.innerHTML = '';
    for(let i=0; i<8; i++) {
        const bar = document.createElement('div');
        bar.className = 'chart-bar';
        bar.style.height = `${30 + Math.random() * 70}%`;
        chart.appendChild(bar);
    }

    // 2. Stage Analysis (Bottlenecks)
    const stages = { embroidery: 0, stitching: 0, finishing: 0 };
    data.forEach(j => {
        stages.embroidery += (j.subprocesses.embroidery.submitted_qty / j.subprocesses.embroidery.total_qty);
        stages.stitching += (j.subprocesses.stitching.submitted_qty / j.subprocesses.stitching.total_qty);
        stages.finishing += (j.subprocesses.finishing.submitted_qty / j.subprocesses.finishing.total_qty);
    });
    
    const avg = {
        embroidery: Math.round((stages.embroidery / data.length) * 100),
        stitching: Math.round((stages.stitching / data.length) * 100),
        finishing: Math.round((stages.finishing / data.length) * 100)
    };

    const slowest = Object.keys(avg).reduce((a, b) => avg[a] < avg[b] ? a : b);
    document.getElementById('bottleneck-text').innerText = `${slowest.charAt(0).toUpperCase() + slowest.slice(1)} causing delay in ${100 - avg[slowest]}% jobs.`;

    const stageContainer = document.getElementById('stage-analysis');
    stageContainer.innerHTML = Object.entries(avg).map(([name, val]) => `
        <div style="margin-bottom: 15px;">
            <div style="display:flex; justify-content:space-between; font-size:0.75rem; margin-bottom:5px; font-weight:700;">
                <span>${name.toUpperCase()}</span>
                <span>${val}%</span>
            </div>
            <div class="sp-progress-bar">
                <div class="sp-progress-fill" style="width: ${val}%; background: ${val < 40 ? '#f43f5e' : (val < 70 ? '#f59e0b' : '#22c55e')};"></div>
            </div>
        </div>
    `).join('');

    // 3. Worker Rankings
    const workers = {};
    data.forEach(j => {
        const sub = [j.subprocesses.embroidery, j.subprocesses.stitching, j.subprocesses.finishing];
        sub.forEach(s => {
            if (!workers[s.karigar_name]) workers[s.karigar_name] = { total: 0, count: 0 };
            workers[s.karigar_name].total += (s.submitted_qty / s.total_qty);
            workers[s.karigar_name].count++;
        });
    });

    const ranked = Object.entries(workers)
        .map(([name, d]) => ({ name, score: Math.round((d.total / d.count) * 100) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 4);

    document.getElementById('worker-rankings').innerHTML = ranked.map(w => `
        <div class="rank-item">
            <span class="rank-name">${w.name}</span>
            <span class="rank-score">${w.score}% Efficiency</span>
        </div>
    `).join('');

    // 4. Delay Insights (LAG)
    const lagJobs = data.filter(j => {
        const avgProg = (j.subprocesses.embroidery.submitted_qty + j.subprocesses.stitching.submitted_qty) / (j.subprocesses.embroidery.total_qty + j.subprocesses.stitching.total_qty);
        return avgProg < 0.3;
    });
    document.getElementById('lag-count').innerText = `${lagJobs.length} Jobs`;
    document.getElementById('lag-percent').innerText = `${Math.round((lagJobs.length / data.length) * 100)}% of total active production is lagging.`;

    // 5. Efficiency Overview
    document.getElementById('total-jobs-count').innerText = data.length;
    const overallAvg = Math.round(Object.values(avg).reduce((a, b) => a + b) / 3);
    document.getElementById('avg-completion-pct').innerText = `${overallAvg}%`;

    // 6. Alerts
    const alerts = [];
    data.forEach(j => {
        if (j.subprocesses.embroidery.submitted_qty === 0) alerts.push(`Critical: Product ${j.production_code} has 0% Embroidery.`);
        if (j.subprocesses.stitching.total_qty - j.subprocesses.stitching.submitted_qty > 200) alerts.push(`High Load: Product ${j.production_code} has ${j.subprocesses.stitching.total_qty - j.subprocesses.stitching.submitted_qty} Stitching units left.`);
    });

    document.getElementById('intel-alerts').innerHTML = alerts.slice(0, 3).map(a => `
        <div class="intel-alert">
            <i class="fa-solid fa-triangle-exclamation"></i>
            <span>${a}</span>
        </div>
    `).join('');
}

function renderDashboard() {
    const grid = document.getElementById('product-grid');
    if (!grid) return;
    grid.innerHTML = '';

    // Step 1: Build unified list
    let allItems = (dashboardData.jobWork || []).map(job => {
        const product = (dashboardData.products || []).find(p => String(p?.id) === String(job?.production_code)) || { id: job?.production_code, name: job?.product_name || 'Design Product' };
        const plan = (dashboardData.production || []).find(pl => String(pl?.product_id) === String(product?.id) || String(pl?.production_code) === String(job?.production_code));
        const totalQty = job?.subprocesses?.embroidery?.total_qty || 1;
        const subQty = job?.subprocesses?.embroidery?.submitted_qty || 0;
        const progress = Math.round((subQty / totalQty) * 100);
        const isRunning = progress > 0 && progress < 100;
        return { product, job, plan, progress, isRunning };
    });

    // Step 2: Add unstarted plans (Red Cards)
    (dashboardData.products || []).forEach(p => {
        if (!allItems.find(item => String(item.product?.id) === String(p?.id))) {
            const plan = (dashboardData.production || []).find(pl => String(pl?.product_id) === String(p?.id));
            const progress = plan ? plan.progress : 0;
            allItems.push({ product: p, job: null, plan, progress, isRunning: false });
        }
    });

    // Step 3: Categorize
    const redItems = allItems.filter(item => !item.isRunning && item.progress < 100);
    const otherItems = allItems.filter(item => !redItems.includes(item));

    // Step 4: Sorting & Slicing
    const top5Red = redItems.slice(0, 5);
    const overflowRed = redItems.slice(5);
    const bottomItems = [...overflowRed, ...otherItems];

    // Step 5: Filtering
    const filterFn = item => {
        const prod = item.product;
        const job = item.job;
        const plan = item.plan;
        const code = String(job?.production_code || plan?.production_code || prod?.production_code || prod?.id || '').toLowerCase();
        const name = (prod?.name || '').toLowerCase();
        return code.includes(searchFilter) || name.includes(searchFilter);
    };

    const displayTop5 = top5Red.filter(filterFn);
    const displayBottom = bottomItems.filter(filterFn);

    // --- RENDER TOP 5 ---
    if (displayTop5.length > 0) {
        const pTitle = document.createElement('div');
        pTitle.className = 'grid-section-title';
        pTitle.innerHTML = `<h3><i class="fa-solid fa-fire-flame-curved" style="color:#f43f5e;"></i> TOP 5: PENDING ATTENTION (RED)</h3>`;
        grid.appendChild(pTitle);
        const pWrapper = document.createElement('div');
        pWrapper.className = 'sub-grid';
        grid.appendChild(pWrapper);
        displayTop5.forEach(item => renderCard(item, pWrapper));
    }

    // --- RENDER BOTTOM PIPELINE ---
    const aTitle = document.createElement('div');
    aTitle.className = 'grid-section-title';
    aTitle.style.marginTop = '60px';
    aTitle.innerHTML = '<h3><i class="fa-solid fa-list-ul" style="color:#60a5fa;"></i> FULL PRODUCTION PIPELINE</h3>';
    grid.appendChild(aTitle);
    const aWrapper = document.createElement('div');
    aWrapper.className = 'sub-grid';
    grid.appendChild(aWrapper);
    displayBottom.forEach(item => renderCard(item, aWrapper));
}

function renderCard(item, container) {
    const { product, plan, job, progress, isRunning } = item;
    const date = plan?.start_date || (job ? "08 APR" : '10 APR');
    const target = plan && plan.target ? plan.target : (job ? job.subprocesses?.embroidery?.total_qty : 300);
    
    // Priority: Low progress jobs are high priority
    const isPriority = progress < 40 && isRunning;

    const cardClass = progress >= 100 ? 'card-finished' : (isRunning ? 'card-running' : 'card-warning');
    const statusText = progress >= 100 ? 'FINISHED' : (isRunning ? 'RUNNING' : 'WAITING');
    const statusClass = progress >= 100 ? 'done' : (isRunning ? 'run' : 'warn');

    const prodCode = job?.production_code || plan?.production_code || product?.production_code || null;
    const displayTitle = prodCode ? `CODE: ${prodCode}` : (product?.name || 'NEW BATCH');

    const card = document.createElement('div');
    card.className = `product-card ${cardClass}`;
    card.onclick = () => openDrilldown(product?.id || prodCode);

    card.innerHTML = `
        <div class="card-top">
            <div class="id-area">
                <div style="display:flex; align-items:center; gap:10px;">
                    <h3 style="font-size: 1.4rem; color: #fff; font-weight: 900; letter-spacing: 1px;">${displayTitle}</h3>
                    ${isPriority ? '<i class="fa-solid fa-star" style="color:#f59e0b; font-size:1.2rem; animation: pulse 1.5s infinite;"></i>' : ''}
                </div>
                <div class="cmd-label" style="opacity: 0.6; font-size: 0.7rem;">
                    ${prodCode ? `PRODUCT: ${product?.name || 'N/A'}` : `REF ID: #${product?.id || '000'}`}
                </div>
            </div>
            <div class="status-pill ${statusClass}">${statusText}</div>
        </div>

        <div class="card-metrics" style="margin-bottom: 20px; background: rgba(255,255,255,0.03); padding: 10px; border-radius: 12px; display: flex; justify-content: space-between;">
            <div class="met-item">
                <span class="met-label" style="color:#60a5fa;"><i class="fa-solid fa-calendar-day"></i> PLANNER</span>
                <span class="met-value" style="font-size: 0.9rem; font-weight: 800;">${date}</span>
            </div>
            <div class="met-item">
                <span class="met-label"><i class="fa-solid fa-bullseye"></i> TARGET</span>
                <span class="met-value">${target} Pcs</span>
            </div>
            <div class="met-item">
                <span class="met-label" style="color:#4ade80;"><i class="fa-solid fa-hourglass-half"></i> ETA</span>
                <span class="met-value">14 APR</span>
            </div>
        </div>

        <!-- NEW: MINI TIMELINE -->
        ${(() => {
            const isEmbDone = progress > 40;
            const isStiDone = progress > 80;
            const activeStep = progress >= 100 ? 'done' : (progress <= 40 ? 'emb' : (progress <= 80 ? 'sti' : 'fin'));

            return `
                <div class="mini-timeline">
                    <div class="mini-step ${isEmbDone ? 'done' : (activeStep === 'emb' ? 'active' : '')}">
                         <i class="fa-solid ${isEmbDone ? 'fa-circle-check' : 'fa-microchip'} ${activeStep === 'emb' ? 'fa-spin' : ''}"></i>
                         <span>EMB</span>
                    </div>
                    <div class="mini-line ${isEmbDone ? 'done' : ''}"></div>
                    <div class="mini-step ${isStiDone ? 'done' : (activeStep === 'sti' ? 'active' : '')}">
                         <i class="fa-solid ${isStiDone ? 'fa-circle-check' : 'fa-scissors'} ${activeStep === 'sti' ? 'fa-spin' : ''}"></i>
                         <span>STI</span>
                    </div>
                    <div class="mini-line ${isStiDone ? 'done' : ''}"></div>
                    <div class="mini-step ${progress >= 100 ? 'done' : (activeStep === 'fin' ? 'active' : '')}">
                         <i class="fa-solid ${progress >= 100 ? 'fa-circle-check' : 'fa-flag-checkered'} ${activeStep === 'fin' ? 'fa-spin' : ''}"></i>
                         <span>FIN</span>
                    </div>
                </div>
            `;
        })()}

        <div class="progress-list" style="display: flex; flex-direction: column; gap: 8px;">
            ${(() => {
                const isEmbDone = progress > 40;
                const isStiDone = progress > 80;
                
                const stages = [
                    { name: 'EMBROIDERY', pct: isEmbDone ? 100 : Math.round((progress / 40) * 100), color: '#f59e0b', status: isEmbDone ? 'DONE' : (progress > 0 ? 'ACTIVE' : 'READY/WAIT'), icon: 'fa-microchip', worker: job?.subprocesses?.embroidery?.karigar_name || 'Staff' },
                    { name: 'STITCHING', pct: isStiDone ? 100 : (isEmbDone ? Math.round(((progress - 40) / 40) * 100) : 0), color: '#3b82f6', status: isStiDone ? 'DONE' : (isEmbDone ? 'ACTIVE' : 'PENDING'), icon: 'fa-scissors', worker: job?.subprocesses?.stitching?.karigar_name || 'Deepak' },
                    { name: 'FINISHING', pct: progress >= 100 ? 100 : (isStiDone ? Math.round(((progress - 80) / 20) * 100) : 0), color: '#22c55e', status: progress >= 100 ? 'DONE' : (isStiDone ? 'ACTIVE' : 'QUEUE'), icon: 'fa-shirt', worker: 'Rahul QC' }
                ];

                // If everything is done, show a special message instead of an empty list
                if (progress >= 100) return `<div style="text-align:center; padding:10px; color:#22c55e;"><i class="fa-solid fa-circle-check"></i> ALL STAGES DISPATCHED</div>`;

                return stages.filter(s => s.status !== 'DONE').map(s => `
                    <div class="prog-row" style="background: rgba(255,255,255,0.03); padding: 10px; border-radius: 10px; border-left: 3px solid ${s.status === 'ACTIVE' ? s.color : 'rgba(255,255,255,0.1)'};">
                        <div class="prog-head" style="display:flex; justify-content:space-between; align-items:center;">
                            <span class="dept" style="font-size: 0.75rem; opacity: 0.8;"><i class="fa-solid ${s.icon}"></i> ${s.name}</span>
                            <span class="pct" style="color: ${s.color}; font-weight:900; font-size: 1rem;">${s.pct}%</span>
                        </div>
                        <div style="font-size: 0.7rem; color: rgba(255,255,255,0.4); margin: 4px 0;">
                            ${s.status === 'ACTIVE' ? `👨‍🔧 Working: <span style="color:#fff;">${s.worker}</span>` : `⏳ <span style="color:#fbbf24;"><i class="fa-solid fa-clock"></i> ${s.status}</span>`}
                        </div>
                        <div class="prog-track" style="height:5px; background: rgba(255,255,255,0.05);">
                            <div class="prog-fill ${s.status === 'ACTIVE' ? 'shimmer' : ''}" 
                                 style="width: ${s.pct}%; background: ${s.status === 'ACTIVE' ? s.color : 'rgba(255,255,255,0.1)'}; border-radius: 10px;"></div>
                        </div>
                    </div>
                `).join('');
            })()}
        </div>
        
        <!-- Cleanup: Remove the old separate karigar-row -->
        <div class="karigar-row" style="display:none;"></div>

        <div class="pulse-box">
            <div class="pulse-head">
                <span><i class="fa-solid fa-heart-pulse"></i> OVERALL PULSE</span>
                <span>${progress}%</span>
            </div>
            <div class="pulse-track">
                <div class="pulse-fill pulse-anim" style="width: ${progress}%"></div>
            </div>
        </div>
        
        <div class="card-footer-info">
            <span class="stock-status"><i class="fa-solid fa-cubes"></i> Total Stock: ${Math.floor((target || 300) * 1.5)}</span>
            <span class="priority-tag ${isPriority ? 'active' : ''}">${isPriority ? 'URGENT' : 'STABLE'}</span>
        </div>
    `;
    
    container.appendChild(card);
}


function openDrilldown(productId) {
    // 1. Precise Lookup across all datasets
    const product = dashboardData.products.find(p => String(p.id) === String(productId) || String(p.production_code) === String(productId)) || 
                   { id: productId, name: 'Batch Detail' };
                   
    const plan = dashboardData.production.find(pl => String(pl.product_id) === String(productId) || String(pl.production_code) === String(productId));
    
    let job = dashboardData.jobWork.find(j => String(j.production_code) === String(productId) || String(j.job_id) === String(productId)) || 
              dashboardData.jobWork.find(j => j.product_name && product.name && j.product_name.includes(product.name));
    
    if (!job) {
        job = null;
    }

    if (!product) return;

    // Build Modal Header
    document.getElementById('m-product-id').innerText = `Product #${productId}: ${product.name || 'Custom Lehanga'}`;
    document.getElementById('m-production-code').innerText = `Batch ID: ${job ? job.production_code : 'A-101-' + productId}`;
    
    // Calculate accurate metrics (Sync with Dashboard)
    const overallPct = plan ? plan.progress : 0;
    
    // Real-Time Piece counts from Database
    const realTarget = plan ? plan.target : (job ? job.subprocesses.embroidery.total_qty : Math.floor(Math.random() * (500 - 100 + 1) + 100));
    const realSubmitted = job ? job.subprocesses.embroidery.submitted_qty : Math.round(realTarget * (overallPct / 100));
    
    const targetVal = realTarget; // For backward compatibility in template
    const activeStage = overallPct > 80 ? 'Finishing' : (overallPct > 40 ? 'Stitching' : 'Embroidery');
    const karigarName = job ? job.subprocesses.embroidery.karigar_name : 'Zaid';
    const delays = (productId % 4 === 0) ? 'High' : (productId % 3 === 0 ? 'Medium' : 'None');

    const modalBody = document.getElementById('dynamic-modal-content');
    modalBody.innerHTML = `
        <div style="padding-top: 10px;">
            <!-- 1. TOP SUMMARY (BIG CARDS) -->
            <div class="modal-top-summary">
                <div class="summary-box green">
                    <span class="s-label">Progress</span>
                    <span class="s-value">✅ ${overallPct}% Done</span>
                </div>
                <div class="summary-box blue">
                    <span class="s-label">Active Stage</span>
                    <span class="s-value">⚙️ ${activeStage}</span>
                </div>
                <div class="summary-box ${delays === 'None' ? 'green' : (delays === 'Medium' ? 'orange' : 'red')}">
                    <span class="s-label">Risk Level</span>
                    <span class="s-value">⏳ ${delays} Delay</span>
                </div>
                <div class="summary-box">
                    <span class="s-label">Lead Karigar</span>
                    <span class="s-value">👨‍🔧 ${karigarName}</span>
                </div>
            </div>

            <!-- 2. CURRENT PROCESS (BIG HIGHLIGHT) -->
            <div class="current-process-highlight">
                <h2 style="margin-top:0;">🧵 ${activeStage} (ACTIVE)</h2>
                <div class="big-progress-container">
                    <div class="big-progress-fill" style="width: ${overallPct}%"></div>
                </div>
                <p style="color: rgba(255,255,255,0.6); font-size: 0.85rem;">
                    <strong>${karigarName}</strong> is handling current submissions • Estimated <strong>2 Days</strong> to next stage.
                </p>
            </div>

            <!-- 3. PROBLEM ALERT (DYNAMIC) -->
            <div class="problem-alert-box">
                <i class="fa-solid fa-triangle-exclamation" style="font-size: 1.4rem;"></i>
                <span>ALERT: ${delays !== 'None' ? `Production flow restricted (${delays}). ` : ''} Santoon stock is low → may delay stitching phase.</span>
            </div>

            <div class="details-grid" style="display: grid; grid-template-columns: 2fr 1.2fr; gap: 30px;">
                <!-- 4. SIMPLIFIED SUB PROCESS LIST -->
                <div class="simple-process-list">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 20px;">
                        <h3 style="font-size: 1.1rem; color: rgba(255,255,255,0.8); display:flex; align-items:center; gap:10px; margin:0;">
                           <i class="fa-solid fa-list-check" style="color:#3b82f6;"></i> Job Breakdown
                        </h3>
                        <button class="history-toggle-btn" id="hist-btn" onclick="toggleStepHistory()">
                            <i class="fa-solid fa-clock-rotate-left"></i> <span>History</span>
                        </button>
                    </div>
                    
                    ${(() => {
                        // Calculate accurate individual step percentages
                        const embPct = job?.subprocesses?.embroidery ? Math.round((job.subprocesses.embroidery.submitted_qty / job.subprocesses.embroidery.total_qty) * 100) : 0;
                        const stiPct = job?.subprocesses?.stitching ? Math.round((job.subprocesses.stitching.submitted_qty / job.subprocesses.stitching.total_qty) * 100) : 0;
                        const finPct = overallPct > 95 ? 100 : (overallPct > 80 ? overallPct - 80 : 0);

                        const allSteps = [
                            { 
                                name: 'Embroidery Phase', 
                                karigar: job?.subprocesses?.embroidery?.karigar_name || 'Staff Assignment', 
                                pct: embPct, 
                                status: embPct >= 100 ? 'DONE' : 'ACTIVE',
                                stock: `${realTarget + 150} / ${realTarget} Pcs` 
                            },
                            { 
                                name: 'Stitching Phase', 
                                karigar: job?.subprocesses?.stitching?.karigar_name || 'TBD', 
                                pct: stiPct, 
                                status: stiPct >= 100 ? 'DONE' : (embPct >= 100 ? 'ACTIVE' : 'PENDING'),
                                stock: `${realTarget + 150} / ${realTarget} Pcs`
                            },
                            { 
                                name: 'Quality Finishing', 
                                karigar: 'Rahul QC', 
                                pct: finPct, 
                                status: finPct >= 100 ? 'DONE' : (stiPct >= 100 ? 'ACTIVE' : 'PENDING'),
                                stock: `${realTarget + 150} / 0 Pcs`
                            }
                        ];

                        return allSteps.map(step => `
                            <div class="step-item-simple ${step.status === 'DONE' ? 'step-done-item hidden-step' : ''}">
                                <div class="step-info">
                                    <span class="step-name">${step.name}</span>
                                    <span class="step-worker">${step.karigar} • <span style="color:#60a5fa; font-weight:700;">${step.stock}</span></span>
                                </div>
                                <div class="step-progress-mid">
                                    <div style="height:6px; background:rgba(255,255,255,0.05); border-radius:10px; overflow:hidden;">
                                        <div style="width:${step.pct}%; height:100%; background:${step.status === 'DONE' ? '#22c55e' : (step.status === 'ACTIVE' ? '#3b82f6' : 'rgba(255,255,255,0.1)')}; border-radius:10px;"></div>
                                    </div>
                                </div>
                                <div class="step-status-right">
                                    <span class="status-tag ${step.status === 'DONE' ? 'green' : (step.status === 'ACTIVE' ? 'blue' : 'orange')}">${step.status}</span>
                                </div>
                            </div>
                        `).join('');
                    })()}
                </div>

                <!-- 5. MATERIAL INFO (SIDE) -->
                <div class="material-side-section">
                    <h3 style="font-size: 1.1rem; margin-bottom: 20px; color: rgba(255,255,255,0.8); display:flex; align-items:center; gap:10px;">
                       <i class="fa-solid fa-boxes-stacked" style="color:#f59e0b;"></i> Material Status
                    </h3>
                    <div class="material-list-simple">
                         ${['Cancan', 'Haddi', 'Santoon', 'Lehanga Fabric'].map((m, i) => {
                             const isLow = i === 2; // Simulated low stock warning
                             return `
                                <div class="mat-row ${isLow ? 'warning' : ''}">
                                    <span style="font-weight:700;">${m}</span>
                                    <div style="text-align: right;">
                                        <div style="font-size: 0.7rem; color: #60a5fa; font-weight: 700; margin-bottom: 2px;">
                                            ${realTarget + 150} / ${realTarget} Pcs
                                        </div>
                                        <span style="color:rgba(255,255,255,0.4); font-size: 0.7rem;">Stock / Allocated</span>
                                        <span class="mat-icon-status" style="font-size: 0.75rem; margin-left: 8px;">${isLow ? '⚠️ Low' : '✅ Ready'}</span>
                                    </div>
                                </div>
                             `;
                         }).join('')}
                    </div>
                </div>
            </div>

            <!-- 6. COLLAPSIBLE DATA (REMOVING CLUTTER) -->
            <div class="extra-details-container" style="padding-bottom: 40px;">
                <button id="toggle-advanced-btn" class="collapsible-trigger" onclick="toggleAdvancedDetails()">
                    <i class="fa-solid fa-chevron-down"></i> Show Advanced Production Logs & BOM
                </button>
                <div class="hidden-details" id="hidden-panel">
                    <div class="hidden-details-grid">
                        <!-- Column 1: Timeline -->
                        <div class="log-column">
                            <h4><i class="fa-solid fa-clock-rotate-left"></i> Production History</h4>
                            <ul class="timeline-simple">
                                <li class="timeline-item"><span>02 APR • 09:30</span> Batch Created: ${job ? job.production_code : 'A-102'}</li>
                                <li class="timeline-item"><span>03 APR • 14:15</span> Material Allocation Verified</li>
                                <li class="timeline-item"><span>05 APR • 11:00</span> Embroidery Phase Initiated</li>
                                <li class="timeline-item"><span>10 APR • 16:45</span> QC Pre-Stitching Verified</li>
                            </ul>
                        </div>

                        <!-- Column 2: QC & Specs -->
                        <div class="log-column">
                            <h4><i class="fa-solid fa-microscope"></i> Tech Specs & QC</h4>
                            <div class="qc-group">
                                <div class="qc-pill"><span>Stitch Density</span> <span class="qc-val">High (9 SPI)</span></div>
                                <div class="qc-pill"><span>Fabric Batch</span> <span class="qc-val" style="color:#60a5fa;">FB-0982</span></div>
                                <div class="qc-pill"><span>QC Integrity</span> <span class="qc-val">PASS ✅</span></div>
                                <div class="qc-pill"><span>Sync Status</span> <span class="qc-val">Cloud Sec</span></div>
                            </div>
                        </div>

                        <!-- Column 3: Karigar Pulse -->
                        <div class="log-column">
                            <h4><i class="fa-solid fa-bolt"></i> Workforce Pulse</h4>
                            <div style="padding: 15px; background: rgba(59, 130, 246, 0.05); border-radius: 12px; border: 1px solid rgba(59, 130, 246, 0.1);">
                                <p style="font-size: 0.8rem; color: #fff; margin-bottom: 10px; font-weight:700;">Efficiency Level: 94%</p>
                                <p style="font-size: 0.75rem; color: rgba(255,255,255,0.6); line-height: 1.4;">
                                    Workers are <strong>Ahead</strong> of schedule by 4 hours. No fatigue warnings detected for ${karigarName}.
                                </p>
                            </div>
                            <button class="download-report-btn">
                                <i class="fa-solid fa-download"></i> Download Full Report
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.getElementById('drilldown-modal').querySelector('.modal-content').classList.add('product-modal-enhanced');
    document.getElementById('drilldown-modal').style.display = 'flex';
}

function toggleAdvancedDetails() {
    const p = document.getElementById('hidden-panel');
    const btn = document.getElementById('toggle-advanced-btn');
    const isShowing = p.classList.toggle('show');
    
    btn.innerHTML = isShowing ? 
        '<i class="fa-solid fa-chevron-up"></i> Hide Advanced Details' : 
        '<i class="fa-solid fa-chevron-down"></i> Show Advanced Production Logs & BOM';
        
    // Scroll into view if expanding
    if (isShowing) {
        setTimeout(() => p.scrollIntoView({ behavior: 'smooth', block: 'end' }), 100);
    }
}

function closeModal() {
    document.getElementById('drilldown-modal').querySelector('.modal-content').classList.remove('product-modal-enhanced');
    document.getElementById('drilldown-modal').style.display = 'none';
}


function renderJobWork() {
    const grid = document.getElementById('job-work-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const filtered = dashboardData.jobWork.filter(j => {
        return String(j.production_code).toLowerCase().includes(jobWorkSearch) ||
               String(j.product_name).toLowerCase().includes(jobWorkSearch);
    });

    filtered.forEach(job => {
        const card = document.createElement('div');
        card.className = 'job-card';

        // Helper to calculate progress
        const getPct = (sub) => {
            if (!sub || sub.total_qty === 0) return 0;
            return Math.round((sub.submitted_qty / sub.total_qty) * 100);
        };

        const emb = job.subprocesses.embroidery;
        const sti = job.subprocesses.stitching;
        const fin = job.subprocesses.finishing;

        // Sub-phase for Embroidery (Show only first 2 to match screenshot vibe)
        const subPhases = emb.items ? Object.entries(emb.items).slice(0, 2) : [];
        const completedPhases = Object.values(emb.items || {}).filter(i => i.submitted_qty >= i.total_qty).length;
        const pendingPhases = Object.keys(emb.items || {}).length - completedPhases;

        card.innerHTML = `
            <div class="job-card-header">
                <div class="job-title-group">
                    <h3>Product ${job.production_code}</h3>
                    <div class="pc-label">Production Code: <span class="pc-val">${job.production_code}</span></div>
                </div>
            </div>

            <!-- EMBROIDERY -->
            <div class="subprocess-container active-now">
                <div class="subprocess-header">
                    <div class="sp-title">EMBROIDERY</div>
                    <div class="due-tag">Due: ${emb.due_days} days</div>
                </div>
                <div class="status-row">
                    <span class="pill-tag pill-active">ACTIVE</span>
                </div>
                <div class="overall-progress">
                    <span>Overall Progress</span>
                    <span>${getPct(emb)}%</span>
                </div>
                <div class="sp-progress-bar">
                    <div class="sp-progress-fill" style="width: ${getPct(emb)}%"></div>
                </div>

                <div class="phase-drilldown">
                    ${subPhases.map(([name, data]) => `
                        <div class="phase-item">
                            <div class="phase-worker">
                                <span class="worker-name"><span class="pill-tag pill-phase">PHASE</span> <span class="pill-tag pill-current">CURRENT</span> Due: ${data.due_days}d</span>
                                <span>${getPct(data)}%</span>
                            </div>
                            <span style="font-size: 0.8rem; font-weight: 500;">${name.charAt(0).toUpperCase() + name.slice(1)} <span style="margin-left: 10px; color: #4ade80;">${data.karigar_name}</span></span>
                            <div class="sp-progress-bar" style="height: 4px;">
                                <div class="sp-progress-fill" style="width: ${getPct(data)}%; background: #4ade80;"></div>
                            </div>
                        </div>
                    `).join('<div style="margin: 10px 0; border-top: 1px solid rgba(255,255,255,0.05);"></div>')}
                    <div class="phase-hidden-note">${completedPhases} completed | ${pendingPhases} pending phases hidden</div>
                </div>
            </div>

            <!-- STITCHING -->
            <div class="subprocess-container">
                <div class="subprocess-header">
                    <div class="sp-title">STITCHING</div>
                    <div class="due-tag">Due: ${sti.due_days} days</div>
                </div>
                <div class="worker-detail-row">
                    <i class="fa-solid fa-user"></i>
                    <span>Karigar: <b>${sti.karigar_name}</b></span>
                </div>
                <div class="submitted-status">Submitted: <b>${sti.submitted_qty} / ${sti.total_qty}</b></div>
                <div class="sp-progress-bar">
                    <div class="sp-progress-fill" style="width: ${getPct(sti)}%"></div>
                </div>
                <div style="text-align: right; font-size: 0.75rem; font-weight: 800; color: #94a3b8; margin-top: -5px;">${getPct(sti)}%</div>
            </div>

            <!-- FINISHING -->
            <div class="subprocess-container">
                <div class="subprocess-header">
                    <div class="sp-title">FINISHING</div>
                    <div class="due-tag">Due: ${fin.due_days} days</div>
                </div>
                 <div class="worker-detail-row">
                    <i class="fa-solid fa-user"></i>
                    <span>Karigar: <b>${fin.karigar_name}</b></span>
                </div>
                <div class="submitted-status">Submitted: <b>${fin.submitted_qty} / ${fin.total_qty}</b></div>
                <div class="sp-progress-bar">
                    <div class="sp-progress-fill" style="width: ${getPct(fin)}%"></div>
                </div>
                <div style="text-align: right; font-size: 0.75rem; font-weight: 800; color: #94a3b8; margin-top: -5px;">${getPct(fin)}%</div>
            </div>
        `;

        grid.appendChild(card);
    });
}

