// PredictiveLocationInput.js
// Unified Google Places-powered input for city, neighborhood, or place.
// Replaces both PredictiveCityInput and PredictiveNeighborhoodInput.

import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { FiX } from 'react-icons/fi';

const PredictiveLocationInput = ({ label, value, onChange, placeholder = "Type a city, neighborhood, or place..." }) => {
  const [inputValue, setInputValue] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  const fetchSuggestions = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }
    setIsLoading(true);
    try {
      const response = await axios.get('/api/places-autocomplete', {
        params: { input: query },
      });
      setSuggestions(response.data || []);
    } catch (error) {
      console.error('Error fetching location suggestions:', error);
      setSuggestions([]);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (inputValue.length >= 2) {
      const debounceTimer = setTimeout(() => {
        fetchSuggestions(inputValue);
      }, 300);
      return () => clearTimeout(debounceTimer);
    } else {
      setSuggestions([]);
    }
  }, [inputValue, fetchSuggestions]);

  const handleChange = (e) => {
    setInputValue(e.target.value);
    setShowSuggestions(true);
  };

  const handleSelectLocation = (suggestion) => {
    setInputValue(suggestion.fullSuggestion || suggestion.description || '');
    onChange(suggestion);
    setShowSuggestions(false);
    setSuggestions([]);
    inputRef.current.blur();
  };

  const handleClear = () => {
    setInputValue('');
    onChange('');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (inputRef.current && !inputRef.current.contains(event.target) &&
          suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div style={{ position: 'relative' }}>
      <label style={{ fontWeight: 500, fontSize: 13, display: 'block', marginBottom: 3 }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleChange}
          onFocus={() => inputValue.length >=2 && suggestions.length > 0 && setShowSuggestions(true)}
          placeholder={placeholder}
          style={{
            width: '100%',
            padding: '8px 12px',
            paddingRight: inputValue ? '30px' : '12px',
            borderRadius: 8,
            border: '1px solid #d1d5db',
            fontSize: 13,
            background: '#f9fafb',
            color: '#333',
          }}
        />
        {inputValue && (
          <FiX
            onClick={handleClear}
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              cursor: 'pointer',
              color: '#888',
              fontSize: '16px'
            }}
            title="Clear location"
          />
        )}
      </div>
      {showSuggestions && suggestions.length > 0 && (
        <ul ref={suggestionsRef} style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          background: 'white',
          border: '1px solid #d1d5db',
          borderRadius: '0 0 8px 8px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          listStyle: 'none',
          padding: 0,
          margin: '2px 0 0 0',
          maxHeight: '200px',
          overflowY: 'auto',
          zIndex: 1000,
        }}>
          {isLoading ? (
            <li style={{ padding: '8px 12px', color: '#888' }}>Loading...</li>
          ) : (
            suggestions.map((suggestion, idx) => (
              <li
                key={suggestion.place_id || idx}
                onMouseDown={() => handleSelectLocation(suggestion)}
                style={{
                  padding: '8px 12px',
                  cursor: 'pointer',
                  fontSize: 13,
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
              >
                {suggestion.fullSuggestion || suggestion.description}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
};

export default PredictiveLocationInput; 