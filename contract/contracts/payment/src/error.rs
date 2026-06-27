use soroban_sdk::contracterror;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, Ord, PartialOrd)]
#[repr(u32)]
pub enum Error {
    InvoiceNotFound = 1,
    InvoiceAlreadyPaid = 2,
    MarkPaidFailed = 3,
}
