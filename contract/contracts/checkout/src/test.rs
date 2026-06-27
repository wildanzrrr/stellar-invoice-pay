#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env, String};

fn setup(env: &Env) -> (InvoiceContractClient, Address) {
    let payment = Address::generate(env);
    let cid = env.register(InvoiceContract, (&payment,));
    let client = InvoiceContractClient::new(env, &cid);
    (client, payment)
}

#[test]
fn test_create_invoice_already_exists() {
    let env = Env::default();
    let (client, _) = setup(&env);

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
    let (client, _) = setup(&env);

    let invoice_id = String::from_str(&env, "non_existent_invoice");

    // Try to get a non-existent invoice, should return an error
    assert_eq!(
        client.try_get_invoice(&invoice_id).unwrap_err(),
        Ok(Error::InvoiceNotFound)
    )
}

#[test]
fn test_mark_paid_succeeds_with_bound_payment() {
    let env = Env::default();
    let (client, payment) = setup(&env);

    let id = String::from_str(&env, "inv_ok");
    let receiver = Address::generate(&env);
    let _ = client.create_invoice(&id, &receiver, &10i128, &String::from_str(&env, "n"));

    let ok = client.mark_paid(&id, &payment);
    assert!(ok);
}

#[test]
fn test_mark_paid_rejects_wrong_payment_addr() {
    let env = Env::default();
    let (client, _) = setup(&env);

    let impostor = Address::generate(&env);

    let id = String::from_str(&env, "inv_bad");
    let receiver = Address::generate(&env);
    let _ = client.create_invoice(&id, &receiver, &10i128, &String::from_str(&env, "n"));

    assert_eq!(
        client.try_mark_paid(&id, &impostor).unwrap_err(),
        Ok(Error::Unauthorized)
    );
}
