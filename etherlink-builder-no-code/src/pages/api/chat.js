import OpenAI from "openai";


// Function to parse the response string
function parseResponse(responseString) {
  // Split the response string into sections
  // Initialize defaults
  let fullCode = 'No Full Code Provided';
  let parameters = '';
  let componentsSection = '';

  // Splitting the response string into major sections
  const sections = responseString.includes('Parameters:') ? responseString.split('Parameters:') : [responseString];
  const fullCodeSection = sections[0];
  if (sections.length > 1) {
    const sections2 = sections[1].includes('Code components:') ? sections[1].split('Code components:') : [sections[1]];
    parameters = sections2[0];
    componentsSection = sections2.length > 1 ? sections2[1] : '';
  }

  // Processing the Full code section
  if (fullCodeSection.includes('Full code:')) {
    fullCode = fullCodeSection.split('Full code:')[1].trim();
  }
  fullCode = fullCode.replace('solidity', ''); // If you meant to remove the word "solidity" from the code.
  
  parameters = parameters ? parameters.replace('Parameters:\n\n', '').trim() : 'No Parameters Provided';
  // Process the components section if available
  const componentsArray = componentsSection ? componentsSection.split(/\d+\./).slice(1) : [];
  const components = componentsArray.reduce((acc, componentString) => {
      const lines = componentString.split('\n').map(line => line.trim()).filter(line => line);
      if (lines.length > 0) {
          const nameLine = lines[0];
          const name = nameLine.replace('Name:', '').trim();
          const descriptionIndex = lines.findIndex(line => line.startsWith('Description:'));
          const description = descriptionIndex !== -1 ? lines[descriptionIndex].replace('Description:', '').trim() : 'No Description Provided';
          const code = lines.slice(descriptionIndex + 1).join('\n').replace('Code:', '').trim();

          acc[name] = { description, code };
      }
      return acc;
  }, {});

  return { fullCode, components, parameters };
}

export default async function handler(req, res) {
    console.log('Received body:', req.body); // Check the incoming request body

    // Correctly extracting the message from the request body
    const { message } = req.body;
    console.log(message, 'received message');
    
    //Adjust the message
    // Prepend the context to the user's input
    const prompt = `You are a solidity co-pilot for Tezos new EVM compatible L2 Etherlink. You are part of a no code solutions that let's users specify the functionality of a smart contract and you return the code written in best practice and explained in detail. The code should be clustered into the main components with the parameters clearly displayed. The components can consists of individual functions or multiple functions together.
    Include at least 2 components. Return all hardcoded parameters in the code under the section Parameters in the return format.
    Name the contract always CustomContract so that it can be compiled in solidity with this identifier. Start the solidity code under Full code: with the license // SPDX-License-Identifier: MIT
    Do not use constructor arguments.
    Return it in this format only. Always include Full Code:, Parameters: and Code components:

    ----- Return format --------
    Full code:
    Complete solidity code that can directly be compiled

    Parameters:
    1. VariableName = Value|Description of variable

    Code components:
    1. Name 
    Description:
    Code:
        
    
    \n\n${message}`;


    if (req.method === 'POST') {
    try {
        
      const API_KEY = process.env.OPENAI_API_KEY;
      // Initialize the OpenAI client with your API key
      const openai = new OpenAI({apiKey: API_KEY});


    //     const message = req.body['message'];
    //   console.log(message,'reqbody');
              // Extract your prompt or message from the request body
      const completion = await openai.chat.completions.create({
        messages: [{ role: "system", content:  prompt}],
        model: "gpt-3.5-turbo",
      });
    
      console.log(completion.choices[0]);




        // Extracting the assistant's message content
        const assistantResponse = completion.choices[0].message.content;
        console.log(assistantResponse, 'ar repsonse');
        // Ensure a message was provided and successfully returned
        if (!message || !assistantResponse) {
        return res.status(400).json({ error: 'No message provided or no response from assistant' });
        }

        const responseData = parseResponse(assistantResponse);
        console.log(responseData,'rdata');
        // Send the assistant's message content back as the response
        return res.status(200).json(responseData);

    } catch (error) {
      console.error('Error calling OpenAI:', error);
      res.status(500).json({ error: 'Failed to fetch response from OpenAI' });
    }
  } else {
    // Only POST method is accepted
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
