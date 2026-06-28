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
    contractId: "CAXMI7MNVY2TSIWB4RF2V5DTBP26Z5CIUGUWATLWCL67UPBA2F23IOE3",
  }
} as const

export const Errors = {
  1: {message:"InvoiceAlreadyExists"},
  2: {message:"InvoiceNotFound"},
  3: {message:"InvoiceAlreadyPaid"},
  4: {message:"Unauthorized"}
}


export interface Invoice {
  amount: i128;
  id: string;
  is_paid: boolean;
  note: string;
  receiver: string;
}



export interface Client {
  /**
   * Construct and simulate a mark_paid transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Mark an invoice as paid. Only callable by the payment contract that was
   * bound at deploy time.
   * 
   * The caller MUST pass its own address as `payment_contract`. We compare it
   * against the address stored in the constructor. No cross-call, no re-entry.
   */
  mark_paid: ({id, payment_contract}: {id: string, payment_contract: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<boolean>>>

  /**
   * Construct and simulate a get_invoice transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_invoice: ({id}: {id: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<Invoice>>>

  /**
   * Construct and simulate a create_invoice transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  create_invoice: ({id, receiver, amount, note}: {id: string, receiver: string, amount: i128, note: string}, options?: MethodOptions) => Promise<AssembledTransaction<Result<string>>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
        /** Constructor/Initialization Args for the contract's `__constructor` method */
        {payment_contract}: {payment_contract: string},
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
    return ContractClient.deploy({payment_contract}, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAAAAAAAPNNYXJrIGFuIGludm9pY2UgYXMgcGFpZC4gT25seSBjYWxsYWJsZSBieSB0aGUgcGF5bWVudCBjb250cmFjdCB0aGF0IHdhcwpib3VuZCBhdCBkZXBsb3kgdGltZS4KClRoZSBjYWxsZXIgTVVTVCBwYXNzIGl0cyBvd24gYWRkcmVzcyBhcyBgcGF5bWVudF9jb250cmFjdGAuIFdlIGNvbXBhcmUgaXQKYWdhaW5zdCB0aGUgYWRkcmVzcyBzdG9yZWQgaW4gdGhlIGNvbnN0cnVjdG9yLiBObyBjcm9zcy1jYWxsLCBubyByZS1lbnRyeS4AAAAACW1hcmtfcGFpZAAAAAAAAAIAAAAAAAAAAmlkAAAAAAAQAAAAAAAAABBwYXltZW50X2NvbnRyYWN0AAAAEwAAAAEAAAPpAAAAAQAAAAM=",
        "AAAAAAAAAAAAAAALZ2V0X2ludm9pY2UAAAAAAQAAAAAAAAACaWQAAAAAABAAAAABAAAD6QAAB9AAAAAHSW52b2ljZQAAAAAD",
        "AAAAAAAAAKtDb25zdHJ1Y3RvcjogcnVucyBvbmNlIG9uIGRlcGxveS4gVGhlIHBheW1lbnQgY29udHJhY3QgYWRkcmVzcyBpcyBmaXhlZCBhdApkZXBsb3kgdGltZSwgc28gZGVwbG95IG9yZGVyIGlzOiBwYXltZW50IGZpcnN0IOKGkiB0aGVuIGNoZWNrb3V0IHdpdGggdGhlCmtub3duIHBheW1lbnQgYWRkcmVzcy4AAAAADV9fY29uc3RydWN0b3IAAAAAAAABAAAAAAAAABBwYXltZW50X2NvbnRyYWN0AAAAEwAAAAA=",
        "AAAAAAAAAAAAAAAOY3JlYXRlX2ludm9pY2UAAAAAAAQAAAAAAAAAAmlkAAAAAAAQAAAAAAAAAAhyZWNlaXZlcgAAABMAAAAAAAAABmFtb3VudAAAAAAACwAAAAAAAAAEbm90ZQAAABAAAAABAAAD6QAAABAAAAAD",
        "AAAABAAAAAAAAAAAAAAABUVycm9yAAAAAAAABAAAAAAAAAAUSW52b2ljZUFscmVhZHlFeGlzdHMAAAABAAAAAAAAAA9JbnZvaWNlTm90Rm91bmQAAAAAAgAAAAAAAAASSW52b2ljZUFscmVhZHlQYWlkAAAAAAADAAAAAAAAAAxVbmF1dGhvcml6ZWQAAAAE",
        "AAAAAQAAAAAAAAAAAAAAB0ludm9pY2UAAAAABQAAAAAAAAAGYW1vdW50AAAAAAALAAAAAAAAAAJpZAAAAAAAEAAAAAAAAAAHaXNfcGFpZAAAAAABAAAAAAAAAARub3RlAAAAEAAAAAAAAAAIcmVjZWl2ZXIAAAAT",
        "AAAABQAAAAAAAAAAAAAAEEludm9pY2VQYWlkRXZlbnQAAAABAAAAEmludm9pY2VfcGFpZF9ldmVudAAAAAAABAAAAAAAAAACaWQAAAAAABAAAAAAAAAAAAAAAAZhbW91bnQAAAAAAAsAAAAAAAAAAAAAAAhyZWNlaXZlcgAAABMAAAAAAAAAAAAAAARub3RlAAAAEAAAAAAAAAAC",
        "AAAABQAAAAAAAAAAAAAAE0ludm9pY2VDcmVhdGVkRXZlbnQAAAAAAQAAABVpbnZvaWNlX2NyZWF0ZWRfZXZlbnQAAAAAAAAEAAAAAAAAAAJpZAAAAAAAEAAAAAAAAAAAAAAABmFtb3VudAAAAAAACwAAAAAAAAAAAAAACHJlY2VpdmVyAAAAEwAAAAAAAAAAAAAABG5vdGUAAAAQAAAAAAAAAAI=" ]),
      options
    )
  }
  public readonly fromJSON = {
    mark_paid: this.txFromJSON<Result<boolean>>,
        get_invoice: this.txFromJSON<Result<Invoice>>,
        create_invoice: this.txFromJSON<Result<string>>
  }
}