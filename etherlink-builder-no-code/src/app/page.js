'use client'
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useWalletClient, useSendTransaction, useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Grid, AppBar, Toolbar, Typography, Button, TextField, Container, Box, Card, CardContent, Snackbar, IconButton, Tooltip } from '@mui/material';
import { ethers } from 'ethers';
import InfoIcon from '@mui/icons-material/Info';
// const { ethers } = require("ethers");


// const verifyContract = async (contractAddress, sourceCode) => {
//     const verificationBody = {
//       compiler_version: "v0.8.24+commit.e11b9ed9",
//       source_code: sourceCode,
//       is_optimization_enabled: true,
//       optimization_runs: "200",
//       evm_version: "istanbul",
//       autodetect_constructor_args: true,
//       constructor_args: "", // If your contract's constructor takes arguments, they need to be ABI-encoded and provided here.
//     };
  
//     try {
//         const headers= {
//             "accept": "*/*",
//             "accept-language": "en-US,en;q=0.9",
//             "content-type": "application/json",
//             // User-Agent related headers typically can't be set programmatically due to browser security policies.
//             "sec-fetch-dest": "empty",
//             "sec-fetch-mode": "cors",
//             "sec-fetch-site": "same-origin",
//             // The cookie header should be managed securely and not exposed in client-side code.
//             "Referer": "https://testnet-explorer.etherlink.com/contract-verification",
//             "Referrer-Policy": "origin-when-cross-origin"
//           };
//       const response = await fetch("https://testnet-explorer.etherlink.com/api/v2/smart-contracts/" + contractAddress + "/verification/via/flattened-code", {
//         method: "POST",
//         headers: headers,
//         body: JSON.stringify(verificationBody),
//       });
  
//       if (!response.ok) {
//         throw new Error('Failed to verify the contract. ' + response.statusText);
//       }
  
//       const data = await response.json();
//       console.log("Verification response:", data);
//       // Handle the successful verification here. You can update the state to show verification status in the UI.
//     } catch (error) {
//       console.error("Error verifying contract:", error);
//       // Handle error, possibly update UI to show verification failed.
//     }
//   };
  

export default function Home() {
    const { data: account } = useAccount();
    const [input, setInput] = useState('');
    const [response, setResponse] = useState({ fullCode: '', components: {} });
    const [compilationResult, setCompilationResult] = useState(null);
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [contractAddress, setContractAddress] = useState(''); // To store the contract address after deployment
    const [verificationSuccess, setVerificationSuccess] = useState(false);  
    const [parameters, setParameters] = useState([]);

    const [provider, setProvider] = useState(null);

    useEffect(() => {
        // Make sure ethers and window.ethereum are defined
        if (typeof ethers !== 'undefined' && window.ethereum) {
            console.log(window.ethereum, 'w eth');
            setProvider(new ethers.BrowserProvider(window.ethereum));
        }
    }, []);

    useEffect(() => {
        if (response.parameters) {
            const parsedParameters = response.parameters.split('\n').map(line => {
                const [left, description] = line.split('|');
                const match = left.trim().match(/^(.+?) = (.+)$/);
                if (match) {
                    const [_, name, value] = match;
                    return { 
                        name: name.trim(), 
                        value: value.replace(/["']/g, '').trim(), 
                        description: description ? description.trim() : '' 
                    };
                }
                // Handle the case where a line does not conform to the expected format.
                // This could either return a default structure or exclude the line altogether.
                // Here's an example returning a placeholder, adjust as needed.
                return {
                    name: 'Unknown',
                    value: '',
                    description: 'This line does not conform to the expected format'
                };
            });
            setParameters(parsedParameters);
        }
    }, [response.parameters]);
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
            setSnackbarMessage(`Contract deployed successfully! Address: ${deploymentReceipt.contractAddress}`);
            setContractAddress(deploymentReceipt.contractAddress);
            // await verifyContract(deploymentReceipt.contractAddress, response.fullCode);
            // const res = await axios.post('/api/verification', { contractAddress: deploymentReceipt.contractAddress, sourceCode:response.fullCode });
            // console.log(res.data);
            
        } catch (error) {
            console.error('Deployment error:', error);
            setSnackbarMessage('Contract deployment failed.');
        }

        setOpenSnackbar(true);
    };
// Function to handle verification
const handleVerifyContract = async () => {
    if (!contractAddress || !response.fullCode) {
        setSnackbarMessage('Missing contract address or source code for verification.');
        setOpenSnackbar(true);
        return;
    }

    try {
        const verificationData = {
            ContractAddress: contractAddress, // Make sure this matches the field expected by your API
            sourceCode: response.fullCode
        };

        
        console.log(verificationData, 'verfdata');
        const res = await axios.post('/api/verification', verificationData);
        console.log(res.data);
        if (res.data && res.status === 200) {
            setVerificationSuccess(true);
            // Update UI or state as needed based on verification success
            setSnackbarMessage('Contract verified successfully!');
        } else {
            // Handle API response indicating verification failure
            setSnackbarMessage('Contract verification failed. Please check the details and try again.');
        }
    } catch (error) {
        console.error('Error during contract verification:', error);
        setSnackbarMessage('Error during contract verification. Please try again later.');
    }
    setOpenSnackbar(true);
};

    const handleCloseSnackbar = () => {
        setOpenSnackbar(false);
    };

    const handleChange = (index, newValue) => {
        const updatedParameters = [...parameters];
        updatedParameters[index].value = newValue;
        setParameters(updatedParameters);

        console.log('up', updatedParameters);

        updateCodeAndComponents(updatedParameters); //
    };
    useEffect(() => {
        // Make sure to call this whenever parameters change to update the code.
        updateCodeAndComponents();
    }, [parameters]); // Add other dependencies as necessary

    const updateCodeAndComponents = () => {
        let updatedFullCode = updateFullCodeWithParameters(response.fullCode, parameters);
        let updatedComponents = updateComponentsWithParameters(response.components, parameters);
        console.log(updatedFullCode);
        setResponse({
            ...response,
            fullCode: updatedFullCode,
            components: updatedComponents,
        });
    };
    
// Utility function to determine if a value should be treated as a number
const isNumeric = (value) => !isNaN(value) && !isNaN(parseFloat(value));

function cleanParamName(name) {
    // This regex matches optional numbering at the start (e.g., "3. ") and trims whitespace
    const cleanNameRegex = /^\d+\.\s*(\S+)/;
    const match = name.match(cleanNameRegex);

    // If there's a match, return the cleaned name; otherwise, return the original name
    return match ? match[1].trim() : name.trim();
}
// Enhanced function to update full code with new parameter values
function updateFullCodeWithParameters(fullCode, parameters) {
    let updatedFullCode = fullCode;
    parameters.forEach(param => {
        console.log('checking para',param);
        const cleanedName = cleanParamName(param.name);
        console.log('checking para',cleanedName);

        const value = isNumeric(param.value) ? param.value : `"${param.value}"`; // Add quotation marks for strings
        // const regex = new RegExp(`\\b${cleanedName}\\s*=\\s*.*?\\s*;?`, 'g');
        const regex = new RegExp(`(\\b${cleanedName}\\s*=\\s*).*?;`, 'g');
        // Replace the entire match with the parameter name followed by the new value, ensuring old values are overwritten
        updatedFullCode = updatedFullCode.replace(regex, `$1${value};`);
        console.log(regex);
        // updatedFullCode = updatedFullCode.replace(regex, `${cleanedName} = ${value};`);
    });
    return updatedFullCode;
}

// Enhanced function to update components with new parameter values
function updateComponentsWithParameters(components, parameters) {
    let updatedComponents = { ...components };
    Object.entries(updatedComponents).forEach(([key, component]) => {
        parameters.forEach(param => {
            const cleanedName = cleanParamName(param.name);
            console.log('checking para',cleanedName);
            const value = isNumeric(param.value) ? param.value : `"${param.value}"`; // Add quotation marks for strings
            // const regex = new RegExp(`\\b${cleanedName}\\s*=\\s*.*?\\s*;?`, 'g');
            const regex = new RegExp(`(\\b${cleanedName}\\s*=\\s*).*?;`, 'g');

            component.code = component.code.replace(regex, `$1${value};`);
        });
        updatedComponents[key] = component;
    });
    return updatedComponents;
}

    

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
    
            {/* <Grid container spacing={1}> */}
                <Grid item xs={12} md={6}>
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
    
                        {(response.parameters && parameters.length > 0  &&         
                <Box sx={{ margin: '20px' }}>
                <Card>
                    <CardContent>
                        <Typography variant="h5" gutterBottom>
                            Parameters:
                        </Typography>
                        {parameters.map((param, index) => (
                            <Box key={index} sx={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                                <TextField
                                    label={param.name}
                                    variant="outlined"
                                    value={param.value}
                                    onChange={(e) => handleChange(index, e.target.value)}
                                    sx={{ marginRight: '10px' }}
                                />
                                <Tooltip title={param.description}>
                                    <IconButton>
                                        <InfoIcon />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        ))}
                    </CardContent>
                </Card>
                </Box>
            
                        )}
                        {response.fullCode && (
                            <>
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
    
                                {compilationResult && (
                                    <Card>
                                        <CardContent>
                                            <Typography variant="h5">Compilation Result:</Typography>
                                            <Typography component="div">Bytecode: <pre>{compilationResult.bytecode}</pre></Typography>
                                            <Typography component="div">ABI: <pre>{JSON.stringify(compilationResult.abi, null, 2)}</pre></Typography>
                                            <Button variant="contained" onClick={handleDeploy} style={{ marginTop: '10px' }}>
                                                Deploy Contract
                                            </Button>
                                            <Button variant="contained" onClick={handleVerifyContract} style={{ margin: '20px' }}>
                                                Verify Contract
                                            </Button>
                                        </CardContent>
                                    </Card>
                                )}
                            </>
                        )}
    
                        {Object.keys(response.components).length > 0 && (
                            <Typography variant="h5" gutterBottom>
                                Code Components:
                            </Typography>
                        )}
    
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
                </Grid>
{/*     
                <Grid item xs={12} md={6}>
                    <iframe
                        src={verificationSuccess ? `https://testnet-explorer.etherlink.com/address/${contractAddress}?tab=contract` : "https://testnet-explorer.etherlink.com/"}
                        title={verificationSuccess ? "Contract Details" : "Etherlink Verification"}
                        width="100%"
                        height="100%"
                        style={{ minHeight: '600px', border: "none" }}
                    ></iframe>
                </Grid> */}
            {/* </Grid> */}
    
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
        </Box>
    );
            }