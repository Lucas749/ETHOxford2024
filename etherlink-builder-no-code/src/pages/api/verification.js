

  export default async function handler(req, res) {
    console.log(req.body,'req');
    // const verifyContract = async (contractAddress,v sourceCode) => {
      let contractAddress = req.body.ContractAddress;
      let sourceCode = req.body.sourceCode;

      // Find the index where 'pragma' starts
      let pragmaIndex = sourceCode.indexOf(';');

      // If 'pragma' is found, trim the sourceCode to start from there
      if (pragmaIndex !== -1) {
        sourceCode = sourceCode.substring(pragmaIndex+1);
      }

      console.log(contractAddress);
      console.log(sourceCode);
      
      // contractAddress = '0x653574192c664674c671ebd20ee8ecded1b5ddf1';
      
      
      const verificationBody = {
        compiler_version: "v0.8.24+commit.e11b9ed9",
        source_code: sourceCode,
        is_optimization_enabled: true,
        is_yul_contract: false,
        optimization_runs: "200",
        evm_version: "istanbul",
        autodetect_constructor_args: false,
        constructor_args: "",
      };
    
      const headers = {
        "accept": "*/*",
        "accept-language": "en-US,en;q=0.9",
        "content-type": "application/json",
        "sec-ch-ua": "\"Not A(Brand\";v=\"99\", \"Google Chrome\";v=\"121\", \"Chromium\";v=\"121\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"macOS\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "Referer": "https://testnet-explorer.etherlink.com/contract-verification",
        "Referrer-Policy": "origin-when-cross-origin"
        // Note: The 'cookie' header should generally be avoided in server-to-server requests for security reasons.
      };

      // const b = `{\"compiler_version\":\"v0.8.24+commit.e11b9ed9\",\"source_code\":\"contract CustomContract {\\n    string public constant name = \\\"Donald Trump Token\\\";\\n    string public constant symbol = \\\"DTRUMP\\\";\\n    uint8 public constant decimals = 18;\\n\\n    mapping(address => uint256) balances;\\n    mapping(address => mapping(address => uint256)) allowed;\\n    uint256 totalSupply;\\n\\n    event Transfer(address indexed from, address indexed to, uint256 value);\\n    event Approval(address indexed owner, address indexed spender, uint256 value);\\n\\n    function balanceOf(address owner) external view returns (uint256) {\\n        return balances[owner];\\n    }\\n\\n    function transfer(address to, uint256 value) external returns (bool) {\\n        require(to != address(0), \\\"ERC20: transfer to the zero address\\\");\\n        require(balances[msg.sender] >= value, \\\"ERC20: insufficient balance for transfer\\\");\\n\\n        balances[msg.sender] -= value;\\n        balances[to] += value;\\n        emit Transfer(msg.sender, to, value);\\n        return true;\\n    }\\n\\n    function allowance(address owner, address spender) external view returns (uint256) {\\n        return allowed[owner][spender];\\n    }\\n\\n    function approve(address spender, uint256 value) external returns (bool) {\\n        allowed[msg.sender][spender] = value;\\n        emit Approval(msg.sender, spender, value);\\n        return true;\\n    }\\n\\n    function transferFrom(address from, address to, uint256 value) external returns (bool) {\\n        require(to != address(0), \\\"ERC20: transfer to the zero address\\\");\\n        require(balances[from] >= value, \\\"ERC20: insufficient balance for transfer\\\");\\n        require(allowed[from][msg.sender] >= value, \\\"ERC20: insufficient allowance for transfer\\\");\\n\\n        balances[from] -= value;\\n        balances[to] += value;\\n        allowed[from][msg.sender] -= value;\\n        emit Transfer(from, to, value);\\n        return true;\\n    }\\n\\n    function increaseAllowance(address spender, uint256 addedValue) external returns (bool) {\\n        allowed[msg.sender][spender] += addedValue;\\n        emit Approval(msg.sender, spender, allowed[msg.sender][spender]);\\n        return true;\\n    }\\n\\n    function decreaseAllowance(address spender, uint256 subtractedValue) external returns (bool) {\\n        uint256 currentAllowance = allowed[msg.sender][spender];\\n        require(currentAllowance >= subtractedValue, \\\"ERC20: decreased allowance below zero\\\");\\n\\n        allowed[msg.sender][spender] = currentAllowance - subtractedValue;\\n        emit Approval(msg.sender, spender, allowed[msg.sender][spender]);\\n        return true;\\n    }\\n}\",\"is_optimization_enabled\":true,\"is_yul_contract\":false,\"optimization_runs\":\"200\",\"evm_version\":\"istanbul\",\"autodetect_constructor_args\":false,\"constructor_args\":\"\"}`;
      const b = JSON.stringify(verificationBody);
      console.log(b);
      try {
        const response = await fetch("https://testnet-explorer.etherlink.com/api/v2/smart-contracts/" + contractAddress + "/verification/via/flattened-code", {
          method: "POST",
          headers: headers,
          body: b,
        });
        console.log('res',response)
        if (!response.ok) {
          throw new Error('Failed to verify the contract. ' + response.statusText);
        } 
    
        const data = await response.json();
        // console.log("Verification response:", data);
        return res.status(200).json(data);
        // Handle the successful verification here. You can update the state to show verification status in the UI.
      } catch (error) {
        console.error("Error verifying contract:", error);
        // Handle error, possibly update UI to show verification failed.
      }
    };
