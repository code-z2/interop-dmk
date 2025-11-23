import { type ContextModuleConfig } from "@ledgerhq/context-module";

export const defaultMetadata: ContextModuleConfig = {
  cal: {
    url: "https://crypto-assets-service.api.ledger.com/v1",
    mode: "prod",
    branch: "main",
  },
  web3checks: {
    url: "https://web3checks-backend.api.ledger.com/v3",
  },
  metadataServiceDomain: {
    url: "https://nft.api.live.ledger.com",
  },
  originToken: process.env.NEXT_PUBLIC_GATING_TOKEN || "origin-token",
  defaultLoaders: false,
  defaultFieldLoaders: false,
  customFieldLoaders: [],
  customLoaders: [],
};

export const DEFAULT_DERIVATION_PATH = "44'/60'/0'/0/0";
