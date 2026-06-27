#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, String};

mod error;

use error::Error;

#[contracttype]
#[derive(Clone, Eq, Debug, PartialEq)]
pub struct Invoice {
    pub id: String,
    pub is_paid: bool,
    pub amount: u32,
    pub receiver: Address,
    pub note: String,
}

#[contract]
pub struct Contract;

#[contractimpl]
impl Contract {
    // Create an invoice workflow:
    // 1. User calls create_invoice with invoice details
    // 2. Check if there is already an invoice with the same id, if yes, return a custom error
    // 3. If not, create a new invoice and store it in the contract's storage with the invoice id as the key and the invoice details as the value
    // 4. Return the invoice id as a confirmation of successful creation
    pub fn create_invoice(
        env: Env,
        id: String,
        receiver: Address,
        amount: u32,
        note: String,
    ) -> Result<String, Error> {
        // Check if the invoice already exists
        if env.storage().instance().has(&id) {
            return Err(Error::InvoiceAlreadyExists);
        }

        // Create a new invoice
        let invoice = Invoice {
            id: id.clone(),
            is_paid: false,
            amount: amount,
            receiver: receiver,
            note: note,
        };

        // Store the invoice in the contract's storage
        env.storage().instance().set(&id, &invoice);

        // Return the invoice id as confirmation
        Ok(id)
    }

    pub fn get_invoice(env: Env, id: String) -> Result<Invoice, Error> {
        match env.storage().instance().get(&id) {
            Some(invoice) => Ok(invoice),
            None => Err(Error::InvoiceNotFound),
        }
    }
}

mod test;
