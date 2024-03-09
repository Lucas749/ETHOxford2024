'use client'
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useWalletClient, useSendTransaction, useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { AppBar, Toolbar, Typography, Button, TextField, Container, Box, Card, CardContent, Snackbar } from '@mui/material';
import { ethers } from 'ethers';
// const { ethers } = require("ethers");

export default function Home() {
    const { data: account } = useAccount();
    const [input, setInput] = useState('');
    const [response, setResponse] = useState({ fullCode: '', components: {} });
    const [compilationResult, setCompilationResult] = useState(null);
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [provider, setProvider] = useState(null);

    useEffect(() => {
        // Make sure ethers and window.ethereum are defined
        if (typeof ethers !== 'undefined' && window.ethereum) {
            console.log(window.ethereum, 'w eth');
            setProvider(new ethers.BrowserProvider(window.ethereum));
        }
    }, []);
    const handleInputChange = (e) => setInput(e.target.value);
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('/api/chat', { message: input });
            console.log(res.data);
            setResponse(res.data);
        } catch (error) {
            console.error('Error fetching response:', error);
        }
    };

    const handleCompile = async () => {
        if (!response.fullCode) {
            console.error('No code to compile');
            return;
        }
        try {
            // This assumes you have an API endpoint set up for compilation
            const res = await axios.post('/api/compiler', { source: response.fullCode });
            setCompilationResult(res.data);
        } catch (error) {
            console.error('Error compiling code:', error.response?.data || error.message);
            setCompilationResult(null);
        }
    };

    const handleDeploy = async () => {
        if (!compilationResult?.bytecode) {
            setSnackbarMessage('No bytecode to deploy.');
            setOpenSnackbar(true);
            return;
        }

        // if (!provider) {
        //     setSnackbarMessage('No Ethereum provider found. Please install MetaMask.');
        //     setOpenSnackbar(true);
        //     return;
        // }

        try {
            // const { sendTransaction } = useSendTransaction()
            // sendTransaction({
            //     value: 0,
            //     data: "0x" + compilationResult.bytecode,
            //   })
            const signer = await provider.getSigner();
            console.log(signer,'siger');
            const factory = new ethers.ContractFactory([], compilationResult.bytecode, signer);
            console.log(factory,'factory');

            const contract = await factory.deploy();
            console.log(contract,'contract');

                    // Wait for the contract to be mined
            const deploymentReceipt = await contract.deploymentTransaction().wait(2);
            
            console.log(deploymentReceipt);
            setSnackbarMessage(`Contract deployed successfully! Address: ${contract.address}`);
        } catch (error) {
            console.error('Deployment error:', error);
            setSnackbarMessage('Contract deployment failed.');
        }

        setOpenSnackbar(true);
    };

    const handleCloseSnackbar = () => {
        setOpenSnackbar(false);
    };

    return (
        <Box sx={{ flexGrow: 1 }}>
            <AppBar position="static">
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        Etherlink Builder
                    </Typography>
                    <ConnectButton />
                </Toolbar>
            </AppBar>

            <Container maxWidth="sm" style={{ marginTop: '2rem' }}>
                <Typography variant="h4" gutterBottom align="center">
                    What do you want to build on Etherlink?
                </Typography>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                    <TextField
                        fullWidth
                        variant="outlined"
                        label="Enter your idea"
                        value={input}
                        onChange={handleInputChange}
                    />
                    <Button variant="contained" color="primary" type="submit">
                        Submit
                    </Button>
                </form>
            </Container>

            {response.fullCode && (
                <Container maxWidth="md" style={{ marginTop: '2rem' }}>
                    <Card>
                        <CardContent>
                            <Typography variant="h5" gutterBottom>
                                Full Code:
                            </Typography>
                            <pre>{response.fullCode}</pre>
                            <Button variant="contained" onClick={handleCompile} style={{ marginTop: '10px' }}>
                                Compile Code
                            </Button>
                        </CardContent>
                    </Card>
                </Container>
            )}

            {compilationResult && (
                <Container maxWidth="md" style={{ marginTop: '2rem' }}>
                    <Card>
                        <CardContent>
                            <Typography variant="h5">Compilation Result:</Typography>
                            <Typography component="div">Bytecode: <pre>{compilationResult.bytecode}</pre></Typography>
                            <Typography component="div">ABI: <pre>{JSON.stringify(compilationResult.abi, null, 2)}</pre></Typography>
                        </CardContent>
                    </Card>
                </Container>
            )}
                        {compilationResult && (
                <Button variant="contained" onClick={handleDeploy} style={{ margin: '20px' }}>
                    Deploy Contract
                </Button>
            )}

            <Snackbar
                open={openSnackbar}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                message={snackbarMessage}
                action={
                    <Button color="secondary" size="small" onClick={handleCloseSnackbar}>
                        Close
                    </Button>
                }
            />
            {Object.keys(response.components).length > 0 && (
                <Container maxWidth="md" style={{ marginTop: '2rem' }}>
                    <Typography variant="h5" gutterBottom>
                        Code Components:
                    </Typography>
                    {Object.entries(response.components).map(([name, { description, code }], index) => (
                        <Card key={index} style={{ marginBottom: '1rem' }}>
                            <CardContent>
                                <Typography variant="h6">{name}</Typography>
                                <Typography color="textSecondary" gutterBottom>
                                    Description: {description}
                                </Typography>
                                <Typography component="pre" style={{ overflowX: 'auto' }}>
                                    Code: {code}
                                </Typography>
                            </CardContent>
                        </Card>
                    ))}
                </Container>
            )}
        </Box>
    );
}