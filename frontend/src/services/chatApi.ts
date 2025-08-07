// Real chat API service that connects to the backend

import { ChatMessage } from '../types';
import axios from 'axios';

// API base URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const chatApi = {
  chat: {
    sendMessage: async (message: string, userId: string) => {
      console.log('Sending message with backend:', message, userId);

      try {
        const token = localStorage.getItem('wellnest_token');

        if (!token) {
          throw new Error('Not authenticated');
        }

        // Call backend API to send message
        const response = await axios.post(`${API_URL}/chat/send`, {
          message,
          userId
        }, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        console.log('Message sent and response received:', response.data);
        return response.data;
      } catch (error) {
        console.error('Error sending message with backend:', error);
        // Return a more specific error for better handling
        if (error.message === 'Not authenticated') {
          throw new Error('Authentication required for backend chat');
        }
        throw new Error(error.response?.data?.message || 'Failed to send message');
      }
    },

    getHistory: async (userId: string) => {
      console.log('Getting chat history with backend for user:', userId);

      try {
        const token = localStorage.getItem('wellnest_token');

        if (!token) {
          throw new Error('Not authenticated');
        }

        // Call backend API to get chat history
        const response = await axios.get(`${API_URL}/chat/history/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        console.log(`Found ${response.data.messages.length} messages`);
        return { messages: response.data.messages };
      } catch (error) {
        console.error('Error getting chat history with backend:', error);
        throw new Error(error.response?.data?.message || 'Failed to get chat history');
      }
    }
  }
};
