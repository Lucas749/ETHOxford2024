import { http, createConfig } from 'wagmi'
import { mainnet, sepolia, etherlinkTestnet } from 'wagmi/chains'
// import {EtherLink} from ''./app/customChains
import { coinbaseWallet, injected, walletConnect } from 'wagmi/connectors'

export const config = createConfig({
  chains: [etherlinkTestnet, mainnet, sepolia],
  connectors: [
    injected(),
    coinbaseWallet({ appName: 'Etherlink Builder' }),
    // walletConnect({ projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID }),
  ],
  ssr: true,
  transports: {
    [etherlinkTestnet.id]: http(),
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}
