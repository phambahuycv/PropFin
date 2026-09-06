// Invoices, Meter Readings & VietQR Billing Module
const invoicesModule = {
    allInvoices: [],
    currentInvoice: null,
    suggestData: null,

    async init() {
        await this.loadInvoices();
        this.bindEvents();
    },

    async loadInvoices() {
        const month = document.getElementById('filterInvMonth')?.value || '';
        const status = document.getElementById('filterInvStatus')?.value || '';
        const roomId = document.getElementById('filterInvRoom')?.value || '';

        const params = {};
        if (month) params.month = month;
        if (status) params.payment_status = status;
        if (roomId) params.room_id = roomId;

        try {
            const list = await api.getInvoices(params);
            this.allInvoices = list;
            this.renderTable(list);
            this.renderStats(list);
        } catch (error) {
            window.showToast('Lỗi khi tải danh sách hóa đơn: ' + error.message, 'error');
        }
    },

    renderTable(list) {
        const tbody = document.getElementById('invTableBody');
        if (!tbody) return;

        if (list.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align:center; padding:36px; color:var(--text-dim);">
                        <i class="fa-solid fa-file-invoice-dollar" style="font-size:32px; margin-bottom:10px; display:block;"></i>
                        Chưa có hóa đơn nào cho tháng được chọn.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = list.map(inv => {
            const isPaid = inv.payment_status === 'paid';
            const statusBadge = isPaid
                ? '<span class="badge badge-success"><i class="fa-solid fa-check-circle"></i> Đã thanh toán</span>'
                : '<span class="badge badge-warning"><i class="fa-solid fa-clock"></i> Chưa thu tiền</span>';

            return `
                <tr>
                    <td>
                        <strong>${inv.billing_month}</strong>
                        <div style="font-size:11.5px; color:var(--text-dim);">Lập: ${inv.billing_date}</div>
                    </td>
                    <td>
                        <strong style="font-size:15px; color:var(--primary);">${inv.room_code}</strong>
                        <div style="font-size:12px; color:var(--text-muted);">${inv.tenant_name} (${inv.tenant_phone || '-'})</div>
                    </td>
                    <td>
                        <div style="font-size:12.5px;">⚡ Điện: <strong>${inv.electricity_usage} kWh</strong> (${window.formatCurrency(inv.electricity_amount)})</div>
                        <div style="font-size:12.5px;">💧 Nước: <strong>${inv.water_usage || '-'}</strong> (${window.formatCurrency(inv.water_amount)})</div>
                    </td>
                    <td>
                        <div style="font-size:12.5px;">Phòng: ${window.formatCurrency(inv.room_amount)}</div>
                        <div style="font-size:11.5px; color:var(--text-dim);">Dịch vụ: ${window.formatCurrency(inv.internet_amount + inv.garbage_amount + inv.parking_amount + inv.other_amount)}</div>
                    </td>
                    <td>
                        <strong style="font-size:15px; color:var(--text-main);">${window.formatCurrency(inv.total_amount)}</strong>
                    </td>
                    <td>${statusBadge}</td>
                    <td style="text-align:right;">
                        <div style="display:flex; gap:6px; justify-content:flex-end;">
                            <button class="btn btn-outline" style="padding:6px 10px; font-size:12px;" onclick="invoicesModule.openBillPreviewModal(${inv.id})">
                                <i class="fa-solid fa-receipt"></i> Xem Phiếu/QR
                            </button>
                            ${!isPaid ? `
                                <button class="btn btn-success" style="padding:6px 10px; font-size:12px;" onclick="invoicesModule.openPayModal(${inv.id})">
                                    <i class="fa-solid fa-check"></i> Thu tiền
                                </button>
                            ` : ''}
                            <button class="btn-icon" style="width:30px; height:30px;" title="Xóa hóa đơn" onclick="invoicesModule.deleteInvoice(${inv.id})">
                                <i class="fa-solid fa-trash" style="font-size:12px; color:var(--danger);"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    },

    renderStats(list) {
        let totalBilled = 0;
        let totalCollected = 0;
        let totalUnpaid = 0;

        list.forEach(inv => {
            totalBilled += inv.total_amount;
            if (inv.payment_status === 'paid') totalCollected += inv.paid_amount || inv.total_amount;
            else totalUnpaid += inv.total_amount;
        });

        const billedEl = document.getElementById('statInvTotalBilled');
        const collectedEl = document.getElementById('statInvCollected');
        const unpaidEl = document.getElementById('statInvUnpaid');

        if (billedEl) billedEl.textContent = window.formatCurrency(totalBilled);
        if (collectedEl) collectedEl.textContent = window.formatCurrency(totalCollected);
        if (unpaidEl) unpaidEl.textContent = window.formatCurrency(totalUnpaid);
    },

    // --- Modal: Chốt điện nước nhanh ---
    async openQuickBillModal(roomId) {
        try {
            const data = await api.getInvoiceSuggest(roomId);
            this.suggestData = data;

            document.getElementById('billRoomName').textContent = `${data.room_code} (Tầng ${data.floor})`;
            document.getElementById('billTenantName').textContent = `${data.tenant_name} (${data.tenant_phone})`;
            document.getElementById('billMonthInput').value = data.billing_month;
            document.getElementById('billDateInput').value = data.billing_date;

            document.getElementById('billPrevElec').value = data.prev_electricity;
            document.getElementById('billCurrElec').value = data.prev_electricity;
            document.getElementById('billElecRate').value = data.electricity_rate;

            document.getElementById('billWaterType').value = data.water_billing_type;
            document.getElementById('billPrevWater').value = data.prev_water;
            document.getElementById('billCurrWater').value = data.prev_water;
            document.getElementById('billWaterRate').value = data.water_rate;
            document.getElementById('billWaterCount').value = data.water_person_count;

            document.getElementById('billRoomAmount').value = data.room_amount;
            document.getElementById('billInternetAmount').value = data.internet_amount;
            document.getElementById('billGarbageAmount').value = data.garbage_amount;
            document.getElementById('billParkingAmount').value = data.parking_amount;
            document.getElementById('billOtherAmount').value = data.other_amount;
            document.getElementById('billOtherNote').value = data.other_note || '';
            document.getElementById('billDiscountAmount').value = 0;

            this.calculateLiveBill();
            document.getElementById('modalQuickBill').classList.add('active');
        } catch (error) {
            window.showToast(error.message, 'error');
        }
    },

    calculateLiveBill() {
        const prevElec = parseFloat(document.getElementById('billPrevElec')?.value) || 0;
        const currElec = parseFloat(document.getElementById('billCurrElec')?.value) || 0;
        const elecRate = parseFloat(document.getElementById('billElecRate')?.value) || 3500;
        const elecUsage = Math.max(0, currElec - prevElec);
        const elecAmount = elecUsage * elecRate;

        const waterType = document.getElementById('billWaterType')?.value || 'per_person';
        const prevWater = parseFloat(document.getElementById('billPrevWater')?.value) || 0;
        const currWater = parseFloat(document.getElementById('billCurrWater')?.value) || 0;
        const waterRate = parseFloat(document.getElementById('billWaterRate')?.value) || 30000;
        const waterCount = parseInt(document.getElementById('billWaterCount')?.value) || 1;

        let waterAmount = 0;
        let waterUsageText = '';
        if (waterType === 'meter') {
            const waterUsage = Math.max(0, currWater - prevWater);
            waterAmount = waterUsage * waterRate;
            waterUsageText = `${waterUsage} m³`;
        } else if (waterType === 'per_person') {
            waterAmount = waterCount * waterRate;
            waterUsageText = `${waterCount} người`;
        } else {
            waterAmount = waterRate;
            waterUsageText = 'Cố định';
        }

        const roomAmount = parseFloat(document.getElementById('billRoomAmount')?.value) || 0;
        const internet = parseFloat(document.getElementById('billInternetAmount')?.value) || 0;
        const garbage = parseFloat(document.getElementById('billGarbageAmount')?.value) || 0;
        const parking = parseFloat(document.getElementById('billParkingAmount')?.value) || 0;
        const other = parseFloat(document.getElementById('billOtherAmount')?.value) || 0;
        const discount = parseFloat(document.getElementById('billDiscountAmount')?.value) || 0;

        const total = roomAmount + elecAmount + waterAmount + internet + garbage + parking + other - discount;

        // Update preview labels
        const elecSummary = document.getElementById('billElecLiveSummary');
        const waterSummary = document.getElementById('billWaterLiveSummary');
        const totalSummary = document.getElementById('billTotalLiveSummary');

        if (elecSummary) elecSummary.textContent = `${elecUsage} kWh = ${window.formatCurrency(elecAmount)}`;
        if (waterSummary) waterSummary.textContent = `${waterUsageText} = ${window.formatCurrency(waterAmount)}`;
        if (totalSummary) totalSummary.textContent = window.formatCurrency(total);

        return {
            elecUsage,
            elecAmount,
            waterAmount,
            total
        };
    },

    async handleSaveInvoice(e) {
        e.preventDefault();
        if (!this.suggestData) return;

        const calc = this.calculateLiveBill();
        const payload = {
            contract_id: this.suggestData.contract_id,
            room_id: this.suggestData.room_id,
            billing_month: document.getElementById('billMonthInput').value,
            billing_date: document.getElementById('billDateInput').value,
            prev_electricity: parseFloat(document.getElementById('billPrevElec').value) || 0,
            curr_electricity: parseFloat(document.getElementById('billCurrElec').value) || 0,
            electricity_usage: calc.elecUsage,
            electricity_rate: parseFloat(document.getElementById('billElecRate').value) || 3500,
            electricity_amount: calc.elecAmount,
            water_billing_type: document.getElementById('billWaterType').value,
            prev_water: parseFloat(document.getElementById('billPrevWater').value) || 0,
            curr_water: parseFloat(document.getElementById('billCurrWater').value) || 0,
            water_usage: 0,
            water_rate: parseFloat(document.getElementById('billWaterRate').value) || 30000,
            water_amount: calc.waterAmount,
            room_amount: parseFloat(document.getElementById('billRoomAmount').value) || 0,
            internet_amount: parseFloat(document.getElementById('billInternetAmount').value) || 0,
            garbage_amount: parseFloat(document.getElementById('billGarbageAmount').value) || 0,
            parking_amount: parseFloat(document.getElementById('billParkingAmount').value) || 0,
            other_amount: parseFloat(document.getElementById('billOtherAmount').value) || 0,
            other_note: document.getElementById('billOtherNote').value.trim(),
            discount_amount: parseFloat(document.getElementById('billDiscountAmount').value) || 0,
            total_amount: calc.total,
            payment_status: 'unpaid',
            paid_amount: 0,
            paid_date: null,
            wallet_id: null,
            notes: 'Lập hóa đơn tiền trọ tháng'
        };

        try {
            const newInv = await api.createInvoice(payload);
            window.showToast('Đã tạo hóa đơn tiền trọ thành công!', 'success');
            document.getElementById('modalQuickBill').classList.remove('active');
            await this.loadInvoices();
            await window.app.refreshGlobalStats();
            
            // Open bill preview immediately
            this.openBillPreviewModal(newInv.id);
        } catch (error) {
            window.showToast(error.message, 'error');
        }
    },

    // --- Modal: Xem Hóa đơn / Bill Zalo / VietQR ---
    async openBillPreviewModal(invoiceId) {
        try {
            const inv = await api.getInvoice(invoiceId);
            this.currentInvoice = inv;

            // Tìm ví ngân hàng mặc định để sinh QR
            const wallets = window.transactionsModule?.allWallets || await api.getWallets();
            const bankWallet = wallets.find(w => w.type === 'bank' && w.account_number) || wallets.find(w => w.type === 'bank') || wallets[0];

            let qrUrl = '';
            let bankInfoText = '';
            if (bankWallet && bankWallet.account_number) {
                const bankCode = bankWallet.bank_code || 'MB';
                const accNum = bankWallet.account_number;
                const accName = bankWallet.account_holder || 'CHU NHA';
                const memo = `Tien tro ${inv.room_code} thang ${inv.billing_month}`;
                qrUrl = `https://img.vietqr.io/image/${bankCode}-${accNum}-compact2.png?amount=${Math.round(inv.total_amount)}&addInfo=${encodeURIComponent(memo)}&accountName=${encodeURIComponent(accName)}`;
                bankInfoText = `${bankWallet.bank_name || bankCode} - STK: ${accNum} (${accName})`;
            }

            const body = document.getElementById('billPreviewBody');
            body.innerHTML = `
                <div class="invoice-bill-card" id="printableBill">
                    <div class="bill-header">
                        <div class="bill-title">PHIẾU THU TIỀN PHÒNG TRỌ</div>
                        <div class="bill-sub">Tháng: <strong>${inv.billing_month}</strong> | Ngày lập: ${inv.billing_date}</div>
                    </div>

                    <div class="bill-info-grid">
                        <div>Phòng: <strong style="color:#4f46e5; font-size:15px;">${inv.room_code} (Tầng ${inv.floor})</strong></div>
                        <div>Khách thuê: <strong>${inv.tenant_name}</strong></div>
                        <div>Số điện thoại: <strong>${inv.tenant_phone || '-'}</strong></div>
                        <div>Trạng thái: <strong style="color:${inv.payment_status === 'paid' ? '#10b981' : '#f59e0b'};">${inv.payment_status === 'paid' ? 'ĐÃ THANH TOÁN' : 'CHƯA THANH TOÁN'}</strong></div>
                    </div>

                    <table class="bill-table">
                        <thead>
                            <tr>
                                <th>Khoản mục</th>
                                <th style="text-align:center;">Chi tiết</th>
                                <th style="text-align:right;">Thành tiền</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><strong>1. Tiền phòng</strong></td>
                                <td style="text-align:center;">1 tháng</td>
                                <td style="text-align:right;"><strong>${window.formatCurrency(inv.room_amount)}</strong></td>
                            </tr>
                            <tr>
                                <td><strong>2. Tiền điện</strong></td>
                                <td style="text-align:center;">${inv.prev_electricity} ➜ ${inv.curr_electricity} (${inv.electricity_usage} kWh x ${window.formatCurrency(inv.electricity_rate)})</td>
                                <td style="text-align:right;"><strong>${window.formatCurrency(inv.electricity_amount)}</strong></td>
                            </tr>
                            <tr>
                                <td><strong>3. Tiền nước</strong></td>
                                <td style="text-align:center;">${inv.water_billing_type === 'meter' ? `${inv.water_usage} m³` : 'Khoán'}</td>
                                <td style="text-align:right;"><strong>${window.formatCurrency(inv.water_amount)}</strong></td>
                            </tr>
                            ${inv.internet_amount > 0 ? `
                                <tr>
                                    <td>4. Mạng Wifi</td>
                                    <td style="text-align:center;">Cố định</td>
                                    <td style="text-align:right;">${window.formatCurrency(inv.internet_amount)}</td>
                                </tr>
                            ` : ''}
                            ${inv.garbage_amount > 0 ? `
                                <tr>
                                    <td>5. Rác & Vệ sinh</td>
                                    <td style="text-align:center;">Cố định</td>
                                    <td style="text-align:right;">${window.formatCurrency(inv.garbage_amount)}</td>
                                </tr>
                            ` : ''}
                            ${inv.parking_amount > 0 ? `
                                <tr>
                                    <td>6. Phí gửi xe</td>
                                    <td style="text-align:center;">Cố định</td>
                                    <td style="text-align:right;">${window.formatCurrency(inv.parking_amount)}</td>
                                </tr>
                            ` : ''}
                            ${inv.other_amount > 0 ? `
                                <tr>
                                    <td>7. Dịch vụ khác (${inv.other_note || 'Khác'})</td>
                                    <td style="text-align:center;">-</td>
                                    <td style="text-align:right;">${window.formatCurrency(inv.other_amount)}</td>
                                </tr>
                            ` : ''}
                            ${inv.discount_amount > 0 ? `
                                <tr>
                                    <td style="color:#f43f5e;">8. Giảm trừ</td>
                                    <td style="text-align:center;">Khuyến mãi</td>
                                    <td style="text-align:right; color:#f43f5e;">-${window.formatCurrency(inv.discount_amount)}</td>
                                </tr>
                            ` : ''}
                            <tr class="total-row">
                                <td colspan="2">TỔNG CỘNG THANH TOÁN:</td>
                                <td style="text-align:right;" class="bill-total-highlight">${window.formatCurrency(inv.total_amount)}</td>
                            </tr>
                        </tbody>
                    </table>

                    ${qrUrl ? `
                        <div class="vietqr-section">
                            <div style="font-weight:700; font-size:13px; color:#1e293b;">QUÉT MÃ VIETQR ĐỂ CHUYỂN KHOẢN NHANH</div>
                            <img src="${qrUrl}" alt="VietQR" class="vietqr-img" />
                            <div class="vietqr-tip">${bankInfoText}</div>
                        </div>
                    ` : ''}
                </div>
            `;

            document.getElementById('btnCopyZaloText').onclick = () => this.copyZaloBillText(inv, bankInfoText);
            document.getElementById('modalBillPreview').classList.add('active');
        } catch (error) {
            window.showToast('Không thể tải chi tiết hóa đơn: ' + error.message, 'error');
        }
    },

    copyZaloBillText(inv, bankInfo) {
        const text = `🏡 THÔNG BÁO TIỀN PHÒNG THÁNG ${inv.billing_month}
Phòng: ${inv.room_code} - Khách: ${inv.tenant_name}
---------------------------------
1. Tiền phòng: ${window.formatCurrency(inv.room_amount)}
2. Tiền điện: ${inv.prev_electricity} -> ${inv.curr_electricity} (${inv.electricity_usage} kWh x ${window.formatCurrency(inv.electricity_rate)}) = ${window.formatCurrency(inv.electricity_amount)}
3. Tiền nước: ${window.formatCurrency(inv.water_amount)}
4. Wifi + Rác + Dịch vụ: ${window.formatCurrency(inv.internet_amount + inv.garbage_amount + inv.parking_amount + inv.other_amount)}
${inv.discount_amount > 0 ? `Giảm trừ: -${window.formatCurrency(inv.discount_amount)}\n` : ''}---------------------------------
👉 TỔNG CỘNG: ${window.formatCurrency(inv.total_amount)}

${bankInfo ? `💳 Thông tin thanh toán:\n${bankInfo}\nNội dung: Tien tro ${inv.room_code} thang ${inv.billing_month}` : 'Vui lòng thanh toán cho quản lý tòa nhà.'}
Cảm ơn bạn!`;

        navigator.clipboard.writeText(text).then(() => {
            window.showToast('Đã sao chép nội dung tin nhắn Zalo!', 'success');
        }).catch(() => {
            window.showToast('Không thể tự sao chép, hãy chọn và copy thủ công', 'warning');
        });
    },

    // --- Modal: Thu tiền / Thanh toán hóa đơn ---
    openPayModal(invoiceId) {
        const inv = this.allInvoices.find(i => i.id === invoiceId);
        if (!inv) return;
        this.currentInvoice = inv;

        document.getElementById('payInvoiceRoomName').textContent = `${inv.room_code} (Tháng ${inv.billing_month})`;
        document.getElementById('payInvoiceAmount').textContent = window.formatCurrency(inv.total_amount);
        document.getElementById('payDateInput').value = new Date().toISOString().split('T')[0];

        // Fill wallets select
        const wallets = (window.walletsModule?.allWallets && window.walletsModule.allWallets.length > 0)
            ? window.walletsModule.allWallets 
            : (window.transactionsModule?.allWallets || []);
        const walletSelect = document.getElementById('payWalletSelect');
        walletSelect.innerHTML = wallets.map(w => `<option value="${w.id}">${w.name} (${window.formatCurrency(w.balance)})</option>`).join('');

        document.getElementById('modalPayInvoice').classList.add('active');
    },

    async handleConfirmPayment(e) {
        e.preventDefault();
        if (!this.currentInvoice) return;

        const wallet_id = parseInt(document.getElementById('payWalletSelect').value);
        const paid_date = document.getElementById('payDateInput').value;

        try {
            await api.payInvoice(this.currentInvoice.id, {
                payment_status: 'paid',
                paid_amount: this.currentInvoice.total_amount,
                paid_date,
                wallet_id,
                auto_create_income: true
            });

            window.showToast('Đã xác nhận thanh toán & đồng bộ vào Sổ Thu Chi!', 'success');
            document.getElementById('modalPayInvoice').classList.remove('active');
            await this.loadInvoices();
            await window.transactionsModule?.loadTransactions();
            await window.app.refreshGlobalStats();
        } catch (error) {
            window.showToast(error.message, 'error');
        }
    },

    async deleteInvoice(id) {
        if (!confirm('Bạn có chắc muốn xóa hóa đơn này? Nếu đã thanh toán, giao dịch thu nhập sẽ được hủy hoàn tiền.')) return;
        try {
            await api.deleteInvoice(id);
            window.showToast('Đã xóa hóa đơn', 'success');
            await this.loadInvoices();
            await window.transactionsModule?.loadTransactions();
            await window.app.refreshGlobalStats();
        } catch (error) {
            window.showToast(error.message, 'error');
        }
    },

    bindEvents() {
        const formBill = document.getElementById('formQuickBill');
        if (formBill) formBill.addEventListener('submit', (e) => this.handleSaveInvoice(e));

        const formPay = document.getElementById('formPayInvoice');
        if (formPay) formPay.addEventListener('submit', (e) => this.handleConfirmPayment(e));

        // Live calculation listeners
        ['billCurrElec', 'billPrevElec', 'billElecRate', 'billCurrWater', 'billPrevWater', 'billWaterRate', 'billWaterCount', 'billRoomAmount', 'billInternetAmount', 'billGarbageAmount', 'billParkingAmount', 'billOtherAmount', 'billDiscountAmount', 'billWaterType'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('input', () => this.calculateLiveBill());
                el.addEventListener('change', () => this.calculateLiveBill());
            }
        });

        ['filterInvMonth', 'filterInvStatus', 'filterInvRoom'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('change', () => this.loadInvoices());
        });
    }
};

window.invoicesModule = invoicesModule;
