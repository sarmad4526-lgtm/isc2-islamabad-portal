/**
 * ISC2 Islamabad Chapter - Admin Portal Management System
 * Hybrid Engine: Live REST API + Resilient Offline Fallback
 */

// ============================================
// BUILT-IN SEED DATASETS (OFFLINE / FALLBACK)
// ============================================
const DEFAULT_MEMBERS = [
    {
        memberId: "000335888",
        name: "Asim Husain",
        email: "asim.h@isc2islamabad.org",
        chapter: "Pakistan Islamabad Chapter",
        role: "Member",
        company: "National Cyber Security Hub",
        jobTitle: "Lead Security Architect",
        specialisation: "Secure System Architecture & Design",
        industry: "Telecommunications, Technology, Internet & Electronics",
        certifications: ["CISSP", "ISSAP"],
        workingGroups: ["Cloud Security"],
        termStartDate: "2026-08-19",
        termEndDate: "2027-08-19",
        status: "Active",
        history: [
            { period: 1, startDate: "2013-07-17", endDate: "2023-12-31", status: "Expired" },
            { period: 2, startDate: "2026-08-19", endDate: "2027-08-19", status: "Active" }
        ]
    },
    {
        memberId: "000335889",
        name: "Tanveer Ahmad",
        email: "tanveer.a@isc2islamabad.org",
        chapter: "Pakistan Islamabad Chapter",
        role: "Member",
        company: "Federal Tech Innovations",
        jobTitle: "Governance & Risk Manager",
        specialisation: "Cyber Security Governance & Risk Management",
        industry: "Government",
        certifications: ["CGRC", "CISSP"],
        workingGroups: ["DevSecOps"],
        termStartDate: "2017-02-11",
        termEndDate: "2024-02-10",
        status: "Inactive",
        history: [
            { period: 1, startDate: "2017-02-11", endDate: "2024-02-10", status: "Expired" }
        ]
    },
    {
        memberId: "000335890",
        name: "Hamid Ali",
        email: "hamid.a@isc2islamabad.org",
        chapter: "Pakistan Islamabad Chapter",
        role: "Member",
        company: "Nexus Defense Systems",
        jobTitle: "SOC Analyst",
        specialisation: "Network Monitoring and Intrusion Detection",
        industry: "Airlines & Aerospace (including Defense)",
        certifications: ["SSCP"],
        workingGroups: ["Cloud Security"],
        termStartDate: "2022-10-27",
        termEndDate: "2024-10-27",
        status: "Inactive",
        history: [
            { period: 1, startDate: "2022-10-27", endDate: "2024-10-27", status: "Expired" }
        ]
    },
    {
        memberId: "000335891",
        name: "Jawwad Shamsi",
        email: "jawwad.s@isc2islamabad.org",
        chapter: "Pakistan Islamabad Chapter",
        role: "Member",
        company: "FAST-NUCES Islamabad",
        jobTitle: "Professor & Cyber Security Advisor",
        specialisation: "Secure System Development",
        industry: "Education",
        certifications: ["CISSP", "CSSLP"],
        workingGroups: ["DevSecOps"],
        termStartDate: "2025-09-23",
        termEndDate: "2026-09-22",
        status: "Active",
        history: [
            { period: 1, startDate: "2025-09-23", endDate: "2026-09-22", status: "Active" }
        ]
    },
    {
        memberId: "000335892",
        name: "Muhammad Irfan Khokhar",
        email: "irfan.k@isc2islamabad.org",
        chapter: "Pakistan Islamabad Chapter",
        role: "Member",
        company: "Global Digital Trust",
        jobTitle: "Principal Security Consultant",
        specialisation: "Cyber Threat Intelligence",
        industry: "Finance & Financial Services",
        certifications: ["CISSP", "ISSMP"],
        workingGroups: ["Cloud Security", "DevSecOps"],
        termStartDate: "2025-09-18",
        termEndDate: "2026-09-17",
        status: "Active",
        history: [
            { period: 1, startDate: "2025-09-18", endDate: "2026-09-17", status: "Active" }
        ]
    },
    {
        memberId: "000335893",
        name: "Hassan Jalil Hadi",
        email: "hassan.h@isc2islamabad.org",
        chapter: "Pakistan Islamabad Chapter",
        role: "Member",
        company: "TechSecure PK",
        jobTitle: "Cloud Architect",
        specialisation: "Secure System Architecture & Design",
        industry: "Telecommunications, Technology, Internet & Electronics",
        certifications: ["CCSP"],
        workingGroups: ["Cloud Security"],
        termStartDate: "2026-01-29",
        termEndDate: "2027-01-29",
        status: "Active",
        history: [
            { period: 1, startDate: "2026-01-29", endDate: "2027-01-29", status: "Active" }
        ]
    },
    {
        memberId: "000335894",
        name: "Mr Ali",
        email: "ali.m@isc2islamabad.org",
        chapter: "Pakistan Islamabad Chapter",
        role: "Member",
        company: "Islamabad Telecom Group",
        jobTitle: "Data Protection Officer",
        specialisation: "Data Protection & Privacy",
        industry: "Telecommunications, Technology, Internet & Electronics",
        certifications: ["CGRC"],
        workingGroups: ["Cloud Security"],
        termStartDate: "2018-11-20",
        termEndDate: "2023-11-19",
        status: "Inactive",
        history: [
            { period: 1, startDate: "2018-11-20", endDate: "2023-11-19", status: "Expired" }
        ]
    },
    {
        memberId: "000335896",
        name: "Touseef Gul",
        email: "touseef.g@isc2islamabad.org",
        chapter: "Pakistan Islamabad Chapter",
        role: "Member",
        company: "Islamabad Cyber Works",
        jobTitle: "Senior Incident Responder",
        specialisation: "Incident Response",
        industry: "Healthcare & Pharmaceuticals",
        certifications: ["CISSP"],
        workingGroups: ["DevSecOps"],
        termStartDate: "2026-03-09",
        termEndDate: "2027-03-09",
        status: "Active",
        history: [
            { period: 1, startDate: "2026-03-09", endDate: "2027-03-09", status: "Active" }
        ]
    },
    {
        memberId: "000335897",
        name: "Muhammad Huzaifa Rashid",
        email: "huzaifa.r@isc2islamabad.org",
        chapter: "Pakistan Islamabad Chapter",
        role: "Member",
        company: "GovSec Solutions",
        jobTitle: "Cryptographic Engineer",
        specialisation: "Cryptography & Communications Security",
        industry: "Government",
        certifications: ["CC"],
        workingGroups: ["DevSecOps"],
        termStartDate: "2026-08-19",
        termEndDate: "2027-08-19",
        status: "Active",
        history: [
            { period: 1, startDate: "2021-11-04", endDate: "2023-11-04", status: "Expired" },
            { period: 2, startDate: "2026-08-19", endDate: "2027-08-19", status: "Active" }
        ]
    },
    {
        memberId: "000335898",
        name: "Waseem Sajjad",
        email: "waseem.s@isc2islamabad.org",
        chapter: "Pakistan Islamabad Chapter",
        role: "Member",
        company: "Pakistan Fintech Security",
        jobTitle: "Lead Auditor",
        specialisation: "Cyber Security Audit and Assurance",
        industry: "Finance & Financial Services",
        certifications: ["CISSP", "CGRC"],
        workingGroups: ["Cloud Security"],
        termStartDate: "2025-10-22",
        termEndDate: "2026-10-21",
        status: "Active",
        history: [
            { period: 1, startDate: "2025-10-22", endDate: "2026-10-21", status: "Active" }
        ]
    }
];

const DEFAULT_REQUESTS = [
    {
        requestId: "REQ-2025-001",
        isc2Number: "000452101",
        name: "Ahmed Khan",
        email: "ahmed.k@example.com",
        company: "National Bank of Pakistan",
        jobTitle: "Senior Security Analyst",
        certifications: ["CISSP"],
        specialisation: "Cyber Security Governance & Risk Management",
        industry: "Finance & Financial Services",
        workingGroups: ["DevSecOps"],
        date: "2025-08-10",
        status: "Pending"
    },
    {
        requestId: "REQ-2025-002",
        isc2Number: "000452102",
        name: "Fatima Ali",
        email: "fatima.a@example.com",
        company: "PTCL",
        jobTitle: "Cloud Security Engineer",
        certifications: ["CCSP"],
        specialisation: "Cloud Security",
        industry: "Telecommunications, Technology, Internet & Electronics",
        workingGroups: ["Cloud Security"],
        date: "2025-08-09",
        status: "Pending"
    },
    {
        requestId: "REQ-2025-003",
        isc2Number: "000452103",
        name: "Usman Tariq",
        email: "usman.t@example.com",
        company: "Systems Limited",
        jobTitle: "Security Consultant",
        certifications: ["CC"],
        specialisation: "Cyber Security Generalists",
        industry: "Telecommunications, Technology, Internet & Electronics",
        workingGroups: ["Cloud Security"],
        date: "2025-08-08",
        status: "Pending"
    },
    {
        requestId: "REQ-2025-004",
        isc2Number: "000452104",
        name: "Sana Malik",
        email: "sana.m@example.com",
        company: "Jazz",
        jobTitle: "Network Security Specialist",
        certifications: ["SSCP"],
        specialisation: "Network Monitoring and Intrusion Detection",
        industry: "Telecommunications, Technology, Internet & Electronics",
        workingGroups: ["DevSecOps"],
        date: "2025-08-07",
        status: "Pending"
    },
    {
        requestId: "REQ-2025-005",
        isc2Number: "000452105",
        name: "Bilal Ahmed",
        email: "bilal.a@example.com",
        company: "Government of Pakistan",
        jobTitle: "Information Security Officer",
        certifications: ["CISSP", "CISM"],
        specialisation: "Cyber Security Strategy and Leadership",
        industry: "Government",
        workingGroups: ["Cloud Security", "DevSecOps"],
        date: "2025-08-06",
        status: "Pending"
    }
];

// In-memory & Persistent application state
const savedActive = localStorage.getItem('isc2_active_members');
const savedInactive = localStorage.getItem('isc2_inactive_members');
const savedRequests = localStorage.getItem('isc2_pending_requests');

let currentActiveMembers = savedActive ? JSON.parse(savedActive) : JSON.parse(JSON.stringify(DEFAULT_MEMBERS.filter(m => m.status === 'Active')));
let currentInactiveMembers = savedInactive ? JSON.parse(savedInactive) : JSON.parse(JSON.stringify(DEFAULT_MEMBERS.filter(m => m.status === 'Inactive')));
let currentRequests = savedRequests ? JSON.parse(savedRequests) : JSON.parse(JSON.stringify(DEFAULT_REQUESTS));
let confirmCallback = null;
let isServerOnline = false;

// ============================================
// TOP-LEVEL NAVIGATION (INSTANT SWITCHING)
// ============================================
window.showSection = function(sectionId) {
    if (!sectionId) return;

    // Update sidebar navigation
    const navItems = document.querySelectorAll('.admin-nav li');
    navItems.forEach(nav => {
        if (nav.getAttribute('data-section') === sectionId) {
            nav.classList.add('active');
        } else {
            nav.classList.remove('active');
        }
    });

    // Update main section views
    const sections = document.querySelectorAll('.admin-section-content');
    sections.forEach(sec => sec.classList.remove('active'));

    const target = document.getElementById(sectionId);
    if (target) {
        target.classList.add('active');
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// ============================================
// AUTHENTICATED FETCH HELPER
// ============================================
const API_BASE = (window.location.protocol === 'file:' || (window.location.port && window.location.port !== '5000'))
    ? 'http://localhost:5000'
    : '';

async function authFetch(url, options = {}) {
    const fullUrl = url.startsWith('http') ? url : `${API_BASE}${url}`;
    const token = localStorage.getItem('isc2_token');
    const headers = {
        'Accept': 'application/json',
        ...(options.headers || {})
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    if (options.body && typeof options.body === 'string' && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
    }

    const fetchOptions = {
        ...options,
        headers
    };

    if (window.location.protocol !== 'file:') {
        fetchOptions.credentials = 'include';
    }

    return await fetch(fullUrl, fetchOptions);
}

// ============================================
// TOAST NOTIFICATIONS
// ============================================
window.showToast = function(message, type = 'success') {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const iconMap = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        info: 'fa-info-circle'
    };

    const icon = iconMap[type] || iconMap.success;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<i class="fas ${icon}"></i> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(40px)';
        setTimeout(() => { toast.remove(); }, 350);
    }, 4000);
};

function saveStateToStorage() {
    try {
        localStorage.setItem('isc2_active_members', JSON.stringify(currentActiveMembers));
        localStorage.setItem('isc2_inactive_members', JSON.stringify(currentInactiveMembers));
        localStorage.setItem('isc2_pending_requests', JSON.stringify(currentRequests));
    } catch (e) {}
}

// ============================================
// INITIALIZATION
// ============================================
function initApp() {
    initNavigationEvents();
    initModals();
    initEmailModule();
    
    // Render immediate local data first so the UI is never blank
    renderStatsDOM();
    renderActiveMembersDOM();
    renderInactiveMembersDOM();
    renderRequestsDOM();
    renderEmailRecipients();
    initSearchAndSort();

    // Then attempt background sync with Node.js SQLite server
    syncWithServer();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

function initNavigationEvents() {
    // Global delegated click listener for all cards, buttons and action triggers
    document.addEventListener('click', function(e) {
        // 1. Quick actions, stat cards & section navigation
        const navEl = e.target.closest('.action-card, .stat-card, [data-section], [data-section-target], [data-action], .dropdown-toggle');
        if (navEl) {
            const action = navEl.getAttribute('data-action');
            if (action === 'export-csv') {
                e.preventDefault();
                window.exportMembersCSV();
                return;
            }
            if (action === 'refresh-data') {
                e.preventDefault();
                window.refreshPortalData();
                return;
            }

            const sec = navEl.getAttribute('data-section-target') || navEl.getAttribute('data-section');
            if (sec) {
                e.preventDefault();
                window.showSection(sec);
                return;
            }
            if (navEl.classList.contains('dropdown-toggle')) {
                const text = navEl.textContent.toLowerCase();
                if (text.includes('inactive')) { window.showSection('inactive-members'); return; }
                if (text.includes('active')) { window.showSection('members'); return; }
                if (text.includes('pending')) { window.showSection('requests'); return; }
            }
        }

        // 2. View Member Details
        const viewMember = e.target.closest('.btn-view, .member-link, [data-action="view-member"]');
        if (viewMember) {
            const tr = viewMember.closest('tr');
            const memberId = viewMember.getAttribute('data-id') || (tr && tr.getAttribute('data-member-id'));
            const reqId = viewMember.getAttribute('data-request-id') || (tr && tr.getAttribute('data-request-id'));
            if (memberId) {
                e.preventDefault();
                window.openMemberDetails(memberId);
                return;
            } else if (reqId) {
                e.preventDefault();
                window.openRequestDetails(reqId);
                return;
            }
        }

        // 3. Reactivate Member
        const reactivate = e.target.closest('.btn-reactivate, [data-action="reactivate-member"]');
        if (reactivate) {
            const tr = reactivate.closest('tr');
            const memberId = reactivate.getAttribute('data-id') || (tr && tr.getAttribute('data-member-id'));
            if (memberId) {
                e.preventDefault();
                window.confirmReactivate(memberId);
                return;
            }
        }

        // 4. Approve Application
        const approve = e.target.closest('.btn-approve, [data-action="approve-request"]');
        if (approve) {
            const tr = approve.closest('tr');
            const reqId = approve.getAttribute('data-id') || (tr && tr.getAttribute('data-request-id'));
            if (reqId) {
                e.preventDefault();
                window.approveRequest(reqId);
                return;
            }
        }

        // 5. Reject Application
        const reject = e.target.closest('.btn-reject, [data-action="reject-request"]');
        if (reject) {
            const tr = reject.closest('tr');
            const reqId = reject.getAttribute('data-id') || (tr && tr.getAttribute('data-request-id'));
            if (reqId) {
                e.preventDefault();
                window.rejectRequest(reqId);
                return;
            }
        }
    });

    const logoutBtn = document.querySelector('.btn-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            try {
                await authFetch('/api/auth/logout', { method: 'POST' });
            } catch (err) {}
            localStorage.removeItem('isc2_token');
            localStorage.removeItem('isc2_user');
            window.location.href = 'login.html';
        });
    }
}

// ============================================
// DATA SYNC & RENDERING
// ============================================
async function syncWithServer() {
    try {
        const statsRes = await authFetch('/api/admin/stats');
        if (statsRes.ok) {
            const statsData = await statsRes.json();
            if (statsData.success && statsData.stats) {
                isServerOnline = true;
                
                // Fetch active members
                const activeRes = await authFetch('/api/admin/members?status=active');
                if (activeRes.ok) {
                    const activeData = await activeRes.json();
                    if (activeData.success && Array.isArray(activeData.members)) {
                        currentActiveMembers = activeData.members;
                    }
                }

                // Fetch inactive members
                const inactiveRes = await authFetch('/api/admin/members?status=inactive');
                if (inactiveRes.ok) {
                    const inactiveData = await inactiveRes.json();
                    if (inactiveData.success && Array.isArray(inactiveData.members)) {
                        currentInactiveMembers = inactiveData.members;
                    }
                }

                // Fetch pending applications
                const reqRes = await authFetch('/api/admin/applications');
                if (reqRes.ok) {
                    const reqData = await reqRes.json();
                    if (reqData.success && Array.isArray(reqData.applications)) {
                        currentRequests = reqData.applications;
                    }
                }

                // Re-render UI with synced server data
                localStorage.removeItem('isc2_active_members');
                localStorage.removeItem('isc2_inactive_members');
                localStorage.removeItem('isc2_pending_requests');
                saveStateToStorage();
                renderStatsDOM();
                renderActiveMembersDOM();
                renderInactiveMembersDOM();
                renderRequestsDOM();
                renderEmailRecipients();
            }
        }
    } catch (e) {
        console.info('Server sync unavailable, operating with local data store.');
    }
}

window.renderAll = async function() {
    await syncWithServer();
    renderStatsDOM();
    renderActiveMembersDOM();
    renderInactiveMembersDOM();
    renderRequestsDOM();
    renderEmailRecipients();
};

function renderStatsDOM() {
    const total = currentActiveMembers.length + currentInactiveMembers.length;
    const active = currentActiveMembers.length;
    const inactive = currentInactiveMembers.length;
    const pending = currentRequests.length;

    const elTotal = document.getElementById('statTotalMembers');
    const elActive = document.getElementById('statActiveMembers');
    const elInactive = document.getElementById('statInactiveMembers');
    const elRequests = document.getElementById('statPendingRequests');

    if (elTotal) elTotal.textContent = total;
    if (elActive) elActive.textContent = active;
    if (elInactive) elInactive.textContent = inactive;
    if (elRequests) elRequests.textContent = pending;

    // Update Quick Action Badges
    const quickRequests = document.getElementById('quickBadgeRequests');
    if (quickRequests) quickRequests.textContent = `${pending} Pending`;

    const quickActive = document.getElementById('quickBadgeActive');
    if (quickActive) quickActive.textContent = `${active} Active`;

    const quickInactive = document.getElementById('quickBadgeInactive');
    if (quickInactive) quickInactive.textContent = `${inactive} Inactive`;

    const activeMeta = document.getElementById('activeMetaText');
    if (activeMeta) activeMeta.innerHTML = `${active} active member${active === 1 ? '' : 's'} &bull; Filtered by Status: Active`;

    const inactiveMeta = document.getElementById('inactiveMetaText');
    if (inactiveMeta) inactiveMeta.innerHTML = `${inactive} inactive member${inactive === 1 ? '' : 's'} &bull; Filtered by Status: Inactive`;

    const requestsMeta = document.getElementById('requestsMetaText');
    if (requestsMeta) requestsMeta.innerHTML = `${pending} pending request${pending === 1 ? '' : 's'} &bull; Sorted by Request Date`;
}

function renderActiveMembersDOM() {
    const tbody = document.getElementById('activeMembersTableBody');
    if (!tbody) return;

    if (currentActiveMembers.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding: 24px; color: var(--text-secondary);">No active members found.</td></tr>`;
        return;
    }

    tbody.innerHTML = currentActiveMembers.map(member => `
        <tr data-member-id="${member.memberId}">
            <td class="checkbox-col"><input type="checkbox" class="active-member-checkbox" value="${member.memberId}"></td>
            <td class="id-cell">${member.memberId}</td>
            <td>${member.chapter || 'Pakistan Islamabad Chapter'}</td>
            <td><a href="#" class="member-link" onclick="openMemberDetails('${member.memberId}'); return false;">${member.name}</a></td>
            <td>${member.role || 'Member'}</td>
            <td>${member.city && member.country ? `${member.city}, ${member.country}` : 'Not specified'}</td>
            <td><span class="status-badge active">Active</span></td>
            <td>${formatDisplayDate(member.termStartDate)}</td>
            <td>${formatDisplayDate(member.termEndDate)}</td>
            <td>
                <button class="btn-action btn-view" title="View Details" onclick="openMemberDetails('${member.memberId}')">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        </tr>
    `).join('');

    const selectAllActive = document.getElementById('selectAllActive');
    if (selectAllActive) {
        selectAllActive.checked = false;
        selectAllActive.onchange = function() {
            tbody.querySelectorAll('.active-member-checkbox').forEach(cb => cb.checked = this.checked);
        };
    }
}

function renderInactiveMembersDOM() {
    const tbody = document.getElementById('inactiveMembersTableBody');
    if (!tbody) return;

    if (currentInactiveMembers.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding: 24px; color: var(--text-secondary);">No inactive members. All members currently have active terms.</td></tr>`;
        return;
    }

    tbody.innerHTML = currentInactiveMembers.map(member => `
        <tr data-member-id="${member.memberId}">
            <td class="checkbox-col"><input type="checkbox" class="inactive-member-checkbox" value="${member.memberId}"></td>
            <td class="id-cell">${member.memberId}</td>
            <td>${member.chapter || 'Pakistan Islamabad Chapter'}</td>
            <td><a href="#" class="member-link" onclick="openMemberDetails('${member.memberId}'); return false;">${member.name}</a></td>
            <td>${member.role || 'Member'}</td>
            <td>${member.city && member.country ? `${member.city}, ${member.country}` : 'Not specified'}</td>
            <td><span class="status-badge inactive">Inactive</span></td>
            <td>${formatDisplayDate(member.termStartDate)}</td>
            <td>${formatDisplayDate(member.termEndDate)}</td>
            <td>
                <button class="btn-action btn-view" title="View Details" onclick="openMemberDetails('${member.memberId}')">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn-action btn-reactivate" title="Reactivate Membership" onclick="confirmReactivate('${member.memberId}')">
                    <i class="fas fa-redo"></i>
                </button>
            </td>
        </tr>
    `).join('');

    const selectAllInactive = document.getElementById('selectAllInactive');
    if (selectAllInactive) {
        selectAllInactive.checked = false;
        selectAllInactive.onchange = function() {
            tbody.querySelectorAll('.inactive-member-checkbox').forEach(cb => cb.checked = this.checked);
        };
    }

    const btnBulk = document.getElementById('btnBulkReactivate');
    if (btnBulk) {
        btnBulk.onclick = function() {
            const selected = Array.from(tbody.querySelectorAll('.inactive-member-checkbox:checked')).map(cb => cb.value);
            if (selected.length === 0) {
                alert('Please select at least one inactive member to reactivate.');
                return;
            }
            confirmBulkReactivate(selected);
        };
    }
}

function renderRequestsDOM() {
    const tbody = document.getElementById('requestsTableBody');
    if (!tbody) return;

    if (currentRequests.length === 0) {
        tbody.innerHTML = `<tr><td colspan="10" style="text-align:center; padding: 24px; color: var(--text-secondary);">No pending membership requests.</td></tr>`;
        return;
    }

    tbody.innerHTML = currentRequests.map(req => {
        const certBadges = (req.certifications || []).map(c => `<span class="badge-cert">${c}</span>`).join(' ') || 'None';
        const isc2Num = (req.isc2Number || '').replace(/\D/g, '') || 'N/A';
        return `
            <tr data-request-id="${req.requestId}">
                <td class="id-cell">${req.requestId}</td>
                <td class="id-cell" style="font-weight:700; color:var(--text-primary);">${isc2Num}</td>
                <td><a href="#" class="member-link" onclick="openRequestDetails('${req.requestId}'); return false;">${req.name}</a></td>
                <td>${req.email}</td>
                <td>${req.city && req.country ? `${req.city}, ${req.country}` : 'Not specified'}</td>
                <td>${req.company || 'N/A'}</td>
                <td>${req.jobTitle || 'N/A'}</td>
                <td>${certBadges}</td>
                <td>${req.specialisation || 'N/A'}</td>
                <td>${req.date}</td>
                <td>
                    <button class="btn-action btn-approve" title="Approve & Activate" onclick="approveRequest('${req.requestId}')">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="btn-action btn-reject" title="Reject" onclick="rejectRequest('${req.requestId}')">
                        <i class="fas fa-times"></i>
                    </button>
                    <button class="btn-action btn-view" title="View Details" onclick="openRequestDetails('${req.requestId}')">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function renderEmailRecipients() {
    const tbody = document.getElementById('emailRecipientsTableBody');
    if (!tbody) return;

    if (currentActiveMembers.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 20px; color: var(--text-secondary);">No active members available as recipients.</td></tr>`;
        updateEmailRecipientCount();
        return;
    }

    tbody.innerHTML = currentActiveMembers.map(member => `
        <tr>
            <td><input type="checkbox" class="member-checkbox" value="${member.email}" checked></td>
            <td>${member.name}</td>
            <td>${member.email}</td>
            <td>${member.role || 'Member'}</td>
            <td><span class="status-badge active">Active</span></td>
        </tr>
    `).join('');

    updateEmailRecipientCount();
    bindEmailCheckboxEvents();
}

// ============================================
// ACTIONS (APPROVE, REJECT, REACTIVATE)
// ============================================
window.approveRequest = async function(requestId) {
    let req = currentRequests.find(r => r.requestId === requestId || String(r.id) === String(requestId));
    if (!req) return;

    if (!confirm(`Approve membership request for ${req.name} with ISC2 Member ID [${req.isc2Number}]?`)) return;

    // If server is online, do the API call FIRST so we know it succeeded before updating UI
    if (isServerOnline) {
        try {
            const approveRes = await authFetch(`/api/admin/applications/${requestId}/approve`, { method: 'POST' });
            if (!approveRes.ok) {
                const errData = await approveRes.json().catch(() => ({}));
                const msg = errData.message || `Server returned ${approveRes.status}`;
                window.showToast(`Approval failed: ${msg}`, 'error');
                return;
            }
        } catch (e) {
            window.showToast('Could not reach server. Please check connection and try again.', 'error');
            return;
        }
        // Sync from server so UI reflects real DB state
        await syncWithServer();
        window.closeModal();
        window.showToast(`Member ${req.name} approved and added to Active Members!`, 'success');
        return;
    }

    // Offline fallback: update local state only
    const today = new Date().toISOString().split('T')[0];
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    const endStr = nextYear.toISOString().split('T')[0];

    const newMember = {
        memberId: req.isc2Number,
        name: req.name,
        email: req.email,
        chapter: 'Pakistan Islamabad Chapter',
        role: 'Member',
        company: req.company || 'Not specified',
        jobTitle: req.jobTitle || 'Member',
        specialisation: req.specialisation || 'Not specified',
        industry: req.industry || 'Not specified',
        certifications: req.certifications || [],
        workingGroups: req.workingGroups || [],
        termStartDate: today,
        termEndDate: endStr,
        status: 'Active',
        history: [{ period: 1, startDate: today, endDate: endStr, status: 'Active' }]
    };

    currentRequests = currentRequests.filter(r => r.requestId !== requestId && String(r.id) !== String(requestId));
    currentActiveMembers.unshift(newMember);

    saveStateToStorage();
    window.closeModal();
    renderStatsDOM();
    renderActiveMembersDOM();
    renderRequestsDOM();
    renderEmailRecipients();

    window.showToast(`Member ${req.name} approved and added to Active Members! (Offline mode)`, 'success');
};

window.rejectRequest = async function(requestId) {
    let req = currentRequests.find(r => r.requestId === requestId || String(r.id) === String(requestId));
    if (!req) return;

    if (!confirm(`Are you sure you want to reject the membership request for ${req.name}?`)) return;

    currentRequests = currentRequests.filter(r => r.requestId !== requestId && String(r.id) !== String(requestId));
    saveStateToStorage();
    window.closeModal();
    renderStatsDOM();
    renderRequestsDOM();
    window.showToast(`Application for ${req.name} has been rejected.`, 'info');

    if (isServerOnline) {
        try {
            await authFetch(`/api/admin/applications/${requestId}/reject`, { method: 'POST' });
        } catch (e) {}
    }
};

window.confirmReactivate = function(memberId) {
    let member = currentInactiveMembers.find(m => m.memberId === memberId || String(m.id) === String(memberId));
    if (!member) return;

    showConfirmModal(
        `Reactivate Member: ${member.name}`,
        `Are you sure you want to reactivate membership for <strong>${member.name}</strong> (ISC2 Member ID: ${member.memberId})?<br><br>
        <strong>Term Extension:</strong> 1 Year from today<br>
        <strong>Status:</strong> Active<br><br>
        All prior membership periods will be retained in history without creating duplicate records.`,
        async function() {
            const today = new Date().toISOString().split('T')[0];
            const nextYear = new Date();
            nextYear.setFullYear(nextYear.getFullYear() + 1);
            const endStr = nextYear.toISOString().split('T')[0];

            member.status = 'Active';
            member.termStartDate = today;
            member.termEndDate = endStr;
            const periodNum = (member.history ? member.history.length : 1) + 1;
            if (!member.history) member.history = [];
            member.history.push({ period: periodNum, startDate: today, endDate: endStr, status: 'Active' });

            currentInactiveMembers = currentInactiveMembers.filter(m => m.memberId !== memberId);
            currentActiveMembers.unshift(member);

            saveStateToStorage();
            window.closeConfirmModal();
            renderStatsDOM();
            renderActiveMembersDOM();
            renderInactiveMembersDOM();
            renderEmailRecipients();

            window.showToast(`Member ${member.name} successfully reactivated and moved to Active Members!`, 'success');

            if (isServerOnline) {
                try {
                    await authFetch(`/api/admin/members/${memberId}/reactivate`, { method: 'POST' });
                    await syncWithServer();
                } catch (e) {}
            }
        }
    );
};

window.confirmBulkReactivate = function(memberIds) {
    const count = memberIds.length;

    showConfirmModal(
        `Bulk Reactivate Members (${count} Selected)`,
        `Are you sure you want to batch-reactivate <strong>${count}</strong> inactive member${count === 1 ? '' : 's'}?<br><br>
        <strong>New Term:</strong> 1 Year from today for all selected members<br>
        <strong>Status:</strong> Active`,
        async function() {
            const today = new Date().toISOString().split('T')[0];
            const nextYear = new Date();
            nextYear.setFullYear(nextYear.getFullYear() + 1);
            const endStr = nextYear.toISOString().split('T')[0];

            for (const id of memberIds) {
                const member = currentInactiveMembers.find(m => m.memberId === id);
                if (member) {
                    member.status = 'Active';
                    member.termStartDate = today;
                    member.termEndDate = endStr;
                    currentActiveMembers.unshift(member);
                }
            }

            currentInactiveMembers = currentInactiveMembers.filter(m => !memberIds.includes(m.memberId));

            saveStateToStorage();
            window.closeConfirmModal();
            renderStatsDOM();
            renderActiveMembersDOM();
            renderInactiveMembersDOM();
            renderEmailRecipients();

            window.showToast(`Successfully reactivated ${count} member${count === 1 ? '' : 's'}!`, 'success');

            if (isServerOnline) {
                try {
                    await authFetch(`/api/admin/members/bulk-reactivate`, {
                        method: 'POST',
                        body: JSON.stringify({ memberIds })
                    });
                    await syncWithServer();
                } catch (e) {}
            }
        }
    );
};

// ============================================
// MODALS
// ============================================
function initModals() {
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', function() {
            window.closeModal();
            window.closeConfirmModal();
        });
    });

    window.addEventListener('click', function(e) {
        if (e.target.classList && e.target.classList.contains('modal')) {
            window.closeModal();
            window.closeConfirmModal();
        }
    });

    window.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            window.closeModal();
            window.closeConfirmModal();
        }
    });
}

window.closeModal = function() {
    const modal = document.getElementById('requestModal');
    if (modal) modal.classList.remove('active');
};

window.openMemberDetails = function(memberId) {
    let member = currentActiveMembers.find(m => m.memberId === memberId || String(m.id) === String(memberId));
    if (!member) {
        member = currentInactiveMembers.find(m => m.memberId === memberId || String(m.id) === String(memberId));
    }
    if (!member) {
        alert('Member details not found.');
        return;
    }

    const modal = document.getElementById('requestModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    const modalFooter = document.getElementById('modalFooter');

    const certBadges = (member.certifications || []).map(c => `<span class="badge-cert">${c}</span>`).join(' ') || '<span style="color:var(--text-muted);">None</span>';
    const wgBadges = (member.workingGroups || []).map(w => `<span class="badge-cert" style="background:#e6fffa; color:#234e52;">${w}</span>`).join(' ') || '<span style="color:var(--text-muted);">None</span>';

    modalTitle.textContent = `Member Profile — ${member.name}`;

    const historyRows = (member.history && member.history.length > 0)
        ? member.history.map(h => `
            <tr>
                <td><strong>Period ${h.period || 1}</strong></td>
                <td>${formatDisplayDate(h.startDate || member.termStartDate)}</td>
                <td>${formatDisplayDate(h.endDate || member.termEndDate)}</td>
                <td><span class="status-badge ${h.status === 'Active' ? 'active' : 'inactive'}">${h.status || 'Active'}</span></td>
            </tr>
        `).join('')
        : `
            <tr>
                <td><strong>Period 1</strong></td>
                <td>${formatDisplayDate(member.termStartDate)}</td>
                <td>${formatDisplayDate(member.termEndDate)}</td>
                <td><span class="status-badge ${member.status ? member.status.toLowerCase() : 'active'}">${member.status || 'Active'}</span></td>
            </tr>
        `;

    modalBody.innerHTML = `
        <div class="detail-grid">
            <div class="detail-item">
                <strong>ISC2 Member ID</strong>
                <span class="id-cell" style="font-weight:700; font-size:0.95rem;">${member.memberId}</span>
            </div>
            <div class="detail-item">
                <strong>Status</strong>
                <span class="status-badge ${member.status ? member.status.toLowerCase() : 'active'}">${member.status || 'Active'}</span>
            </div>
            <div class="detail-item">
                <strong>Full Name</strong>
                ${member.name}
            </div>
            <div class="detail-item">
                <strong>Email Address</strong>
                <a href="mailto:${member.email}">${member.email}</a>
            </div>
            <div class="detail-item">
                <strong>Chapter & Role</strong>
                ${member.chapter || 'Pakistan Islamabad Chapter'} &bull; ${member.role || 'Member'}
            </div>
            <div class="detail-item">
                <strong>Location (City, Country)</strong>
                ${member.city || 'N/A'}, ${member.country || 'N/A'}
            </div>
            <div class="detail-item">
                <strong>Company & Job Title</strong>
                ${member.jobTitle || 'N/A'} at ${member.company || 'N/A'}
            </div>
            <div class="detail-item">
                <strong>Specialisation</strong>
                ${member.specialisation || 'N/A'}
            </div>
            <div class="detail-item">
                <strong>Industry</strong>
                ${member.industry || 'N/A'}
            </div>
            <div class="detail-item" style="grid-column: 1 / -1;">
                <strong>Certifications</strong>
                ${certBadges}
            </div>
            <div class="detail-item" style="grid-column: 1 / -1;">
                <strong>Working Groups</strong>
                ${wgBadges}
            </div>
        </div>

        <div class="history-section">
            <div class="history-header">
                <h4 class="history-title"><i class="fas fa-history"></i> Membership History & Periods</h4>
            </div>
            <table class="history-table">
                <thead>
                    <tr>
                        <th>Period</th>
                        <th>Start Date</th>
                        <th>End Date</th>
                        <th>Term Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${historyRows}
                </tbody>
            </table>
        </div>
    `;

    if (member.status === 'Inactive') {
        modalFooter.innerHTML = `
            <button class="btn-modal" style="background: var(--border); color: var(--text-primary);" onclick="window.closeModal()">Close</button>
            <button class="btn-modal btn-approve-modal" onclick="window.closeModal(); confirmReactivate('${member.memberId}');">
                <i class="fas fa-redo"></i> Reactivate Member
            </button>
        `;
    } else {
        modalFooter.innerHTML = `
            <button class="btn-modal" style="background: var(--border); color: var(--text-primary);" onclick="window.closeModal()">Close</button>
        `;
    }

    modal.classList.add('active');
};

window.openRequestDetails = function(requestId) {
    let req = currentRequests.find(r => r.requestId === requestId || String(r.id) === String(requestId));
    if (!req) {
        alert('Application request details not found.');
        return;
    }

    const modal = document.getElementById('requestModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    const modalFooter = document.getElementById('modalFooter');

    modalTitle.textContent = `Membership Request Details`;

    const certBadges = (req.certifications || []).map(c => `<span class="badge-cert">${c}</span>`).join(' ') || 'None';
    const isc2Num = (req.isc2Number || '').replace(/\D/g, '') || 'N/A';

    modalBody.innerHTML = `
        <div class="detail-grid">
            <div class="detail-item">
                <strong>Request ID</strong>
                <span class="id-cell" style="font-weight:700;">${req.requestId}</span>
            </div>
            <div class="detail-item">
                <strong>ISC2 Member ID</strong>
                <span class="id-cell" style="font-weight:700; color:var(--accent);">${isc2Num}</span>
            </div>
            <div class="detail-item">
                <strong>Submission Date</strong>
                ${req.date}
            </div>
            <div class="detail-item">
                <strong>Applicant Name</strong>
                ${req.name}
            </div>
            <div class="detail-item">
                <strong>Email Address</strong>
                <a href="mailto:${req.email}">${req.email}</a>
            </div>
            <div class="detail-item">
                <strong>Location (City, Country)</strong>
                ${req.city || 'N/A'}, ${req.country || 'N/A'}
            </div>
            <div class="detail-item">
                <strong>Company</strong>
                ${req.company || 'N/A'}
            </div>
            <div class="detail-item">
                <strong>Job Title</strong>
                ${req.jobTitle || 'N/A'}
            </div>
            <div class="detail-item">
                <strong>Specialisation</strong>
                ${req.specialisation || 'N/A'}
            </div>
            <div class="detail-item">
                <strong>Industry</strong>
                ${req.industry || 'N/A'}
            </div>
            <div class="detail-item" style="grid-column: 1 / -1;">
                <strong>Certifications</strong>
                ${certBadges}
            </div>
        </div>
    `;

    modalFooter.innerHTML = `
        <button class="btn-modal btn-reject-modal" onclick="rejectRequest('${req.requestId}')">Reject</button>
        <button class="btn-modal btn-approve-modal" onclick="approveRequest('${req.requestId}')">Approve & Activate</button>
    `;

    modal.classList.add('active');
};

function showConfirmModal(title, messageHtml, onConfirm) {
    const modal = document.getElementById('confirmModal');
    const titleEl = document.getElementById('confirmModalTitle');
    const bodyEl = document.getElementById('confirmModalBody');
    const actionBtn = document.getElementById('confirmModalActionBtn');

    if (titleEl) titleEl.textContent = title;
    if (bodyEl) bodyEl.innerHTML = messageHtml;

    confirmCallback = onConfirm;

    if (actionBtn) {
        actionBtn.onclick = function() {
            if (confirmCallback) confirmCallback();
        };
    }

    if (modal) modal.classList.add('active');
}

window.closeConfirmModal = function() {
    const modal = document.getElementById('confirmModal');
    if (modal) modal.classList.remove('active');
    confirmCallback = null;
};

// ============================================
// QUICK ACTIONS: EXPORT, REFRESH
// ============================================
window.exportMembersCSV = function() {
    const allMembers = [
        ...currentActiveMembers.map(m => ({ ...m, dynamicStatus: 'Active' })),
        ...currentInactiveMembers.map(m => ({ ...m, dynamicStatus: 'Inactive' }))
    ];

    if (allMembers.length === 0) {
        alert('No member records available to export.');
        return;
    }

    const headers = [
        'Member ID',
        'Full Name',
        'Email',
        'Chapter',
        'Role',
        'Status',
        'Company',
        'Job Title',
        'Specialisation',
        'Industry',
        'Certifications',
        'Working Groups',
        'Term Start Date',
        'Term End Date'
    ];

    const csvRows = [headers.join(',')];

    for (const m of allMembers) {
        const certs = (m.certifications || []).join('; ');
        const groups = (m.workingGroups || []).join('; ');
        const row = [
            `"${m.memberId || ''}"`,
            `"${(m.name || '').replace(/"/g, '""')}"`,
            `"${(m.email || '').replace(/"/g, '""')}"`,
            `"${(m.chapter || 'Pakistan Islamabad Chapter').replace(/"/g, '""')}"`,
            `"${(m.role || 'Member').replace(/"/g, '""')}"`,
            `"${m.dynamicStatus || m.status || 'Active'}"`,
            `"${(m.company || '').replace(/"/g, '""')}"`,
            `"${(m.jobTitle || '').replace(/"/g, '""')}"`,
            `"${(m.specialisation || '').replace(/"/g, '""')}"`,
            `"${(m.industry || '').replace(/"/g, '""')}"`,
            `"${certs.replace(/"/g, '""')}"`,
            `"${groups.replace(/"/g, '""')}"`,
            `"${m.termStartDate || ''}"`,
            `"${m.termEndDate || ''}"`
        ];
        csvRows.push(row.join(','));
    }

    const csvString = csvRows.join('\r\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const today = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `isc2_islamabad_members_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

window.refreshPortalData = async function() {
    const icon = document.getElementById('quickRefreshIcon');
    if (icon) icon.classList.add('fa-spin');

    try {
        await syncWithServer();
        renderStatsDOM();
        renderActiveMembersDOM();
        renderInactiveMembersDOM();
        renderRequestsDOM();
        renderEmailRecipients();
        window.showToast('Portal data synchronized with database successfully!', 'info');
        setTimeout(() => {
            if (icon) icon.classList.remove('fa-spin');
        }, 500);
    } catch (e) {
        if (icon) icon.classList.remove('fa-spin');
        window.showToast('Data refreshed from local store.', 'info');
    }
};

// ============================================
// SEARCH & SORT
// ============================================
function initSearchAndSort() {
    bindSearchInput('activeSearchInput', 'activeMembersTable');
    bindSearchInput('inactiveSearchInput', 'inactiveMembersTable');
    bindSearchInput('requestsSearchInput', 'requestsTable');

    document.querySelectorAll('.data-table th.sortable').forEach(header => {
        const newHeader = header.cloneNode(true);
        header.parentNode.replaceChild(newHeader, header);

        newHeader.addEventListener('click', function() {
            const table = this.closest('table');
            const tbody = table.querySelector('tbody');
            const rows = Array.from(tbody.querySelectorAll('tr'));
            if (rows.length <= 1) return;

            const index = Array.from(this.parentNode.children).indexOf(this);
            const isAsc = !this.classList.contains('asc');

            table.querySelectorAll('th').forEach(th => th.classList.remove('asc', 'desc'));
            this.classList.add(isAsc ? 'asc' : 'desc');

            rows.sort((a, b) => {
                const aText = a.children[index]?.textContent.trim() || '';
                const bText = b.children[index]?.textContent.trim() || '';
                return isAsc ? aText.localeCompare(bText, undefined, { numeric: true }) : bText.localeCompare(aText, undefined, { numeric: true });
            });

            rows.forEach(row => tbody.appendChild(row));
        });
    });
}

function bindSearchInput(inputId, tableId) {
    const input = document.getElementById(inputId);
    const table = document.getElementById(tableId);
    if (!input || !table) return;

    input.oninput = function() {
        const term = this.value.toLowerCase().trim();
        const rows = table.querySelectorAll('tbody tr');
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(term) ? '' : 'none';
        });
    };
}

// ============================================
// EMAIL BROADCAST
// ============================================
function initEmailModule() {
    const btnPreview = document.getElementById('btnPreview');
    const previewSuccess = document.getElementById('previewSuccess');

    btnPreview?.addEventListener('click', async function() {
        const subject = document.getElementById('emailSubject').value.trim();
        const messageBody = document.getElementById('emailBody').value.trim();
        const previewEmail = document.getElementById('previewEmail').value.trim();

        if (!subject || !messageBody) {
            alert('Please enter both subject and message body before sending a test.');
            return;
        }

        if (!previewEmail) {
            alert('Please enter your email address to receive the test preview.');
            return;
        }

        if (isServerOnline) {
            try {
                await authFetch('/api/admin/email/test', {
                    method: 'POST',
                    body: JSON.stringify({ previewEmail, subject, messageBody })
                });
            } catch (e) {}
        }

        if (previewSuccess) {
            previewSuccess.style.display = 'flex';
            previewSuccess.innerHTML = `<i class="fas fa-check-circle"></i> Test email successfully sent to ${previewEmail}! Review it in your inbox.`;
            setTimeout(() => { previewSuccess.style.display = 'none'; }, 6000);
        }
    });

    const emailSubject = document.getElementById('emailSubject');
    const sendSubject = document.getElementById('sendSubject');
    emailSubject?.addEventListener('input', function() {
        if (sendSubject) sendSubject.textContent = this.value || '(no subject)';
    });

    const btnSendAll = document.getElementById('btnSendAll');
    const sendSuccess = document.getElementById('sendSuccess');

    btnSendAll?.addEventListener('click', async function() {
        const subject = emailSubject ? emailSubject.value.trim() : '';
        const messageBody = document.getElementById('emailBody') ? document.getElementById('emailBody').value.trim() : '';
        const selectedCheckboxes = document.querySelectorAll('.member-checkbox:checked');
        const recipients = Array.from(selectedCheckboxes).map(cb => cb.value);

        if (!subject || !messageBody) {
            alert('Please enter both subject and message body before broadcasting.');
            return;
        }

        if (recipients.length === 0) {
            alert('Please select at least one recipient.');
            return;
        }

        if (!confirm(`Send broadcast email "${subject}" to ${recipients.length} active members?`)) {
            return;
        }

        if (isServerOnline) {
            try {
                await authFetch('/api/admin/email/broadcast', {
                    method: 'POST',
                    body: JSON.stringify({ recipients, subject, messageBody })
                });
            } catch (e) {}
        }

        if (sendSuccess) {
            sendSuccess.style.display = 'flex';
            sendSuccess.innerHTML = `<i class="fas fa-check-circle"></i> Broadcast successfully sent to ${recipients.length} members!`;
            setTimeout(() => { sendSuccess.style.display = 'none'; }, 6000);
        }
    });
}

function updateEmailRecipientCount() {
    const checked = document.querySelectorAll('.member-checkbox:checked').length;
    const selectedCountEl = document.getElementById('selectedCount');
    const sendCountEl = document.getElementById('sendCount');
    if (selectedCountEl) selectedCountEl.textContent = `${checked} members selected`;
    if (sendCountEl) sendCountEl.textContent = checked;
}

function bindEmailCheckboxEvents() {
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
    const selectAllLabel = document.getElementById('selectAllMembers');
    const memberCheckboxes = document.querySelectorAll('.member-checkbox');

    selectAllCheckbox?.addEventListener('change', function() {
        memberCheckboxes.forEach(cb => cb.checked = this.checked);
        if (selectAllLabel) selectAllLabel.checked = this.checked;
        updateEmailRecipientCount();
    });

    selectAllLabel?.addEventListener('change', function() {
        memberCheckboxes.forEach(cb => cb.checked = this.checked);
        if (selectAllCheckbox) selectAllCheckbox.checked = this.checked;
        updateEmailRecipientCount();
    });

    memberCheckboxes.forEach(cb => {
        cb.addEventListener('change', function() {
            const allChecked = document.querySelectorAll('.member-checkbox:checked').length === memberCheckboxes.length;
            if (selectAllCheckbox) selectAllCheckbox.checked = allChecked;
            if (selectAllLabel) selectAllLabel.checked = allChecked;
            updateEmailRecipientCount();
        });
    });
}

function formatDisplayDate(dateStr) {
    if (!dateStr) return 'N/A';
    try {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            return `${parts[1]}/${parts[2]}/${parts[0]}`;
        }
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return `${String(d.getMonth()+1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;
    } catch (e) {
        return dateStr;
    }
}
