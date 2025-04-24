import React, { useState } from 'react';
import { generateIcon, processIconFormats } from '../utils/api';
import PromptHelper from './PromptHelper';

function IconGenerator({ onGenerationStart, onGenerationComplete, onProcessingStart, onProcessingComplete, onError }) {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('flat');
  const [color, setColor] = useState('');
  const [model, setModel] = useState('dall-e-3');
  const [aspectRatio, setAspectRatio] = useState('square');
  const [includeFormats, setIncludeFormats] = useState({
    ico: true,
    png: true,
    svg: true,
    webp: true,
    favicon: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Define model cost info
  const modelCosts = {
    'dall-e-2': { cost: 0.02, currency: '€' },
    'dall-e-3': { cost: 0.04, currency: '€' }
  };

  const handlePromptSelect = (selectedPrompt) => {
    setPrompt(selectedPrompt);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!prompt.trim()) {
      onError('Bitte gib eine Beschreibung für dein Icon ein');
      return;
    }

    // Prevent multiple submissions
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      onGenerationStart();

      console.log('Generating icon with params:', { prompt, style, color, model, aspectRatio });

      const iconData = await generateIcon({
        prompt,
        style,
        color,
        model,
        aspectRatio
      });

      console.log('Icon generated successfully:', iconData);
      onGenerationComplete(iconData);

      if (iconData) {
        onProcessingStart();

        console.log('Processing icon formats...');
        const selectedFormats = Object.keys(includeFormats).filter(key => includeFormats[key]);
        console.log('Selected formats:', selectedFormats);

        try {
          const downloadData = await processIconFormats({
            iconId: iconData.id,
            formats: selectedFormats,
          });

          console.log('Icon processing complete:', downloadData);
          onProcessingComplete(downloadData.downloadUrl);
        } catch (processError) {
          console.error('Error processing icon formats:', processError);
          onError(processError.message || 'Icon-Formate konnten nicht verarbeitet werden');
        }
      }
    } catch (error) {
      console.error('Error generating icon:', error);
      onError(error.message || 'Icon konnte nicht generiert werden');
    } finally {
      setIsSubmitting(false);
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

        {/* Prompt-Helper einbinden */}
        <PromptHelper onSelectPrompt={handlePromptSelect} />

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
            <label htmlFor="model" className="form-label">KI-Modell</label>
            <select
                id="model"
                className="form-control"
                value={model}
                onChange={(e) => setModel(e.target.value)}
            >
              <option value="dall-e-2">DALL-E 2 (Schneller, weniger detailliert)</option>
              <option value="dall-e-3">DALL-E 3 (Hohe Qualität)</option>
            </select>
            <p className="model-cost-info">
              Ungefähre Kosten: {modelCosts[model].cost} {modelCosts[model].currency} pro Bild
            </p>
          </div>

          <div className="form-group">
            <label htmlFor="aspectRatio" className="form-label">Format</label>
            <select
                id="aspectRatio"
                className="form-control"
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
            >
              <option value="square">Quadratisch (1:1)</option>
              <option value="landscape">Querformat (16:9)</option>
              <option value="portrait">Hochformat (9:16)</option>
            </select>
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

          <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
          >
            {isSubmitting ? 'Wird generiert...' : 'Icon generieren'}
          </button>
        </form>
      </div>
  );
}

export default IconGenerator;