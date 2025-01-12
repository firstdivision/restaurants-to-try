// Map.tsx
import React from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";

import restaurants from './data/restaurants.json'

export default function Map() {
    let markers = restaurants.map(function(restaurant) {
        return <Marker position={[restaurant.Lat, restaurant.Lon]}>
                <Popup>
                <b><a href={ restaurant.URL } target="_blank">{ restaurant.Name }</a></b>
                <div>
                    {restaurant.Blurb}
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