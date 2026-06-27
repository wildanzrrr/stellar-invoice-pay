use soroban_sdk::{contracttype, Address, String};

/// Mirrors the `Invoice` shape in the checkout contract.
/// Re-declared here so the payment contract stays decoupled at the crate level.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Invoice {
    pub id: String,
    pub is_paid: bool,
    pub amount: i128,
    pub receiver: Address,
    pub note: String,
}
