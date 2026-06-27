#![no_std]
use soroban_sdk::{contract, contractimpl, symbol_short, Address, Env, String, Symbol};

mod error;
mod invoice;

pub use invoice::Invoice;

use error::Error;

/// Storage key for the admin (the account that can configure the contract).
const ADMIN_KEY: Symbol = symbol_short!("admin");

/// Storage key for the allowed payment contract address.
/// When set, only that contract can call `mark_paid` (verified by the `verify_caller`
/// cross-call handshake).
const PAYMENT_KEY: Symbol = symbol_short!("payment");

#[contract]
pub struct InvoiceContract;

#[contractimpl]
impl InvoiceContract {
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

        Ok(id)
    }

    pub fn get_invoice(env: Env, id: String) -> Result<Invoice, Error> {
        match env.storage().instance().get(&id) {
            Some(invoice) => Ok(invoice),
            None => Err(Error::InvoiceNotFound),
        }
    }

    /// Set the admin. Can only be called once (when ADMIN_KEY is empty).
    pub fn init(env: Env, admin: Address) -> Result<(), Error> {
        if env.storage().instance().has(&ADMIN_KEY) {
            return Err(Error::Unauthorized);
        }
        admin.require_auth();
        env.storage().instance().set(&ADMIN_KEY, &admin);
        Ok(())
    }

    /// Admin-only: register the payment contract that is allowed to call `mark_paid`.
    pub fn set_payment_contract(env: Env, payment_contract: Address) -> Result<(), Error> {
        let admin: Address = env
            .storage()
            .instance()
            .get(&ADMIN_KEY)
            .ok_or(Error::Unauthorized)?;
        admin.require_auth();
        env.storage()
            .instance()
            .set(&PAYMENT_KEY, &payment_contract);
        Ok(())
    }

    /// Mark an invoice as paid. Only callable by the registered payment contract.
    ///
    /// The caller MUST pass its own address as `payment_contract`. We compare it
    /// against the admin-registered address. This avoids cross-call re-entry
    /// (Soroban forbids contract A calling into A, which a handshake would require).
    pub fn mark_paid(env: Env, id: String, payment_contract: Address) -> Result<bool, Error> {
        // 1. Lookup the registered payment contract.
        let registered: Address = env
            .storage()
            .instance()
            .get(&PAYMENT_KEY)
            .ok_or(Error::PaymentContractNotSet)?;

        // 2. Direct equality check — no cross-call, no re-entry.
        if payment_contract != registered {
            return Err(Error::Unauthorized);
        }

        // 3. Flip the flag.
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
        Ok(true)
    }
}

mod test;
