import React from 'react';
import CameraList from '../components/CameraList';

const Home: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-4xl font-bold mb-4">CCTV Guardian</h1>
      <p className="text-lg mb-8">Monitoring authorized cameras with consent.</p>
      <CameraList />
    </div>
  );
};

export default Home;