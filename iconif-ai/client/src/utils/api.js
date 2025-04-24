// utils/api.js
const API_BASE_URL = 'http://localhost:5012/api';

/**
 * Generate an icon using the OpenAI API
 * @param {Object} options - Generation options
 * @param {string} options.prompt - Text description of the icon
 * @param {string} options.style - Style of the icon (flat, 3d, outline, etc.)
 * @param {string} options.color - Optional color theme
 * @param {string} options.model - AI model to use (dall-e-2, dall-e-3, dall-e-3.5)
 * @param {string} options.aspectRatio - Aspect ratio (square, landscape, portrait)
 * @returns {Promise<Object>} Icon data including preview URL
 */
export const generateIcon = async (options) => {
  try {
    console.log('Sending generation request to API:', options);

    const response = await fetch(`${API_BASE_URL}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    });

    console.log('Generation API response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Generation API error:', errorData);
      throw new Error(errorData.message || 'Failed to generate icon');
    }

    const data = await response.json();
    console.log('Generation successful, received data:', data);
    return data;
  } catch (error) {
    console.error('Error in generateIcon():', error);
    throw error;
  }
};

/**
 * Process the generated icon into various formats
 * @param {Object} options - Processing options
 * @param {string} options.iconId - ID of the generated icon
 * @param {Array<string>} options.formats - Array of formats to generate
 * @returns {Promise<Object>} Data including download URL
 */
export const processIconFormats = async (options) => {
  try {
    console.log('Sending processing request to API:', options);

    const response = await fetch(`${API_BASE_URL}/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    });

    console.log('Processing API response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Processing API error:', errorData);
      throw new Error(errorData.message || 'Failed to process icon formats');
    }

    const data = await response.json();
    console.log('Processing successful, received data:', data);
    return data;
  } catch (error) {
    console.error('Error in processIconFormats():', error);
    throw error;
  }
};