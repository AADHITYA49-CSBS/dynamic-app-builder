import React, { useEffect, useState } from 'react';
import axios from 'axios';

function App() {
  const [config, setConfig] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('http://localhost:5000/config')
      .then(res => {
        // defensively handle malformed config
        const cfg = res && res.data ? res.data : {};
        const fields = Array.isArray(cfg.fields) ? cfg.fields : [];
        setConfig({ ...cfg, fields });

        const initialFormData = {};
        fields.forEach(field => {
          if (field && typeof field.name === 'string' && field.name.trim() !== '') {
            initialFormData[field.name] = '';
          }
        });
        setFormData(initialFormData);
      })
      .catch(err => {
        console.error('Failed to load config', err);
        setConfig({ fields: [] });
      })
      .finally(() => setLoading(false));
  }, []);

  const handleInputChange = (fieldName, value) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!config) return alert('Configuration not loaded');
    const entity = config.entity;
    if (!entity) return alert('Entity not defined in config');

    const apiUrl = `http://localhost:5000/api/${entity}`;
    axios.post(apiUrl, formData)
      .then(res => {
        console.log('Response:', res.data);
        alert('Form submitted successfully!');
      })
      .catch(err => {
        console.error('Error submitting form:', err.response ? err.response.data : err.message);
        alert('Error submitting form');
      });
  };

  const allowedTypes = new Set(['text','number','email','password','date','checkbox','radio','textarea']);

  if (loading) {
    return (
      <div style={{ padding: '20px' }}>
        <h1>Dynamic Form</h1>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Dynamic Form</h1>

      {!config && <p>Loading...</p>}

      {config && (
        <form onSubmit={handleSubmit}>
          {(Array.isArray(config.fields) ? config.fields : []).map((field, index) => {
            if (!field || typeof field !== 'object') return null;

            const hasName = typeof field.name === 'string' && field.name.trim() !== '';
            const labelText = hasName ? field.name : 'Unknown Field';

            const type = allowedTypes.has(field.type) ? field.type : 'text';

            // If field has no name we render a safe, uncontrolled fallback input
            if (!hasName) {
              return (
                <div key={index} style={{ marginBottom: '15px' }}>
                  <label>{labelText}</label><br />
                  <input type={type} placeholder={labelText} />
                </div>
              );
            }

            return (
              <div key={index} style={{ marginBottom: '15px' }}>
                <label>{labelText}</label><br />
                {type === 'textarea' ? (
                  <textarea
                    placeholder={labelText}
                    value={formData[field.name] || ''}
                    onChange={e => handleInputChange(field.name, e.target.value)}
                  />
                ) : (
                  <input
                    type={type}
                    placeholder={labelText}
                    value={formData[field.name] || ''}
                    onChange={e => handleInputChange(field.name, e.target.value)}
                  />
                )}
              </div>
            );
          })}

          <button type="submit" style={{ padding: '10px 20px', cursor: 'pointer' }}>
            Submit
          </button>
        </form>
      )}
    </div>
  );
}

export default App;