import React, { useContext, useState } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import WeatherDetailsModal from './WeatherDetailsModal';

function Forecast({ forecast }) {
  const { darkMode } = useContext(ThemeContext);
  const [selectedDay, setSelectedDay] = useState(null);

  // Hilfsfunktion, um den Wochentag zu erhalten
  const getDayName = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('de-DE', { weekday: 'long' });
  };

  // Hilfsfunktion, um die durchschnittliche Temperatur zu berechnen
  const getAverageTemp = (dayData) => {
    const sum = dayData.reduce((acc, item) => acc + item.main.temp, 0);
    return Math.round(sum / dayData.length);
  };

  // Hilfsfunktion, um das häufigste Wettersymbol zu erhalten
  const getMostFrequentIcon = (dayData) => {
    const iconCount = {};
    dayData.forEach(item => {
      const icon = item.weather[0].icon;
      iconCount[icon] = (iconCount[icon] || 0) + 1;
    });

    let mostFrequentIcon = '';
    let maxCount = 0;

    Object.entries(iconCount).forEach(([icon, count]) => {
      if (count > maxCount) {
        mostFrequentIcon = icon;
        maxCount = count;
      }
    });

    return mostFrequentIcon;
  };

  const openDayDetails = (dayData) => {
    setSelectedDay(dayData);
  };

  const closeModal = () => {
    setSelectedDay(null);
  };

  return (
      <>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-4">
          {forecast.map((dayData, index) => {
            const date = new Date(dayData[0].dt * 1000);
            const dayName = getDayName(date);
            const avgTemp = getAverageTemp(dayData);
            const icon = getMostFrequentIcon(dayData);
            const iconUrl = `https://openweathermap.org/img/wn/${icon}@2x.png`;
            const description = dayData[0].weather[0].description;

            return (
                <div
                    key={index}
                    className={`rounded-lg shadow-md p-3 sm:p-4 flex flex-col items-center ${darkMode ? 'bg-primary-light' : 'bg-white'} cursor-pointer transition-transform duration-200 hover:scale-105 relative`}
                    onClick={() => openDayDetails(dayData)}
                >
                  <div className={`absolute top-1 right-1 text-xs ${darkMode ? 'text-blue-300' : 'text-blue-500'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-sm sm:text-lg mb-1 sm:mb-2">{dayName}</h3>
                  <p className={`${darkMode ? 'text-gray-300' : 'text-gray-500'} text-xs sm:text-sm`}>
                    {date.toLocaleDateString('de-DE')}
                  </p>
                  <img
                      src={iconUrl}
                      alt={description}
                      className="w-12 h-12 sm:w-16 sm:h-16 my-1 sm:my-2"
                  />
                  <p className={`capitalize text-xs sm:text-sm mb-1 sm:mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {description}
                  </p>
                  <p className="text-xl sm:text-2xl font-bold">{avgTemp}°C</p>
                </div>
            );
          })}
        </div>

        {selectedDay && (
            <WeatherDetailsModal dayData={selectedDay} onClose={closeModal} />
        )}
      </>
  );
}

export default Forecast;