// import './globals.css'
// import type { Metadata } from 'next'
// import { Inter } from 'next/font/google'
// import { type ReactNode } from 'react'

// import { Providers } from './providers'

// const inter = Inter({ subsets: ['latin'] })

// export const metadata: Metadata = {
//   title: 'EtherlinkGPT',
//   description: 'No Code Building on Etherlink',
// }

// export default function RootLayout(props: { children: ReactNode }) {
//   return (
//     <html lang="en">
//       <body className={inter.className}>
//         <Providers>{props.children}</Providers>
//       </body>
//     </html>
//   )
// }


import './globals.css';
import type { ReactNode } from 'react';
import Head from 'next/head';
import { Inter } from 'next/font/google';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Head>
        <title>EtherlinkGPT</title>
        <meta name="description" content="No Code Building on Etherlink" />
        <link rel="icon" href="favicon.ico" /> 
      </Head>
      <html lang="en">
        <body className={inter.className}>
          <Providers>{children}</Providers>
        </body>
      </html>
    </>
  );
}
