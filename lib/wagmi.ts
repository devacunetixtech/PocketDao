import { createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { botchainMainnet, botchainTestnet } from "./chains";

export const wagmiConfig = createConfig({
  chains: [botchainTestnet, botchainMainnet],
  connectors: [injected({ shimDisconnect: true })],
  transports: {
    [botchainTestnet.id]: http(),
    [botchainMainnet.id]: http(),
  },
  ssr: true,
});
