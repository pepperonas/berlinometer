// Test script to verify pressure data handling
const express = require('express');

// Test data with pressure
const testData = {
    temperature: 23.87,
    humidity: 75.11,
    pressure: 1013.25,
    timestamp: Math.floor(Date.now() / 1000)
};

console.log('Test data structure:');
console.log(testData);

// Test parsing
const temp = parseFloat(testData.temperature);
const hum = parseFloat(testData.humidity);
const press = testData.pressure ? parseFloat(testData.pressure) : null;

console.log('Parsed values:');
console.log(`Temperature: ${temp.toFixed(1)}°C`);
console.log(`Humidity: ${hum.toFixed(1)}%`);
console.log(`Pressure: ${press ? press.toFixed(1) + 'hPa' : 'N/A'}`);

// Test validation
if (press && (press < 950 || press > 1050)) {
    console.log('Warning: Pressure value seems unusual');
} else if (press) {
    console.log('Pressure value is within normal range');
}

console.log('Pressure data handling test complete');