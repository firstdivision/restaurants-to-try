// Map.tsx
import React from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";

export default function Map() {
  return (
    <MapContainer center={[30.265175, -97.743821]} zoom={10} scrollWheelZoom={false}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[30.3041725, -97.7267211]}>
        <Popup>
        <b><a href='https://hpbng.com/'>Hyde Park Bar and Grill</a></b>
        </Popup>
      </Marker>
    </MapContainer>
  );
}