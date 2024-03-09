import { useState } from 'react';
import axios from 'axios';

export default function Home() {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState({ fullCode: '', components: {} });

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/chat', { message: input });
      console.log(res.data);
      setResponse(res.data); // Assuming the API response is directly structured as needed
    } catch (error) {
      console.error('Error fetching response:', error);
      // Handle error appropriately
    }
  };

  return (
    <div>
      <h1>What do you want to build on Etherlink?</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          placeholder="Enter your idea"
        />
        <button type="submit">Submit</button>
      </form>
      {response.fullCode && (
        <div>
          <h2>Full Code:</h2>
          <pre>{response.fullCode}</pre>
        </div>
      )}
      {Object.keys(response.components).length > 0 && (
        <div>
          <h2>Code Components:</h2>
          {Object.entries(response.components).map(([name, { description, code }], index) => (
            <div key={index}>
              <h3>{name}</h3>
              <p>{description}</p>
              <pre>{code}</pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
