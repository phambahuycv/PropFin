// Reminders Center Logic
const remindersModule = {
    allReminders: [],

    async init() {
        await this.loadReminders();
        this.bindEvents();
    },

    async loadReminders() {
        try {
            const list = await api.getReminders();
            this.allReminders = list;
            this.renderList(list);
            this.updateBadge(list);
        } catch (error) {
            window.showToast('Lỗi khi tải danh sách nhắc hẹn: ' + error.message, 'error');
        }
    },

    renderList(list) {
        const container = document.getElementById('remindersListContainer');
        if (!container) return;

        if (list.length === 0) {
            container.innerHTML = `
                <div style="text-align:center; padding:48px; color:var(--text-dim);">
                    <i class="fa-solid fa-bell-slash" style="font-size:36px; margin-bottom:12px; display:block;"></i>
                    Tuyệt vời! Hiện không có nhắc hẹn hoặc công việc nào cần xử lý.
                </div>
            `;
            return;
        }

        const todayStr = new Date().toISOString().split('T')[0];

        container.innerHTML = list.map(rem => {
            const isDone = rem.is_completed === 1;
            const isOverdue = rem.due_date < todayStr && !isDone;
            const isDueToday = rem.due_date === todayStr && !isDone;

            let typeBadge = '';
            if (rem.reminder_type === 'rent_due') typeBadge = '<span class="badge badge-warning"><i class="fa-solid fa-money-bill-wave"></i> Thu tiền trọ</span>';
            else if (rem.reminder_type === 'contract_expiry') typeBadge = '<span class="badge badge-danger"><i class="fa-solid fa-calendar-xmark"></i> Hết hạn HĐ</span>';
            else if (rem.reminder_type === 'checkout') typeBadge = '<span class="badge badge-info"><i class="fa-solid fa-person-walking-dashed-line-arrow-right"></i> Trả phòng</span>';
            else typeBadge = '<span class="badge badge-purple"><i class="fa-solid fa-bell"></i> Ghi nhớ</span>';

            let dueStatus = `<span class="reminder-due-badge"><i class="fa-regular fa-clock"></i> Hạn: ${rem.due_date}</span>`;
            if (isOverdue) dueStatus = `<span class="reminder-due-badge urgent"><i class="fa-solid fa-circle-exclamation"></i> ĐÃ QUÁ HẠN (${rem.due_date})</span>`;
            else if (isDueToday) dueStatus = `<span class="reminder-due-badge urgent"><i class="fa-solid fa-bell"></i> HÔM NAY ĐẾN HẠN</span>`;

            return `
                <div class="reminder-item ${isDone ? 'completed' : ''}">
                    <button class="reminder-check-btn" onclick="remindersModule.toggleComplete(${rem.id}, ${isDone ? 0 : 1})">
                        ${isDone ? '<i class="fa-solid fa-check"></i>' : ''}
                    </button>
                    <div class="reminder-body">
                        <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                            ${typeBadge}
                            <span class="reminder-title">${rem.title}</span>
                        </div>
                        <div class="reminder-meta">
                            ${dueStatus}
                            ${rem.notes ? `<span>• ${rem.notes}</span>` : ''}
                            ${rem.amount > 0 ? `<span>• Số tiền: <strong style="color:var(--primary);">${window.formatCurrency(rem.amount)}</strong></span>` : ''}
                        </div>
                    </div>
                    <button class="btn-icon" style="width:32px; height:32px;" title="Xóa nhắc hẹn" onclick="remindersModule.deleteReminder(${rem.id})">
                        <i class="fa-solid fa-trash" style="font-size:12px; color:var(--text-dim);"></i>
                    </button>
                </div>
            `;
        }).join('');
    },

    updateBadge(list) {
        const pendingCount = list.filter(r => r.is_completed === 0).length;
        const badge = document.getElementById('remindersNavBadge');
        if (badge) {
            badge.textContent = pendingCount;
            badge.style.display = pendingCount > 0 ? 'inline-block' : 'none';
        }
    },

    async toggleComplete(id, newStatus) {
        try {
            await api.updateReminder(id, { is_completed: newStatus });
            await this.loadReminders();
            await window.app.refreshGlobalStats();
        } catch (error) {
            window.showToast(error.message, 'error');
        }
    },

    openAddModal() {
        document.getElementById('formReminder').reset();
        document.getElementById('remDueDateInput').value = new Date().toISOString().split('T')[0];
        document.getElementById('modalAddReminder').classList.add('active');
    },

    async handleSaveReminder(e) {
        e.preventDefault();
        const title = document.getElementById('remTitleInput').value.trim();
        const reminder_type = document.getElementById('remTypeSelect').value;
        const due_date = document.getElementById('remDueDateInput').value;
        const amount = parseFloat(document.getElementById('remAmountInput').value) || 0;
        const notes = document.getElementById('remNotesInput').value.trim();

        if (!title || !due_date) {
            window.showToast('Vui lòng nhập tiêu đề và ngày nhắc hẹn', 'error');
            return;
        }

        try {
            await api.createReminder({
                title,
                reminder_type,
                due_date,
                amount,
                notes,
                is_completed: 0
            });

            window.showToast('Đã thêm nhắc hẹn mới', 'success');
            document.getElementById('modalAddReminder').classList.remove('active');
            await this.loadReminders();
            await window.app.refreshGlobalStats();
        } catch (error) {
            window.showToast(error.message, 'error');
        }
    },

    async deleteReminder(id) {
        try {
            await api.deleteReminder(id);
            window.showToast('Đã xóa nhắc hẹn', 'success');
            await this.loadReminders();
            await window.app.refreshGlobalStats();
        } catch (error) {
            window.showToast(error.message, 'error');
        }
    },

    bindEvents() {
        const form = document.getElementById('formReminder');
        if (form) form.addEventListener('submit', (e) => this.handleSaveReminder(e));
    }
};

window.remindersModule = remindersModule;
