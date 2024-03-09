import OpenAI from "openai";


// Function to parse the response string
function parseResponse(responseString) {
  // Split the response string into sections
  const sections = responseString.split('Code components:');
  const fullCodeSection = sections[0];
  const componentsSection = sections.length > 1 ? sections[1] : '';

  // Check and process the full code section
  const fullCode = fullCodeSection ? fullCodeSection.replace('Full code:\n\n', '').trim() : 'No Full Code Provided';

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

  return { fullCode, components };
}

export default async function handler(req, res) {
    console.log('Received body:', req.body); // Check the incoming request body

    // Correctly extracting the message from the request body
    const { message } = req.body;
    console.log(message, 'received message');
    
    //Adjust the message
    // Prepend the context to the user's input
    const prompt = `You are a solidity co-pilot for Tezos new EVM compatible L2 Etherlink. You are part of a no code solutions that let's users specify the functionality of a smart contract and you return the code written in best practice and explained in detail. The code should be clustered into the main components with the parameters clearly displayed. The main components can consists of individual functions or multiple functions together.
    Name the contract always CustomContract so that it can be compiled in solidity with this identifier. Start the code with the license // SPDX-License-Identifier: MIT

    Return it in this format only

    Full code:

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
