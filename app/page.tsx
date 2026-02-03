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
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [weather, setWeather] = useState<any>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [weatherError, setWeatherError] = useState("");

  async function fetchWeather(e: React.FormEvent) {
    e.preventDefault();
    setLoadingWeather(true);
    setWeatherError("");
    setWeather(null);
    try {
      // Use Open-Meteo geocoding and weather APIs (no key required)
      const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)},${encodeURIComponent(state)}&count=1`);
      const geoData = await geoRes.json();
      if (!geoData.results || geoData.results.length === 0) {
        setWeatherError("Location not found.");
        setLoadingWeather(false);
        return;
      }
      const { latitude, longitude, name, country } = geoData.results[0];
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
        <form onSubmit={fetchWeather} style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <input
            type="text"
            placeholder="City"
            value={city}
            onChange={e => setCity(e.target.value)}
            required
            style={{ padding: "0.5rem", borderRadius: "4px", border: "1px solid #aaa" }}
          />
          <input
            type="text"
            placeholder="State"
            value={state}
            onChange={e => setState(e.target.value)}
            required
            style={{ padding: "0.5rem", borderRadius: "4px", border: "1px solid #aaa" }}
          />
          <button type="submit" style={{ background: "#0070f3", color: "white", border: "none", borderRadius: "4px", padding: "0.5rem", cursor: "pointer" }}>
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
  )
}
