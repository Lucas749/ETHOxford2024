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
    const { source } = req.body;
    if (!source) {
      return res.status(400).json({ error: 'No Solidity source code provided.' });
    }   
    // console.log(solc —version, '')
    console.log(source,'source');
    const source2 = `// SPDX-License-Identifier: GPL-3.0
    pragma solidity ^0.8.0;

    contract CustomContract {
        
        string public name = "Donald Trump Token";
        string public symbol = "DTRUMP";
        uint8 public decimals = 18;
        uint256 public totalSupply;
    
        mapping(address => uint256) public balanceOf;
        mapping(address => mapping(address => uint256)) public allowance;
    
        event Transfer(address indexed from, address indexed to, uint256 value);
        event Approval(address indexed owner, address indexed spender, uint256 value);
    
        constructor(uint256 initialSupply) {
            totalSupply = initialSupply * 10 ** uint256(decimals);
            balanceOf[msg.sender] = totalSupply;
        }
    
        function _transfer(address from, address to, uint256 value) internal {
            require(from != address(0), "ERC20: transfer from the zero address");
            require(to != address(0), "ERC20: transfer to the zero address");
            require(balanceOf[from] >= value, "ERC20: insufficient balance");
    
            balanceOf[from] -= value;
            balanceOf[to] += value;
    
            emit Transfer(from, to, value);
        }
    
        function transfer(address to, uint256 value) public returns (bool) {
            _transfer(msg.sender, to, value);
            return true;
        }
    
        function approve(address spender, uint256 value) public returns (bool) {
            allowance[msg.sender][spender] = value;
            emit Approval(msg.sender, spender, value);
            return true;
        }
    
        function transferFrom(address from, address to, uint256 value) public returns (bool) {
            require(allowance[from][msg.sender] >= value, "ERC20: insufficient allowance");
            
            allowance[from][msg.sender] -= value;
            _transfer(from, to, value);
            
            return true;
        }
    }`;
    // Prepare compiler input
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

    console.log(compiledContract.evm.bytecode.object,compiledContract.abi,);
    return res.status(200).json({
      bytecode: compiledContract.evm.bytecode.object,
      abi: compiledContract.abi,
    });
  } catch (error) {
    console.error('Compilation error:', error);
    return res.status(500).json({ error: 'Failed to compile Solidity code.' });
  }
}
