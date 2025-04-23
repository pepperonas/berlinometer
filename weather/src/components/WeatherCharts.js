import React, { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

function WeatherCharts({ forecast }) {
    const { darkMode } = useContext(ThemeContext);

    // Hilfsfunktion zum Formatieren des Datums/Uhrzeit
    const formatXAxis = (timestamp) => {
        const date = new Date(timestamp * 1000);
        return date.toLocaleDateString('de-DE', { weekday: 'short' }) + ' ' +
            date.getHours() + 'h';
    };

    // Daten für die Charts vorbereiten
    const prepareChartData = () => {
        if (!forecast || forecast.length === 0) return [];

        // Flatten forecasts und nur relevante Daten behalten
        const chartData = [];

        forecast.forEach(day => {
            day.forEach(item => {
                chartData.push({
                    time: item.dt,
                    temp: Math.round(item.main.temp),
                    rain: item.rain ? item.rain['3h'] || 0 : 0,
                    wind: Math.round(item.wind.speed * 3.6), // Umrechnung in km/h
                    humidity: item.main.humidity
                });
            });
        });

        return chartData;
    };

    const chartData = prepareChartData();

    // Farben basierend auf dem Theme
    const colors = {
        temp: darkMode ? '#3B82F6' : '#2563EB',
        rain: darkMode ? '#60A5FA' : '#3B82F6',
        wind: darkMode ? '#93C5FD' : '#60A5FA'
    };

    // Chart-Styles
    const chartStyle = {
        backgroundColor: darkMode ? '#383B4F' : '#FFFFFF',
        borderRadius: '0.5rem',
        padding: '1rem',
        marginBottom: '1rem',
        boxShadow: darkMode ? '0 4px 6px rgba(0, 0, 0, 0.3)' : '0 4px 6px rgba(0, 0, 0, 0.1)'
    };

    return (
        <div className="mt-6 sm:mt-8 animate-chartLoad">
            <h2 className={`text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 ${darkMode ? 'text-blue-300' : 'text-blue-500'}`}>
                Wettertrends der nächsten Tage
            </h2>

            {/* Temperatur-Chart */}
            <div style={chartStyle} className="mb-4">
                <h3 className={`text-lg font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Temperaturverlauf</h3>
                <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#4B5563' : '#E5E7EB'} />
                        <XAxis
                            dataKey="time"
                            tickFormatter={formatXAxis}
                            stroke={darkMode ? '#9CA3AF' : '#6B7280'}
                        />
                        <YAxis
                            unit="°C"
                            stroke={darkMode ? '#9CA3AF' : '#6B7280'}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: darkMode ? '#2C2E3B' : '#FFFFFF', borderColor: darkMode ? '#4B5563' : '#E5E7EB' }}
                            labelFormatter={value => formatXAxis(value)}
                            formatter={(value) => [`${value}°C`, 'Temperatur']}
                        />
                        <Line
                            type="monotone"
                            dataKey="temp"
                            stroke={colors.temp}
                            strokeWidth={2}
                            dot={{ r: 2, fill: colors.temp }}
                            activeDot={{ r: 4 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Niederschlag-Chart */}
            <div style={chartStyle} className="mb-4">
                <h3 className={`text-lg font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Niederschlag</h3>
                <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#4B5563' : '#E5E7EB'} />
                        <XAxis
                            dataKey="time"
                            tickFormatter={formatXAxis}
                            stroke={darkMode ? '#9CA3AF' : '#6B7280'}
                        />
                        <YAxis
                            unit=" mm"
                            stroke={darkMode ? '#9CA3AF' : '#6B7280'}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: darkMode ? '#2C2E3B' : '#FFFFFF', borderColor: darkMode ? '#4B5563' : '#E5E7EB' }}
                            labelFormatter={value => formatXAxis(value)}
                            formatter={(value) => [`${value} mm`, 'Niederschlag']}
                        />
                        <Bar
                            dataKey="rain"
                            fill={colors.rain}
                            radius={[4, 4, 0, 0]}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Wind-Chart */}
            <div style={chartStyle}>
                <h3 className={`text-lg font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Windgeschwindigkeit</h3>
                <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#4B5563' : '#E5E7EB'} />
                        <XAxis
                            dataKey="time"
                            tickFormatter={formatXAxis}
                            stroke={darkMode ? '#9CA3AF' : '#6B7280'}
                        />
                        <YAxis
                            unit=" km/h"
                            stroke={darkMode ? '#9CA3AF' : '#6B7280'}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: darkMode ? '#2C2E3B' : '#FFFFFF', borderColor: darkMode ? '#4B5563' : '#E5E7EB' }}
                            labelFormatter={value => formatXAxis(value)}
                            formatter={(value) => [`${value} km/h`, 'Wind']}
                        />
                        <Line
                            type="monotone"
                            dataKey="wind"
                            stroke={colors.wind}
                            strokeWidth={2}
                            dot={{ r: 2, fill: colors.wind }}
                            activeDot={{ r: 4 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

export default WeatherCharts;