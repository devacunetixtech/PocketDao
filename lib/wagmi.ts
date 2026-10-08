import { createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { botchainMainnet } from "./chains";

export const wagmiConfig = createConfig({
  chains: [botchainMainnet],
  connectors: [injected({ shimDisconnect: true })],
  transports: {
    [botchainMainnet.id]: http(),
  },
  ssr: true,
});
