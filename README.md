# Invoice and Pay

**Invoice and Pay** is a simple, no-account-required checkout app built on **Stellar**. A merchant fills in an amount and a note, gets a shareable link + QR, and the payer settles in **USDC** on testnet. Two small Soroban contracts handle the invoice lifecycle and the on-chain payment — the frontend just drives them.

The tagline says it all: _Make Checkout, get Paid in USDC._

![Invoice and Pay — Create and Pay views](docs/Screenshot-1.png)

---

## Deployment Summary

| Component             | Details                                                                                                                                                                                                                                                                                                                                                                                                       |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Website**           | https://stellar-invoice-pay.vercel.app/                                                                                                                                                                                                                                                                                                                                                                       |
| **Checkout Contract** | [CAXMI7MNVY2TSIWB4RF2V5DTBP26Z5CIUGUWATLWCL67UPBA2F23IOE3](https://lab.stellar.org/smart-contracts/contract-explorer?$=network$id=testnet&label=Testnet&horizonUrl=https:////horizon-testnet.stellar.org&rpcUrl=https:////soroban-testnet.stellar.org&passphrase=Test%20SDF%20Network%20/;%20September%202015;&smartContracts$explorer$contractId=CAXMI7MNVY2TSIWB4RF2V5DTBP26Z5CIUGUWATLWCL67UPBA2F23IOE3;;) |
| **Payment Contract**  | [CDPK2U33ENBPXTXJGLIIFJVKCUSI5R6UPHHCLC334QJOWIKOJAW523RV](https://lab.stellar.org/smart-contracts/contract-explorer?$=network$id=testnet&label=Testnet&horizonUrl=https:////horizon-testnet.stellar.org&rpcUrl=https:////soroban-testnet.stellar.org&passphrase=Test%20SDF%20Network%20/;%20September%202015;&smartContracts$explorer$contractId=CDPK2U33ENBPXTXJGLIIFJVKCUSI5R6UPHHCLC334QJOWIKOJAW523RV;;) |

<div>
    <a href="https://www.loom.com/share/9288a39e6dc84f7c8598dd33660845cc">
      <p>Invoice and Pay App Demo on Stellar - Watch Video</p>
    </a>
    <a href="https://www.loom.com/share/9288a39e6dc84f7c8598dd33660845cc">
      <img style="max-width:300px;" src="https://cdn.loom.com/sessions/thumbnails/9288a39e6dc84f7c8598dd33660845cc-18cc4a7a155c1b4f-full-play.gif#t=0.1">
    </a>
  </div>

---

## High Level Architecture

![High Level Architecture](docs/HLA.png)

The system is split into two Soroban contracts that talk to each other, plus the Stellar USDC Stellar Asset Contract (SAC) for the actual token movement:

- **Checkout Contract** — `create_invoice`, `get_invoice`, `mark_paid`. Holds the invoice state and is the source of truth for "paid or not". Emits `InvoiceCreatedEvent` and `InvoicePaidEvent`.
- **Payment Contract** — `pay_invoice`. The single entry point for paying. It cross-calls `get_invoice` on checkout, transfers USDC from payer to receiver, then cross-calls `mark_paid`.
- **USDC SAC** — the Stellar Asset Contract for USDC on testnet. Payment invokes it via the standard `token::Client` to move funds.
- **Registration flow** — at deploy time, checkout receives the payment contract address in its constructor and stores it. Every `mark_paid` call must pass an address that matches that stored value, so only the real payment contract can flip invoices to paid. No handshake, no re-entry.

In short: **checkout owns state, payment owns the USDC move, the SAC owns the token, and the registration is a one-time address pin at deploy.**

---

## How to Setup

### 1. Install frontend dependencies

```bash
pnpm install
```

### 2. Copy `.env.example` and fill `.env`

```bash
cp .env.example .env
```

Then edit `.env`:

- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` — your WalletConnect Cloud project ID (used by the Stellar wallets kit).
- `NEXT_PUBLIC_STELLAR_NETWORK` — `TESTNET` or `PUBLIC`.
- `NEXT_PUBLIC_APP_URL` — the public URL the app is served from (used for OG / canonical metadata).

### 3. Build and deploy the contracts

Build the WASM artifacts:

```bash
cd contract && stellar contract build
```

Deploy the **payment** contract first (you need its address to pass into checkout):

```bash
stellar contract deploy \
--wasm target/wasm32v1-none/release/payment.wasm \
--source-account YOUR_ACCOUNT \
--network testnet \
--alias payment
```

Grab the deployed payment contract address from the output, then use it in the next step.

Deploy the **checkout** contract, passing the payment contract address as the constructor arg:

```bash
stellar contract deploy \
  --wasm target/wasm32v1-none/release/checkout.wasm \
  --source-account YOUR_ACCOUNT \
  --network testnet \
  -- \
  --payment_contract PAYMENT_CONTRACT_ADDRESS
```

### 4. Create the bindings for the two contracts:

```bash
stellar contract bindings typescript \
  --network testnet \
  --contract-id payment \
  --output-dir packages/payment
stellar contract bindings typescript \
  --network testnet \
  --contract-id checkout \
  --output-dir packages/checkout
cd packages/checkout && pnpm i && cd ../payment && pnpm i
cd ../../../
```

### 5. Run the app

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to create an invoice, or `/pay/<invoice-id>` to settle one. Make sure your wallet is funded with testnet USDC before paying.
