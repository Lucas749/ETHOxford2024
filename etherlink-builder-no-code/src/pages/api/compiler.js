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
    source = source.replace("```","").replace(/```/g, '');
    console.log(source,'source');

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
