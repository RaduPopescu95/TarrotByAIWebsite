import React from "react";
import { GoogleMap, LoadScript, Marker, Circle } from "@react-google-maps/api";

const MapContainer = () => {
  // Cheia de API Google Maps
  const apiKey = "AIzaSyDSc0AqLLaFhhnI2p9p3EDOlrJG6jPTZxU";

  const mapContainerStyles = {
    height: "40vh", // 40% din înălțimea vizibilă a browser-ului
    width: "100%", // 100% din lățimea vizibilă a browser-ului
  };

  const defaultCenter = {
    lat: 44.9215353170728, // Latitudinea adresei tale
    lng: 25.454169796552627, // Longitudinea adresei tale
  };

  // Adresa pentru marker
  const markerAddress = {
    lat: 25.454169796552627, // Latitudinea adresei tale
    lng: 25.454169796552627, // Longitudinea adresei tale
  };

  return (
    <div style={mapContainerStyles}>
      <LoadScript googleMapsApiKey={apiKey}>
        <GoogleMap
          mapContainerStyle={mapContainerStyles}
          center={defaultCenter}
          zoom={15}
        >
          {/* Adaugă markerul pentru adresa specificată */}
          <Marker
            position={markerAddress}
            icon={
              "https://developers.google.com/maps/documentation/javascript/examples/full/images/beachflag.png"
            }
          />
        </GoogleMap>
      </LoadScript>
    </div>
  );
};

export default MapContainer;
