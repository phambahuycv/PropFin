// API Helper Module for PropFin
const API_BASE = '/api';

const api = {
    // Generic request helper
    async request(endpoint, options = {}) {
        const url = `${API_BASE}${endpoint}`;
        const defaultHeaders = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };

        const config = {
            ...options,
            headers: {
                ...defaultHeaders,
                ...options.headers
            }
        };

        if (options.body && typeof options.body === 'object') {
            config.body = JSON.stringify(options.body);
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.detail || data.message || 'Có lỗi xảy ra trong quá trình xử lý');
            }
            return data;
        } catch (error) {
            console.error(`API Error on ${url}:`, error);
            throw error;
        }
    },

    // Wallets
    getWallets: () => api.request('/wallets'),
    getBanks: () => api.request('/wallets/banks'),
    createWallet: (data) => api.request('/wallets', { method: 'POST', body: data }),
    updateWallet: (id, data) => api.request(`/wallets/${id}`, { method: 'PUT', body: data }),
    deleteWallet: (id) => api.request(`/wallets/${id}`, { method: 'DELETE' }),

    // Properties (Căn hộ & Tòa nhà)
    getProperties: () => api.request('/properties'),
    getProperty: (id) => api.request(`/properties/${id}`),
    createProperty: (data) => api.request('/properties', { method: 'POST', body: data }),
    updateProperty: (id, data) => api.request(`/properties/${id}`, { method: 'PUT', body: data }),
    deleteProperty: (id) => api.request(`/properties/${id}`, { method: 'DELETE' }),

    // Categories
    getCategories: (type) => api.request(`/categories${type ? `?type=${type}` : ''}`),
    createCategory: (data) => api.request('/categories', { method: 'POST', body: data }),
    deleteCategory: (id) => api.request(`/categories/${id}`, { method: 'DELETE' }),

    // Transactions
    getTransactions: (params = {}) => {
        const search = new URLSearchParams(params).toString();
        return api.request(`/transactions${search ? `?${search}` : ''}`);
    },
    createTransaction: (data) => api.request('/transactions', { method: 'POST', body: data }),
    deleteTransaction: (id) => api.request(`/transactions/${id}`, { method: 'DELETE' }),

    // Rooms
    getRooms: (params = {}) => {
        const search = new URLSearchParams(params).toString();
        return api.request(`/rooms${search ? `?${search}` : ''}`);
    },
    createRoom: (data) => api.request('/rooms', { method: 'POST', body: data }),
    updateRoom: (id, data) => api.request(`/rooms/${id}`, { method: 'PUT', body: data }),
    deleteRoom: (id) => api.request(`/rooms/${id}`, { method: 'DELETE' }),

    // Contracts
    getContracts: (params = {}) => {
        const search = new URLSearchParams(params).toString();
        return api.request(`/contracts${search ? `?${search}` : ''}`);
    },
    getContract: (id) => api.request(`/contracts/${id}`),
    createContract: (data) => api.request('/contracts', { method: 'POST', body: data }),
    updateContract: (id, data) => api.request(`/contracts/${id}`, { method: 'PUT', body: data }),
    terminateContract: (id, checkoutDate) => api.request(`/contracts/${id}/terminate${checkoutDate ? `?checkout_date=${checkoutDate}` : ''}`, { method: 'POST' }),
    deleteContract: (id) => api.request(`/contracts/${id}`, { method: 'DELETE' }),

    // Invoices
    getInvoices: (params = {}) => {
        const search = new URLSearchParams(params).toString();
        return api.request(`/invoices${search ? `?${search}` : ''}`);
    },
    getInvoice: (id) => api.request(`/invoices/${id}`),
    getInvoiceSuggest: (roomId) => api.request(`/invoices/suggest/${roomId}`),
    createInvoice: (data) => api.request('/invoices', { method: 'POST', body: data }),
    payInvoice: (id, data) => api.request(`/invoices/${id}/pay`, { method: 'POST', body: data }),
    deleteInvoice: (id) => api.request(`/invoices/${id}`, { method: 'DELETE' }),

    // Reminders
    getReminders: () => api.request('/reminders'),
    createReminder: (data) => api.request('/reminders', { method: 'POST', body: data }),
    updateReminder: (id, data) => api.request(`/reminders/${id}`, { method: 'PUT', body: data }),
    deleteReminder: (id) => api.request(`/reminders/${id}`, { method: 'DELETE' }),

    // Analytics
    getAnalyticsOverview: (month) => api.request(`/analytics/overview${month ? `?month=${month}` : ''}`),
    getCashflowMonthly: (year) => api.request(`/analytics/cashflow-monthly${year ? `?year=${year}` : ''}`),
    getExpensesByCategory: (month) => api.request(`/analytics/expenses-by-category${month ? `?month=${month}` : ''}`),
    getIncomesBySource: (month) => api.request(`/analytics/incomes-by-source${month ? `?month=${month}` : ''}`),
    getPropertySummary: () => api.request('/analytics/property-summary')
};

window.api = api;
