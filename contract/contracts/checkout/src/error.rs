use soroban_sdk::contracterror;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, Ord, PartialOrd)]
#[repr(u32)]
pub enum Error {
    InvoiceAlreadyExists = 1,
    InvoiceNotFound = 2,
    InvoiceAlreadyPaid = 3,
    MarkPaidFailed = 4,
    Unauthorized = 5,
    PaymentContractNotSet = 6,
}
