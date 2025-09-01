import React from 'react';
import { Camera } from '../types/camera';

interface CameraListProps {
  cameras: Camera[];
}

const CameraList: React.FC<CameraListProps> = ({ cameras }) => {
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Camera List</h2>
      <ul className="space-y-2">
        {cameras.map((camera) => (
          <li key={camera.id} className="border p-2 rounded shadow">
            <h3 className="font-semibold">{camera.name}</h3>
            <p>Status: {camera.isActive ? 'Active' : 'Inactive'}</p>
            <p>Location: {camera.location}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CameraList;