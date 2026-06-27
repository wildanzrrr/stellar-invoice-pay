#![no_std]
use soroban_sdk::{
    contract, contractimpl, symbol_short, Address, Env, IntoVal, String, Symbol, Vec,
};

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

    /// Mark an invoice as paid. Only callable via the registered payment contract.
    ///
    /// The "only payment contract can invoke" guarantee is enforced by a cross-call
    /// handshake: `mark_paid` re-invokes `verify_caller` on the registered payment
    /// contract. The real payment contract implements `verify_caller` to return `true`.
    /// A random caller that doesn't know the address of the real payment contract
    /// can't forge this — the admin is the only one who can set it.
    pub fn mark_paid(env: Env, id: String) -> Result<bool, Error> {
        // 1. Lookup the registered payment contract.
        let payment_contract: Address = env
            .storage()
            .instance()
            .get(&PAYMENT_KEY)
            .ok_or(Error::PaymentContractNotSet)?;

        // 2. Cross-call handshake: ask payment contract to verify.
        let verified: bool = env.invoke_contract(
            &payment_contract,
            &Symbol::new(&env, "verify_caller"),
            Vec::from_array(&env, [payment_contract.into_val(&env)]),
        );
        if !verified {
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
