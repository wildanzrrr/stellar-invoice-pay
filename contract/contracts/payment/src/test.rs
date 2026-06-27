#![cfg(test)]

use checkout::{Invoice, InvoiceContract};
use soroban_sdk::{testutils::Address as _, Address, Env, String};

#[test]
fn test_verify_caller() {
    let env = Env::default();
    let payment = env.register(crate::PaymentContract, ());
    let client = crate::PaymentContractClient::new(&env, &payment);

    // Own address -> true; random address -> false.
    assert!(client.verify_caller(&payment));
    let other = Address::generate(&env);
    assert!(!client.verify_caller(&other));
}

#[test]
fn test_payment_handshake() {
    let env = Env::default();
    env.mock_all_auths();

    // 1. Deploy real checkout, register payment contract as the allowed caller.
    let checkout_addr = env.register(InvoiceContract, ());
    let checkout_client = checkout::InvoiceContractClient::new(&env, &checkout_addr);
    let admin = Address::generate(&env);
    checkout_client.init(&admin);
    checkout_client.set_payment_contract(&payment_addr(&env));

    // 2. Create an invoice via the real checkout.
    let id = String::from_str(&env, "inv_acl");
    let receiver = Address::generate(&env);
    let _ = checkout_client.create_invoice(&id, &receiver, &10i128, &String::from_str(&env, "n"));

    // 3. Direct mark_paid through the real ACL works.
    let ok = checkout_client.mark_paid(&id);
    assert!(ok);
    let inv: Invoice = checkout_client.get_invoice(&id);
    assert!(inv.is_paid);
}

#[test]
#[should_panic]
fn test_mark_paid_rejects_when_payment_unset() {
    let env = Env::default();
    env.mock_all_auths();
    let checkout_addr = env.register(InvoiceContract, ());
    let checkout_client = checkout::InvoiceContractClient::new(&env, &checkout_addr);

    let id = String::from_str(&env, "inv_acl_2");
    let receiver = Address::generate(&env);
    checkout_client.create_invoice(&id, &receiver, &10i128, &String::from_str(&env, "n"));

    // No payment contract set -> mark_paid should error / panic.
    let _ = checkout_client.mark_paid(&id);
}

#[test]
#[ignore = "requires live USDC testnet SAC; cannot run in local test env"]
fn test_pay_invoice_end_to_end() {
    // Placeholder for the full pay_invoice flow against a deployed USDC SAC.
}

fn payment_addr(env: &Env) -> Address {
    let id = env.register(crate::PaymentContract, ());
    id
}
