import React, { useState } from 'react';
import { generateIcon, processIconFormats } from '../utils/api';

function IconGenerator({ onGenerationStart, onGenerationComplete, onProcessingStart, onProcessingComplete, onError }) {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('flat');
  const [color, setColor] = useState('');
  const [includeFormats, setIncludeFormats] = useState({
    ico: true,
    png: true,
    svg: true,
    webp: true,
    favicon: true,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!prompt.trim()) {
      onError('Bitte gib eine Beschreibung für dein Icon ein');
      return;
    }
    
    try {
      onGenerationStart();
      
      const iconData = await generateIcon({
        prompt,
        style,
        color,
      });
      
      onGenerationComplete(iconData);
      
      if (iconData) {
        onProcessingStart();
        
        const downloadData = await processIconFormats({
          iconId: iconData.id,
          formats: Object.keys(includeFormats).filter(key => includeFormats[key]),
        });
        
        onProcessingComplete(downloadData.downloadUrl);
      }
    } catch (error) {
      onError(error.message || 'Icon konnte nicht generiert werden');
    }
  };

  const handleFormatChange = (format) => {
    setIncludeFormats({
      ...includeFormats,
      [format]: !includeFormats[format],
    });
  };

  return (
    <div className="card">
      <h2>Icon generieren</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="prompt" className="form-label">Beschreibung</label>
          <textarea
            id="prompt"
            className="form-control"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Beschreibe dein Icon (z.B. 'Ein minimalistisches Berg-Logo')"
            rows={4}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="style" className="form-label">Stil</label>
          <select
            id="style"
            className="form-control"
            value={style}
            onChange={(e) => setStyle(e.target.value)}
          >
            <option value="flat">Flat</option>
            <option value="3d">3D</option>
            <option value="outline">Outline</option>
            <option value="gradient">Gradient</option>
            <option value="pixel">Pixel Art</option>
            <option value="realistic">Realistisch</option>
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="color" className="form-label">Farbschema (optional)</label>
          <input
            type="text"
            id="color"
            className="form-control"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            placeholder="z.B. blau, rot und weiß, pastellfarben"
          />
        </div>
        
        <div className="form-group">
          <label className="form-label">Ausgabeformate</label>
          <div className="format-checkboxes">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={includeFormats.ico}
                onChange={() => handleFormatChange('ico')}
              />
              .ICO (Windows)
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={includeFormats.png}
                onChange={() => handleFormatChange('png')}
              />
              .PNG (Transparent)
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={includeFormats.svg}
                onChange={() => handleFormatChange('svg')}
              />
              .SVG (Vektor)
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={includeFormats.webp}
                onChange={() => handleFormatChange('webp')}
              />
              .WEBP (Web-optimiert)
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={includeFormats.favicon}
                onChange={() => handleFormatChange('favicon')}
              />
              Favicon-Paket
            </label>
          </div>
        </div>
        
        <button type="submit" className="btn btn-primary">Icon generieren</button>
      </form>
    </div>
  );
}

export default IconGenerator;
