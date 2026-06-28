import { Buffer } from "buffer";
import { Address } from "@stellar/stellar-sdk";
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from "@stellar/stellar-sdk/contract";
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Timepoint,
  Duration,
} from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";

if (typeof window !== "undefined") {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}


export const networks = {
  testnet: {
    networkPassphrase: "Test SDF Network ; September 2015",
    contractId: "CDPK2U33ENBPXTXJGLIIFJVKCUSI5R6UPHHCLC334QJOWIKOJAW523RV",
  }
} as const

export const Errors = {
  1: {message:"InvoiceNotFound"},
  2: {message:"InvoiceAlreadyPaid"},
  3: {message:"MarkPaidFailed"}
}


/**
 * Mirrors the `Invoice` shape in the checkout contract.
 * Re-declared here so the payment contract stays decoupled at the crate level.
 */
export interface Invoice {
  amount: i128;
  id: string;
  is_paid: boolean;
  note: string;
  receiver: string;
}

export interface Client {
  /**
   * Construct and simulate a pay_invoice transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Pay an open invoice with USDC.
   * 
   * Workflow:
   * 1. Require payer auth up front so the cross-call tree is authorized.
   * 2. Cross-call the checkout contract's `get_invoice` to fetch the invoice.
   * 3. Reject if already paid.
   * 4. Transfer USDC from `payer` to the invoice's `receiver`.
   * 5. Cross-call `mark_paid` on the checkout contract to flip the flag.
   */
  pay_invoice: ({payer, invoice_contract, id}: {payer: string, invoice_contract: string, id: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      }
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy(null, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAAAAAAAVNQYXkgYW4gb3BlbiBpbnZvaWNlIHdpdGggVVNEQy4KCldvcmtmbG93OgoxLiBSZXF1aXJlIHBheWVyIGF1dGggdXAgZnJvbnQgc28gdGhlIGNyb3NzLWNhbGwgdHJlZSBpcyBhdXRob3JpemVkLgoyLiBDcm9zcy1jYWxsIHRoZSBjaGVja291dCBjb250cmFjdCdzIGBnZXRfaW52b2ljZWAgdG8gZmV0Y2ggdGhlIGludm9pY2UuCjMuIFJlamVjdCBpZiBhbHJlYWR5IHBhaWQuCjQuIFRyYW5zZmVyIFVTREMgZnJvbSBgcGF5ZXJgIHRvIHRoZSBpbnZvaWNlJ3MgYHJlY2VpdmVyYC4KNS4gQ3Jvc3MtY2FsbCBgbWFya19wYWlkYCBvbiB0aGUgY2hlY2tvdXQgY29udHJhY3QgdG8gZmxpcCB0aGUgZmxhZy4AAAAAC3BheV9pbnZvaWNlAAAAAAMAAAAAAAAABXBheWVyAAAAAAAAEwAAAAAAAAAQaW52b2ljZV9jb250cmFjdAAAABMAAAAAAAAAAmlkAAAAAAAQAAAAAQAAA+kAAAACAAAAAw==",
        "AAAABAAAAAAAAAAAAAAABUVycm9yAAAAAAAAAwAAAAAAAAAPSW52b2ljZU5vdEZvdW5kAAAAAAEAAAAAAAAAEkludm9pY2VBbHJlYWR5UGFpZAAAAAAAAgAAAAAAAAAOTWFya1BhaWRGYWlsZWQAAAAAAAM=",
        "AAAAAQAAAIJNaXJyb3JzIHRoZSBgSW52b2ljZWAgc2hhcGUgaW4gdGhlIGNoZWNrb3V0IGNvbnRyYWN0LgpSZS1kZWNsYXJlZCBoZXJlIHNvIHRoZSBwYXltZW50IGNvbnRyYWN0IHN0YXlzIGRlY291cGxlZCBhdCB0aGUgY3JhdGUgbGV2ZWwuAAAAAAAAAAAAB0ludm9pY2UAAAAABQAAAAAAAAAGYW1vdW50AAAAAAALAAAAAAAAAAJpZAAAAAAAEAAAAAAAAAAHaXNfcGFpZAAAAAABAAAAAAAAAARub3RlAAAAEAAAAAAAAAAIcmVjZWl2ZXIAAAAT" ]),
      options
    )
  }
  public readonly fromJSON = {
    pay_invoice: this.txFromJSON<Result<void>>
  }
}