"use client";

import { useState, useEffect } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import "./../app/app.css";
import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";
import "@aws-amplify/ui-react/styles.css";

Amplify.configure(outputs);

const client = generateClient<Schema>();

export default function App() {
  const [todos, setTodos] = useState<Array<Schema["Todo"]["type"]>>([]);

  function listTodos() {
    client.models.Todo.observeQuery().subscribe({
      next: (data) => setTodos([...data.items]),
    });
  }

  useEffect(() => {
    listTodos();
  }, []);

  function createTodo() {
    client.models.Todo.create({
      content: window.prompt("Todo content"),
    });
  }
  
  function deleteTodo(id: string) {
    client.models.Todo.delete({ id })
  }
          
  // Weather widget state
  const US_STATES = [
    { abbr: "AL", name: "Alabama" }, { abbr: "AK", name: "Alaska" }, { abbr: "AZ", name: "Arizona" }, { abbr: "AR", name: "Arkansas" },
    { abbr: "CA", name: "California" }, { abbr: "CO", name: "Colorado" }, { abbr: "CT", name: "Connecticut" }, { abbr: "DE", name: "Delaware" },
    { abbr: "FL", name: "Florida" }, { abbr: "GA", name: "Georgia" }, { abbr: "HI", name: "Hawaii" }, { abbr: "ID", name: "Idaho" },
    { abbr: "IL", name: "Illinois" }, { abbr: "IN", name: "Indiana" }, { abbr: "IA", name: "Iowa" }, { abbr: "KS", name: "Kansas" },
    { abbr: "KY", name: "Kentucky" }, { abbr: "LA", name: "Louisiana" }, { abbr: "ME", name: "Maine" }, { abbr: "MD", name: "Maryland" },
    { abbr: "MA", name: "Massachusetts" }, { abbr: "MI", name: "Michigan" }, { abbr: "MN", name: "Minnesota" }, { abbr: "MS", name: "Mississippi" },
    { abbr: "MO", name: "Missouri" }, { abbr: "MT", name: "Montana" }, { abbr: "NE", name: "Nebraska" }, { abbr: "NV", name: "Nevada" },
    { abbr: "NH", name: "New Hampshire" }, { abbr: "NJ", name: "New Jersey" }, { abbr: "NM", name: "New Mexico" }, { abbr: "NY", name: "New York" },
    { abbr: "NC", name: "North Carolina" }, { abbr: "ND", name: "North Dakota" }, { abbr: "OH", name: "Ohio" }, { abbr: "OK", name: "Oklahoma" },
    { abbr: "OR", name: "Oregon" }, { abbr: "PA", name: "Pennsylvania" }, { abbr: "RI", name: "Rhode Island" }, { abbr: "SC", name: "South Carolina" },
    { abbr: "SD", name: "South Dakota" }, { abbr: "TN", name: "Tennessee" }, { abbr: "TX", name: "Texas" }, { abbr: "UT", name: "Utah" },
    { abbr: "VT", name: "Vermont" }, { abbr: "VA", name: "Virginia" }, { abbr: "WA", name: "Washington" }, { abbr: "WV", name: "West Virginia" },
    { abbr: "WI", name: "Wisconsin" }, { abbr: "WY", name: "Wyoming" }
  ];
  const [state, setState] = useState("");
  const [cityInput, setCityInput] = useState("");
  const [cityOptions, setCityOptions] = useState<any[]>([]);
  const [selectedCity, setSelectedCity] = useState<any>(null);
  const [weather, setWeather] = useState<any>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [weatherError, setWeatherError] = useState("");
  const [loadingCities, setLoadingCities] = useState(false);
  const [ip, setIp] = useState<string>("");
  const [loadingIp, setLoadingIp] = useState(false);
  // Fetch weather by IP
  async function fetchWeatherByIP() {
    setLoadingWeather(true);
    setWeatherError("");
    setWeather(null);
    setLoadingIp(true);
    try {
      // Get IP and location
      const ipRes = await fetch("https://ipapi.co/json/");
      const ipData = await ipRes.json();
      setIp(ipData.ip);
      if (!ipData.latitude || !ipData.longitude) {
        setWeatherError("Could not determine your location from IP.");
        setLoadingWeather(false);
        setLoadingIp(false);
        return;
      }
      const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${ipData.latitude}&longitude=${ipData.longitude}&current_weather=true`);
      const weatherData = await weatherRes.json();
      setWeather({
        location: `${ipData.city}, ${ipData.region}, ${ipData.country_name}`,
        ...weatherData.current_weather
      });
    } catch (err) {
      setWeatherError("Failed to fetch weather by IP.");
    }
    setLoadingWeather(false);
    setLoadingIp(false);
  }

  // Fetch city options as user types
  useEffect(() => {
    async function fetchCities() {
      if (cityInput.length < 2 || !state) {
        setCityOptions([]);
        return;
      }
      setLoadingCities(true);
      try {
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityInput)}&country=US&admin1=${encodeURIComponent(state)}&count=5`);
        const geoData = await geoRes.json();
        if (geoData.results) {
          setCityOptions(geoData.results);
        } else {
          setCityOptions([]);
        }
      } catch {
        setCityOptions([]);
      }
      setLoadingCities(false);
    }
    fetchCities();
  }, [cityInput, state]);

  async function fetchWeather(e: React.FormEvent) {
    e.preventDefault();
    setWeatherError("");
    setWeather(null);
    if (!selectedCity) {
      setWeatherError("Please select a city from the list.");
      return;
    }
    setLoadingWeather(true);
    try {
      const { latitude, longitude, name, country } = selectedCity;
      const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
      const weatherData = await weatherRes.json();
      setWeather({
        location: `${name}, ${country}`,
        ...weatherData.current_weather
      });
    } catch (err) {
      setWeatherError("Failed to fetch weather.");
    }
    setLoadingWeather(false);
  }

  return (
    <>
      <nav style={{ width: '100%', background: '#222', color: 'white', padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <span style={{ fontWeight: 700, fontSize: '1.2rem' }}>YTS App</span>
        <a href="/chatbot" style={{ color: 'white', textDecoration: 'none', background: '#0070f3', padding: '0.4rem 1rem', borderRadius: '4px', fontWeight: 500 }}>AI Chatbot</a>
      </nav>
      <main>
      <h1>My todos</h1>
      <button onClick={createTodo}>+ new</button>
      <ul>
        {todos.map(todo => (
          <li key={todo.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ flex: 1 }}>{todo.content}</span>
            <button onClick={() => deleteTodo(todo.id)} style={{ color: 'white', background: 'red', border: 'none', borderRadius: '4px', padding: '0.2rem 0.5rem', cursor: 'pointer' }}>Delete</button>
          </li>
        ))}
      </ul>
      <div>
        🥳 App successfully hosted. Try creating a new todo.
        <br />
        <a href="https://docs.amplify.aws/nextjs/start/quickstart/nextjs-app-router-client-components/">Review next step of this tutorial.</a>
      </div>
      <hr style={{ margin: "2rem 0" }} />
      <section style={{ marginTop: "2rem", padding: "1rem", border: "1px solid #ccc", borderRadius: "8px", maxWidth: "400px" }}>
        <h2>Weather Widget</h2>
        <button onClick={fetchWeatherByIP} style={{ background: "#0070f3", color: "white", border: "none", borderRadius: "4px", padding: "0.5rem", cursor: "pointer", marginBottom: "1rem" }} disabled={loadingWeather || loadingIp}>
          {loadingIp ? "Detecting location..." : loadingWeather ? "Loading weather..." : "Get My Weather by IP"}
        </button>
        {ip && <div style={{ fontSize: "0.95em", marginBottom: "0.5rem" }}>Your IP: {ip}</div>}
        <div style={{ margin: "1rem 0", fontWeight: 500 }}>Or search by city/state:</div>
        <form onSubmit={fetchWeather} style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }} autoComplete="off">
          <label>
            State
            <select
              value={state}
              onChange={e => {
                setState(e.target.value);
                setSelectedCity(null);
                setCityInput("");
                setCityOptions([]);
              }}
              required
              style={{ padding: "0.5rem", borderRadius: "4px", border: "1px solid #aaa", marginTop: "0.25rem" }}
            >
              <option value="">Select state</option>
              {US_STATES.map(s => (
                <option key={s.abbr} value={s.name}>{s.name}</option>
              ))}
            </select>
          </label>
          <label style={{ marginTop: "0.5rem" }}>
            City
            <input
              type="text"
              placeholder="Enter city name"
              value={cityInput}
              onChange={e => {
                setCityInput(e.target.value);
                setSelectedCity(null);
              }}
              disabled={!state}
              required
              style={{ padding: "0.5rem", borderRadius: "4px", border: "1px solid #aaa", marginTop: "0.25rem" }}
              autoComplete="off"
            />
            {loadingCities && <div style={{ fontSize: "0.9em" }}>Loading cities...</div>}
            {cityOptions.length > 0 && (
              <ul style={{ listStyle: "none", padding: 0, margin: 0, border: "1px solid #aaa", borderRadius: "4px", background: "#fff", maxHeight: "120px", overflowY: "auto", position: "absolute", zIndex: 10 }}>
                {cityOptions.map((city, idx) => (
                  <li
                    key={city.id || city.name + city.latitude}
                    style={{ padding: "0.3rem 0.5rem", cursor: "pointer" , background: selectedCity && selectedCity.name === city.name ? "#e0e0e0" : "#fff"}}
                    onClick={() => {
                      setSelectedCity(city);
                      setCityInput(city.name);
                      setCityOptions([]);
                    }}
                  >
                    {city.name} {city.admin1 ? `(${city.admin1})` : ""}
                  </li>
                ))}
              </ul>
            )}
          </label>
          <button type="submit" style={{ background: "#0070f3", color: "white", border: "none", borderRadius: "4px", padding: "0.5rem", cursor: "pointer", marginTop: "0.5rem" }}>
            {loadingWeather ? "Loading..." : "Get Weather"}
          </button>
        </form>
        {weatherError && <div style={{ color: "red", marginTop: "0.5rem" }}>{weatherError}</div>}
        {weather && (
          <div style={{ marginTop: "1rem" }}>
            <strong>{weather.location}</strong>
            <div>Temperature: {weather.temperature}°C</div>
            <div>Windspeed: {weather.windspeed} km/h</div>
            <div>Weather code: {weather.weathercode}</div>
            <div>Time: {weather.time}</div>
          </div>
        )}
      </section>
      </main>
    </>
  )
}
