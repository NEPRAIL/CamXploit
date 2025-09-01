"use client";
import "maplibre-gl/dist/maplibre-gl.css";
import Map, { Layer, Source } from "react-map-gl/maplibre";
import maplibregl from "maplibre-gl";
import { useEffect, useState } from "react";

export default function Home() {
  const [data, setData] = useState<any[]>([]);
  useEffect(()=>{ fetch("/api/map").then(r=>r.json()).then(setData).catch(()=>setData([])); }, []);
  const geo = { type:"FeatureCollection", features: data.map((r:any)=>({
    type:"Feature", properties:{ status: r.status || "offline" }, geometry:{ type:"Point", coordinates:[r.lng, r.lat] }
  })) } as any;
  return (
    <div className="h-screen w-screen bg-[#0b1220] text-white">
      <div className="absolute z-10 top-4 left-4 text-xl font-semibold">CCTV Guardian</div>
  <Map initialViewState={{ longitude: 10, latitude: 20, zoom: 1.6 }}
       mapLib={maplibregl as any}
           mapStyle="https://demotiles.maplibre.org/style.json"
           style={{ width:"100%", height:"100%" }}>
        <Source id="cams" type="geojson" data={geo}>
          <Layer id="glow" type="circle" paint={{
            "circle-radius": 10,
            "circle-color": ["match", ["get","status"],
              "online", "#22c55e",
              "auth_required", "#fbbf24",
              "auth_failed", "#f97316",
              /* default */ "#ef4444"
            ],
            "circle-blur": 0.6, "circle-opacity": 0.85
          }}/>
        </Source>
      </Map>
    </div>
  );
}
