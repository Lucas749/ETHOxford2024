'use client'
import { useState } from 'react';
import axios from 'axios';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';

export default function Home() {
    const { data: account } = useAccount();
    const { connect, connectors, error, isLoading } = useConnect();
    const { disconnect } = useDisconnect();

    const [input, setInput] = useState('');
    const [response, setResponse] = useState({ fullCode: '', components: {} });

    const handleInputChange = (e) => setInput(e.target.value);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Ensure the endpoint matches your environment setup; this is for localhost development.
            const res = await axios.post('/api/chat', { message: input });
            console.log(res.data);
            setResponse(res.data);
        } catch (error) {
            console.error('Error fetching response:', error);
        }
    };

    return (
        <div>
            <div>
                <h2>Account</h2>
                <div>
                    status: {account?.status}
                    <br />
                    address: {account?.address}
                    <br />
                    chainId: {account?.chainId}
                </div>
                <ConnectButton />
            </div>

            {account?.address && (
                <button type="button" onClick={() => disconnect()}>
                    Disconnect
                </button>
            )}

            <div>
                <h2>Connect</h2>
                {connectors.map((connector) => (
                    <button key={connector.id} onClick={() => connect(connector)} disabled={!connector.ready}>
                        {connector.name}
                        {!connector.ready && ' (unsupported)'}
                        {isLoading && connector.id === connector?.id && '…'}
                    </button>
                ))}
                {error && <div>{error.message}</div>}
            </div>

            <h1>What do you want to build on Etherlink?</h1>
            <form onSubmit={handleSubmit}>
                <input type="text" value={input} onChange={handleInputChange} placeholder="Enter your idea" />
                <button type="submit">Submit</button>
            </form>
            {response.fullCode && (
                <div>
                    <h2>Full Code:</h2>
                    <pre>{response.fullCode}</pre>
                </div>
            )}
            {Object.keys(response.components).length > 0 && (
                <div>
                    <h2>Code Components:</h2>
                    {Object.entries(response.components).map(([name, { description, code }], index) => (
                        <div key={index}>
                            <h3>{name}</h3>
                            <p>Description: {description}</p>
                            <pre>Code: {code}</pre>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
