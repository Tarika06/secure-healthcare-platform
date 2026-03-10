import apiClient from './client';

const chatApi = {
  sendMessage: async (messages) => {
    const response = await apiClient.post('/chat', { messages });
    return response.data;
  }
};

export default chatApi;
