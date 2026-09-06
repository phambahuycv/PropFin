// Wallets & Accounts Management Module
const walletsModule = {
    allWallets: [],
    banksList: [],
    editingWallet: null,

    async init() {
        await this.loadBanks();
        await this.loadWallets();
        this.bindEvents();
    },

    async loadBanks() {
        try {
            this.banksList = await api.getBanks();
            this.populateBankDropdown();
        } catch (error) {
            console.error('Failed to load banks:', error);
        }
    },

    populateBankDropdown() {
        const select = document.getElementById('bankCodeSelect');
        if (!select) return;
        select.innerHTML = '<option value="">-- Chọn ngân hàng --</option>' + 
            this.banksList.map(b => `<option value="${b.code}" data-name="${b.name}">${b.name} (${b.code})</option>`).join('');
    },

    async loadWallets() {
        try {
            const wallets = await api.getWallets();
            this.allWallets = wallets;
            this.renderWallets(wallets);
        } catch (error) {
            window.showToast('Không thể tải danh sách ví: ' + error.message, 'error');
        }
    },

    renderWallets(wallets) {
        const bankContainer = document.getElementById('bankWalletsList');
        const cashContainer = document.getElementById('cashWalletsList');
        const totalBalEl = document.getElementById('walletsPageTotalBalance');

        const totalBalance = wallets.reduce((sum, w) => sum + (w.balance || 0), 0);
        if (totalBalEl) totalBalEl.textContent = window.formatCurrency(totalBalance);

        const banks = wallets.filter(w => w.type === 'bank');
        const cashs = wallets.filter(w => w.type === 'cash' || w.type === 'e_wallet');

        if (bankContainer) {
            if (banks.length === 0) {
                bankContainer.innerHTML = `
                    <div class="empty-state-box">
                        <i class="fa-solid fa-building-columns" style="font-size:32px; color:var(--text-dim); margin-bottom:8px;"></i>
                        <p>Chưa có tài khoản ngân hàng nào. Hãy thêm tài khoản để nhận chuyển khoản và tạo VietQR!</p>
                    </div>
                `;
            } else {
                bankContainer.innerHTML = banks.map(w => this.generateBankCard(w)).join('');
            }
        }

        if (cashContainer) {
            if (cashs.length === 0) {
                cashContainer.innerHTML = `
                    <div class="empty-state-box">
                        <i class="fa-solid fa-wallet" style="font-size:32px; color:var(--text-dim); margin-bottom:8px;"></i>
                        <p>Chưa có ví tiền mặt nào. Hãy thêm ví tiền mặt để quản lý chi tiêu và thu tiền mặt trực tiếp!</p>
                    </div>
                `;
            } else {
                cashContainer.innerHTML = cashs.map(w => this.generateCashCard(w)).join('');
            }
        }
    },

    generateBankCard(w) {
        const isDefault = Boolean(w.is_default);
        return `
            <div class="bank-card-item">
                <div class="bank-card-inner">
                    <div class="bank-card-top">
                        <div class="bank-chip">
                            <i class="fa-solid fa-microchip"></i>
                            <span class="bank-brand">${w.bank_name || 'NGÂN HÀNG'}</span>
                        </div>
                        ${isDefault ? '<span class="bank-badge-default"><i class="fa-solid fa-star"></i> Mặc định VietQR</span>' : ''}
                    </div>

                    <div class="bank-card-name">${w.name}</div>
                    
                    <div class="bank-card-number">
                        ${w.account_number ? w.account_number.replace(/(\d{4})/g, '$1 ').trim() : '•••• •••• •••• ••••'}
                    </div>

                    <div class="bank-card-bottom">
                        <div>
                            <div class="bank-label">CHỦ TÀI KHOẢN</div>
                            <div class="bank-holder">${w.account_holder || 'CHƯA CẬP NHẬT'}</div>
                        </div>
                        <div style="text-align:right;">
                            <div class="bank-label">SỐ DƯ KHẢ DỤNG</div>
                            <div class="bank-balance">${window.formatCurrency(w.balance)}</div>
                        </div>
                    </div>
                </div>

                <div class="wallet-card-actions">
                    <button class="btn btn-sm btn-outline" onclick="walletsModule.openEditModal(${w.id})">
                        <i class="fa-solid fa-pen"></i> Sửa
                    </button>
                    ${!isDefault ? `
                        <button class="btn btn-sm btn-outline" title="Đặt làm ví nhận tiền mặc định" onclick="walletsModule.setDefaultWallet(${w.id})">
                            <i class="fa-regular fa-star"></i> Đặt mặc định
                        </button>
                    ` : ''}
                    <button class="btn btn-sm btn-danger-outline" onclick="walletsModule.deleteWallet(${w.id}, '${w.name}')">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    },

    generateCashCard(w) {
        return `
            <div class="cash-card-item">
                <div class="cash-card-body">
                    <div class="cash-card-icon">
                        <i class="fa-solid fa-money-bill-wave"></i>
                    </div>
                    <div class="cash-card-info">
                        <div class="cash-card-title">${w.name}</div>
                        <div class="cash-card-subtitle">Ví tiền mặt vật lý / Tiền thu trực tiếp</div>
                        <div class="cash-card-balance">${window.formatCurrency(w.balance)}</div>
                    </div>
                </div>
                <div class="wallet-card-actions">
                    <button class="btn btn-sm btn-outline" onclick="walletsModule.openEditModal(${w.id})">
                        <i class="fa-solid fa-pen"></i> Sửa
                    </button>
                    <button class="btn btn-sm btn-danger-outline" onclick="walletsModule.deleteWallet(${w.id}, '${w.name}')">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    },

    // Modal: Thêm Tài Khoản Ngân Hàng
    openAddBankModal() {
        this.editingWallet = null;
        document.getElementById('formBankWallet').reset();
        document.getElementById('bankWalletId').value = '';
        document.getElementById('bankWalletModalTitle').textContent = 'Thêm Tài Khoản Ngân Hàng Mới';
        document.getElementById('modalBankWallet').classList.add('active');
    },

    // Modal: Thêm Ví Tiền Mặt
    openAddCashModal() {
        this.editingWallet = null;
        document.getElementById('formCashWallet').reset();
        document.getElementById('cashWalletId').value = '';
        document.getElementById('cashWalletModalTitle').textContent = 'Thêm Ví Tiền Mặt Mới';
        document.getElementById('modalCashWallet').classList.add('active');
    },

    // Sửa ví (Tự động mở đúng modal)
    openEditModal(walletId) {
        const w = this.allWallets.find(x => x.id === walletId);
        if (!w) return;
        this.editingWallet = w;

        if (w.type === 'bank') {
            document.getElementById('bankWalletModalTitle').textContent = `Chỉnh sửa: ${w.name}`;
            document.getElementById('bankWalletId').value = w.id;
            document.getElementById('bankWalletName').value = w.name;
            document.getElementById('bankCodeSelect').value = w.bank_code || '';
            document.getElementById('bankAccountNumber').value = w.account_number || '';
            document.getElementById('bankAccountHolder').value = w.account_holder || '';
            document.getElementById('bankBalance').value = w.balance || 0;
            document.getElementById('bankIsDefault').checked = Boolean(w.is_default);
            document.getElementById('modalBankWallet').classList.add('active');
        } else {
            document.getElementById('cashWalletModalTitle').textContent = `Chỉnh sửa: ${w.name}`;
            document.getElementById('cashWalletId').value = w.id;
            document.getElementById('cashWalletName').value = w.name;
            document.getElementById('cashBalance').value = w.balance || 0;
            document.getElementById('modalCashWallet').classList.add('active');
        }
    },

    async handleSaveBank(e) {
        e.preventDefault();
        const id = document.getElementById('bankWalletId').value;
        const name = document.getElementById('bankWalletName').value.trim();
        const bankSelect = document.getElementById('bankCodeSelect');
        const bank_code = bankSelect.value;
        const selectedOpt = bankSelect.selectedOptions[0];
        const bank_name = selectedOpt ? (selectedOpt.getAttribute('data-name') || bank_code) : '';
        const account_number = document.getElementById('bankAccountNumber').value.trim();
        const account_holder = document.getElementById('bankAccountHolder').value.trim().toUpperCase();
        const balance = parseFloat(document.getElementById('bankBalance').value) || 0;
        const is_default = document.getElementById('bankIsDefault').checked ? 1 : 0;

        if (!name) {
            window.showToast('Vui lòng nhập tên tài khoản hiển thị', 'error');
            return;
        }

        const payload = {
            name,
            type: 'bank',
            balance,
            account_number,
            bank_code,
            bank_name,
            account_holder,
            is_default
        };

        try {
            if (id) {
                await api.updateWallet(id, payload);
                window.showToast('Đã cập nhật tài khoản ngân hàng thành công', 'success');
            } else {
                await api.createWallet(payload);
                window.showToast('Đã thêm tài khoản ngân hàng mới thành công', 'success');
            }
            document.getElementById('modalBankWallet').classList.remove('active');
            await this.refreshAll();
        } catch (error) {
            window.showToast(error.message, 'error');
        }
    },

    async handleSaveCash(e) {
        e.preventDefault();
        const id = document.getElementById('cashWalletId').value;
        const name = document.getElementById('cashWalletName').value.trim();
        const balance = parseFloat(document.getElementById('cashBalance').value) || 0;

        if (!name) {
            window.showToast('Vui lòng nhập tên ví tiền mặt', 'error');
            return;
        }

        const payload = {
            name,
            type: 'cash',
            balance,
            account_number: '',
            bank_code: '',
            bank_name: '',
            account_holder: '',
            is_default: 0
        };

        try {
            if (id) {
                await api.updateWallet(id, payload);
                window.showToast('Đã cập nhật ví tiền mặt thành công', 'success');
            } else {
                await api.createWallet(payload);
                window.showToast('Đã thêm ví tiền mặt mới thành công', 'success');
            }
            document.getElementById('modalCashWallet').classList.remove('active');
            await this.refreshAll();
        } catch (error) {
            window.showToast(error.message, 'error');
        }
    },

    async setDefaultWallet(walletId) {
        try {
            await api.updateWallet(walletId, { is_default: 1 });
            window.showToast('Đã đặt làm tài khoản mặc định nhận thanh toán QR', 'success');
            await this.refreshAll();
        } catch (error) {
            window.showToast(error.message, 'error');
        }
    },

    async deleteWallet(walletId, walletName) {
        if (!confirm(`Bạn có chắc chắn muốn xóa ví "${walletName}"? Chỉ có thể xóa ví khi chưa có giao dịch thu chi liên kết.`)) return;
        try {
            const res = await api.deleteWallet(walletId);
            window.showToast(res.message || 'Đã xóa ví thành công', 'success');
            await this.refreshAll();
        } catch (error) {
            window.showToast(error.message, 'error');
        }
    },

    async refreshAll() {
        await this.loadWallets();
        await window.app?.refreshGlobalStats();
        await window.transactionsModule?.loadDependencies();
    },

    bindEvents() {
        const formBank = document.getElementById('formBankWallet');
        if (formBank) formBank.addEventListener('submit', (e) => this.handleSaveBank(e));

        const formCash = document.getElementById('formCashWallet');
        if (formCash) formCash.addEventListener('submit', (e) => this.handleSaveCash(e));
    }
};

window.walletsModule = walletsModule;
