import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [config, setConfig] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
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
        setError('Failed to load form configuration. Please try again later.');
        setConfig(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleInputChange = (fieldName, value) => {
    setSuccessMessage('');
    setFormData(prev => ({ ...prev, [fieldName]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!config || isSubmitting) return;
    const entity = config.entity;
    if (!entity) {
      setError('Entity not defined in config.');
      return;
    }

    const apiUrl = `http://localhost:5000/api/${entity}`;
    setIsSubmitting(true);
    setError('');
    setSuccessMessage('');

    try {
      const res = await axios.post(apiUrl, formData);
      console.log('Response:', res.data);
      setSuccessMessage('Form submitted successfully!');
    } catch (err) {
      console.error('Error submitting form:', err.response ? err.response.data : err.message);
      setError('Error submitting form. Please check the data and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const allowedTypes = new Set(['text','number','email','password','date','checkbox','radio','textarea']);

  if (loading) {
    return (
      <div className="app-shell">
        <div className="app-card">
          <h1>Dynamic Form</h1>
          <p className="status-message status-message--info">Loading form configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="app-card">
        <h1>Dynamic Form</h1>

        {error && <p className="status-message status-message--error">{error}</p>}
        {successMessage && <p className="status-message status-message--success">{successMessage}</p>}

        {config && (
          <form onSubmit={handleSubmit} className="dynamic-form">
            {(Array.isArray(config.fields) ? config.fields : []).map((field, index) => {
              if (!field || typeof field !== 'object') return null;

              const hasName = typeof field.name === 'string' && field.name.trim() !== '';
              const labelText = hasName ? field.name : 'Unknown Field';

              const type = allowedTypes.has(field.type) ? field.type : 'text';

              // If field has no name we render a safe, uncontrolled fallback input
              if (!hasName) {
                return (
                  <div key={index} className="field-group">
                    <label>{labelText}</label>
                    <input type={type} placeholder={labelText} />
                  </div>
                );
              }

              return (
                <div key={index} className="field-group">
                  <label>{labelText}</label>
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

            <button type="submit" className="submit-button" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default App;