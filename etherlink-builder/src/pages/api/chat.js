import OpenAI from "openai";


// Function to parse the response string
function parseResponse(responseString) {
    const [fullCodeSection, componentsSection] = responseString.split('Code components:');
    const fullCode = fullCodeSection.replace('Full code:\n\n', '').trim();
    
    const componentsArray = componentsSection.split(/\d+\./).slice(1);
    const components = componentsArray.reduce((acc, componentString) => {
        const [nameLine, ...rest] = componentString.split('\n').map(line => line.trim()).filter(line => line);
        const name = nameLine.replace('Name:', '').trim();
        const descriptionIndex = rest.findIndex(line => line.startsWith('Description:'));
        const description = rest[descriptionIndex].replace('Description:', '').trim();
        const code = rest.slice(descriptionIndex + 1).join('\n').replace('Code:', '').trim();
        
        acc[name] = { description, code };
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
    const prompt = `You are a solidity co-pilot for Tezos new EVM compatible L2 Etherlink. You are part of a no code solutions that let's users specify the functionality of a smart contract and you return the code written in best practice and explained in detail. The code should be clustered into the main components with the parameters clearly displayed.
    
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
      console.log(API_KEY,'APIKEY');
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
