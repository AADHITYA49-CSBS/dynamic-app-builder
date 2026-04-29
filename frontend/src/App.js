import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
const DEFAULT_ENTITY = 'User';

function App() {
  const [config, setConfig] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [submissions, setSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  // Fetch config on mount
  useEffect(() => {
    fetchConfig();
  }, []);

  // Fetch config
  const fetchConfig = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await axios.get(`${API_BASE_URL}/config/${DEFAULT_ENTITY}`);
      
      const cfg = res && res.data ? res.data : {};
      const fields = Array.isArray(cfg.fields) ? cfg.fields : [];
      setConfig({ entity: DEFAULT_ENTITY, ...cfg, fields });

      const initialFormData = {};
      fields.forEach(field => {
        if (field && typeof field.name === 'string' && field.name.trim() !== '') {
          initialFormData[field.name] = '';
        }
      });
      setFormData(initialFormData);

      // Fetch initial submissions
      if (cfg.entity) {
        await fetchSubmissions(cfg.entity);
      }
    } catch (err) {
      console.error('Failed to load config', err);
      setError('Failed to load form configuration. Please try again later.');
      setConfig(null);
    } finally {
      setLoading(false);
    }
  };

  // Fetch submissions
  const fetchSubmissions = async (entity) => {
    try {
      setLoadingSubmissions(true);
      const res = await axios.get(`${API_BASE_URL}/api/${entity}`);
      setSubmissions(res.data.data || []);
    } catch (err) {
      console.error('Failed to load submissions', err);
      setSubmissions([]);
    } finally {
      setLoadingSubmissions(false);
    }
  };

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

    const apiUrl = `${API_BASE_URL}/api/${entity}`;
    setIsSubmitting(true);
    setError('');
    setSuccessMessage('');

    try {
      const res = await axios.post(apiUrl, formData);
      console.log('Response:', res.data);
      
      setSuccessMessage('Form submitted successfully!');
      
      // Clear form
      const initialFormData = {};
      config.fields.forEach(field => {
        if (field && typeof field.name === 'string' && field.name.trim() !== '') {
          initialFormData[field.name] = '';
        }
      });
      setFormData(initialFormData);

      // Refresh submissions
      await fetchSubmissions(entity);
    } catch (err) {
      console.error('Error submitting form:', err);
      const errorMsg = err.response?.data?.error || 'Error submitting form. Please check the data and try again.';
      setError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const allowedTypes = new Set(['text', 'number', 'email', 'password', 'date', 'checkbox', 'radio', 'textarea']);

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
        <h1>Dynamic Form Builder</h1>

        {error && <p className="status-message status-message--error">{error}</p>}
        {successMessage && <p className="status-message status-message--success">{successMessage}</p>}

        {config && (
          <>
            {/* Form Section */}
            <section className="form-section">
              <h2>Submit {config.entity} Data</h2>
              <form onSubmit={handleSubmit} className="dynamic-form">
                {(Array.isArray(config.fields) ? config.fields : []).map((field, index) => {
                  if (!field || typeof field !== 'object') return null;

                  const hasName = typeof field.name === 'string' && field.name.trim() !== '';
                  if (!hasName) return null;

                  const labelText = field.name;
                  const type = allowedTypes.has(field.type) ? field.type : 'text';


                  return (
                    <div key={index} className="field-group">
                      <label htmlFor={field.name}>{labelText}</label>
                      {type === 'textarea' ? (
                        <textarea
                          id={field.name}
                          placeholder={labelText}
                          value={formData[field.name] || ''}
                          onChange={e => handleInputChange(field.name, e.target.value)}
                        />
                      ) : (
                        <input
                          id={field.name}
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
            </section>

            {/* Submissions Table Section */}
            <section className="submissions-section">
              <h2>Submitted {config.entity} Data</h2>
              
              {loadingSubmissions ? (
                <p className="status-message status-message--info">Loading submissions...</p>
              ) : submissions.length === 0 ? (
                <p className="status-message status-message--info">No submissions yet. Fill out the form above to get started.</p>
              ) : (
                <div className="table-wrapper">
                  <table className="submissions-table">
                    <thead>
                      <tr>
                        {config.fields
                          .filter(f => f && typeof f.name === 'string' && f.name.trim() !== '')
                          .map(field => (
                            <th key={field.name}>{field.name}</th>
                          ))}
                        <th>Submitted At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {submissions.map((submission, idx) => (
                        <tr key={idx}>
                          {config.fields
                            .filter(f => f && typeof f.name === 'string' && f.name.trim() !== '')
                            .map(field => (
                              <td key={field.name}>{submission[field.name] || '-'}</td>
                            ))}
                          <td>
                            {submission.submitted_at
                              ? new Date(submission.submitted_at).toLocaleString()
                              : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}

export default App;