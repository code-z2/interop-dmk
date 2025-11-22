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
} from "@ledgerhq/device-management-kit";
import { FlipperDmkLogger } from "@ledgerhq/device-management-kit-flipper-plugin-client";
import {
  SignerEthBuilder,
  type AddressOptions,
} from "@ledgerhq/device-signer-kit-ethereum";
import { webBleTransportFactory } from "@ledgerhq/device-transport-kit-web-ble";
import { webHidTransportFactory } from "@ledgerhq/device-transport-kit-web-hid";
import { createConnector } from "@wagmi/core";
import { defaultMetadata } from "./utils";

export type LedgerConnectorParameters = {
  derivationPath: string;
  addressOptions: AddressOptions;
};

export function ledgerConnector(parameters: LedgerConnectorParameters) {
  return createConnector((config) => ({
    icon: "ledger",
    id: "ledger",
    name: "Ledger",
    rdns: "com.ledger",
    connector: ledgerConnector(parameters),
    disconnect: async () => {
      await signer.close();
    },
    getAccounts: () => {},
  }));
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
  originToken: string = "origin-token",
  dmk: DeviceManagementKit = getLedgerDefaultDMK(),
  contextModule: ContextModule = getLedgerContextModule()
) => {
  return new SignerEthBuilder({
    dmk,
    sessionId,
    originToken,
  })
    .withContextModule(contextModule)
    .build();
};

const signer = getLedgerSignerEth("");

// const getAccount = async (derivationPath: string, addressOptions: AddressOptions) => {
//     return toAccount({
//         address: await signer.getAddress(derivationPath, addressOptions),
//         signMessage: async ({ message }) => {
//             return await signer.signMessage(derivationPath, addressOptions);
//         },
//         signTransaction: async (transaction, { serializer }) => {
//             return signTransaction({ privateKey: await signer.getPrivateKey(derivationPath, addressOptions), transaction, serializer });
//         },
//         signTypedData: async (typedData) => {
//             return signTypedData({ ...typedData, privateKey: await signer.getPrivateKey(derivationPath, addressOptions) });
//         },

//     })
// }
