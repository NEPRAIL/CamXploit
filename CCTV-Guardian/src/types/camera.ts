export interface Camera {
    id: string;
    name: string;
    ipAddress: string;
    status: 'online' | 'offline' | 'error';
    lastChecked: Date;
    hasConsent: boolean; // Indicates if the camera has consent for interaction
}