#![no_std]

mod error;
mod invoice;

use soroban_sdk::{contract, contractimpl, token, Address, Env, IntoVal, String, Symbol, Vec};

pub use error::Error;
use invoice::Invoice;

/// USDC Stellar Asset Contract address on the Stellar testnet.
/// Hardcoded so callers don't need to look it up, and so the payment flow is fixed
/// to USDC. Payer must already hold USDC on this network.
const USDC_TOKEN: &str = "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA";

#[contract]
pub struct Contract;

#[contractimpl]
impl Contract {
    /// Pay an open invoice with USDC.
    ///
    /// Workflow:
    /// 1. Require payer auth up front so the cross-call tree is authorized.
    /// 2. Cross-call the checkout contract's `get_invoice` to fetch the invoice.
    /// 3. Reject if already paid.
    /// 4. Transfer USDC from `payer` to the invoice's `receiver`.
    /// 5. Cross-call `mark_paid` on the checkout contract to flip the flag.
    pub fn pay_invoice(
        env: Env,
        payer: Address,
        invoice_contract: Address,
        id: String,
    ) -> Result<(), Error> {
        payer.require_auth();

        // 1. Fetch invoice.
        let invoice: Invoice = env.invoke_contract(
            &invoice_contract,
            &Symbol::new(&env, "get_invoice"),
            Vec::from_array(&env, [id.clone().into_val(&env)]),
        );

        // 2. Guard.
        if invoice.is_paid {
            return Err(Error::InvoiceAlreadyPaid);
        }

        // 3. USDC transfer payer -> receiver.
        let usdc = Address::from_string(&String::from_str(&env, USDC_TOKEN));
        let token_client = token::Client::new(&env, &usdc);
        token_client.transfer(&payer, &invoice.receiver, &(invoice.amount));

        // 4. Mark paid in checkout.
        let _ok: bool = env.invoke_contract(
            &invoice_contract,
            &Symbol::new(&env, "mark_paid"),
            Vec::from_array(&env, [invoice.id.clone().into_val(&env)]),
        );

        Ok(())
    }

    /// Handshake fn for checkout's `mark_paid` ACL.
    /// Returns `true` only if the arg equals this contract's own address,
    /// proving the caller of the handshake is the registered payment contract.
    pub fn verify_caller(env: Env, claimed: Address) -> bool {
        claimed == env.current_contract_address()
    }
}

mod test;
