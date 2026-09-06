// Transactions Management Logic
const transactionsModule = {
    allCategories: [],
    allWallets: [],

    async init() {
        await this.loadDependencies();
        await this.loadTransactions();
        this.bindEvents();
    },

    async loadDependencies() {
        try {
            const [categories, wallets] = await Promise.all([
                api.getCategories(),
                api.getWallets()
            ]);
            this.allCategories = categories;
            this.allWallets = wallets;
            this.renderCategoryChips('expense');
            this.renderWalletSelects();
            this.populateFilterDropdowns();
        } catch (error) {
            window.showToast('Không thể tải danh mục và ví tiền', 'error');
        }
    },

    renderWalletSelects() {
        const walletSelect = document.getElementById('txWalletSelect');
        const destWalletSelect = document.getElementById('txDestWalletSelect');
        const filterWallet = document.getElementById('filterTxWallet');

        if (walletSelect) {
            walletSelect.innerHTML = this.allWallets.map(w => 
                `<option value="${w.id}">${w.name} (${window.formatCurrency(w.balance)})</option>`
            ).join('');
        }

        if (destWalletSelect) {
            destWalletSelect.innerHTML = '<option value="">-- Chọn ví đích --</option>' + this.allWallets.map(w => 
                `<option value="${w.id}">${w.name} (${window.formatCurrency(w.balance)})</option>`
            ).join('');
        }

        if (filterWallet) {
            filterWallet.innerHTML = '<option value="">-- Tất cả ví/tài khoản --</option>' + this.allWallets.map(w => 
                `<option value="${w.id}">${w.name}</option>`
            ).join('');
        }
    },

    populateFilterDropdowns() {
        const filterCat = document.getElementById('filterTxCategory');
        if (filterCat) {
            filterCat.innerHTML = '<option value="">-- Tất cả danh mục --</option>' + this.allCategories.map(c => 
                `<option value="${c.id}">[${c.type === 'income' ? 'Thu' : 'Chi'}] ${c.group_name}: ${c.name}</option>`
            ).join('');
        }
    },

    renderCategoryChips(type) {
        const container = document.getElementById('txCategoryChips');
        if (!container) return;

        const filtered = this.allCategories.filter(c => c.type === type);
        
        // Group by group_name
        const groups = {};
        filtered.forEach(c => {
            if (!groups[c.group_name]) groups[c.group_name] = [];
            groups[c.group_name].push(c);
        });

        let html = '';
        for (const [groupName, cats] of Object.entries(groups)) {
            html += `<div style="width:100%; font-size:11px; font-weight:700; color:var(--text-dim); text-transform:uppercase; margin-top:6px;">${groupName}</div>`;
            cats.forEach(c => {
                html += `
                    <div class="cat-chip" data-id="${c.id}" onclick="transactionsModule.selectCategoryChip(${c.id})">
                        <i class="fa-solid fa-${c.icon || 'tag'}"></i>
                        <span>${c.name}</span>
                    </div>
                `;
            });
        }
        container.innerHTML = html;

        // Auto select first chip if none selected
        if (filtered.length > 0) {
            this.selectCategoryChip(filtered[0].id);
        }
    },

    selectCategoryChip(catId) {
        document.querySelectorAll('#txCategoryChips .cat-chip').forEach(chip => {
            chip.classList.toggle('selected', chip.dataset.id == catId);
        });
        const hiddenInput = document.getElementById('txCategoryId');
        if (hiddenInput) hiddenInput.value = catId;
    },

    async loadTransactions() {
        const month = document.getElementById('filterTxMonth')?.value || '';
        const type = document.getElementById('filterTxType')?.value || '';
        const category_id = document.getElementById('filterTxCategory')?.value || '';
        const wallet_id = document.getElementById('filterTxWallet')?.value || '';

        const params = {};
        if (month) params.month = month;
        if (type) params.type = type;
        if (category_id) params.category_id = category_id;
        if (wallet_id) params.wallet_id = wallet_id;

        try {
            const list = await api.getTransactions(params);
            this.renderTable(list);
            this.renderSummary(list);
        } catch (error) {
            window.showToast('Lỗi khi tải danh sách thu chi: ' + error.message, 'error');
        }
    },

    renderTable(list) {
        const tbody = document.getElementById('txTableBody');
        if (!tbody) return;

        if (list.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align:center; padding:36px; color:var(--text-dim);">
                        <i class="fa-solid fa-receipt" style="font-size:32px; margin-bottom:10px; display:block;"></i>
                        Chưa có giao dịch thu chi nào phù hợp với bộ lọc.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = list.map(tx => {
            const isIncome = tx.type === 'income';
            const isTransfer = tx.type === 'transfer';
            const amountPrefix = isIncome ? '+' : (isTransfer ? '⇄ ' : '-');
            const amountColor = isIncome ? 'var(--success)' : (isTransfer ? 'var(--info)' : 'var(--danger)');
            const typeBadge = isIncome 
                ? '<span class="badge badge-success">Thu nhập</span>' 
                : (isTransfer ? '<span class="badge badge-info">Chuyển ví</span>' : '<span class="badge badge-danger">Chi tiêu</span>');

            return `
                <tr>
                    <td>
                        <span style="font-size:12px; color:var(--text-dim);">${tx.transaction_date}</span>
                    </td>
                    <td>
                        <div style="font-weight:700;">${tx.title}</div>
                        ${tx.notes ? `<div style="font-size:11.5px; color:var(--text-muted);">${tx.notes}</div>` : ''}
                    </td>
                    <td>${typeBadge}</td>
                    <td>
                        ${tx.category_name ? `<span class="badge badge-neutral"><i class="fa-solid fa-tag"></i> ${tx.category_group ? tx.category_group + ': ' : ''}${tx.category_name}</span>` : '<span style="color:var(--text-dim);">-</span>'}
                    </td>
                    <td>
                        <span style="font-weight:600; font-size:12.5px;">${tx.wallet_name || 'Ví'}</span>
                        ${isTransfer && tx.destination_wallet_name ? `<div style="font-size:11px; color:var(--info);">➜ ${tx.destination_wallet_name}</div>` : ''}
                    </td>
                    <td style="text-align:right;">
                        <span style="font-weight:800; font-size:14.5px; color:${amountColor};">
                            ${amountPrefix}${window.formatCurrency(tx.amount)}
                        </span>
                    </td>
                    <td style="text-align:center;">
                        <button class="btn-icon" style="width:30px; height:30px; margin:auto;" title="Xóa giao dịch" onclick="transactionsModule.deleteTransaction(${tx.id})">
                            <i class="fa-solid fa-trash" style="font-size:12px; color:var(--danger);"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    },

    renderSummary(list) {
        let totalIncome = 0;
        let totalExpense = 0;

        list.forEach(tx => {
            if (tx.type === 'income') totalIncome += tx.amount;
            else if (tx.type === 'expense') totalExpense += tx.amount;
        });

        const net = totalIncome - totalExpense;
        const incomeEl = document.getElementById('txSummaryIncome');
        const expenseEl = document.getElementById('txSummaryExpense');
        const netEl = document.getElementById('txSummaryNet');

        if (incomeEl) incomeEl.textContent = window.formatCurrency(totalIncome);
        if (expenseEl) expenseEl.textContent = window.formatCurrency(totalExpense);
        if (netEl) {
            netEl.textContent = window.formatCurrency(net);
            netEl.style.color = net >= 0 ? 'var(--success)' : 'var(--danger)';
        }
    },

    openAddModal(type = 'expense') {
        const modal = document.getElementById('modalAddTransaction');
        if (!modal) return;

        // Reset form
        document.getElementById('formAddTransaction').reset();
        
        // Set default datetime to now
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const hh = String(now.getHours()).padStart(2, '0');
        const min = String(now.getMinutes()).padStart(2, '0');
        document.getElementById('txDateInput').value = `${yyyy}-${mm}-${dd}T${hh}:${min}`;

        // Switch type
        this.switchTxType(type);
        modal.classList.add('active');
    },

    switchTxType(type) {
        document.querySelectorAll('.tx-type-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.type === type);
        });
        document.getElementById('txTypeHidden').value = type;

        const catSection = document.getElementById('txCategorySection');
        const destWalletSection = document.getElementById('txDestWalletSection');

        if (type === 'transfer') {
            catSection.style.display = 'none';
            destWalletSection.style.display = 'block';
        } else {
            catSection.style.display = 'block';
            destWalletSection.style.display = 'none';
            this.renderCategoryChips(type);
        }
    },

    async handleSaveTransaction(e) {
        e.preventDefault();
        const type = document.getElementById('txTypeHidden').value;
        const title = document.getElementById('txTitleInput').value.trim();
        const amount = parseFloat(document.getElementById('txAmountInput').value) || 0;
        const wallet_id = parseInt(document.getElementById('txWalletSelect').value);
        const destination_wallet_id = type === 'transfer' ? parseInt(document.getElementById('txDestWalletSelect').value) : null;
        const category_id = type !== 'transfer' ? parseInt(document.getElementById('txCategoryId').value) : null;
        const datetimeVal = document.getElementById('txDateInput').value.replace('T', ' ');
        const notes = document.getElementById('txNotesInput').value.trim();

        if (!title || amount <= 0) {
            window.showToast('Vui lòng nhập tên khoản và số tiền hợp lệ', 'error');
            return;
        }

        if (type === 'transfer' && (!destination_wallet_id || destination_wallet_id === wallet_id)) {
            window.showToast('Vui lòng chọn ví đích nhận tiền khác ví nguồn', 'error');
            return;
        }

        try {
            await api.createTransaction({
                title,
                amount,
                type,
                wallet_id,
                destination_wallet_id,
                category_id,
                transaction_date: datetimeVal,
                notes
            });

            window.showToast('Đã lưu giao dịch thành công!', 'success');
            document.getElementById('modalAddTransaction').classList.remove('active');
            await this.loadTransactions();
            await window.app.refreshGlobalStats();
        } catch (error) {
            window.showToast(error.message, 'error');
        }
    },

    async deleteTransaction(id) {
        if (!confirm('Bạn có chắc muốn xóa giao dịch này? Số dư ví sẽ được hoàn lại tự động.')) return;
        try {
            await api.deleteTransaction(id);
            window.showToast('Đã xóa giao dịch', 'success');
            await this.loadTransactions();
            await window.app.refreshGlobalStats();
        } catch (error) {
            window.showToast(error.message, 'error');
        }
    },

    bindEvents() {
        const form = document.getElementById('formAddTransaction');
        if (form) {
            form.addEventListener('submit', (e) => this.handleSaveTransaction(e));
        }

        ['filterTxMonth', 'filterTxType', 'filterTxCategory', 'filterTxWallet'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('change', () => this.loadTransactions());
        });
    }
};

window.transactionsModule = transactionsModule;
