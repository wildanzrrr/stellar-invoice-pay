use soroban_sdk::{contracttype, Address, String};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Invoice {
    pub id: String,
    pub is_paid: bool,
    pub amount: i128,
    pub receiver: Address,
    pub note: String,
}
