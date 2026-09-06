// Properties & Buildings Management Module
const propertiesModule = {
    allProperties: [],
    selectedProperty: null,

    async init() {
        await this.loadProperties();
        this.bindEvents();
    },

    async loadProperties() {
        try {
            const props = await api.getProperties();
            this.allProperties = props;
            this.renderPropertiesList(props);
            this.renderPropertyStats(props);
            this.populatePropertyDropdowns();
        } catch (error) {
            window.showToast('Không thể tải danh sách căn hộ / tòa nhà: ' + error.message, 'error');
        }
    },

    populatePropertyDropdowns() {
        // Dropdown trong bộ lọc phòng
        const filterProp = document.getElementById('filterRoomProperty');
        if (filterProp) {
            const currentVal = filterProp.value;
            filterProp.innerHTML = '<option value="">-- Tất cả căn hộ & tòa nhà --</option>' + 
                this.allProperties.map(p => `<option value="${p.id}">${p.name} (${p.code || 'Mã #' + p.id})</option>`).join('');
            if (currentVal) filterProp.value = currentVal;
        }

        // Dropdown trong modal thêm phòng
        const roomPropSelect = document.getElementById('roomPropertySelect');
        if (roomPropSelect) {
            roomPropSelect.innerHTML = this.allProperties.map(p => 
                `<option value="${p.id}">${p.name} (${p.code || 'Mã #' + p.id})</option>`
            ).join('');
        }

        // Dropdown trong bộ lọc hợp đồng
        const filterContractProp = document.getElementById('filterContractProperty');
        if (filterContractProp) {
            filterContractProp.innerHTML = '<option value="">-- Tất cả căn hộ & tòa nhà --</option>' + 
                this.allProperties.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
        }

        // Dropdown trong modal tạo hợp đồng
        const contractPropSelect = document.getElementById('contractPropertySelect');
        if (contractPropSelect) {
            contractPropSelect.innerHTML = '<option value="">-- Chọn Căn hộ / Tòa nhà --</option>' + 
                this.allProperties.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
        }
    },

    renderPropertyStats(props) {
        const totalProps = props.length;
        const totalRooms = props.reduce((sum, p) => sum + (p.total_rooms || 0), 0);
        const rentedRooms = props.reduce((sum, p) => sum + (p.rented_rooms || 0), 0);
        const emptyRooms = props.reduce((sum, p) => sum + (p.empty_rooms || 0), 0);
        const totalRev = props.reduce((sum, p) => sum + (p.total_revenue || 0), 0);

        const elProps = document.getElementById('propStatTotalCount');
        const elRooms = document.getElementById('propStatTotalRooms');
        const elRented = document.getElementById('propStatRented');
        const elEmpty = document.getElementById('propStatEmpty');
        const elRev = document.getElementById('propStatRevenue');

        if (elProps) elProps.textContent = totalProps;
        if (elRooms) elRooms.textContent = totalRooms;
        if (elRented) elRented.textContent = rentedRooms;
        if (elEmpty) elEmpty.textContent = emptyRooms;
        if (elRev) elRev.textContent = window.formatCurrency(totalRev);
    },

    renderPropertiesList(props) {
        const container = document.getElementById('propertiesGridContainer');
        if (!container) return;

        if (props.length === 0) {
            container.innerHTML = `
                <div class="empty-state-box" style="grid-column:1/-1;">
                    <i class="fa-solid fa-city" style="font-size:40px; color:var(--text-dim); margin-bottom:12px;"></i>
                    <h4>Chưa có Căn hộ hoặc Tòa nhà nào</h4>
                    <p>Hãy bấm "+ Thêm Căn Hộ / Tòa Nhà Mới" để bắt đầu thiết lập khu vực cho thuê của bạn.</p>
                </div>
            `;
            return;
        }

        const typeLabels = {
            apartment: { label: 'Căn hộ chung cư', icon: 'fa-building', color: '#6366f1' },
            mini_building: { label: 'Tòa chung cư mini', icon: 'fa-city', color: '#10b981' },
            boarding_house: { label: 'Dãy nhà trọ', icon: 'fa-house-user', color: '#f59e0b' },
            house: { label: 'Nhà nguyên căn', icon: 'fa-house', color: '#ec4899' }
        };

        container.innerHTML = props.map(p => {
            const typeInfo = typeLabels[p.property_type] || typeLabels.apartment;
            const occupancy = p.occupancy_rate || 0;

            return `
                <div class="property-card-item">
                    <div class="property-card-header">
                        <div class="property-type-tag" style="background:${typeInfo.color}15; color:${typeInfo.color}; border:1px solid ${typeInfo.color}35;">
                            <i class="fa-solid ${typeInfo.icon}"></i> ${typeInfo.label}
                        </div>
                        ${p.code ? `<span class="badge badge-neutral" style="font-weight:700;">${p.code}</span>` : ''}
                    </div>

                    <h3 class="property-card-name">${p.name}</h3>

                    <div class="property-card-address">
                        <i class="fa-solid fa-location-dot"></i>
                        <span>${p.address || 'Chưa cập nhật địa chỉ'}</span>
                    </div>

                    ${p.notes ? `
                        <div style="font-size:12px; color:var(--text-dim); margin-bottom:14px; font-style:italic;">
                            <i class="fa-solid fa-circle-info"></i> ${p.notes}
                        </div>
                    ` : ''}

                    <div class="property-stats-box">
                        <div class="prop-stat-mini">
                            <span class="lbl">Tổng phòng</span>
                            <span class="val">${p.total_rooms}</span>
                        </div>
                        <div class="prop-stat-mini">
                            <span class="lbl">Đang thuê</span>
                            <span class="val" style="color:var(--success);">${p.rented_rooms}</span>
                        </div>
                        <div class="prop-stat-mini">
                            <span class="lbl">Trống</span>
                            <span class="val" style="color:var(--info);">${p.empty_rooms}</span>
                        </div>
                        <div class="prop-stat-mini">
                            <span class="lbl">Doanh thu</span>
                            <span class="val" style="font-size:12.5px; color:var(--primary);">${window.formatCurrencyShort(p.total_revenue)}</span>
                        </div>
                    </div>

                    <!-- Progress bar occupancy -->
                    <div style="margin-bottom:18px;">
                        <div style="display:flex; justify-content:space-between; font-size:11.5px; margin-bottom:6px; color:var(--text-muted);">
                            <span>Tỷ lệ lấp đầy</span>
                            <strong style="color:var(--text-main);">${occupancy}%</strong>
                        </div>
                        <div style="height:6px; background:var(--bg-card); border-radius:999px; overflow:hidden; border:1px solid var(--border-subtle);">
                            <div style="height:100%; width:${occupancy}%; background:linear-gradient(90deg, var(--primary), var(--success)); border-radius:999px; transition:width 0.4s ease;"></div>
                        </div>
                    </div>

                    <div class="property-card-actions">
                        <button class="btn btn-sm btn-primary" onclick="propertiesModule.viewRoomsOfProperty(${p.id})">
                            <i class="fa-solid fa-door-open"></i> Xem ${p.total_rooms} phòng
                        </button>
                        <button class="btn btn-sm btn-outline" title="Thêm phòng mới vào căn này" onclick="propertiesModule.addRoomToProperty(${p.id})">
                            <i class="fa-solid fa-plus"></i> Thêm phòng
                        </button>
                        <button class="btn btn-sm btn-outline" title="Sửa thông tin" onclick="propertiesModule.openEditModal(${p.id})">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        <button class="btn btn-sm btn-danger-outline" title="Xóa căn hộ/tòa nhà này" onclick="propertiesModule.deleteProperty(${p.id}, '${p.name}')">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    },

    viewRoomsOfProperty(propId) {
        window.app.switchTab('rooms');
        const filterEl = document.getElementById('filterRoomProperty');
        if (filterEl) {
            filterEl.value = propId;
            window.roomsModule?.loadRooms();
        }
    },

    addRoomToProperty(propId) {
        window.roomsModule?.openAddRoomModal(propId);
    },

    openAddModal() {
        this.selectedProperty = null;
        document.getElementById('formProperty').reset();
        document.getElementById('propertyEditId').value = '';
        document.getElementById('propertyModalTitle').textContent = 'Thêm Căn Hộ / Tòa Nhà Mới';
        document.getElementById('modalProperty').classList.add('active');
    },

    openEditModal(propId) {
        const p = this.allProperties.find(x => x.id === propId);
        if (!p) return;
        this.selectedProperty = p;

        document.getElementById('propertyModalTitle').textContent = `Chỉnh sửa: ${p.name}`;
        document.getElementById('propertyEditId').value = p.id;
        document.getElementById('propertyNameInput').value = p.name;
        document.getElementById('propertyCodeInput').value = p.code || '';
        document.getElementById('propertyTypeSelect').value = p.property_type || 'apartment';
        document.getElementById('propertyAddressInput').value = p.address || '';
        document.getElementById('propertyFloorsInput').value = p.total_floors || 1;
        document.getElementById('propertyNotesInput').value = p.notes || '';

        document.getElementById('modalProperty').classList.add('active');
    },

    async handleSaveProperty(e) {
        e.preventDefault();
        const id = document.getElementById('propertyEditId').value;
        const name = document.getElementById('propertyNameInput').value.trim();
        const code = document.getElementById('propertyCodeInput').value.trim();
        const property_type = document.getElementById('propertyTypeSelect').value;
        const address = document.getElementById('propertyAddressInput').value.trim();
        const total_floors = parseInt(document.getElementById('propertyFloorsInput').value) || 1;
        const notes = document.getElementById('propertyNotesInput').value.trim();

        if (!name) {
            window.showToast('Vui lòng nhập tên căn hộ / tòa nhà', 'error');
            return;
        }

        const payload = { name, code, property_type, address, total_floors, notes };

        try {
            if (id) {
                await api.updateProperty(id, payload);
                window.showToast('Đã cập nhật thông tin căn hộ / tòa nhà', 'success');
            } else {
                await api.createProperty(payload);
                window.showToast('Đã tạo căn hộ / tòa nhà mới thành công', 'success');
            }
            document.getElementById('modalProperty').classList.remove('active');
            await this.loadProperties();
            await window.roomsModule?.loadRooms();
            await window.contractsModule?.loadContracts();
            await window.app?.refreshGlobalStats();
        } catch (error) {
            window.showToast(error.message, 'error');
        }
    },

    async deleteProperty(propId, propName) {
        if (!confirm(`Bạn có chắc chắn muốn xóa "${propName}"? Toàn bộ các phòng trống thuộc căn hộ/tòa nhà này sẽ bị xóa. (Không thể xóa nếu còn hợp đồng thuê hoạt động).`)) return;

        try {
            const res = await api.deleteProperty(propId);
            window.showToast(res.message || 'Đã xóa thành công', 'success');
            await this.loadProperties();
            await window.roomsModule?.loadRooms();
            await window.app?.refreshGlobalStats();
        } catch (error) {
            window.showToast(error.message, 'error');
        }
    },

    bindEvents() {
        const form = document.getElementById('formProperty');
        if (form) form.addEventListener('submit', (e) => this.handleSaveProperty(e));
    }
};

window.propertiesModule = propertiesModule;
