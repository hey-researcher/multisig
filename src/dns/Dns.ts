import { Address, Cell, Contract, Slice, beginCell } from "@ton/core";
import {Op} from "./DnsConstants";


async function digestMessage(message: string): Promise<Buffer> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Buffer.from(hash);
}

export class Dns implements Contract {
  constructor(readonly address: Address, readonly init?: {code: Cell, data: Cell}) {

  }

  static async changeDnsRecord(address: Address): Promise<Cell> {
    return beginCell()
      .storeUint(Op.change_dns_record, 32)
      .storeUint(0, 64) // queryId
      .storeBuffer(await digestMessage('wallet'))
      .storeRef(
        beginCell()
          .storeUint(0x9fd3, 16)
          .storeAddress(address)
          .storeUint(0, 8)
          .endCell()
      )
      .endCell();
  }

  static parseCallTo(slice: Slice) {
    const op = slice.loadUint(32);
    if (op !== Op.change_dns_record) throw new Error('Invalid op');

    const queryId = slice.loadUint(64);
    const ref = slice.loadRef();
    const refSlice = ref.asSlice();
    refSlice.skip(16); // skip addr

    const newAddress = refSlice.loadAddress();

    return {
      queryId,
      newAddress
    };
  }
}
