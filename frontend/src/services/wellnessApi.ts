// Real wellness API service that connects to the backend

import { WellnessEntry } from '../types';
import axios from 'axios';

// API base URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const wellnessApi = {
  wellness: {
    // Check if backend is available
    checkBackendHealth: async () => {
      try {
        const response = await axios.get(`${API_URL.replace('/api', '')}/health`, {
          timeout: 5000
        });
        console.log('Backend health check successful:', response.status);
        return response.status === 200;
      } catch (error) {
        console.log('Backend health check failed:', error.message);
        return false;
      }
    },

    // Test wellness submission with sample data
    testSubmission: async () => {
      try {
        const token = localStorage.getItem('wellnest_token');
        if (!token) {
          console.log('No token found for test submission');
          return false;
        }

        const testData = {
          moodRating: 7,
          energyLevel: 6,
          sleepHours: 8,
          sleepQuality: 7,
          stressLevel: 4,
          exerciseMinutes: 30,
          entryDate: new Date().toISOString().split('T')[0]
        };

        console.log('Testing wellness submission with data:', testData);

        const response = await axios.post(`${API_URL}/wellness/entries`, testData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        });

        console.log('Test submission successful:', response.data);
        return true;
      } catch (error) {
        console.error('Test submission failed:', error.response?.data || error.message);
        return false;
      }
    },
    submitEntry: async (entry: Partial<WellnessEntry>) => {
      // Alias for createEntry for backward compatibility
      console.log('Submitting wellness entry with backend (via alias):', entry);

      try {
        const token = localStorage.getItem('wellnest_token');

        if (!token) {
          throw new Error('Not authenticated');
        }

        console.log('Using API URL:', API_URL);
        console.log('Token found:', token ? 'Yes' : 'No');
        console.log('Entry data being sent:', JSON.stringify(entry, null, 2));

        // Call backend API to create entry
        const response = await axios.post(`${API_URL}/wellness/entries`, entry, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000 // 10 second timeout
        });

        console.log('Wellness entry submitted successfully:', response.data);
        return { entry: response.data };
      } catch (error) {
        console.error('Error submitting wellness entry with backend:', error);

        // Handle specific error cases
        if (error.message === 'Not authenticated') {
          throw new Error('Authentication required. Please log in or use guest mode.');
        }

        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
          throw new Error('Connection timeout. Please check your internet connection and try again.');
        }

        if (error.response?.status === 401) {
          throw new Error('Authentication expired. Please log in again.');
        }

        if (error.response?.status === 500) {
          throw new Error('Server error. Please try again later.');
        }

        throw new Error(error.response?.data?.message || 'Failed to submit wellness entry');
      }
    },

    createEntry: async (entry: Partial<WellnessEntry>) => {
      console.log('Creating wellness entry with backend:', entry);

      try {
        const token = localStorage.getItem('wellnest_token');

        if (!token) {
          throw new Error('Not authenticated');
        }

        // Call backend API to create entry
        const response = await axios.post(`${API_URL}/wellness/entries`, entry, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        console.log('Wellness entry created:', response.data);
        return { entry: response.data };
      } catch (error) {
        console.error('Error creating wellness entry with backend:', error);
        throw new Error(error.response?.data?.message || 'Failed to create wellness entry');
      }
    },

    getEntries: async (userId: string) => {
      console.log('Getting wellness entries with backend for user:', userId);

      try {
        const token = localStorage.getItem('wellnest_token');

        if (!token) {
          throw new Error('Not authenticated');
        }

        // Call backend API to get entries
        const response = await axios.get(`${API_URL}/wellness/entries/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        console.log(`Found ${response.data.entries.length} wellness entries`);
        return { entries: response.data.entries };
      } catch (error) {
        console.error('Error getting wellness entries with backend:', error);
        throw new Error(error.response?.data?.message || 'Failed to get wellness entries');
      }
    },

    getAnalytics: async (userId: string) => {
      console.log('Getting wellness analytics with backend for user:', userId);

      try {
        const token = localStorage.getItem('wellnest_token');

        if (!token) {
          throw new Error('Not authenticated');
        }

        // Call backend API to get analytics
        const response = await axios.get(`${API_URL}/wellness/analytics/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        console.log('Wellness analytics retrieved');
        return response.data;
      } catch (error) {
        console.error('Error getting wellness analytics with backend:', error);
        throw new Error(error.response?.data?.message || 'Failed to get wellness analytics');
      }
    },

    getContext: async (userId: string) => {
      console.log('Getting wellness context with backend for user:', userId);

      try {
        const token = localStorage.getItem('wellnest_token');

        if (!token) {
          throw new Error('Not authenticated');
        }

        // Call backend API to get context
        const response = await axios.get(`${API_URL}/wellness/context/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        console.log('Wellness context retrieved');
        return response.data;
      } catch (error) {
        console.error('Error getting wellness context with backend:', error);
        throw new Error(error.response?.data?.message || 'Failed to get wellness context');
      }
    }
  }
};
