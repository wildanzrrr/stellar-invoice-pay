#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env, String};

#[test]
fn test_create_invoice_already_exists() {
    let env = Env::default();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

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
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let invoice_id = String::from_str(&env, "non_existent_invoice");

    // Try to get a non-existent invoice, should return an error
    assert_eq!(
        client.try_get_invoice(&invoice_id).unwrap_err(),
        Ok(Error::InvoiceNotFound)
    )
}
