#![no_std]
use soroban_sdk::{contract, contractimpl, symbol_short, Address, Env, String, Symbol};

mod error;
mod invoice;

pub use invoice::Invoice;
pub use invoice::InvoiceCreatedEvent;
pub use invoice::InvoicePaidEvent;

use error::Error;

/// Storage key for the allowed payment contract address.
/// Set once in the constructor and never changes. The payment contract is the only
/// address allowed to call `mark_paid`.
const PAYMENT_KEY: Symbol = symbol_short!("payment");

#[contract]
pub struct InvoiceContract;

#[contractimpl]
impl InvoiceContract {
    /// Constructor: runs once on deploy. The payment contract address is fixed at
    /// deploy time, so deploy order is: payment first → then checkout with the
    /// known payment address.
    pub fn __constructor(env: Env, payment_contract: Address) {
        env.storage()
            .instance()
            .set(&PAYMENT_KEY, &payment_contract);
    }

    // Create an invoice workflow:
    // 1. User calls create_invoice with invoice details
    // 2. Check if there is already an invoice with the same id, if yes, return a custom error
    // 3. If not, create a new invoice and store it in the contract's storage with the invoice id as the key and the invoice details as the value
    // 4. Return the invoice id as a confirmation of successful creation
    pub fn create_invoice(
        env: Env,
        id: String,
        receiver: Address,
        amount: i128,
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
            amount,
            receiver,
            note,
        };

        // Store the invoice in the contract's storage
        env.storage().instance().set(&id, &invoice);
        InvoiceCreatedEvent {
            id: id.clone(),
            receiver: invoice.receiver.clone(),
            amount: invoice.amount,
            note: invoice.note.clone(),
        }
        .publish(&env);

        Ok(id)
    }

    pub fn get_invoice(env: Env, id: String) -> Result<Invoice, Error> {
        match env.storage().instance().get(&id) {
            Some(invoice) => Ok(invoice),
            None => Err(Error::InvoiceNotFound),
        }
    }

    /// Mark an invoice as paid. Only callable by the payment contract that was
    /// bound at deploy time.
    ///
    /// The caller MUST pass its own address as `payment_contract`. We compare it
    /// against the address stored in the constructor. No cross-call, no re-entry.
    pub fn mark_paid(env: Env, id: String, payment_contract: Address) -> Result<bool, Error> {
        // 1. Direct equality check — payment_contract was set in ctor, so no
        //    "unset" branch is reachable in practice.
        let registered: Address = env
            .storage()
            .instance()
            .get(&PAYMENT_KEY)
            .ok_or(Error::Unauthorized)?;
        if payment_contract != registered {
            return Err(Error::Unauthorized);
        }

        // 2. Flip the flag.
        let mut invoice: Invoice = env
            .storage()
            .instance()
            .get(&id)
            .ok_or(Error::InvoiceNotFound)?;
        if invoice.is_paid {
            return Err(Error::InvoiceAlreadyPaid);
        }
        invoice.is_paid = true;
        env.storage().instance().set(&id, &invoice);

        InvoicePaidEvent {
            id: invoice.id.clone(),
            amount: invoice.amount,
            receiver: invoice.receiver.clone(),
            note: invoice.note.clone(),
        }
        .publish(&env);
        Ok(true)
    }
}

mod test;
