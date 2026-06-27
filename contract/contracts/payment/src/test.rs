#![cfg(test)]

use checkout::{Invoice, InvoiceContract};
use soroban_sdk::{testutils::Address as _, Address, Env, String};

#[test]
fn test_mark_paid_succeeds_with_bound_payment() {
    let env = Env::default();
    env.mock_all_auths();

    let payment_addr = env.register(crate::PaymentContract, ());
    let checkout_addr = env.register(InvoiceContract, (&payment_addr,));
    let checkout_client = checkout::InvoiceContractClient::new(&env, &checkout_addr);

    let id = String::from_str(&env, "inv_ok");
    let receiver = Address::generate(&env);
    let _ = checkout_client.create_invoice(&id, &receiver, &10i128, &String::from_str(&env, "n"));

    let ok = checkout_client.mark_paid(&id, &payment_addr);
    assert!(ok);
    let inv: Invoice = checkout_client.get_invoice(&id);
    assert!(inv.is_paid);
}

#[test]
#[should_panic]
fn test_mark_paid_rejects_wrong_payment_addr() {
    let env = Env::default();
    env.mock_all_auths();

    let registered = env.register(crate::PaymentContract, ());
    let impostor = env.register(crate::PaymentContract, ());
    let checkout_addr = env.register(InvoiceContract, (&registered,));
    let checkout_client = checkout::InvoiceContractClient::new(&env, &checkout_addr);

    let id = String::from_str(&env, "inv_bad");
    let receiver = Address::generate(&env);
    let _ = checkout_client.create_invoice(&id, &receiver, &10i128, &String::from_str(&env, "n"));

    let _ = checkout_client.mark_paid(&id, &impostor);
}

#[test]
#[ignore = "requires live USDC testnet SAC; cannot run in local test env"]
fn test_pay_invoice_end_to_end() {
    // Placeholder for the full pay_invoice flow against a deployed USDC SAC.
}
