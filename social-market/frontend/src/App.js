import React, { useState, useEffect } from 'react';
import './App.css';

const API_URL = process.env.NODE_ENV === 'production' 
  ? '/social-market/api' 
  : 'http://localhost:5015/api';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isMaster, setIsMaster] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [error, setError] = useState('');
  const [products, setProducts] = useState([]);
  const [generatedKey, setGeneratedKey] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [uploadData, setUploadData] = useState({
    text: '',
    price: '',
    image: null
  });

  useEffect(() => {
    // Check for key in URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const urlKey = urlParams.get('key');
    if (urlKey) {
      validateKey(urlKey);
    }
  }, []);

  const validateKey = async (key) => {
    try {
      const response = await fetch(`${API_URL}/validate-key`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key })
      });
      
      const data = await response.json();
      
      if (data.valid) {
        setIsAuthenticated(true);
        setIsMaster(data.isMaster);
        setProducts(data.products);
        setError('');
        // Clear URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
      } else {
        setError('Invalid or already used key');
      }
    } catch (err) {
      setError('Connection error');
    }
  };

  const handleKeySubmit = (e) => {
    e.preventDefault();
    validateKey(keyInput);
  };

  const generateNewKey = async () => {
    try {
      const response = await fetch(`${API_URL}/generate-key`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: keyInput })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setGeneratedKey(data.key);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Connection error');
    }
  };

  const generateLink = async () => {
    try {
      const response = await fetch(`${API_URL}/generate-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: keyInput })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setGeneratedLink(data.link);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Connection error');
    }
  };

  const handleProductUpload = async (e) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('password', keyInput);
    formData.append('text', uploadData.text);
    formData.append('price', uploadData.price);
    formData.append('image', uploadData.image);
    
    try {
      const response = await fetch(`${API_URL}/upload-product`, {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setProducts([...products, data.product]);
        setUploadData({ text: '', price: '', image: null });
        // Clear file input
        document.getElementById('image-input').value = '';
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Upload failed');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setIsMaster(false);
    setKeyInput('');
    setProducts([]);
    setGeneratedKey('');
    setGeneratedLink('');
  };

  if (!isAuthenticated) {
    return (
      <div className="App">
        <div className="auth-container">
          <h1 className="typewriter">SOCIAL MARKET</h1>
          <form onSubmit={handleKeySubmit}>
            <input
              type="text"
              className="key-input"
              placeholder="ENTER KEY"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              maxLength="19"
            />
            <button type="submit" className="btn">ENTER</button>
          </form>
          {error && <div className="error">{error}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <button className="btn logout-btn" onClick={handleLogout}>LOGOUT</button>
      
      <div className="main-content">
        {isMaster && (
          <div className="admin-panel">
            <h2>ADMIN PANEL</h2>
            
            <div className="generate-section">
              <h3>Generate Access Key</h3>
              <button className="btn" onClick={generateNewKey}>GENERATE KEY</button>
              {generatedKey && (
                <div className="key-display" onClick={() => copyToClipboard(generatedKey)}>
                  {generatedKey}
                </div>
              )}
            </div>
            
            <div className="generate-section">
              <h3>Generate Access Link</h3>
              <button className="btn" onClick={generateLink}>GENERATE LINK</button>
              {generatedLink && (
                <div className="link-display" onClick={() => copyToClipboard(generatedLink)}>
                  {generatedLink}
                </div>
              )}
            </div>
            
            <div className="generate-section">
              <h3>Upload Product</h3>
              <form className="upload-form" onSubmit={handleProductUpload}>
                <input
                  type="file"
                  id="image-input"
                  accept="image/*"
                  onChange={(e) => setUploadData({...uploadData, image: e.target.files[0]})}
                  required
                />
                <input
                  type="text"
                  placeholder="Product description"
                  value={uploadData.text}
                  onChange={(e) => setUploadData({...uploadData, text: e.target.value})}
                  required
                />
                <input
                  type="number"
                  placeholder="Price"
                  step="0.01"
                  value={uploadData.price}
                  onChange={(e) => setUploadData({...uploadData, price: e.target.value})}
                  required
                />
                <button type="submit" className="btn">UPLOAD</button>
              </form>
            </div>
          </div>
        )}
        
        <div className="products-grid">
          {products.map(product => (
            <div key={product.id} className="product-card">
              <img 
                src={process.env.NODE_ENV === 'production' 
                  ? `/social-market${product.image}` 
                  : `http://localhost:5015${product.image}`} 
                alt={product.text}
                className="product-image"
              />
              <div className="product-info">
                <p className="product-text">{product.text}</p>
                <p className="product-price">${product.price.toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
