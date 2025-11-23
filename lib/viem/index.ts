import type { TypedData } from "@ledgerhq/device-signer-kit-ethereum";
import {
  signMessage,
  signTransaction,
  signTypedData,
} from "lib/ledgerConnector";
import type { LedgerConnection } from "lib/types";
import { signatureToHex } from "lib/utils";
import { hexToBytes, serializeTransaction, toHex } from "viem";

import { toAccount, type Account } from "viem/accounts";

export const toLedgerAccount = (connection: LedgerConnection): Account => {
  const { signer, address, derivationPath } = connection;
  return toAccount({
    address: address.address,
    signMessage: async ({ message }) => {
      const msg =
        typeof message === "string" ? message : `0x${toHex(message.raw)}`;
      const sig = await signMessage(derivationPath, msg, signer);
      return signatureToHex(sig);
    },
    signTransaction: async (tx) => {
      const serialized = serializeTransaction(tx);
      const unsignedBytes = hexToBytes(serialized);
      const sigOrSigned = await signTransaction(
        derivationPath,
        unsignedBytes,
        signer
      );

      let vNum = sigOrSigned.v;
      if (vNum >= 27) {
        vNum = vNum - 27;
      }
      const yParity = (vNum === 0 ? 0 : 1) as 0 | 1;
      return serializeTransaction(tx, {
        ...sigOrSigned,
        yParity,
        v: BigInt(vNum),
      });
    },
    signTypedData: async (parameters) => {
      const sig = await signTypedData(
        derivationPath,
        parameters as TypedData,
        signer
      );
      return signatureToHex(sig);
    },
  });
};
