import { useRef, useState } from "react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { connectLedger } from "lib/ledgerConnector";
import { LedgerTransports, type LedgerConnection } from "lib/types";
import { createWalletClient, http } from "viem";
import { toLedgerAccount } from "lib/viem";
import { mainnet } from "viem/chains";

const DMKTest = () => {
  const [connection, setConnection] = useState<LedgerConnection | null>(null);
  const responseInputRef = useRef<HTMLTextAreaElement>(null);

  const handleConnectLedger = async () => {
    const connection = await connectLedger({
      transport: LedgerTransports.webHidIdentifier,
    });
    setConnection(connection);
  };

  const handleSignWithLedger = async () => {
    if (!connection) {
      return;
    }
    const account = toLedgerAccount(connection);
    const walletClient = createWalletClient({
      transport: http(),
      account,
      chain: mainnet,
    });
    const hash = await walletClient.signTransaction({
      to: connection.address.address,
      value: 1000000000000000000n,
    });
    responseInputRef.current!.value = hash;
  };

  return (
    <div className="flex flex-col justify-center items-center gap-10 my-10">
      <div className="flex justify-center items-center gap-10">
        <Button onClick={handleConnectLedger}>
          {connection ? "Reconnect Ledger" : "Connect Ledger"}
        </Button>
        <Button onClick={handleSignWithLedger}>Sign Transaction</Button>
      </div>
      <textarea
        ref={responseInputRef}
        readOnly
        placeholder="Response will appear here..."
        className={cn(
          "w-full min-h-[140px] bg-card",
          "border border-input rounded-xl p-3",
          "font-mono resize-y",
          "placeholder:text-muted-foreground"
        )}
      />
      {connection && (
        <p className="text-sm text-muted-foreground">
          Connected to: {connection.address.address}
        </p>
      )}
    </div>
  );
};

export default DMKTest;
