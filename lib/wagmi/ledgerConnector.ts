import {
  ContextModuleBuilder,
  type ContextModule,
  type ContextModuleConfig,
} from "@ledgerhq/context-module";
import {
  ConsoleLogger,
  DeviceManagementKit,
  DeviceManagementKitBuilder,
  WebLogsExporterLogger,
  type DeviceActionState,
  type DiscoveredDevice,
  type TransportIdentifier,
} from "@ledgerhq/device-management-kit";
import { FlipperDmkLogger } from "@ledgerhq/device-management-kit-flipper-plugin-client";
import {
  SignerEthBuilder,
  type AddressOptions,
  type Signature,
  type SignTransactionDAError,
  type SignTransactionDAIntermediateValue,
  type TransactionOptions,
} from "@ledgerhq/device-signer-kit-ethereum";
import { webBleTransportFactory } from "@ledgerhq/device-transport-kit-web-ble";
import { webHidTransportFactory } from "@ledgerhq/device-transport-kit-web-hid";
import { defaultMetadata } from "./utils";
import { Observable } from "rxjs";

import { speculosIdentifier } from "@ledgerhq/device-transport-kit-speculos";
import { webBleIdentifier } from "@ledgerhq/device-transport-kit-web-ble";
import { webHidIdentifier } from "@ledgerhq/device-transport-kit-web-hid";
import type { DefaultSignerEth } from "@ledgerhq/device-signer-kit-ethereum/internal/DefaultSignerEth.js";

export const LedgerTransports = {
  speculosIdentifier,
  webBleIdentifier,
  webHidIdentifier,
} as const;

export type LedgerConnectorParameters = {
  derivationPath: string;
  addressOptions: AddressOptions;
  transport: TransportIdentifier;
};

type StartDeviceActionFn<TState> = () => {
  observable: Observable<TState>;
  cancel?: () => void;
};

export function ledgerConnector(parameters: LedgerConnectorParameters) {
  const dmk = getLedgerDefaultDMK();
  return {
    connect: () => {
      dmk.startDiscovering({ transport: parameters.transport }).subscribe({
        next: (device: DiscoveredDevice) => {
          dmk
            .connect({
              device: device,
              sessionRefresherOptions: {
                isRefresherDisabled: true,
              },
            })
            .then((sessionId: string) => {
              return sessionId;
            });
        },
      });
    },
    disconnect: (sessionId: string) => {
      dmk.disconnect({ sessionId });
    },
    dmk,
  };
}

export const getLedgerContextModule = (
  metadata: ContextModuleConfig = defaultMetadata
) => {
  return new ContextModuleBuilder({
    originToken: metadata.originToken,
  })
    .setCalConfig(metadata.cal)
    .setWeb3ChecksConfig(metadata.web3checks)
    .setMetadataServiceConfig(metadata.metadataServiceDomain)
    .build();
};

function getLedgerDefaultDMK(
  logsExporter: WebLogsExporterLogger = new WebLogsExporterLogger()
) {
  return new DeviceManagementKitBuilder()
    .addTransport(webHidTransportFactory)
    .addTransport(webBleTransportFactory)
    .addLogger(new ConsoleLogger())
    .addLogger(logsExporter)
    .addLogger(new FlipperDmkLogger())
    .build();
}

export const getLedgerSignerEth = (
  sessionId: string,
  dmk: DeviceManagementKit,
  contextModule: ContextModule,
  originToken: string = "origin-token"
) => {
  return new SignerEthBuilder({
    dmk,
    sessionId,
    originToken,
  })
    .withContextModule(contextModule)
    .build();
};

const signTransaction = async (
  derivationPath: string = "44'/60'/0'/0/0",
  transaction: Uint8Array,
  signer: DefaultSignerEth,
  options?: TransactionOptions,
  onComplete?: () => void
) => {
  return runDeviceActionOnce<
    Signature,
    SignTransactionDAError,
    SignTransactionDAIntermediateValue,
    DeviceActionState<
      Signature,
      SignTransactionDAError,
      SignTransactionDAIntermediateValue
    >
  >(
    () => signer.signTransaction(derivationPath, transaction, options),
    onComplete
  );
};

export function runDeviceActionOnce<
  TOutput,
  Err,
  Glue,
  TState extends DeviceActionState<TOutput, Err, Glue>
>(
  start: StartDeviceActionFn<TState>,
  onComplete?: () => void
): Promise<TOutput> {
  const { observable, cancel } = start();

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
