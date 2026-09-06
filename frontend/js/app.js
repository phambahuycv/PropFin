// PropFin Main Application Coordinator
const app = {
    currentTab: 'dashboard',

    async init() {
        this.initTheme();
        this.bindGlobalEvents();
        await this.refreshGlobalStats();

        // Initialize submodules
        await window.walletsModule?.init();
        await window.propertiesModule?.init();
        await window.roomsModule?.init();
        await window.contractsModule?.init();
        await window.transactionsModule?.init();
        await window.invoicesModule?.init();
        await window.remindersModule?.init();
        await window.analyticsModule?.init();

        // Set default month filters to current month
        const currentMonth = new Date().toISOString().substring(0, 7);
        ['filterTxMonth', 'filterInvMonth', 'analyticsMonthSelect'].forEach(id => {
            const el = document.getElementById(id);
            if (el && !el.value) el.value = currentMonth;
        });
    },

    initTheme() {
        const savedTheme = localStorage.getItem('propfin_theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateThemeIcon(savedTheme);
    },

    toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme') || 'dark';
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('propfin_theme', next);
        this.updateThemeIcon(next);

        // Re-render charts for theme color adaptation
        if (window.analyticsModule?.cashflowChart) {
            window.analyticsModule.loadAllAnalytics();
        }
    },

    updateThemeIcon(theme) {
        const icon = document.querySelector('#themeToggleBtn i');
        if (icon) {
            icon.className = theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
        }
    },

    switchTab(tabId) {
        this.currentTab = tabId;

        // Update nav items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.tab === tabId);
        });

        // Update sub-tab buttons if any
        document.querySelectorAll('.prop-subnav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
        });

        // Update panes
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.toggle('active', pane.id === `tab-${tabId}`);
        });

        // Update page title
        const titles = {
            dashboard: { title: 'Tổng Quan Dòng Tiền & Nhà Trọ', sub: 'Bảng điều khiển tài chính toàn diện' },
            properties: { title: 'Quản Lý Căn Hộ & Tòa Nhà', sub: 'Danh mục các căn hộ chung cư, tòa nhà mini, dãy trọ cho thuê' },
            rooms: { title: 'Quản Lý Phòng Riêng', sub: 'Sơ đồ phòng theo từng căn hộ, mặt trong/ngoài và tình trạng' },
            contracts: { title: 'Quản Lý Hợp Đồng Cho Thuê', sub: 'Bảng theo dõi toàn bộ hợp đồng thuê, khách ở, đặt cọc và thời hạn' },
            invoices: { title: 'Chốt Điện Nước & Hoá Đơn', sub: 'Tính tiền điện nước, xuất bill Zalo & mã VietQR' },
            wallets: { title: 'Quản Lý Ví & Tài Khoản Ngân Quỹ', sub: 'Tài khoản ngân hàng VietQR & Ví tiền mặt thu chi riêng biệt' },
            transactions: { title: 'Sổ Thu - Chi Cá Nhân & Gia Đình', sub: 'Quản lý chi tiêu Marketing, tiêu dùng, đối nội ngoại, học tập, tiền lương' },
            reminders: { title: 'Trung Tâm Nhắc Hẹn & Cảnh Báo', sub: 'Theo dõi hạn đóng tiền trọ, hợp đồng hết hạn và công việc' },
            analytics: { title: 'Báo Cáo & Phân Tích Tài Chính', sub: 'Biểu đồ dòng tiền, phân bổ chi tiêu và hiệu quả kinh doanh trọ' }
        };

        const pageTitleEl = document.getElementById('pageTitle');
        const pageSubEl = document.getElementById('pageSubtitle');
        if (pageTitleEl && titles[tabId]) pageTitleEl.textContent = titles[tabId].title;
        if (pageSubEl && titles[tabId]) pageSubEl.textContent = titles[tabId].sub;

        // Trigger module reloads if needed
        if (tabId === 'dashboard') this.refreshGlobalStats();
        else if (tabId === 'properties') window.propertiesModule?.loadProperties();
        else if (tabId === 'rooms') window.roomsModule?.loadRooms();
        else if (tabId === 'contracts') window.contractsModule?.loadContracts();
        else if (tabId === 'wallets') window.walletsModule?.loadWallets();
        else if (tabId === 'invoices') window.invoicesModule?.loadInvoices();
        else if (tabId === 'transactions') window.transactionsModule?.loadTransactions();
        else if (tabId === 'reminders') window.remindersModule?.loadReminders();
        else if (tabId === 'analytics') window.analyticsModule?.loadAllAnalytics();

        // Close mobile sidebar if open
        document.getElementById('sidebar')?.classList.remove('open');
    },

    async refreshGlobalStats() {
        try {
            const data = await api.getAnalyticsOverview();
            
            // Dashboard KPI Cards
            const dbIncome = document.getElementById('dashIncome');
            const dbExpense = document.getElementById('dashExpense');
            const dbNet = document.getElementById('dashNet');
            const dbBalance = document.getElementById('dashTotalBalance');
            const dbRented = document.getElementById('dashRentedRatio');
            const dbEstRent = document.getElementById('dashEstRent');

            if (dbIncome) dbIncome.textContent = window.formatCurrency(data.total_income);
            if (dbExpense) dbExpense.textContent = window.formatCurrency(data.total_expense);
            if (dbNet) {
                dbNet.textContent = window.formatCurrency(data.net_cashflow);
                dbNet.style.color = data.net_cashflow >= 0 ? 'var(--success)' : 'var(--danger)';
            }
            if (dbBalance) dbBalance.textContent = window.formatCurrency(data.total_balance);
            if (dbRented) dbRented.textContent = `${data.room_stats.rented_rooms}/${data.room_stats.total_rooms} (${data.room_stats.occupancy_rate}%)`;
            if (dbEstRent) dbEstRent.textContent = window.formatCurrency(data.estimated_rent_monthly);

            // Sidebar Quick Wallet Card
            const sideBal = document.getElementById('sidebarTotalBalance');
            if (sideBal) sideBal.textContent = window.formatCurrency(data.total_balance);

            // Render Dashboard Wallets List
            const dashWalletsList = document.getElementById('dashWalletsList');
            if (dashWalletsList && data.wallets) {
                dashWalletsList.innerHTML = data.wallets.map(w => `
                    <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid var(--border-subtle);">
                        <div style="display:flex; align-items:center; gap:10px;">
                            <i class="${w.type === 'bank' ? 'fa-solid fa-building-columns' : 'fa-solid fa-wallet'}" style="color:var(--primary); font-size:16px;"></i>
                            <div>
                                <div style="font-weight:700; font-size:13.5px;">${w.name}</div>
                                <div style="font-size:11.5px; color:var(--text-dim);">${w.type === 'bank' && w.account_number ? `${w.bank_name || 'Bank'} - ${w.account_number}` : 'Tiền mặt'}</div>
                            </div>
                        </div>
                        <div style="font-weight:800; font-size:14.5px; color:var(--text-main);">
                            ${window.formatCurrency(w.balance)}
                        </div>
                    </div>
                `).join('');
            }
        } catch (error) {
            console.error('Failed to refresh stats:', error);
        }
    },

    bindGlobalEvents() {
        // Nav items click
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchTab(item.dataset.tab);
            });
        });

        // Theme toggle
        document.getElementById('themeToggleBtn')?.addEventListener('click', () => this.toggleTheme());

        // Mobile menu toggle
        document.getElementById('mobileMenuToggle')?.addEventListener('click', () => {
            document.getElementById('sidebar')?.classList.toggle('open');
        });

        // Modal close buttons (clicks on backdrop or close button)
        document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
            backdrop.addEventListener('click', (e) => {
                if (e.target === backdrop) backdrop.classList.remove('active');
            });
        });

        document.querySelectorAll('.btn-close-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                btn.closest('.modal-backdrop')?.classList.remove('active');
            });
        });
    }
};

// Utilities
window.formatCurrency = (amount) => {
    if (amount === null || amount === undefined || isNaN(amount)) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

window.formatCurrencyShort = (amount) => {
    if (Math.abs(amount) >= 1000000) {
        return (amount / 1000000).toFixed(1) + ' tr';
    }
    if (Math.abs(amount) >= 1000) {
        return (amount / 1000).toFixed(0) + ' k';
    }
    return amount.toString();
};

window.showToast = (message, type = 'info') => {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = 'fa-info-circle';
    if (type === 'success') icon = 'fa-check-circle';
    else if (type === 'error') icon = 'fa-exclamation-circle';
    else if (type === 'warning') icon = 'fa-triangle-exclamation';

    toast.innerHTML = `
        <i class="fa-solid ${icon}"></i>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(12px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
};

window.app = app;

document.addEventListener('DOMContentLoaded', () => {
    window.app.init();
});
