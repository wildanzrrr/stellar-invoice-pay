#![cfg(test)]

use checkout::{Invoice, InvoiceContract};
use soroban_sdk::{testutils::Address as _, Address, Env, String};

#[test]
fn test_mark_paid_succeeds_with_registered_payment() {
    let env = Env::default();
    env.mock_all_auths();

    let checkout_addr = env.register(InvoiceContract, ());
    let checkout_client = checkout::InvoiceContractClient::new(&env, &checkout_addr);
    let admin = Address::generate(&env);
    checkout_client.init(&admin);

    let payment_addr = payment_addr(&env);
    checkout_client.set_payment_contract(&payment_addr);

    let id = String::from_str(&env, "inv_ok");
    let receiver = Address::generate(&env);
    let _ = checkout_client.create_invoice(&id, &receiver, &10i128, &String::from_str(&env, "n"));

    // Pass the registered payment address — mark_paid accepts.
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

    let checkout_addr = env.register(InvoiceContract, ());
    let checkout_client = checkout::InvoiceContractClient::new(&env, &checkout_addr);
    let admin = Address::generate(&env);
    checkout_client.init(&admin);

    let registered = payment_addr(&env);
    let impostor = payment_addr(&env);
    checkout_client.set_payment_contract(&registered);

    let id = String::from_str(&env, "inv_bad");
    let receiver = Address::generate(&env);
    let _ = checkout_client.create_invoice(&id, &receiver, &10i128, &String::from_str(&env, "n"));

    // Impostor is not the registered one — must reject.
    let _ = checkout_client.mark_paid(&id, &impostor);
}

#[test]
#[should_panic]
fn test_mark_paid_rejects_when_payment_unset() {
    let env = Env::default();
    env.mock_all_auths();
    let checkout_addr = env.register(InvoiceContract, ());
    let checkout_client = checkout::InvoiceContractClient::new(&env, &checkout_addr);

    let id = String::from_str(&env, "inv_unset");
    let receiver = Address::generate(&env);
    let _ = checkout_client.create_invoice(&id, &receiver, &10i128, &String::from_str(&env, "n"));

    let impostor = payment_addr(&env);
    let _ = checkout_client.mark_paid(&id, &impostor);
}

#[test]
#[ignore = "requires live USDC testnet SAC; cannot run in local test env"]
fn test_pay_invoice_end_to_end() {
    // Placeholder for the full pay_invoice flow against a deployed USDC SAC.
}

fn payment_addr(env: &Env) -> Address {
    env.register(crate::PaymentContract, ())
}
