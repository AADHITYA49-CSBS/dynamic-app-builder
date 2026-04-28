import React, { useEffect, useState } from 'react';
import axios from 'axios';

function App() {
  const [config, setConfig] = useState(null);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    axios.get('http://localhost:5000/config')
      .then(res => {
        setConfig(res.data);
        // Initialize form data with empty values for each field
        const initialFormData = {};
        res.data.fields.forEach(field => {
          initialFormData[field.name] = '';
        });
        setFormData(initialFormData);
      })
      .catch(err => console.error(err));
  }, []);

  // Handle input changes dynamically based on field name
  const handleInputChange = (fieldName, value) => {
    setFormData(prevState => ({
      ...prevState,
      [fieldName]: value
    }));
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!config) return;

    const apiUrl = `http://localhost:5000/api/${config.entity}`;
    
    axios.post(apiUrl, formData)
      .then(res => {
        console.log('Response:', res.data);
        alert('Form submitted successfully!');
      })
      .catch(err => {
        console.error('Error:', err);
        alert('Error submitting form');
      });
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Dynamic Form</h1>

      {!config && <p>Loading...</p>}

      {config && (
        <form onSubmit={handleSubmit}>
          {config.fields.map((field, index) => (
            <div key={index} style={{ marginBottom: "15px" }}>
              <label>{field.name}</label><br />
              <input 
                type={field.type} 
                placeholder={field.name}
                value={formData[field.name] || ''}
                onChange={(e) => handleInputChange(field.name, e.target.value)}
              />
            </div>
          ))}
          <button type="submit" style={{ padding: "10px 20px", cursor: "pointer" }}>
            Submit
          </button>
        </form>
      )}
    </div>
  );
}

export default App;