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
} from "@ledgerhq/device-management-kit";
import { FlipperDmkLogger } from "@ledgerhq/device-management-kit-flipper-plugin-client";
import {
  SignerEthBuilder,
  type AddressOptions,
  type GetAddressDAError,
  type GetAddressDAIntermediateValue,
  type GetAddressDAOutput,
  type Signature,
  type SignPersonalMessageDAError,
  type SignPersonalMessageDAIntermediateValue,
  type SignTransactionDAError,
  type SignTransactionDAIntermediateValue,
  type SignTypedDataDAError,
  type SignTypedDataDAIntermediateValue,
  type TransactionOptions,
  type TypedData,
} from "@ledgerhq/device-signer-kit-ethereum";
import { webBleTransportFactory } from "@ledgerhq/device-transport-kit-web-ble";
import { webHidTransportFactory } from "@ledgerhq/device-transport-kit-web-hid";

import type { MessageOptions } from "@ledgerhq/device-signer-kit-ethereum/api/model/MessageOptions.js";
import type { TypedDataOptions } from "@ledgerhq/device-signer-kit-ethereum/api/model/TypedDataOptions.js";
import type { DefaultSignerEth } from "@ledgerhq/device-signer-kit-ethereum/internal/DefaultSignerEth.js";

import { DEFAULT_DERIVATION_PATH, defaultMetadata } from "./constants";
import type { LedgerConnection, LedgerConnectorParameters } from "./types";
import { runDeviceActionOnce } from "./utils";
import { firstValueFrom } from "rxjs";

export const connectLedger = async ({
  addressOptions,
  transport,
  originToken,
  derivationPath = DEFAULT_DERIVATION_PATH,
}: LedgerConnectorParameters): Promise<LedgerConnection> => {
  const dmk = getLedgerDefaultDMK();
  const contextModule = getLedgerContextModule();
  const device = await firstValueFrom(dmk.startDiscovering({ transport }));
  const sessionId = await dmk.connect({
    device,
    sessionRefresherOptions: {
      isRefresherDisabled: true,
    },
  });

  const signer = getLedgerSignerEth(sessionId, dmk, contextModule, originToken);
  const address = await getAddress(derivationPath, signer, addressOptions);
  const disconnect = async () => {
    await dmk.disconnect({ sessionId });
  };

  return {
    dmk,
    sessionId,
    derivationPath,
    signer,
    address,
    disconnect,
  };
};

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

export const signTransaction = async (
  derivationPath: string,
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

export const signMessage = async (
  derivationPath: string,
  message: string | Uint8Array,
  signer: DefaultSignerEth,
  options?: MessageOptions,
  onComplete?: () => void
) => {
  return runDeviceActionOnce<
    Signature,
    SignPersonalMessageDAError,
    SignPersonalMessageDAIntermediateValue,
    DeviceActionState<
      Signature,
      SignPersonalMessageDAError,
      SignPersonalMessageDAIntermediateValue
    >
  >(() => signer.signMessage(derivationPath, message, options), onComplete);
};

export const signTypedData = async (
  derivationPath: string,
  typedData: TypedData,
  signer: DefaultSignerEth,
  options?: TypedDataOptions,
  onComplete?: () => void
) => {
  return runDeviceActionOnce<
    Signature,
    SignTypedDataDAError,
    SignTypedDataDAIntermediateValue,
    DeviceActionState<
      Signature,
      SignTypedDataDAError,
      SignTypedDataDAIntermediateValue
    >
  >(() => signer.signTypedData(derivationPath, typedData, options), onComplete);
};

export const getAddress = async (
  derivationPath: string,
  signer: DefaultSignerEth,
  options?: AddressOptions,
  onComplete?: () => void
) => {
  return runDeviceActionOnce<
    GetAddressDAOutput,
    GetAddressDAError,
    GetAddressDAIntermediateValue,
    DeviceActionState<
      GetAddressDAOutput,
      GetAddressDAError,
      GetAddressDAIntermediateValue
    >
  >(() => signer.getAddress(derivationPath, options), onComplete);
};
