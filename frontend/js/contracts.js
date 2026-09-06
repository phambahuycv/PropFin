// Dedicated Contracts Management Module
const contractsModule = {
    allContracts: [],
    availableRooms: [],

    async init() {
        await this.loadContracts();
        this.bindEvents();
    },

    async loadContracts() {
        const propFilter = document.getElementById('filterContractProperty')?.value || '';
        const statusFilter = document.getElementById('filterContractStatus')?.value || '';
        const searchInput = document.getElementById('searchContractInput')?.value.trim() || '';

        const params = {};
        if (propFilter) params.property_id = propFilter;
        if (statusFilter) params.status = statusFilter;
        if (searchInput) params.search = searchInput;

        try {
            const contracts = await api.getContracts(params);
            this.allContracts = contracts;
            this.renderContractsTable(contracts);
            this.renderContractStats(contracts);
        } catch (error) {
            window.showToast('Không thể tải danh sách hợp đồng: ' + error.message, 'error');
        }
    },

    renderContractStats(contracts) {
        const total = contracts.length;
        const active = contracts.filter(c => c.status === 'active').length;
        const totalDeposit = contracts.filter(c => c.status === 'active').reduce((sum, c) => sum + (c.deposit_amount || 0), 0);
        const monthlyRent = contracts.filter(c => c.status === 'active').reduce((sum, c) => sum + (c.rent_price || 0), 0);

        const elTotal = document.getElementById('contractStatTotal');
        const elActive = document.getElementById('contractStatActive');
        const elDeposit = document.getElementById('contractStatDeposit');
        const elRent = document.getElementById('contractStatMonthlyRent');

        if (elTotal) elTotal.textContent = total;
        if (elActive) elActive.textContent = active;
        if (elDeposit) elDeposit.textContent = window.formatCurrency(totalDeposit);
        if (elRent) elRent.textContent = window.formatCurrency(monthlyRent);
    },

    renderContractsTable(contracts) {
        const tbody = document.getElementById('contractsTableBody');
        if (!tbody) return;

        if (contracts.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align:center; padding:40px; color:var(--text-dim);">
                        <i class="fa-solid fa-file-contract" style="font-size:36px; margin-bottom:10px; display:block;"></i>
                        Chưa có hợp đồng nào phù hợp với bộ lọc tìm kiếm.
                    </td>
                </tr>
            `;
            return;
        }

        const today = new Date();

        tbody.innerHTML = contracts.map(c => {
            let statusBadge = '<span class="badge badge-success"><i class="fa-solid fa-check"></i> Đang hiệu lực</span>';
            if (c.status === 'ended') {
                statusBadge = '<span class="badge badge-neutral"><i class="fa-solid fa-clock-rotate-left"></i> Đã kết thúc</span>';
            } else if (c.status === 'ending_soon') {
                statusBadge = '<span class="badge badge-warning"><i class="fa-solid fa-triangle-exclamation"></i> Sắp hết hạn</span>';
            } else {
                // Check if expiry date is within 30 days
                if (c.checkout_expected) {
                    const expiry = new Date(c.checkout_expected);
                    const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
                    if (diffDays <= 30 && diffDays >= 0) {
                        statusBadge = `<span class="badge badge-warning"><i class="fa-solid fa-clock"></i> Còn ${diffDays} ngày</span>`;
                    } else if (diffDays < 0) {
                        statusBadge = '<span class="badge badge-danger"><i class="fa-solid fa-circle-exclamation"></i> Quá hạn</span>';
                    }
                }
            }

            return `
                <tr>
                    <td>
                        <div style="font-weight:700; color:var(--primary); font-size:14px;">#HĐ-${c.id}</div>
                        <div style="font-size:11.5px; color:var(--text-dim);">Ngày lập: ${c.created_at ? c.created_at.split(' ')[0] : 'N/A'}</div>
                    </td>
                    <td>
                        <div style="font-weight:700; font-size:14px; color:var(--text-main);">${c.room_code}</div>
                        <div style="font-size:12px; color:var(--text-muted);"><i class="fa-solid fa-building" style="font-size:11px;"></i> ${c.property_name || 'Căn hộ chung'} (Tầng ${c.floor})</div>
                    </td>
                    <td>
                        <div style="font-weight:700; color:var(--text-main);">${c.tenant_name}</div>
                        <div style="font-size:12px; color:var(--text-muted);"><i class="fa-solid fa-phone" style="font-size:10px;"></i> ${c.tenant_phone}</div>
                        ${c.tenant_id_card ? `<div style="font-size:11px; color:var(--text-dim);">CCCD: ${c.tenant_id_card}</div>` : ''}
                    </td>
                    <td>
                        <div style="font-size:12.5px;"><strong>Vào ở:</strong> ${c.checkin_date}</div>
                        <div style="font-size:12.5px;"><strong>Hết hạn:</strong> ${c.checkout_expected}</div>
                        <div style="font-size:11.5px; color:var(--text-dim);">Thu tiền mùng ${c.billing_day} hàng tháng</div>
                    </td>
                    <td>
                        <div style="font-weight:700; color:var(--success); font-size:14px;">${window.formatCurrency(c.rent_price)}<span style="font-size:11px; font-weight:normal; color:var(--text-muted);">/th</span></div>
                        <div style="font-size:12px; color:var(--text-muted);">Cọc: <strong>${window.formatCurrency(c.deposit_amount)}</strong></div>
                    </td>
                    <td>
                        ${statusBadge}
                    </td>
                    <td style="text-align:right;">
                        <div style="display:inline-flex; gap:6px;">
                            <button class="btn btn-sm btn-outline" title="Xem chi tiết & In phiếu" onclick="roomsModule.openContractDetailModal(${c.id})">
                                <i class="fa-solid fa-eye"></i> Chi tiết
                            </button>
                            ${c.status === 'active' ? `
                                <button class="btn btn-sm btn-outline" style="color:var(--danger); border-color:var(--danger);" title="Kết thúc hợp đồng / Trả phòng" onclick="contractsModule.terminateContract(${c.id})">
                                    <i class="fa-solid fa-door-open"></i> Trả phòng
                                </button>
                            ` : ''}
                            <button class="btn btn-sm btn-danger-outline" title="Xóa hợp đồng này" onclick="contractsModule.deleteContract(${c.id})">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    },

    // Modal: Tạo Hợp Đồng Mới Độc Lập
    async openAddContractModal() {
        document.getElementById('formIndependentContract').reset();

        // Load danh sách căn hộ / tòa nhà
        const propSelect = document.getElementById('indepContractPropertySelect');
        if (propSelect && window.propertiesModule?.allProperties) {
            propSelect.innerHTML = '<option value="">-- Chọn Căn hộ / Tòa nhà --</option>' + 
                window.propertiesModule.allProperties.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
        }

        const roomSelect = document.getElementById('indepContractRoomSelect');
        if (roomSelect) {
            roomSelect.innerHTML = '<option value="">-- Vui lòng chọn Căn hộ trước --</option>';
            roomSelect.disabled = true;
        }

        // Set default dates
        const today = new Date();
        const nextYear = new Date();
        nextYear.setFullYear(today.getFullYear() + 1);

        document.getElementById('indepCheckinDate').value = today.toISOString().split('T')[0];
        document.getElementById('indepCheckoutDate').value = nextYear.toISOString().split('T')[0];

        document.getElementById('modalIndependentContract').classList.add('active');
    },

    async onPropertyChangeForContract(propertyId) {
        const roomSelect = document.getElementById('indepContractRoomSelect');
        if (!roomSelect) return;

        if (!propertyId) {
            roomSelect.innerHTML = '<option value="">-- Vui lòng chọn Căn hộ trước --</option>';
            roomSelect.disabled = true;
            return;
        }

        try {
            // Lấy danh sách các phòng còn TRỐNG của căn hộ này
            const rooms = await api.getRooms({ property_id: propertyId, status: 'empty' });
            this.availableRooms = rooms;

            if (rooms.length === 0) {
                roomSelect.innerHTML = '<option value="">-- Hết phòng trống trong căn hộ này --</option>';
                roomSelect.disabled = true;
            } else {
                roomSelect.innerHTML = '<option value="">-- Chọn phòng trống để ký HĐ --</option>' + 
                    rooms.map(r => `<option value="${r.id}" data-price="${r.base_price}" data-deposit="${r.default_deposit}">${r.room_code} (Tầng ${r.floor} - ${r.position === 'outside' ? 'Mặt ngoài' : 'Mặt trong'} - ${window.formatCurrency(r.base_price)}/tháng)</option>`).join('');
                roomSelect.disabled = false;
            }
        } catch (error) {
            window.showToast('Lỗi khi tải danh sách phòng trống: ' + error.message, 'error');
        }
    },

    onRoomSelectedForContract(roomId) {
        if (!roomId) return;
        const room = this.availableRooms.find(r => r.id == roomId);
        if (room) {
            document.getElementById('indepRentPrice').value = room.base_price || 0;
            document.getElementById('indepDepositAmount').value = room.default_deposit || room.base_price || 0;
        }
    },

    async handleSaveIndependentContract(e) {
        e.preventDefault();
        const room_id = parseInt(document.getElementById('indepContractRoomSelect').value);
        if (!room_id) {
            window.showToast('Vui lòng chọn một phòng trống để lập hợp đồng', 'error');
            return;
        }

        const tenant_name = document.getElementById('indepTenantName').value.trim();
        const tenant_phone = document.getElementById('indepTenantPhone').value.trim();
        const tenant_id_card = document.getElementById('indepTenantIdCard').value.trim();
        const billing_day = parseInt(document.getElementById('indepBillingDay').value) || 5;

        const checkin_date = document.getElementById('indepCheckinDate').value;
        const checkout_expected = document.getElementById('indepCheckoutDate').value;
        const rent_price = parseFloat(document.getElementById('indepRentPrice').value) || 0;
        const deposit_amount = parseFloat(document.getElementById('indepDepositAmount').value) || 0;

        // Biểu phí dịch vụ
        const electricity_rate = parseFloat(document.getElementById('indepElecRate').value) || 3500;
        const water_billing_type = document.getElementById('indepWaterType').value;
        const water_rate = parseFloat(document.getElementById('indepWaterRate').value) || 30000;
        const water_person_count = parseInt(document.getElementById('indepWaterCount').value) || 1;
        const internet_fee = parseFloat(document.getElementById('indepInternetFee').value) || 100000;
        const garbage_fee = parseFloat(document.getElementById('indepGarbageFee').value) || 30000;
        const parking_fee = parseFloat(document.getElementById('indepParkingFee').value) || 0;
        const other_fee = parseFloat(document.getElementById('indepOtherFee').value) || 0;
        const other_fee_note = document.getElementById('indepOtherNote').value.trim();

        if (!tenant_name || !tenant_phone || !checkin_date || !checkout_expected) {
            window.showToast('Vui lòng điền đầy đủ họ tên, SĐT và thời hạn hợp đồng', 'error');
            return;
        }

        try {
            await api.createContract({
                room_id,
                tenant_name,
                tenant_phone,
                tenant_id_card,
                checkin_date,
                checkout_expected,
                rent_price,
                deposit_amount,
                electricity_rate,
                water_rate,
                water_billing_type,
                water_person_count,
                internet_fee,
                garbage_fee,
                parking_fee,
                other_fee,
                other_fee_note,
                billing_day,
                status: 'active',
                notes: 'Tạo từ phân hệ Quản lý Hợp đồng'
            });

            window.showToast('Kích hoạt hợp đồng mới thành công!', 'success');
            document.getElementById('modalIndependentContract').classList.remove('active');
            await this.loadContracts();
            await window.roomsModule?.loadRooms();
            await window.propertiesModule?.loadProperties();
            await window.app?.refreshGlobalStats();
        } catch (error) {
            window.showToast(error.message, 'error');
        }
    },

    async terminateContract(contractId) {
        if (!confirm('Bạn có chắc chắn muốn kết thúc hợp đồng này? Phòng sẽ được chuyển về trạng thái Trống và chốt trả phòng hôm nay.')) return;
        try {
            await api.terminateContract(contractId);
            window.showToast('Đã kết thúc hợp đồng thành công', 'success');
            await this.loadContracts();
            await window.roomsModule?.loadRooms();
            await window.propertiesModule?.loadProperties();
            await window.app?.refreshGlobalStats();
        } catch (error) {
            window.showToast(error.message, 'error');
        }
    },

    async deleteContract(contractId) {
        if (!confirm('Bạn có chắc chắn muốn xóa hợp đồng này khỏi hệ thống? Phòng sẽ được chuyển về trạng thái Trống.')) return;
        try {
            await api.deleteContract(contractId);
            window.showToast('Đã xóa hợp đồng thành công', 'success');
            await this.loadContracts();
            await window.roomsModule?.loadRooms();
            await window.propertiesModule?.loadProperties();
            await window.app?.refreshGlobalStats();
        } catch (error) {
            window.showToast(error.message, 'error');
        }
    },

    bindEvents() {
        const form = document.getElementById('formIndependentContract');
        if (form) form.addEventListener('submit', (e) => this.handleSaveIndependentContract(e));

        const propSelect = document.getElementById('indepContractPropertySelect');
        if (propSelect) propSelect.addEventListener('change', (e) => this.onPropertyChangeForContract(e.target.value));

        const roomSelect = document.getElementById('indepContractRoomSelect');
        if (roomSelect) roomSelect.addEventListener('change', (e) => this.onRoomSelectedForContract(e.target.value));

        ['filterContractProperty', 'filterContractStatus'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('change', () => this.loadContracts());
        });

        const searchInput = document.getElementById('searchContractInput');
        if (searchInput) {
            let debounceTimer;
            searchInput.addEventListener('input', () => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => this.loadContracts(), 300);
            });
        }
    }
};

window.contractsModule = contractsModule;
