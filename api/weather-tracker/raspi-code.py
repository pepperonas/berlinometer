import Adafruit_DHT
import requests
import time

# Sensor type and GPIO pin
sensor = Adafruit_DHT.DHT22
pin = 18

# Webserver URL
url = "https://mrx3k1.de/weather-tracker/weather-tracker"


def send_data(temp, humidity):
    try:
        data = {
            'temperature': temp,
            'humidity': humidity,
            'timestamp': int(time.time())
        }
        response = requests.post(url, json=data, timeout=10)
        if response.status_code == 200:
            print(f"Data sent successfully: {temp:.1f}°C, {humidity:.1f}%")
        else:
            print(f"Server error: {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"Network error: {e}")


while True:
    humidity, temperature = Adafruit_DHT.read_retry(sensor, pin)

    if humidity is not None and temperature is not None:
        print(f"Temp: {temperature:.1f}°C    Humidity: {humidity:.1f}%")
        send_data(temperature, humidity)
    else:
        print("Failed to read from sensor")

    time.sleep(5.0)
