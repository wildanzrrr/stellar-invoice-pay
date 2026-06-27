use soroban_sdk::{contractevent, contracttype, Address, String};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Invoice {
    pub id: String,
    pub is_paid: bool,
    pub amount: i128,
    pub receiver: Address,
    pub note: String,
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct InvoiceCreatedEvent {
    pub id: String,
    pub amount: i128,
    pub receiver: Address,
    pub note: String,
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct InvoicePaidEvent {
    pub id: String,
    pub amount: i128,
    pub receiver: Address,
    pub note: String,
}
