// Rooms & Rental Property Management Logic
const roomsModule = {
    allRooms: [],
    selectedRoom: null,

    async init() {
        await this.loadRooms();
        this.bindEvents();
    },

    async loadRooms() {
        const propFilter = document.getElementById('filterRoomProperty')?.value || '';
        const floorFilter = document.getElementById('filterRoomFloor')?.value || '';
        const positionFilter = document.getElementById('filterRoomPosition')?.value || '';
        const statusFilter = document.getElementById('filterRoomStatus')?.value || '';

        const params = {};
        if (propFilter) params.property_id = propFilter;
        if (floorFilter) params.floor = floorFilter;
        if (positionFilter) params.position = positionFilter;
        if (statusFilter) params.status = statusFilter;

        try {
            const rooms = await api.getRooms(params);
            this.allRooms = rooms;
            this.renderFloorMatrix(rooms);
            this.renderRoomStats(rooms);
        } catch (error) {
            window.showToast('Lỗi khi tải danh sách phòng: ' + error.message, 'error');
        }
    },

    renderFloorMatrix(rooms) {
        const container = document.getElementById('floorMatrixContainer');
        if (!container) return;

        if (rooms.length === 0) {
            container.innerHTML = `
                <div style="text-align:center; padding:48px; color:var(--text-dim);">
                    <i class="fa-solid fa-building" style="font-size:40px; margin-bottom:12px; display:block;"></i>
                    Chưa có phòng nào trong danh sách. Hãy nhấn "Thêm phòng mới" để bắt đầu!
                </div>
            `;
            return;
        }

        // Group rooms by floor
        const floors = {};
        rooms.forEach(r => {
            if (!floors[r.floor]) floors[r.floor] = [];
            floors[r.floor].push(r);
        });

        // Sort floors ascending (Tầng 2 -> Tầng 5)
        const sortedFloorKeys = Object.keys(floors).sort((a, b) => parseInt(a) - parseInt(b));

        let html = '';
        sortedFloorKeys.forEach(floorNum => {
            const floorRooms = floors[floorNum];
            const rentedCount = floorRooms.filter(r => r.status === 'rented').length;
            const emptyCount = floorRooms.filter(r => r.status === 'empty').length;

            html += `
                <div class="floor-section">
                    <div class="floor-header">
                        <div class="floor-title">
                            <i class="fa-solid fa-layer-group" style="color:var(--primary);"></i>
                            <span>TẦNG ${floorNum}</span>
                            <span class="floor-badge">${floorRooms.length} Phòng</span>
                        </div>
                        <div style="font-size:12.5px; color:var(--text-muted); display:flex; gap:12px;">
                            <span><strong style="color:var(--success);">${rentedCount}</strong> Đang thuê</span>
                            <span><strong style="color:var(--info);">${emptyCount}</strong> Trống</span>
                        </div>
                    </div>
                    <div class="rooms-grid">
                        ${floorRooms.map(r => this.generateRoomCard(r)).join('')}
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    },

    generateRoomCard(room) {
        const isRented = room.status === 'rented';
        const hasContract = Boolean(room.contract_id);
        const isEmpty = room.status === 'empty';
        const isMaintenance = room.status === 'maintenance';

        let statusBadge = '';
        if (isRented) {
            statusBadge = hasContract 
                ? '<span class="badge badge-success"><i class="fa-solid fa-check"></i> Đang thuê</span>'
                : '<span class="badge badge-warning"><i class="fa-solid fa-user-clock"></i> Chưa có HĐ</span>';
        } else if (isEmpty) {
            statusBadge = '<span class="badge badge-info"><i class="fa-solid fa-door-open"></i> Trống</span>';
        } else {
            statusBadge = '<span class="badge badge-warning"><i class="fa-solid fa-wrench"></i> Đang bảo trì</span>';
        }

        const positionBadge = room.position === 'outside'
            ? '<span class="room-position-badge outside"><i class="fa-solid fa-sun"></i> Mặt ngoài (Ban công)</span>'
            : '<span class="room-position-badge inside"><i class="fa-solid fa-door-closed"></i> Mặt trong</span>';

        return `
            <div class="room-card status-${room.status}">
                <div class="room-card-header">
                    <div class="room-code-group">
                        <span class="room-code">${room.room_code}</span>
                        ${positionBadge}
                    </div>
                    ${statusBadge}
                </div>

                <div style="font-size:12px; color:var(--text-muted); margin-bottom:8px;">
                    <i class="fa-solid fa-building" style="color:var(--primary); font-size:11px;"></i>
                    <strong>${room.property_name || 'Căn hộ chung'}</strong> (Tầng ${room.floor})
                </div>

                <div style="display:flex; justify-content:space-between; align-items:baseline;">
                    <div>
                        <span style="font-size:11px; color:var(--text-dim); text-transform:uppercase;">Giá phòng:</span>
                        <div class="room-price-tag">${window.formatCurrency(room.base_price)}<span style="font-size:11px; color:var(--text-muted); font-weight:normal;">/tháng</span></div>
                    </div>
                    <div style="text-align:right;">
                        <span style="font-size:11px; color:var(--text-dim); text-transform:uppercase;">Tiền cọc:</span>
                        <div style="font-size:13px; font-weight:700; color:var(--text-main);">${window.formatCurrency(room.default_deposit)}</div>
                    </div>
                </div>

                ${isRented && hasContract ? `
                    <div class="room-tenant-info">
                        <div class="tenant-row">
                            <i class="fa-solid fa-user"></i>
                            <span class="tenant-name">${room.tenant_name}</span>
                        </div>
                        <div class="tenant-row">
                            <i class="fa-solid fa-phone"></i>
                            <span>${room.tenant_phone || 'Chưa có SĐT'}</span>
                        </div>
                    </div>
                ` : `
                    <div class="room-tenant-info" style="justify-content:center; color:var(--text-dim); font-style:italic;">
                        ${isRented && !hasContract ? 'Đang đánh dấu Đã thuê (Chưa tạo hợp đồng)' : (isMaintenance ? 'Phòng đang được sửa chữa, dọn dẹp' : 'Phòng đang sẵn sàng đón khách mới')}
                    </div>
                `}

                ${room.amenities ? `
                    <div style="font-size:11.5px; color:var(--text-muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                        <i class="fa-solid fa-tags" style="color:var(--text-dim);"></i> ${room.amenities}
                    </div>
                ` : ''}

                <div class="room-card-actions">
                    ${isRented && hasContract ? `
                        <button class="btn btn-primary" onclick="invoicesModule.openQuickBillModal(${room.id})">
                            <i class="fa-solid fa-calculator"></i> Chốt điện nước
                        </button>
                        <button class="btn btn-outline" onclick="roomsModule.openContractDetailModal(${room.contract_id})">
                            <i class="fa-solid fa-file-contract"></i> Hợp đồng
                        </button>
                    ` : `
                        <button class="btn btn-success" onclick="roomsModule.openAddContractModal(${room.id})">
                            <i class="fa-solid fa-user-plus"></i> Cho thuê
                        </button>
                    `}
                    <button class="btn btn-outline" style="max-width:44px; padding:0;" title="Chỉnh sửa phòng" onclick="roomsModule.openEditRoomModal(${room.id})">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="btn btn-danger-outline" style="max-width:44px; padding:0;" title="Xóa phòng này" onclick="roomsModule.deleteRoom(${room.id}, '${room.room_code}')">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    },

    renderRoomStats(rooms) {
        const total = rooms.length;
        const rented = rooms.filter(r => r.status === 'rented').length;
        const empty = rooms.filter(r => r.status === 'empty').length;
        const maintenance = rooms.filter(r => r.status === 'maintenance').length;
        const occupancy = total > 0 ? Math.round((rented / total) * 100) : 0;

        const totalEl = document.getElementById('statTotalRooms');
        const rentedEl = document.getElementById('statRentedRooms');
        const emptyEl = document.getElementById('statEmptyRooms');
        const rateEl = document.getElementById('statOccupancyRate');

        if (totalEl) totalEl.textContent = total;
        if (rentedEl) rentedEl.textContent = rented;
        if (emptyEl) emptyEl.textContent = empty;
        if (rateEl) rateEl.textContent = `${occupancy}%`;
    },

    // --- Modal: Thêm / Sửa Phòng ---
    openAddRoomModal(preselectedPropId = null) {
        this.selectedRoom = null;
        document.getElementById('formRoom').reset();
        document.getElementById('modalRoomTitle').textContent = 'Thêm Phòng Mới';
        document.getElementById('roomEditId').value = '';

        const propSelect = document.getElementById('roomPropertySelect');
        if (propSelect && preselectedPropId) {
            propSelect.value = preselectedPropId;
        }

        const btnDelete = document.getElementById('btnDeleteRoomInModal');
        if (btnDelete) btnDelete.style.display = 'none';
        document.getElementById('modalRoom').classList.add('active');
    },

    openEditRoomModal(roomId) {
        const room = this.allRooms.find(r => r.id === roomId);
        if (!room) return;
        this.selectedRoom = room;

        document.getElementById('modalRoomTitle').textContent = `Chỉnh sửa phòng ${room.room_code}`;
        document.getElementById('roomEditId').value = room.id;
        if (document.getElementById('roomPropertySelect')) {
            document.getElementById('roomPropertySelect').value = room.property_id || 1;
        }
        document.getElementById('roomCodeInput').value = room.room_code;
        document.getElementById('roomFloorSelect').value = room.floor;
        document.getElementById('roomPositionSelect').value = room.position;
        document.getElementById('roomBasePriceInput').value = room.base_price;
        document.getElementById('roomDepositInput').value = room.default_deposit;
        document.getElementById('roomStatusSelect').value = room.status;
        document.getElementById('roomAreaInput').value = room.area_sqm || '';
        document.getElementById('roomAmenitiesInput').value = room.amenities || '';
        document.getElementById('roomNotesInput').value = room.notes || '';

        const btnDelete = document.getElementById('btnDeleteRoomInModal');
        if (btnDelete) {
            btnDelete.style.display = 'inline-flex';
            btnDelete.onclick = () => this.deleteRoom(room.id, room.room_code);
        }

        document.getElementById('modalRoom').classList.add('active');
    },

    async handleSaveRoom(e) {
        e.preventDefault();
        const id = document.getElementById('roomEditId').value;
        const property_id = parseInt(document.getElementById('roomPropertySelect')?.value) || 1;
        const room_code = document.getElementById('roomCodeInput').value.trim();
        const floor = parseInt(document.getElementById('roomFloorSelect').value);
        const position = document.getElementById('roomPositionSelect').value;
        const base_price = parseFloat(document.getElementById('roomBasePriceInput').value) || 0;
        const default_deposit = parseFloat(document.getElementById('roomDepositInput').value) || 0;
        const status = document.getElementById('roomStatusSelect').value;
        const area_sqm = parseFloat(document.getElementById('roomAreaInput').value) || 0;
        const amenities = document.getElementById('roomAmenitiesInput').value.trim();
        const notes = document.getElementById('roomNotesInput').value.trim();

        if (!room_code) {
            window.showToast('Vui lòng nhập mã phòng (vd: P.201)', 'error');
            return;
        }

        const payload = { property_id, room_code, floor, position, base_price, default_deposit, status, area_sqm, amenities, notes };

        try {
            if (id) {
                await api.updateRoom(id, payload);
                window.showToast('Đã cập nhật thông tin phòng', 'success');
            } else {
                await api.createRoom(payload);
                window.showToast('Đã thêm phòng mới thành công', 'success');
            }
            document.getElementById('modalRoom').classList.remove('active');
            await this.loadRooms();
            await window.propertiesModule?.loadProperties();
            await window.app.refreshGlobalStats();
        } catch (error) {
            window.showToast(error.message, 'error');
        }
    },

    async deleteRoom(roomId, roomCode) {
        if (!confirm(`Bạn có chắc chắn muốn XÓA phòng ${roomCode || ''}? Toàn bộ lịch sử hợp đồng và hóa đơn liên quan đến phòng này sẽ được xóa dọn sạch.`)) return;

        try {
            const res = await api.deleteRoom(roomId);
            window.showToast(res.message || 'Đã xóa phòng thành công', 'success');
            document.getElementById('modalRoom')?.classList.remove('active');
            await this.loadRooms();
            await window.app.refreshGlobalStats();
        } catch (error) {
            window.showToast(error.message, 'error');
        }
    },

    // --- Modal: Tạo Hợp đồng thuê mới ---
    openAddContractModal(roomId) {
        const room = this.allRooms.find(r => r.id === roomId);
        if (!room) return;

        document.getElementById('formContract').reset();
        document.getElementById('contractRoomId').value = room.id;
        document.getElementById('contractRoomName').textContent = `${room.room_code} (Tầng ${room.floor} - ${room.position === 'outside' ? 'Mặt ngoài' : 'Mặt trong'})`;
        document.getElementById('contractRentPrice').value = room.base_price;
        document.getElementById('contractDepositAmount').value = room.default_deposit || room.base_price;

        const today = new Date();
        const nextYear = new Date();
        nextYear.setFullYear(today.getFullYear() + 1);

        document.getElementById('contractCheckinDate').value = today.toISOString().split('T')[0];
        document.getElementById('contractCheckoutDate').value = nextYear.toISOString().split('T')[0];

        document.getElementById('modalAddContract').classList.add('active');
    },

    async handleSaveContract(e) {
        e.preventDefault();
        const room_id = parseInt(document.getElementById('contractRoomId').value);
        const tenant_name = document.getElementById('contractTenantName').value.trim();
        const tenant_phone = document.getElementById('contractTenantPhone').value.trim();
        const tenant_id_card = document.getElementById('contractTenantIdCard').value.trim();
        const checkin_date = document.getElementById('contractCheckinDate').value;
        const checkout_expected = document.getElementById('contractCheckoutDate').value;
        const rent_price = parseFloat(document.getElementById('contractRentPrice').value) || 0;
        const deposit_amount = parseFloat(document.getElementById('contractDepositAmount').value) || 0;

        // Phí dịch vụ
        const electricity_rate = parseFloat(document.getElementById('contractElecRate').value) || 3500;
        const water_billing_type = document.getElementById('contractWaterType').value;
        const water_rate = parseFloat(document.getElementById('contractWaterRate').value) || 30000;
        const water_person_count = parseInt(document.getElementById('contractWaterCount').value) || 1;
        const internet_fee = parseFloat(document.getElementById('contractInternetFee').value) || 100000;
        const garbage_fee = parseFloat(document.getElementById('contractGarbageFee').value) || 30000;
        const parking_fee = parseFloat(document.getElementById('contractParkingFee').value) || 0;
        const other_fee = parseFloat(document.getElementById('contractOtherFee').value) || 0;
        const other_fee_note = document.getElementById('contractOtherNote').value.trim();
        const billing_day = parseInt(document.getElementById('contractBillingDay').value) || 5;

        if (!tenant_name || !tenant_phone || !checkin_date || !checkout_expected) {
            window.showToast('Vui lòng điền đầy đủ thông tin khách và thời hạn hợp đồng', 'error');
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
                notes: 'Tạo từ giao diện quản lý phòng'
            });

            window.showToast('Đã tạo hợp đồng và kích hoạt phòng thành công!', 'success');
            document.getElementById('modalAddContract').classList.remove('active');
            await this.loadRooms();
            await window.app.refreshGlobalStats();
        } catch (error) {
            window.showToast(error.message, 'error');
        }
    },

    // --- Modal: Chi tiết Hợp đồng & Kết thúc hợp đồng ---
    async openContractDetailModal(contractId) {
        if (!contractId) {
            window.showToast('Phòng này hiện chưa có hợp đồng chi tiết.', 'warning');
            return;
        }
        try {
            const c = await api.getContract(contractId);
            const body = document.getElementById('contractDetailBody');
            if (!body) return;

            body.innerHTML = `
                <div style="background:var(--bg-card); padding:16px; border-radius:var(--radius-md); margin-bottom:16px; border:1px solid var(--border-color);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                        <h4 style="font-size:18px; color:var(--primary);">${c.room_code} (Tầng ${c.floor} - ${c.position === 'outside' ? 'Mặt ngoài' : 'Mặt trong'})</h4>
                        <span class="badge ${c.status === 'active' ? 'badge-success' : 'badge-neutral'}">${c.status === 'active' ? 'Đang hoạt động' : 'Đã kết thúc'}</span>
                    </div>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; font-size:13.5px;">
                        <div><strong>Khách thuê:</strong> ${c.tenant_name}</div>
                        <div><strong>SĐT:</strong> ${c.tenant_phone}</div>
                        <div><strong>CCCD:</strong> ${c.tenant_id_card || 'Chưa cập nhật'}</div>
                        <div><strong>Ngày vào ở:</strong> ${c.checkin_date}</div>
                        <div><strong>Ngày hết hạn:</strong> ${c.checkout_expected}</div>
                        <div><strong>Ngày thu tiền:</strong> Mùng ${c.billing_day} hàng tháng</div>
                    </div>
                </div>

                <div style="background:var(--bg-card); padding:16px; border-radius:var(--radius-md); margin-bottom:16px; border:1px solid var(--border-color);">
                    <h5 style="margin-bottom:10px; font-size:14px; color:var(--text-main);">Bảng Phí Hàng Tháng:</h5>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; font-size:13px;">
                        <div>• Tiền phòng: <strong>${window.formatCurrency(c.rent_price)}</strong></div>
                        <div>• Tiền cọc: <strong>${window.formatCurrency(c.deposit_amount)}</strong></div>
                        <div>• Giá điện: <strong>${window.formatCurrency(c.electricity_rate)}/kWh</strong></div>
                        <div>• Giá nước: <strong>${window.formatCurrency(c.water_rate)}</strong> (${c.water_billing_type === 'meter' ? 'theo số' : c.water_person_count + ' người'})</div>
                        <div>• Internet Wifi: <strong>${window.formatCurrency(c.internet_fee)}</strong></div>
                        <div>• Rác & Vệ sinh: <strong>${window.formatCurrency(c.garbage_fee)}</strong></div>
                        ${c.parking_fee > 0 ? `<div>• Phí gửi xe: <strong>${window.formatCurrency(c.parking_fee)}</strong></div>` : ''}
                        ${c.other_fee > 0 ? `<div>• Khác (${c.other_fee_note || 'Dịch vụ'}): <strong>${window.formatCurrency(c.other_fee)}</strong></div>` : ''}
                    </div>
                </div>
            `;

            document.getElementById('btnTerminateContract').onclick = () => this.terminateContract(c.id);
            document.getElementById('modalContractDetail').classList.add('active');
        } catch (error) {
            window.showToast('Không thể tải thông tin hợp đồng: ' + error.message, 'error');
        }
    },

    async terminateContract(contractId) {
        if (!confirm('Bạn có chắc chắn muốn kết thúc hợp đồng này? Phòng sẽ được chuyển về trạng thái Trống và chốt thời gian trả phòng hôm nay.')) return;
        try {
            await api.terminateContract(contractId);
            window.showToast('Đã kết thúc hợp đồng thành công', 'success');
            document.getElementById('modalContractDetail').classList.remove('active');
            await this.loadRooms();
            await window.app.refreshGlobalStats();
        } catch (error) {
            window.showToast(error.message, 'error');
        }
    },

    bindEvents() {
        const formRoom = document.getElementById('formRoom');
        if (formRoom) formRoom.addEventListener('submit', (e) => this.handleSaveRoom(e));

        const formContract = document.getElementById('formContract');
        if (formContract) formContract.addEventListener('submit', (e) => this.handleSaveContract(e));

        ['filterRoomProperty', 'filterRoomFloor', 'filterRoomPosition', 'filterRoomStatus'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('change', () => this.loadRooms());
        });
    }
};

window.roomsModule = roomsModule;
