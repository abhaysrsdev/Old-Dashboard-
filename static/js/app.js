// Product Card Dashboard Logic - STRICT MAP TO EXCEL
let dashboardData = { products: [], production: [], sales: [], jobWork: [] };

document.addEventListener('DOMContentLoaded', () => {
    initBackground();
    fetchAllData();
    setInterval(fetchAllData, 30000); // Refresh every 30s

    // Dashboard Search listener
    const dashSearch = document.getElementById('dashboard-search');
    if (dashSearch) {
        dashSearch.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const filteredProducts = dashboardData.products.filter(p =>
                String(p.id).toLowerCase().includes(term) ||
                p.name.toLowerCase().includes(term) ||
                (p.sku && String(p.sku).toLowerCase().includes(term))
            );
            renderProductCards(filteredProducts, dashboardData.production, dashboardData.sales);
        });
    }

    // Job Work Search listener
    const jobSearch = document.getElementById('job-work-search');
    if (jobSearch) {
        jobSearch.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const filteredJobWork = dashboardData.jobWork.filter(item =>
                String(item.production_code).toLowerCase().includes(term) ||
                String(item.product_name).toLowerCase().includes(term)
            );
            renderJobWorkCards(filteredJobWork);
        });
    }
});

async function fetchAllData() {
    try {
        console.log("Fetching all data...");

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

        // Initial render
        renderProductCards(dashboardData.products, dashboardData.production, dashboardData.sales);
        renderJobWorkCards(dashboardData.jobWork);

    } catch (e) {
        console.error("Error fetching dashboard data:", e);
    }
}

function switchPage(pageId) {
    const dashboardPage = document.getElementById('dashboard-page');
    const jobWorkPage = document.getElementById('job-work-page');
    const navLinks = document.querySelectorAll('.nav-link');

    // Smooth transition
    const pages = [dashboardPage, jobWorkPage];
    pages.forEach(p => {
        p.style.opacity = '0';
        p.style.transition = 'opacity 0.3s ease';
    });

    setTimeout(() => {
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.textContent.toLowerCase().includes(pageId === 'dashboard' ? 'dashboard' : 'job work')) {
                link.classList.add('active');
            }
        });

        if (pageId === 'dashboard') {
            dashboardPage.style.display = 'block';
            jobWorkPage.style.display = 'none';
        } else {
            dashboardPage.style.display = 'none';
            jobWorkPage.style.display = 'block';
        }

        setTimeout(() => {
            const activePage = pageId === 'dashboard' ? dashboardPage : jobWorkPage;
            activePage.style.opacity = '1';
        }, 50);
    }, 300);
}

function initBackground() {
    const bg = document.getElementById('bg-animation');
    if (!bg) return;

    const particleCount = 20;
    for (let i = 0; i < particleCount; i++) {
        const p = document.createElement('div');
        p.className = 'particle';

        const size = Math.random() * 100 + 50;
        p.style.width = `${size}px`;
        p.style.height = `${size}px`;

        p.style.left = `${Math.random() * 100}vw`;
        p.style.top = `${Math.random() * 100}vh`;

        const duration = Math.random() * 20 + 10;
        const delay = Math.random() * 10;
        p.style.animation = `float ${duration}s infinite linear ${delay}s`;

        bg.appendChild(p);
    }
}

async function fetchDashboardData() {
    // Legacy support or fallback
    await fetchAllData();
}

function renderJobWorkCards(jobWorkData) {
    const grid = document.getElementById('job-work-grid');
    if (!grid) return;
    grid.innerHTML = '';

    if (!jobWorkData || jobWorkData.length === 0) {
        grid.innerHTML = '<div style="color:white; padding:20px;">No Job Work data available matching your search.</div>';
        return;
    }

    // Filter for Active Job Cards only
    const activeJobs = jobWorkData.filter(item => {
        const processes = ['embroidery', 'stitching', 'finishing'];
        return processes.some(key => {
            const p = item.subprocesses[key];
            if (!p) return false;

            // Check top level
            if (p.submitted_qty < p.total_qty) return true;

            // Check nested items
            if (p.items) {
                return Object.values(p.items).some(sub => sub.submitted_qty < sub.total_qty);
            }
            return false;
        });
    });

    if (activeJobs.length === 0) {
        grid.innerHTML = '<div style="color:white; padding:20px;">No ACTIVE Job Work available.</div>';
        return;
    }

    activeJobs.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = 'product-card job-work-card card-standard animate-in';
        card.style.animationDelay = `${index * 0.1}s`;

        let subprocessHtml = '';
        const processes = ['embroidery', 'stitching', 'finishing'];

        // Find the "Active" process: The first one that is NOT 100% complete
        let activeProcessKey = null;
        for (const key of processes) {
            const p = item.subprocesses[key];
            if (!p) continue;

            // Check top level
            if (p.submitted_qty < p.total_qty) {
                activeProcessKey = key;
                break;
            }

            // Check nested items
            if (p.items && Object.values(p.items).some(sub => sub.submitted_qty < sub.total_qty)) {
                activeProcessKey = key;
                break;
            }
        }
        // Fallback: If all are 100%, show none as active or last one? Let's show none.

        // Reorder: Active one first, then others
        const orderedProcessKeys = [...processes].sort((a, b) => {
            if (a === activeProcessKey) return -1;
            if (b === activeProcessKey) return 1;
            return 0;
        });

        orderedProcessKeys.forEach(procKey => {
            const proc = item.subprocesses[procKey];
            if (!proc) return;

            const progress = Math.round((proc.submitted_qty / proc.total_qty) * 100);
            const isActive = procKey === activeProcessKey;

            let nestedHtml = '';
            if (proc.items) {
                nestedHtml = '<div class="sub-subprocess-list">';
                const nestedEntries = Object.entries(proc.items);

                // Find the VERY FIRST incomplete subprocess (Sequential Logic)
                const currentSubIndex = nestedEntries.findIndex(([_, sub]) => sub.submitted_qty < sub.total_qty);

                if (currentSubIndex !== -1) {
                    const [subKey, sub] = nestedEntries[currentSubIndex];
                    const subProgress = Math.round((sub.submitted_qty / sub.total_qty) * 100);

                    nestedHtml += `
                        <div class="sub-subprocess-item nested-active">
                            <div class="subprocess-header">
                                <span class="subprocess-name">${subKey} <span class="active-badge mini">CURRENT PHASE</span></span>
                                <span class="due-info mini">Due: ${sub.due_days}d</span>
                            </div>
                            <div class="progress-info mini">
                                <span>${sub.karigar_name}</span>
                                <span>${subProgress}%</span>
                            </div>
                            <div class="subset-progress-bg mini">
                                <div class="subset-progress-fill" style="width: ${subProgress}%"></div>
                            </div>
                        </div>
                    `;

                    const completedBefore = currentSubIndex;
                    const futureAfter = nestedEntries.length - currentSubIndex - 1;

                    if (completedBefore > 0 || futureAfter > 0) {
                        nestedHtml += `<div class="hidden-count">${completedBefore} completed | ${futureAfter} pending phases hidden</div>`;
                    }
                } else {
                    nestedHtml += '<div style="font-size: 0.75rem; text-align: center; opacity: 0.6; padding: 10px;">All sequential phases completed ✅</div>';
                }
                nestedHtml += '</div>';
            }

            subprocessHtml += `
                <div class="subprocess-item ${isActive ? 'active' : ''}">
                    <div class="subprocess-header">
                        <span class="subprocess-name uppercase">${procKey} ${isActive ? '<span class="active-badge">ACTIVE</span>' : ''}</span>
                        <span class="due-info">Due: ${proc.due_days} days</span>
                    </div>
                    ${!proc.items ? `
                        <div class="karigar-info" style="margin-bottom: 8px;">
                            👤 Karigar: <strong>${proc.karigar_name}</strong>
                        </div>
                    ` : ''}
                    
                    <div class="progress-info">
                        <span>${proc.items ? 'Overall Progress' : `Submitted: ${proc.submitted_qty} / ${proc.total_qty}`}</span>
                        <span>${progress}%</span>
                    </div>
                    <div class="subset-progress-bg">
                        <div class="subset-progress-fill" style="width: ${progress}%"></div>
                    </div>
                    
                    ${nestedHtml}
                </div>
            `;
        });

        card.innerHTML = `
            <div class="card-header" style="margin-bottom: 5px;">
                <div class="product-title">${item.product_name}</div>
                <div class="product-sku">Production Code: ${item.production_code}</div>
            </div>
            <div class="subprocess-list">
                ${subprocessHtml}
            </div>
        `;

        grid.appendChild(card);
    });
}

function renderProductCards(products, productionPlans, salesData) {
    const criticalGrid = document.getElementById('critical-grid');
    const pipelineGrid = document.getElementById('pipeline-grid');
    const criticalSection = document.getElementById('critical-section');

    if (!criticalGrid || !pipelineGrid) return;

    criticalGrid.innerHTML = '';
    pipelineGrid.innerHTML = '';

    if (products.length === 0) {
        pipelineGrid.innerHTML = '<div style="color:white;">No products found in Excel file.</div>';
        return;
    }

    // Sort by Date Descending
    const sortedProducts = [...products].sort((a, b) => {
        const planA = productionPlans.find(p => p.product_id === a.id);
        const planB = productionPlans.find(p => p.product_id === b.id);
        const dateA = planA ? new Date(planA.start_date) : new Date(0);
        const dateB = planB ? new Date(planB.start_date) : new Date(0);
        return dateB - dateA;
    });

    let criticalCount = 0;

    sortedProducts.forEach(product => {
        const activePlan = productionPlans.find(p => p.product_id === product.id);
        const sale = salesData.find(s => s.product_id === product.id);
        const demand = sale ? sale.quantity : 0;

        const isRunning = activePlan && activePlan.status === 'Running';
        const progress = activePlan ? activePlan.progress : 0;
        const target = activePlan ? activePlan.target : 'YTA';
        const startDate = activePlan && activePlan.start_date ? activePlan.start_date : 'YTA';
        const designParts = generateDesignParts(product.id, isRunning, activePlan, product);

        // --- Logic for Card Theme ---
        let cardClass = 'product-card';
        let badge = '';

        if (!isRunning && demand > 0) {
            // CRITICAL: Order exists but NO production
            cardClass += ' card-critical-gradient';
            badge = '<span class="priority-badge" title="Attention Needed">⚠️</span>';
        } else if (isRunning && demand > 20) {
            // TRENDING: High demand and active
            cardClass += ' card-trending';
            badge = '<span class="priority-badge" title="Trending High">🔥</span>';
        } else if (isRunning) {
            // STANDARD: Active production
            cardClass += ' card-standard';
            badge = '<span class="priority-badge" title="Active">⚙️</span>';
        } else {
            // INACTIVE: No orders, no production
            cardClass += ' card-dead';
        }

        const card = document.createElement('div');
        card.className = cardClass + ' animate-in';
        card.style.animationDelay = `${(criticalCount + pipelineGrid.children.length) * 0.05}s`;
        card.style.cursor = 'pointer';

        let progressHtml = '';
        if (isRunning) {
            progressHtml = `
                <div class="metrics-row" style="border:none; margin-top:10px; padding:0; display:block;">
                     <div style="font-size:0.75rem; margin-bottom:4px; opacity:0.9; display:flex; justify-content:space-between;">
                        <span style="color:white !important;">Production Limit</span>
                        <span style="color:white !important;">${progress}% / ${target} pcs</span>
                     </div>
                     <div class="card-progress-container">
                        <div class="card-progress-fill" style="width: ${progress}%"></div>
                     </div>
                </div>
            `;
        }

        card.innerHTML = `
            <div class="card-header">
                <div>
                    <div class="product-title" style="font-size:1.2rem;">${product.name}</div>
                    <div class="product-sku" style="opacity:0.8;">Production Code: ${product.id}</div>
                </div>
                ${badge}
            </div>

            <div class="metrics-row" style="grid-template-columns: 1fr 1fr 1fr;">
                <div class="metric">
                    <span style="opacity:0.7; font-size:0.8rem;">Planner Date</span>
                    <strong style="color:white; display:block; font-size:1rem;">${startDate}</strong>
                </div>
                <div class="metric">
                    <span style="opacity:0.7; font-size:0.8rem;">Target</span>
                    <strong style="color:white; display:block; font-size:1rem;">${target} Pcs</strong>
                </div>
                <div class="metric">
                    <span style="opacity:0.7; font-size:0.8rem;">Demand</span>
                    <strong class="highlight-demand" style="display:block; font-size:1rem;">${demand}</strong>
                </div>
            </div>

            <div class="subpart-section" style="flex-grow:1; margin-top:10px;">
                <div style="font-size:0.8rem; margin-bottom:8px; opacity:0.8; color:white;">Materials / Subparts</div>
                <div class="subpart-list" style="display:flex; flex-direction:column; gap:4px;">
                    ${designParts.slice(0, 3).map(sp => `
                        <div class="subpart-item" style="background:rgba(255,255,255,0.15); padding:4px 8px !important; border-radius:4px; color:white; font-size:0.75rem;">
                            ${sp.name}
                        </div>
                    `).join('')}
                    ${designParts.length > 3 ? `<div style="font-size:0.7rem; opacity:0.7; color:white;">+ ${designParts.length - 3} more</div>` : ''}
                </div>
            </div>

            ${progressHtml}
        `;

        card.onclick = () => {
            openProductModal({
                product, activePlan, designParts, isProducing: isRunning,
                dueDate: startDate, stock: 'YTA', reserved: 'YTA', sales: demand
            });
        };

        // Bucket into Grids
        if ((!isRunning && demand > 0) || (isRunning && demand > 0 && progress < 25)) {
            criticalGrid.appendChild(card);
            criticalCount++;
        } else {
            pipelineGrid.appendChild(card);
        }
    });

    // Hide Critical Section if no items
    criticalSection.style.display = criticalCount > 0 ? 'block' : 'none';
}

// Modal Logic
function openProductModal(data) {
    const modal = document.getElementById('product-modal');
    if (!modal) return;

    // Header
    document.getElementById('modal-product-name').textContent = data.product.name;
    document.getElementById('modal-product-sku').textContent = `ID: ${data.product.id}`;

    // Top Metrics
    document.getElementById('modal-total-stock').textContent = data.sales || 0; // Show Demand as key metric
    document.querySelector('#modal-total-stock').previousElementSibling.textContent = "Total Demand";
    document.getElementById('modal-reserved-stock').textContent = data.stock || 'YTA';
    document.getElementById('modal-due-date').textContent = data.dueDate || 'YTA';

    // Production Progress
    let progress = data.activePlan ? data.activePlan.progress : 0;
    let statusText = data.isProducing ? 'Running' : 'Stopped';

    document.getElementById('modal-status-text').textContent = statusText;
    document.getElementById('modal-progress-percent').textContent = `${progress}%`;
    document.getElementById('modal-progress-bar').style.width = `${progress}%`;

    // Design Parts Table
    const tbody = document.getElementById('modal-subparts-body');

    tbody.innerHTML = data.designParts.map(part => {
        let statusBadge = '<span class="status-badge badge-green">OK</span>';
        if (part.status === 'shortage') statusBadge = '<span class="status-badge badge-red">Low Stock</span>';

        return `
            <tr>
                <td>${part.name}</td>
                <td>${statusBadge}</td>
                <td>${part.stock} / ${part.target}</td>
                <td>${Math.round((part.stock / part.target) * 100)}%</td>
            </tr>
        `;
    }).join('');

    modal.style.display = "flex";
}

function closeModal() {
    document.getElementById('product-modal').style.display = "none";
}

window.onclick = function (event) {
    const modal = document.getElementById('product-modal');
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

function generateDesignParts(seed, isProducing, activePlan, product) {
    // Collect all unique subparts from the plan or product
    const subparts = (activePlan && activePlan.subparts && activePlan.subparts.length > 0)
        ? activePlan.subparts
        : (product && product.subparts ? product.subparts : []);

    if (subparts.length > 0) {
        return subparts.map(name => ({
            name: name,
            status: 'ok',
            stock: activePlan ? activePlan.target : 100, // Placeholder
            target: activePlan ? activePlan.target : 100
        }));
    }

    // Fallback Mock
    const parts = ['Front Panel', 'Back Panel', 'Sleeves', 'Collar', 'Trims/Buttons'];
    return parts.map(part => {
        const target = 500;
        let stock = Math.floor(Math.random() * 550);
        let status = 'ok';
        if (stock < 100) status = 'shortage';
        return { name: part, status, stock, target };
    });
}
