import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "@/components/ui/sonner";
import { useLocale } from "@/lib/locale";

type SolanaConnectResponse = {
  publicKey?: {
    toString: () => string;
  };
};

type SolanaProvider = {
  isPhantom?: boolean;
  publicKey?: {
    toString: () => string;
  } | null;
  isConnected?: boolean;
  connect: () => Promise<SolanaConnectResponse>;
  disconnect?: () => Promise<void>;
  signTransaction?: (transaction: unknown) => Promise<unknown>;
  signAndSendTransaction?: (
    transaction: unknown,
    options?: Record<string, unknown>,
  ) => Promise<{ signature: string }>;
  on: (event: string, listener: (...args: unknown[]) => void) => void;
  removeListener: (event: string, listener: (...args: unknown[]) => void) => void;
};

type WalletContextValue = {
  address: string | null;
  chainId: string | null;
  isInstalled: boolean;
  isConnecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  shortAddress: string | null;
};

const WalletContext = createContext<WalletContextValue | null>(null);
const SOLANA_CHAIN_ID = "Solana";

export const getPhantomProvider = (): SolanaProvider | null => {
  if (typeof window === "undefined") return null;
  const provider = window.phantom?.solana ?? null;
  return provider?.isPhantom ? provider : null;
};

const formatAddress = (address: string) =>
  `${address.slice(0, 4)}...${address.slice(-4)}`;

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const { pick } = useLocale();
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const isInstalled = !!getPhantomProvider();

  useEffect(() => {
    const provider = getPhantomProvider();
    if (!provider) return;

    const syncWallet = () => {
      const nextAddress = provider.publicKey?.toString() ?? null;
      setAddress(nextAddress);
      setChainId(nextAddress ? SOLANA_CHAIN_ID : null);
    };

    syncWallet();

    const handleConnect = () => {
      syncWallet();
    };

    const handleDisconnect = () => {
      setAddress(null);
      setChainId(null);
    };

    const handleAccountChanged = (nextPublicKey: unknown) => {
      const nextAddress =
        nextPublicKey &&
        typeof nextPublicKey === "object" &&
        "toString" in nextPublicKey &&
        typeof nextPublicKey.toString === "function"
          ? nextPublicKey.toString()
          : null;
      setAddress(nextAddress);
      setChainId(nextAddress ? SOLANA_CHAIN_ID : null);
    };

    provider.on("connect", handleConnect);
    provider.on("disconnect", handleDisconnect);
    provider.on("accountChanged", handleAccountChanged);

    return () => {
      provider.removeListener("connect", handleConnect);
      provider.removeListener("disconnect", handleDisconnect);
      provider.removeListener("accountChanged", handleAccountChanged);
    };
  }, []);

  const connect = async () => {
    const provider = getPhantomProvider();
    if (!provider) {
      toast.error(
        pick({
          "zh-CN": "尚未检测到 Phantom 钱包。",
          "zh-TW": "尚未偵測到 Phantom 錢包。",
          en: "Phantom wallet is not installed.",
          ja: "Phantom ウォレットが見つかりません。",
        }),
      );
      return;
    }

    setIsConnecting(true);
    try {
      const response = await provider.connect();
      const nextAddress = response.publicKey?.toString() ?? provider.publicKey?.toString() ?? null;
      setAddress(nextAddress);
      setChainId(nextAddress ? SOLANA_CHAIN_ID : null);

      if (nextAddress) {
        toast.success(
          pick({
            "zh-CN": `Phantom 已连接：${formatAddress(nextAddress)}`,
            "zh-TW": `Phantom 已連接：${formatAddress(nextAddress)}`,
            en: `Phantom connected: ${formatAddress(nextAddress)}`,
            ja: `Phantom 接続完了：${formatAddress(nextAddress)}`,
          }),
        );
      }
    } catch (error) {
      const fallbackMessage = pick({
        "zh-CN": "Phantom 连接已取消。",
        "zh-TW": "Phantom 連接已取消。",
        en: "Phantom connection was cancelled.",
        ja: "Phantom の接続がキャンセルされました。",
      });
      const message =
        error instanceof Error && error.message
          ? error.message
          : fallbackMessage;
      toast.error(message);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = async () => {
    const provider = getPhantomProvider();
    if (!provider?.disconnect) {
      setAddress(null);
      setChainId(null);
      return;
    }

    try {
      await provider.disconnect();
      setAddress(null);
      setChainId(null);
      toast.success(
        pick({
          "zh-CN": "Phantom 已断开连接。",
          "zh-TW": "Phantom 已中斷連接。",
          en: "Phantom disconnected.",
          ja: "Phantom を切断しました。",
        }),
      );
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : pick({
              "zh-CN": "Phantom 断开连接失败。",
              "zh-TW": "Phantom 中斷連接失敗。",
              en: "Failed to disconnect Phantom.",
              ja: "Phantom の切断に失敗しました。",
            });
      toast.error(message);
    }
  };

  const value = useMemo<WalletContextValue>(
    () => ({
      address,
      chainId,
      isInstalled,
      isConnecting,
      connect,
      disconnect,
      shortAddress: address ? formatAddress(address) : null,
    }),
    [address, chainId, isConnecting, isInstalled],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within WalletProvider");
  }
  return context;
};

declare global {
  interface Window {
    phantom?: {
      solana?: SolanaProvider;
    };
  }
}
