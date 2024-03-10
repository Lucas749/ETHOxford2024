// pages/api/compile.js

import solc from 'solc';

async function loadCompiler(version) {
    return new Promise((resolve, reject) => {
      solc.loadRemoteVersion(version, (err, compiler) => {
        if (err) return reject(err);
        resolve(compiler);
      });
    });
  }

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let { source } = req.body;
    if (!source) {
      return res.status(400).json({ error: 'No Solidity source code provided.' });
    }   
    // source = source.replace('// SPDX-License-Identifier: MIT\n','');
    // console.log(solc —version, '')
    source = source.replace("```","").replace(/```/g, '');;
    console.log(source,'source');

    // Prepare compiler inputs
    const compiler = await loadCompiler('v0.8.24+commit.e11b9ed9'); // Specify the version

    const input = {
      language: 'Solidity',
      sources: {
        'CustomContract.sol': {
          content: source,
        },
      },
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        },
        outputSelection: {
          '*': {
            '*': ['*'],
          },
        },
        evmVersion: 'istanbul' // Adjust according to needs
      },
    };

    
    const output = JSON.parse(solc.compile(JSON.stringify(input)));
    console.log(output,'output');

    // // Check for errors in compilation
    // if (output.errors) {
    //   // Filter out warnings, return only errors
    //   const errors = output.errors.filter(error => error.severity === 'error');
    //   return res.status(400).json({ errors });
    // }

    // Assuming single contract compilation for simplicity
    const contractName = Object.keys(output.contracts['CustomContract.sol'])[0];
    const compiledContract = output.contracts['CustomContract.sol'][contractName];

    // console.log(compiledContract.evm.bytecode.objecwt,compiledContract.abi,);
    return res.status(200).json({
      bytecode: compiledContract.evm.bytecode.object,
      abi: compiledContract.abi,
    });
  } catch (error) {
    console.error('Compilation error:', error);
    return res.status(500).json({ error: 'Failed to compile Solidity code.' });
  }
}


// fetch("https://testnet-explorer.etherlink.com/api/v2/smart-contracts/0x653574192c664674c671ebd20ee8ecded1b5ddf1/verification/via/flattened-code", {
//   "headers": {
//     "accept": "*/*",
//     "accept-language": "en-US,en;q=0.9",
//     "content-type": "application/json",
//     "sec-ch-ua": "\"Not A(Brand\";v=\"99\", \"Google Chrome\";v=\"121\", \"Chromium\";v=\"121\"",
//     "sec-ch-ua-mobile": "?0",
//     "sec-ch-ua-platform": "\"macOS\"",
//     "sec-fetch-dest": "empty",
//     "sec-fetch-mode": "cors",
//     "sec-fetch-site": "same-origin",
//     "cookie": "uuid=54bfce77-22b4-4d1a-b49a-5b1c8a2d84b9; chakra-ui-color-mode=light; chakra-ui-color-mode-hex=#FFFFFF; indexing_alert=false; mp_4b03b67c70939e1e9e893e11b280c700_mixpanel=%7B%22distinct_id%22%3A%20%22%24device%3A18e24da9bb1706-02c6f54fa70deb-1e525637-16a7f0-18e24da9bb1706%22%2C%22%24device_id%22%3A%20%2218e24da9bb1706-02c6f54fa70deb-1e525637-16a7f0-18e24da9bb1706%22%2C%22%24search_engine%22%3A%20%22google%22%2C%22%24initial_referrer%22%3A%20%22https%3A%2F%2Fwww.google.com%2F%22%2C%22%24initial_referring_domain%22%3A%20%22www.google.com%22%2C%22Chain%20id%22%3A%20%22128123%22%2C%22Environment%22%3A%20%22Prod%22%2C%22Authorized%22%3A%20false%2C%22Viewport%20width%22%3A%20714%2C%22Viewport%20height%22%3A%20785%2C%22Language%22%3A%20%22en-US%22%2C%22Device%20type%22%3A%20%22Browser%22%2C%22User%20id%22%3A%20%2254bfce77-22b4-4d1a-b49a-5b1c8a2d84b9%22%7D",
//     "Referer": "https://testnet-explorer.etherlink.com/contract-verification",
//     "Referrer-Policy": "origin-when-cross-origin"
//   },
//   "body": "{\"compiler_version\":\"v0.8.24+commit.e11b9ed9\",\"source_code\":\"contract CustomContract {\\n    string public constant name = \\\"Donald Trump Token\\\";\\n    string public constant symbol = \\\"DTRUMP\\\";\\n    uint8 public constant decimals = 18;\\n\\n    mapping(address => uint256) balances;\\n    mapping(address => mapping(address => uint256)) allowed;\\n    uint256 totalSupply;\\n\\n    event Transfer(address indexed from, address indexed to, uint256 value);\\n    event Approval(address indexed owner, address indexed spender, uint256 value);\\n\\n    function balanceOf(address owner) external view returns (uint256) {\\n        return balances[owner];\\n    }\\n\\n    function transfer(address to, uint256 value) external returns (bool) {\\n        require(to != address(0), \\\"ERC20: transfer to the zero address\\\");\\n        require(balances[msg.sender] >= value, \\\"ERC20: insufficient balance for transfer\\\");\\n\\n        balances[msg.sender] -= value;\\n        balances[to] += value;\\n        emit Transfer(msg.sender, to, value);\\n        return true;\\n    }\\n\\n    function allowance(address owner, address spender) external view returns (uint256) {\\n        return allowed[owner][spender];\\n    }\\n\\n    function approve(address spender, uint256 value) external returns (bool) {\\n        allowed[msg.sender][spender] = value;\\n        emit Approval(msg.sender, spender, value);\\n        return true;\\n    }\\n\\n    function transferFrom(address from, address to, uint256 value) external returns (bool) {\\n        require(to != address(0), \\\"ERC20: transfer to the zero address\\\");\\n        require(balances[from] >= value, \\\"ERC20: insufficient balance for transfer\\\");\\n        require(allowed[from][msg.sender] >= value, \\\"ERC20: insufficient allowance for transfer\\\");\\n\\n        balances[from] -= value;\\n        balances[to] += value;\\n        allowed[from][msg.sender] -= value;\\n        emit Transfer(from, to, value);\\n        return true;\\n    }\\n\\n    function increaseAllowance(address spender, uint256 addedValue) external returns (bool) {\\n        allowed[msg.sender][spender] += addedValue;\\n        emit Approval(msg.sender, spender, allowed[msg.sender][spender]);\\n        return true;\\n    }\\n\\n    function decreaseAllowance(address spender, uint256 subtractedValue) external returns (bool) {\\n        uint256 currentAllowance = allowed[msg.sender][spender];\\n        require(currentAllowance >= subtractedValue, \\\"ERC20: decreased allowance below zero\\\");\\n\\n        allowed[msg.sender][spender] = currentAllowance - subtractedValue;\\n        emit Approval(msg.sender, spender, allowed[msg.sender][spender]);\\n        return true;\\n    }\\n}\",\"is_optimization_enabled\":true,\"is_yul_contract\":false,\"optimization_runs\":\"200\",\"evm_version\":\"istanbul\",\"autodetect_constructor_args\":false,\"constructor_args\":\"\"}",
//   "method": "POST"
// });