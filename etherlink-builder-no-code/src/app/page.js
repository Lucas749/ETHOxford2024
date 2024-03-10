'use client'
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useWalletClient, useSendTransaction, useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Accordion, AccordionSummary, AccordionDetails, Modal, CssBaseline, createTheme, ThemeProvider, Grid, AppBar, Toolbar, Typography, Button, TextField, Container, Box, Card, CardContent, Snackbar, IconButton, Tooltip } from '@mui/material';
import { ethers } from 'ethers';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InfoIcon from '@mui/icons-material/Info';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs'; // You can choose another style
// import hljs from 'highlight.js';
// import 'highlight.js/styles/default.css'; // Choose a style you like
// import solidity from 'highlightjs-solidity';

// solidity(hljs);
import './globals.css';

function TypingEffect() {
    const fullText = 'What do you want to build on Etherlink?';
    const [text, setText] = useState('');
    const [blink, setBlink] = useState('');

    useEffect(() => {
        if (text.length < fullText.length) {
            setTimeout(() => {
                setText(fullText.slice(0, text.length + 1));
            }, 100); // Speed of typing
        } else {
            // Start blinking animation after the full text is displayed
            setBlink(<span className="blinking-cursor">...</span>);
        }
    }, [text, fullText]);

    return (
        <Typography variant="h4" align="center" style={{ color: '#0f0' }}>{text}{blink}</Typography>
    );
}


// Define the dark theme
const darkTheme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#0a0', // Neon green for primary buttons and accents
        },
        background: {
            default: '#121212', // Dark background
            paper: '#242424', // Dark paper components
        },
        text: {
            primary: '#fff', // White text
            secondary: '#0f0',
        },
    },
});

export default function Home() {
    const { data: account } = useAccount();
    const [input, setInput] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [openCodeModal, setOpenCodeModal] = useState(false);

    const [response, setResponse] = useState({ fullCode: '', components: {} });
    const [compilationResult, setCompilationResult] = useState(null);
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [contractAddress, setContractAddress] = useState(''); // To store the contract address after deployment
    const [verificationSuccess, setVerificationSuccess] = useState(false);
    const [parameters, setParameters] = useState([]);

    const [provider, setProvider] = useState(null);

    // useEffect(() => {
    //     hljs.highlightAll(); // Highlight all code elements on the page
    // }, [openCodeModal, response.fullCode]); // Rerun highlighting when modal opens or code changes

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
            setIsSubmitted(true);
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

        try {

            const signer = await provider.getSigner();
            console.log(signer, 'siger');
            const factory = new ethers.ContractFactory([], compilationResult.bytecode, signer);
            console.log(factory, 'factory');

            const contract = await factory.deploy();
            console.log(contract, 'contract');

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
            console.log('checking para', param);
            const cleanedName = cleanParamName(param.name);
            console.log('checking para', cleanedName);

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
                console.log('checking para', cleanedName);
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
        <ThemeProvider theme={darkTheme}>
            <CssBaseline /> {/* Ensures the background applies globally */}
            <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: 'background.default', color: 'text.primary' }}>
                <AppBar position="static" sx={{ bgcolor: 'black' }} >
                    <Toolbar>
                        {/* <img src={Logo} alt="Logo" style={{ height: '50px', marginRight: '10px' }} /> */}
                        <img src={"logo.png"} alt="Logo" style={{ height: '50px', marginRight: '10px' }} />
                        {/* <img src={Logo} alt="Logo" style={{ height: '50px', marginRight: '10px' }} /> */}
                        <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: 'text.secondary' }}>
                            EtherlinkGPT
                        </Typography>
                        <ConnectButton />
                    </Toolbar>
                </AppBar>

                {/* <Grid container spacing={1}> */}
                <Grid item xs={12} md={6}>
                    <Container maxWidth="lg" style={{ marginTop: '2rem', color: 'white' }}>
                        {isSubmitted ? (

                            <Card sx={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center', padding: '3px', marginBottom: '10px' }}>
                                <CardContent style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center', width: '100%', padding: '8px' }}>
                                    <Typography variant="h5" style={{ color: 'white' }}>Another idea? 🧠</Typography>
                                    <TextField
                                        variant="outlined"
                                        label=""
                                        value={input}
                                        onChange={handleInputChange}
                                        style={{ flexGrow: 1 }}
                                    />
                                    <Button variant="contained" color="primary" onClick={handleSubmit}>
                                        Submit
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                            <>
                                <Typography variant="h4" gutterBottom align="center" style={{ color: 'white' }}>
                                    <TypingEffect />
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
                            </>
                        )}


                        {(response.parameters && parameters.length > 0 &&
                            <Card>
                                <CardContent>
                                    <Typography variant="h5" gutterBottom sx={{ marginBottom: '15px' }}>
                                        Contract Parameters
                                    </Typography>
                                    <Typography variant="body1" gutterBottom sx={{ marginBottom: '15px' }}>
                                        Easy adjust your contract parameters below with the help of EtherlinkGPT. No coding skills required.
                                    </Typography>
                                    {parameters.map((param, index) => (
                                        <Card key={index} sx={{ marginBottom: '10px', display: 'flex', alignItems: 'center', padding: '10px', bgcolor: '#2e2b2b' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                                                <Typography sx={{ minWidth: '100px', marginRight: '10px' }}>{param.name}</Typography> {/* Ensure all parameter names have the same width */}
                                                <Tooltip title={param.description}>

                                                    <IconButton>
                                                        <InfoIcon />
                                                    </IconButton>
                                                </Tooltip>

                                                <TextField
                                                    label=""
                                                    variant="outlined"
                                                    fullWidth
                                                    value={param.value}
                                                    onChange={(e) => handleChange(index, e.target.value)}
                                                    sx={{ marginRight: '10px' }}
                                                />

                                            </Box>
                                        </Card>
                                    ))}

<Box sx={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '20px' }}>
    <Button
        variant="contained"
        color="secondary"
        onClick={() => setOpenCodeModal(true)}
    >
        Show Solidity Code
    </Button>

    <Button variant="contained" onClick={handleCompile}>
        Compile Code
    </Button>

    <Button variant="contained" onClick={handleDeploy}>
        Deploy Contract
    </Button>

    <Button variant="contained" onClick={handleVerifyContract}>
        Verify Contract
    </Button>
</Box>
                                </CardContent>
                            </Card>

                        )}

                        <Modal
                            open={openCodeModal}
                            onClose={() => setOpenCodeModal(false)}
                            aria-labelledby="show-solidity-code-modal"
                            aria-describedby="modal-modal-description"
                            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                            <Box sx={{
                                position: 'absolute',
                                width: '80%',
                                maxHeight: '90vh',
                                overflowY: 'auto',
                                bgcolor: 'background.paper',
                                boxShadow: 24,
                                p: 4,
                                '& pre': {
                                    padding: '16px',
                                    backgroundColor: '#f5f5f5',
                                    borderRadius: '5px',
                                    color: '#333',
                                    fontFamily: '"Fira code", "Fira Mono", monospace',
                                    fontSize: '0.875rem',
                                }
                            }}>
                                <Typography id="modal-modal-title" variant="h6" component="h2">
                                    Solidity Code
                                </Typography>
                                <SyntaxHighlighter language="solidity" style={docco}>
                                    {response.fullCode.replace("```", "").replace(/```/g, '')
                                    }
                                </SyntaxHighlighter>
                            </Box>
                        </Modal>
                        {/* <Typography id="modal-title" variant="h6" component="h2" gutterBottom>
                            Solidity Code
                            </Typography>
                            <pre>
                            <code className="language-solidity">
                                {response.fullCode.replace(/```/g, '')}
                            </code>
                            </pre>
                        </Box>
                        </Modal> */}

                        {/* To show always full code and compilation results */}
                        {/* {response.fullCode && (
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
                        )} */}

                        {/* {Object.keys(response.components).length > 0 && (
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

                        
                        */}

{Object.keys(response.components).length > 0 && (
                    <>
                            <Card>
                                <CardContent>
                                    <Typography variant="h5" gutterBottom sx={{ marginBottom:   '15px',marginBottom: '15px' }}>
                                        Components
                                    </Typography>
                                    <Typography variant="body1" gutterBottom sx={{ marginBottom: '15px' }}>
                                        Easily learn Solidity on the go with EtherlinkGPT. Analyse individual components of the smart contract and see the underlying code.
                                    </Typography>
                        {Object.entries(response.components).map(([name, { description, code }], index) => (
                            <Accordion key={index} sx={{ marginBottom: '10px', bgcolor: '#2e2b2b' }}>
                                <AccordionSummary
                                    expandIcon={<ExpandMoreIcon />}
                                    aria-controls={`panel${index}a-content`}
                                    id={`panel${index}a-header`}
                                >
                                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{name}</Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Typography gutterBottom>
                                        {description}
                                    </Typography>
                                    <Box sx={{
                                        maxHeight: '200px', // Adjust based on your preference
                                        overflow: 'auto',
                                        marginTop: '10px',
                                        color: 'black',
                                        backgroundColor: '#f5f5f5', // Light background for the code area
                                        padding: '10px',
                                        borderRadius: '4px',
                                        fontFamily: '"Fira Code", "Fira Mono", monospace',
                                    }}>
                                        <pre>{code}</pre>
                                    </Box>
                                </AccordionDetails>
                            </Accordion>
                        ))}
                        </CardContent>
                        </Card>
                    </>
                )}
                    </Container>
                </Grid>

                {/* //Embeding of Etherlink explorer if iframes would be allowed */}
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
        </ThemeProvider>
    );
}