import type { DeviceActionState } from "@ledgerhq/device-management-kit";
import type { StartDeviceActionFn } from "./types";
import type { Signature } from "@ledgerhq/device-signer-kit-ethereum";
import { bytesToHex, hexToBytes, type Hex } from "viem";

export function runDeviceActionOnce<
  TOutput,
  Err,
  Glue,
  TState extends DeviceActionState<TOutput, Err, Glue>
>(
  start: StartDeviceActionFn<TState>,
  onComplete?: () => void
): Promise<TOutput> {
  const { observable } = start();

  return new Promise<TOutput>((resolve, reject) => {
    const subscription = observable.subscribe({
      next(state: TState) {
        if (state.status === "completed") {
          subscription.unsubscribe();
          resolve(state.output);
        }
      },
      error(err: Err) {
        subscription.unsubscribe();
        reject(err);
      },
      complete() {
        onComplete?.();
      },
    });
  });
}

export const signatureToHex = (sig: Signature): Hex => {
  const rBytes = hexToBytes(sig.r);
  const sBytes = hexToBytes(sig.s);

  let vNum = sig.v;
  const vByte = vNum >= 27 ? vNum - 27 : vNum;

  const out = new Uint8Array(65);
  out.set(rBytes, 0);
  out.set(sBytes, 32);
  out[64] = vByte;

  return `0x${bytesToHex(out)}`;
};
