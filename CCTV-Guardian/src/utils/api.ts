import axios from 'axios';

const API_BASE_URL = 'https://your-api-url.com/api'; // Replace with your actual API URL

export const fetchCameras = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/cameras`);
        return response.data;
    } catch (error) {
        console.error('Error fetching cameras:', error);
        throw error;
    }
};

export const fetchCameraDetails = async (cameraId: string) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/cameras/${cameraId}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching details for camera ${cameraId}:`, error);
        throw error;
    }
};

// Add more API utility functions as needed, ensuring they only interact with authorized cameras.