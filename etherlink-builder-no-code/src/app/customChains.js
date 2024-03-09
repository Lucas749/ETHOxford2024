import { Chain } from 'wagmi'
 
export const EtherLink = {
    id: 128123,
    name: 'Etherlink',
    network: 'Etherlink',
    iconUrl: "https://www.etherlink.com/_next/image?url=%2Fimg%2Fhome%2Flogo.png&w=256&q=75",
    nativeCurrency: {
      decimals: 18,
      name: 'Tezos',
      symbol: 'XTZ',
    },
    rpcUrls: {
      public: { http: ['https://node.ghostnet.etherlink.com'] },
      default: { http: ['https://node.ghostnet.etherlink.com'] },
    },
    blockExplorers: {
      default: { name: 'Etherlink', url: 'https://testnet-explorer.etherlink.com/' },
    },
  }