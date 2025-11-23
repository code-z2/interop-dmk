import { speculosIdentifier } from "@ledgerhq/device-transport-kit-speculos";
import { webBleIdentifier } from "@ledgerhq/device-transport-kit-web-ble";
import { webHidIdentifier } from "@ledgerhq/device-transport-kit-web-hid";
import { Observable } from "rxjs";
import { DeviceManagementKit } from "@ledgerhq/device-management-kit";
import type {
  AddressOptions,
  GetAddressDAOutput,
} from "@ledgerhq/device-signer-kit-ethereum";
import type { DefaultSignerEth } from "@ledgerhq/device-signer-kit-ethereum/internal/DefaultSignerEth.js";

export const LedgerTransports = {
  speculosIdentifier,
  webBleIdentifier,
  webHidIdentifier,
} as const;

export type LedgerConnectorParameters = {
  addressOptions: AddressOptions;
  transport: (typeof LedgerTransports)[keyof typeof LedgerTransports];
  originToken?: string;
  derivationPath?: string;
};

export type StartDeviceActionFn<TState> = () => {
  observable: Observable<TState>;
  cancel?: () => void;
};

export type LedgerConnection = {
  dmk: DeviceManagementKit;
  sessionId: string;
  derivationPath: string;
  signer: DefaultSignerEth;
  address: GetAddressDAOutput;
  disconnect: () => Promise<void>;
};
