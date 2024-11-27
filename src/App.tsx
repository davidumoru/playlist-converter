import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Header } from "./components/Header";
import { PlaylistConverter } from "./components/PlaylistConverter";
import { CallbackHandler } from "./components/CallbackHandler";

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              YouTube to Spotify Playlist Converter
            </h2>
            <p className="mt-4 text-lg text-gray-600">
            Seamlessly convert your playlists from to YouTube to Spotify in seconds
            </p>
          </div>
          <Routes>
            <Route path="/callback" element={<CallbackHandler />} />
            <Route path="/" element={<PlaylistConverter />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
