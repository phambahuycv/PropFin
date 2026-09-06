// Financial Analytics & Charts Module
const analyticsModule = {
    cashflowChart: null,
    expensePieChart: null,
    incomePieChart: null,

    async init() {
        await this.loadAllAnalytics();
    },

    async loadAllAnalytics() {
        const month = document.getElementById('analyticsMonthSelect')?.value || '';
        const year = document.getElementById('analyticsYearSelect')?.value || '';

        try {
            const [overview, cashflowData, expenseCats, incomeSources, propSummary] = await Promise.all([
                api.getAnalyticsOverview(month),
                api.getCashflowMonthly(year),
                api.getExpensesByCategory(month),
                api.getIncomesBySource(month),
                api.getPropertySummary()
            ]);

            this.renderOverviewCards(overview);
            this.renderCashflowChart(cashflowData);
            this.renderExpensePieChart(expenseCats);
            this.renderIncomePieChart(incomeSources);
            this.renderPropertySummary(propSummary);
        } catch (error) {
            console.error('Error loading analytics:', error);
            window.showToast('Lỗi khi tải báo cáo thống kê: ' + error.message, 'error');
        }
    },

    renderOverviewCards(data) {
        const totalIncomeEl = document.getElementById('anTotalIncome');
        const totalExpenseEl = document.getElementById('anTotalExpense');
        const netCashflowEl = document.getElementById('anNetCashflow');
        const bankBalanceEl = document.getElementById('anBankBalance');
        const cashBalanceEl = document.getElementById('anCashBalance');
        const occupancyEl = document.getElementById('anOccupancyRate');

        if (totalIncomeEl) totalIncomeEl.textContent = window.formatCurrency(data.total_income);
        if (totalExpenseEl) totalExpenseEl.textContent = window.formatCurrency(data.total_expense);
        if (netCashflowEl) {
            netCashflowEl.textContent = window.formatCurrency(data.net_cashflow);
            netCashflowEl.style.color = data.net_cashflow >= 0 ? 'var(--success)' : 'var(--danger)';
        }
        if (bankBalanceEl) bankBalanceEl.textContent = window.formatCurrency(data.bank_balance);
        if (cashBalanceEl) cashBalanceEl.textContent = window.formatCurrency(data.cash_balance);
        if (occupancyEl) occupancyEl.textContent = `${data.room_stats.occupancy_rate}% (${data.room_stats.rented_rooms}/${data.room_stats.total_rooms} phòng)`;
    },

    renderCashflowChart(data) {
        const ctx = document.getElementById('chartCashflow');
        if (!ctx) return;

        const labels = data.map(d => d.month);
        const incomes = data.map(d => d.income);
        const expenses = data.map(d => d.expense);
        const nets = data.map(d => d.net);

        if (this.cashflowChart) this.cashflowChart.destroy();

        this.cashflowChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Thu nhập',
                        data: incomes,
                        backgroundColor: 'rgba(16, 185, 129, 0.75)',
                        borderColor: '#10b981',
                        borderRadius: 6
                    },
                    {
                        label: 'Chi phí',
                        data: expenses,
                        backgroundColor: 'rgba(244, 63, 94, 0.75)',
                        borderColor: '#f43f5e',
                        borderRadius: 6
                    },
                    {
                        label: 'Dòng tiền ròng',
                        data: nets,
                        type: 'line',
                        borderColor: '#6366f1',
                        backgroundColor: 'rgba(99, 102, 241, 0.2)',
                        borderWidth: 3,
                        pointBackgroundColor: '#6366f1',
                        tension: 0.3
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top', labels: { color: getComputedStyle(document.body).getPropertyValue('--text-muted') } },
                    tooltip: {
                        callbacks: {
                            label: (context) => `${context.dataset.label}: ${window.formatCurrency(context.raw)}`
                        }
                    }
                },
                scales: {
                    x: { grid: { display: false } },
                    y: {
                        ticks: {
                            callback: (val) => window.formatCurrencyShort(val)
                        }
                    }
                }
            }
        });
    },

    renderExpensePieChart(cats) {
        const ctx = document.getElementById('chartExpensePie');
        if (!ctx) return;

        if (this.expensePieChart) this.expensePieChart.destroy();

        if (cats.length === 0) {
            ctx.getContext('2d').clearRect(0, 0, ctx.width, ctx.height);
            return;
        }

        const labels = cats.map(c => `${c.group_name}: ${c.category_name}`);
        const values = cats.map(c => c.total_amount);
        const colors = cats.map(c => c.color || '#6366f1');

        this.expensePieChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels,
                datasets: [{
                    data: values,
                    backgroundColor: colors,
                    borderWidth: 2,
                    borderColor: 'var(--bg-surface)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'right', labels: { boxWidth: 12, font: { size: 11 } } },
                    tooltip: {
                        callbacks: {
                            label: (context) => ` ${context.label}: ${window.formatCurrency(context.raw)}`
                        }
                    }
                },
                cutout: '65%'
            }
        });
    },

    renderIncomePieChart(sources) {
        const ctx = document.getElementById('chartIncomePie');
        if (!ctx) return;

        if (this.incomePieChart) this.incomePieChart.destroy();

        if (sources.length === 0) {
            ctx.getContext('2d').clearRect(0, 0, ctx.width, ctx.height);
            return;
        }

        const labels = sources.map(s => s.category_name);
        const values = sources.map(s => s.total_amount);
        const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#06b6d4', '#ec4899'];

        this.incomePieChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels,
                datasets: [{
                    data: values,
                    backgroundColor: colors,
                    borderWidth: 2,
                    borderColor: 'var(--bg-surface)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'right', labels: { boxWidth: 12, font: { size: 11 } } },
                    tooltip: {
                        callbacks: {
                            label: (context) => ` ${context.label}: ${window.formatCurrency(context.raw)}`
                        }
                    }
                },
                cutout: '65%'
            }
        });
    },

    renderPropertySummary(propSummary) {
        const tbody = document.getElementById('propSummaryTableBody');
        if (!tbody || !propSummary.floor_stats) return;

        tbody.innerHTML = propSummary.floor_stats.map(f => {
            const occupancy = f.total_rooms > 0 ? Math.round((f.rented_rooms / f.total_rooms) * 100) : 0;
            return `
                <tr>
                    <td><strong>Tầng ${f.floor}</strong></td>
                    <td><strong>${f.total_rooms}</strong> phòng</td>
                    <td>
                        <span style="color:#10b981;">${f.outside_rooms} Mặt ngoài</span> / 
                        <span style="color:#818cf8;">${f.inside_rooms} Mặt trong</span>
                    </td>
                    <td>
                        <span style="color:var(--success); font-weight:700;">${f.rented_rooms} Đang thuê</span>
                    </td>
                    <td>
                        <span style="color:var(--info); font-weight:700;">${f.empty_rooms} Trống</span>
                    </td>
                    <td>
                        <div style="display:flex; align-items:center; gap:8px;">
                            <div style="flex:1; height:6px; background:var(--border-color); border-radius:3px; overflow:hidden;">
                                <div style="width:${occupancy}%; height:100%; background:var(--primary);"></div>
                            </div>
                            <span style="font-size:12px; font-weight:700;">${occupancy}%</span>
                        </div>
                    </td>
                    <td style="text-align:right; font-weight:800; color:var(--text-main);">
                        ${window.formatCurrency(f.potential_revenue)}
                    </td>
                </tr>
            `;
        }).join('');
    },

    exportTransactionsCSV() {
        const list = window.transactionsModule?.allTransactions || [];
        if (list.length === 0) {
            window.showToast('Chưa có dữ liệu để xuất', 'warning');
            return;
        }

        let csv = '\uFEFFNgày,Tiêu đề,Loại,Danh mục,Nhóm danh mục,Ví/Tài khoản,Số tiền (VNĐ),Ghi chú\n';
        list.forEach(tx => {
            csv += `"${tx.transaction_date}","${tx.title}","${tx.type}","${tx.category_name || ''}","${tx.category_group || ''}","${tx.wallet_name || ''}",${tx.amount},"${tx.notes || ''}"\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Bao_cao_Thu_Chi_PropFin_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        window.showToast('Đã xuất báo cáo CSV thành công!', 'success');
    }
};

window.analyticsModule = analyticsModule;
