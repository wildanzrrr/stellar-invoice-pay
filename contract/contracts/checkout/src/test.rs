#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env, String};

#[test]
fn test_create_invoice_already_exists() {
    let env = Env::default();
    let contract_id = env.register(InvoiceContract, ());
    let client = InvoiceContractClient::new(&env, &contract_id);

    let invoice_id = String::from_str(&env, "invoice_123");
    let address = Address::generate(&env);
    let amount = 10i128;
    let note = String::from_str(&env, "Buy online class subscription for 1 month");

    // Create an invoice
    client.create_invoice(&invoice_id, &address, &amount, &note);

    // Try to create the same invoice again, should return an error
    assert_eq!(
        client
            .try_create_invoice(&invoice_id, &address, &amount, &note)
            .unwrap_err(),
        Ok(Error::InvoiceAlreadyExists)
    )
}

#[test]
fn test_get_invoice_not_found() {
    let env = Env::default();
    let contract_id = env.register(InvoiceContract, ());
    let client = InvoiceContractClient::new(&env, &contract_id);

    let invoice_id = String::from_str(&env, "non_existent_invoice");

    // Try to get a non-existent invoice, should return an error
    assert_eq!(
        client.try_get_invoice(&invoice_id).unwrap_err(),
        Ok(Error::InvoiceNotFound)
    )
}

#[test]
fn test_mark_paid_succeeds_with_registered_payment() {
    let env = Env::default();
    env.mock_all_auths();
    let cid = env.register(InvoiceContract, ());
    let client = InvoiceContractClient::new(&env, &cid);

    let admin = Address::generate(&env);
    client.init(&admin);

    let payment = Address::generate(&env);
    client.set_payment_contract(&payment);

    let id = String::from_str(&env, "inv_acl_ok");
    let receiver = Address::generate(&env);
    let _ = client.create_invoice(&id, &receiver, &10i128, &String::from_str(&env, "n"));

    let ok = client.mark_paid(&id, &payment);
    assert!(ok);
}

#[test]
fn test_mark_paid_rejects_wrong_payment_addr() {
    let env = Env::default();
    env.mock_all_auths();
    let cid = env.register(InvoiceContract, ());
    let client = InvoiceContractClient::new(&env, &cid);

    let admin = Address::generate(&env);
    client.init(&admin);

    let registered = Address::generate(&env);
    let impostor = Address::generate(&env);
    client.set_payment_contract(&registered);

    let id = String::from_str(&env, "inv_acl_bad");
    let receiver = Address::generate(&env);
    let _ = client.create_invoice(&id, &receiver, &10i128, &String::from_str(&env, "n"));

    assert_eq!(
        client.try_mark_paid(&id, &impostor).unwrap_err(),
        Ok(Error::Unauthorized)
    );
}

#[test]
fn test_mark_paid_rejects_when_payment_unset() {
    let env = Env::default();
    env.mock_all_auths();
    let cid = env.register(InvoiceContract, ());
    let client = InvoiceContractClient::new(&env, &cid);

    let id = String::from_str(&env, "inv_acl_unset");
    let receiver = Address::generate(&env);
    let _ = client.create_invoice(&id, &receiver, &10i128, &String::from_str(&env, "n"));

    let some_addr = Address::generate(&env);
    assert_eq!(
        client.try_mark_paid(&id, &some_addr).unwrap_err(),
        Ok(Error::PaymentContractNotSet)
    );
}
