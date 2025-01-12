// Map.tsx
import React from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";

import restaurants from './data/restaurants.json'

export default function Map() {
    let markers = restaurants.map(function(restaurant) {
        return <Marker position={[restaurant.lat, restaurant.lon]}>
                <Popup>
                <b><a href={ restaurant.url } target="_blank">{ restaurant.name }</a></b>
                <div>
                    {restaurant.blurb}
                </div>
                </Popup>
        </Marker>;
      });
  return (

    <MapContainer center={[30.265175, -97.743821]} zoom={10} scrollWheelZoom={false}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {markers}
      {/* <Marker position={[30.3041725, -97.7267211]}>
        <Popup>
        <b><a href='https://hpbng.com/'>Hyde Park Bar and Grill</a></b>
        </Popup>
      </Marker> */}
    </MapContainer>
  );
}