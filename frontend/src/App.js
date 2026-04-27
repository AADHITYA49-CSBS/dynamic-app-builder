import React, { useEffect, useState } from 'react';
import axios from 'axios';

function App() {
  const [config, setConfig] = useState(null);

  useEffect(() => {
    axios.get('http://localhost:5000/config')
      .then(res => setConfig(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1>Dynamic Form</h1>

      {!config && <p>Loading...</p>}

      {config && config.fields.map((field, index) => (
        <div key={index}>
          <label>{field.name}</label><br />
          <input type={field.type} placeholder={field.name} />
        </div>
      ))}
    </div>
  );
}

export default App;