#![cfg(test)]

use soroban_sdk::{testutils::Address as _, Address, Env, String};

/// In-test mirror of the checkout contract. Mirrors `contracts/checkout/src/lib.rs`
/// including the `mark_paid` -> `verify_caller` handshake ACL.
mod checkout {
    use soroban_sdk::{
        contract, contractimpl, contracttype, Address, Env, IntoVal, String, Symbol,
    };

    #[contracttype]
    #[derive(Clone, Debug, Eq, PartialEq)]
    pub struct Invoice {
        pub id: String,
        pub is_paid: bool,
        pub amount: i128,
        pub receiver: Address,
        pub note: String,
    }

    #[contract]
    pub struct Contract;

    #[contractimpl]
    impl Contract {
        pub fn create_invoice(
            env: Env,
            id: String,
            receiver: Address,
            amount: i128,
            note: String,
        ) -> String {
            let invoice = Invoice {
                id: id.clone(),
                is_paid: false,
                amount,
                receiver,
                note,
            };
            env.storage().instance().set(&id, &invoice);
            id
        }

        pub fn get_invoice(env: Env, id: String) -> Option<Invoice> {
            env.storage().instance().get(&id)
        }

        /// Mirrors real checkout: requires the registered payment contract to verify
        /// itself via `verify_caller`.
        pub fn mark_paid(env: Env, payment_contract: Address, id: String) -> bool {
            let verified: bool = env.invoke_contract(
                &payment_contract,
                &Symbol::new(&env, "verify_caller"),
                soroban_sdk::Vec::from_array(&env, [payment_contract.into_val(&env)]),
            );
            if !verified {
                panic!("unauthorized payment contract");
            }
            let mut invoice: Invoice = match env.storage().instance().get(&id) {
                Some(i) => i,
                None => return false,
            };
            invoice.is_paid = true;
            env.storage().instance().set(&id, &invoice);
            true
        }
    }
}

#[test]
fn test_verify_caller() {
    let env = Env::default();
    let payment = env.register(crate::Contract, ());
    let client = crate::ContractClient::new(&env, &payment);

    // Pass own address -> true
    assert!(client.verify_caller(&payment));
    // Pass a random address -> false
    let other = Address::generate(&env);
    assert!(!client.verify_caller(&other));
}

/// USDC testnet SAC is not deployed in the local test environment, so the actual
/// `pay_invoice` flow can't run end-to-end here. The handshake below verifies
/// that the cross-contract ACL works between payment and a mirror checkout.
#[test]
fn test_payment_handshake() {
    let env = Env::default();
    env.mock_all_auths();

    let payment_addr = env.register(crate::Contract, ());
    let checkout_addr = env.register(checkout::Contract, ());
    let checkout_client = checkout::ContractClient::new(&env, &checkout_addr);

    let id = String::from_str(&env, "inv_acl");
    let receiver = Address::generate(&env);
    checkout_client.create_invoice(&id, &receiver, &10i128, &String::from_str(&env, "n"));

    // Direct call to mark_paid with the right payment address works.
    let ok = checkout_client.mark_paid(&payment_addr, &id);
    assert!(ok);
    assert!(checkout_client.get_invoice(&id).unwrap().is_paid);
}

#[test]
#[should_panic]
fn test_payment_handshake_rejects_random_caller() {
    let env = Env::default();
    env.mock_all_auths();
    let checkout_addr = env.register(checkout::Contract, ());
    let checkout_client = checkout::ContractClient::new(&env, &checkout_addr);

    let id = String::from_str(&env, "inv_acl_2");
    let receiver = Address::generate(&env);
    checkout_client.create_invoice(&id, &receiver, &10i128, &String::from_str(&env, "n"));

    // A random address that doesn't implement verify_caller -> panics on invoke_contract.
    let fake = Address::generate(&env);
    let _ = checkout_client.mark_paid(&fake, &id);
}

#[test]
#[ignore = "requires live USDC testnet SAC; cannot run in local test env"]
fn test_pay_invoice_end_to_end() {
    // Placeholder for the full pay_invoice flow against a deployed USDC SAC.
    // Run on a testnet where the USDC SAC is registered.
}
