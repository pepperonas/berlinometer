// utils/api.js
const API_BASE_URL = 'http://localhost:5012/api';

/**
 * Generate an icon using the ChatGPT/OpenAI API
 * @param {Object} options - Generation options
 * @param {string} options.prompt - Text description of the icon
 * @param {string} options.style - Style of the icon (flat, 3d, outline, etc.)
 * @param {string} options.color - Optional color theme
 * @returns {Promise<Object>} Icon data including preview URL
 */
export const generateIcon = async (options) => {
  try {
    const response = await fetch(`${API_BASE_URL}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to generate icon');
    }

    return await response.json();
  } catch (error) {
    console.error('Error generating icon:', error);
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
    const response = await fetch(`${API_BASE_URL}/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to process icon formats');
    }

    return await response.json();
  } catch (error) {
    console.error('Error processing icon formats:', error);
    throw error;
  }
};
