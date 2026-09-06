from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

# --- Wallets ---
class WalletBase(BaseModel):
    name: str
    type: str # bank, cash, e_wallet
    balance: float = 0.0
    account_number: Optional[str] = ""
    bank_code: Optional[str] = ""
    bank_name: Optional[str] = ""
    account_holder: Optional[str] = ""
    is_default: Optional[int] = 0

class WalletCreate(WalletBase):
    pass

class WalletUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    balance: Optional[float] = None
    account_number: Optional[str] = None
    bank_code: Optional[str] = None
    bank_name: Optional[str] = None
    account_holder: Optional[str] = None
    is_default: Optional[int] = None

class WalletResponse(WalletBase):
    id: int
    created_at: str

# --- Categories ---
class CategoryBase(BaseModel):
    name: str
    type: str # income, expense
    group_name: str
    icon: Optional[str] = "tag"
    color: Optional[str] = "#4f46e5"
    is_system: Optional[int] = 0

class CategoryCreate(CategoryBase):
    pass

class CategoryResponse(CategoryBase):
    id: int
    created_at: str

# --- Transactions ---
class TransactionBase(BaseModel):
    title: str
    amount: float
    type: str # income, expense, transfer
    category_id: Optional[int] = None
    wallet_id: int
    destination_wallet_id: Optional[int] = None
    transaction_date: str
    notes: Optional[str] = ""
    ref_invoice_id: Optional[int] = None

class TransactionCreate(TransactionBase):
    pass

class TransactionUpdate(BaseModel):
    title: Optional[str] = None
    amount: Optional[float] = None
    type: Optional[str] = None
    category_id: Optional[int] = None
    wallet_id: Optional[int] = None
    destination_wallet_id: Optional[int] = None
    transaction_date: Optional[str] = None
    notes: Optional[str] = None

class TransactionResponse(TransactionBase):
    id: int
    category_name: Optional[str] = None
    category_group: Optional[str] = None
    wallet_name: Optional[str] = None
    destination_wallet_name: Optional[str] = None
    created_at: str

# --- Properties (Căn hộ / Tòa nhà / Dãy nhà) ---
class PropertyBase(BaseModel):
    name: str
    code: Optional[str] = ""
    address: Optional[str] = ""
    total_floors: Optional[int] = 1
    property_type: Optional[str] = "apartment" # apartment, mini_building, boarding_house, house
    notes: Optional[str] = ""

class PropertyCreate(PropertyBase):
    pass

class PropertyUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    address: Optional[str] = None
    total_floors: Optional[int] = None
    property_type: Optional[str] = None
    notes: Optional[str] = None

class PropertyResponse(PropertyBase):
    id: int
    created_at: str
    total_rooms: Optional[int] = 0
    rented_rooms: Optional[int] = 0
    empty_rooms: Optional[int] = 0
    occupancy_rate: Optional[float] = 0.0
    total_revenue: Optional[float] = 0.0

# --- Rooms ---
class RoomBase(BaseModel):
    property_id: Optional[int] = 1
    room_code: str
    floor: int # 2, 3, 4, 5...
    position: str # inside, outside
    base_price: float = 0.0
    default_deposit: float = 0.0
    status: str = "empty" # empty, rented, maintenance
    area_sqm: Optional[float] = 0.0
    amenities: Optional[str] = ""
    notes: Optional[str] = ""

class RoomCreate(RoomBase):
    pass

class RoomUpdate(BaseModel):
    property_id: Optional[int] = None
    room_code: Optional[str] = None
    floor: Optional[int] = None
    position: Optional[str] = None
    base_price: Optional[float] = None
    default_deposit: Optional[float] = None
    status: Optional[str] = None
    area_sqm: Optional[float] = None
    amenities: Optional[str] = None
    notes: Optional[str] = None

class RoomResponse(RoomBase):
    id: int
    created_at: str
    property_name: Optional[str] = None
    tenant_name: Optional[str] = None
    tenant_phone: Optional[str] = None
    contract_id: Optional[int] = None

# --- Contracts ---
class ContractBase(BaseModel):
    room_id: int
    tenant_name: str
    tenant_phone: str
    tenant_id_card: Optional[str] = ""
    checkin_date: str
    checkout_expected: str
    checkout_actual: Optional[str] = None
    rent_price: float
    deposit_amount: float = 0.0
    deposit_status: Optional[str] = "held"
    electricity_rate: float = 3500.0
    water_rate: float = 30000.0
    water_billing_type: str = "per_person" # meter, per_person, fixed
    water_person_count: int = 1
    internet_fee: float = 100000.0
    garbage_fee: float = 30000.0
    parking_fee: float = 0.0
    other_fee: float = 0.0
    other_fee_note: Optional[str] = ""
    billing_day: int = 5
    status: str = "active" # active, ending_soon, ended
    notes: Optional[str] = ""

class ContractCreate(ContractBase):
    pass

class ContractUpdate(BaseModel):
    tenant_name: Optional[str] = None
    tenant_phone: Optional[str] = None
    tenant_id_card: Optional[str] = None
    checkin_date: Optional[str] = None
    checkout_expected: Optional[str] = None
    checkout_actual: Optional[str] = None
    rent_price: Optional[float] = None
    deposit_amount: Optional[float] = None
    deposit_status: Optional[str] = None
    electricity_rate: Optional[float] = None
    water_rate: Optional[float] = None
    water_billing_type: Optional[str] = None
    water_person_count: Optional[int] = None
    internet_fee: Optional[float] = None
    garbage_fee: Optional[float] = None
    parking_fee: Optional[float] = None
    other_fee: Optional[float] = None
    other_fee_note: Optional[str] = None
    billing_day: Optional[int] = None
    status: Optional[str] = None
    notes: Optional[str] = None

class ContractResponse(ContractBase):
    id: int
    property_id: Optional[int] = None
    property_name: Optional[str] = None
    room_code: Optional[str] = None
    floor: Optional[int] = None
    position: Optional[str] = None
    created_at: str

# --- Invoices ---
class InvoiceBase(BaseModel):
    contract_id: int
    room_id: int
    billing_month: str # YYYY-MM
    billing_date: str # YYYY-MM-DD
    prev_electricity: float = 0.0
    curr_electricity: float = 0.0
    electricity_usage: float = 0.0
    electricity_rate: float = 3500.0
    electricity_amount: float = 0.0
    water_billing_type: str = "per_person"
    prev_water: float = 0.0
    curr_water: float = 0.0
    water_usage: float = 0.0
    water_rate: float = 30000.0
    water_amount: float = 0.0
    room_amount: float
    internet_amount: float = 0.0
    garbage_amount: float = 0.0
    parking_amount: float = 0.0
    other_amount: float = 0.0
    other_note: Optional[str] = ""
    discount_amount: float = 0.0
    total_amount: float
    payment_status: str = "unpaid" # unpaid, paid, partial
    paid_amount: float = 0.0
    paid_date: Optional[str] = None
    wallet_id: Optional[int] = None
    notes: Optional[str] = ""

class InvoiceCreate(InvoiceBase):
    pass

class InvoicePaymentUpdate(BaseModel):
    payment_status: str # paid, partial, unpaid
    paid_amount: float
    paid_date: str
    wallet_id: int # Ví tiền nhận được (Ngân hàng / Tiền mặt)
    auto_create_income: bool = True

class InvoiceResponse(InvoiceBase):
    id: int
    room_code: Optional[str] = None
    floor: Optional[int] = None
    tenant_name: Optional[str] = None
    tenant_phone: Optional[str] = None
    wallet_name: Optional[str] = None
    created_at: str

# --- Reminders ---
class ReminderBase(BaseModel):
    title: str
    reminder_type: str # rent_due, contract_expiry, checkout, bill_meter, custom
    due_date: str
    is_completed: int = 0
    related_room_id: Optional[int] = None
    related_contract_id: Optional[int] = None
    amount: float = 0.0
    notes: Optional[str] = ""

class ReminderCreate(ReminderBase):
    pass

class ReminderUpdate(BaseModel):
    title: Optional[str] = None
    reminder_type: Optional[str] = None
    due_date: Optional[str] = None
    is_completed: Optional[int] = None
    amount: Optional[float] = None
    notes: Optional[str] = None

class ReminderResponse(ReminderBase):
    id: int
    room_code: Optional[str] = None
    tenant_name: Optional[str] = None
    created_at: str
