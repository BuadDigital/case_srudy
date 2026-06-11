"use client";

import { useEffect, useRef, useState } from "react";
import {
  googleMapsApiKey,
  googleMapsSearchUrl,
  loadGoogleMapsApi,
  parseCoord,
} from "../lib/google-maps-loader";
import { JEDDAH_DEFAULT_CENTER } from "../lib/jeddah-default-coords";

const DEFAULT_CENTER = JEDDAH_DEFAULT_CENTER;
const DEFAULT_ZOOM = 6;
const PIN_ZOOM = 17;

type EngineeringSurveyMapProps = {
  latitude: string;
  longitude: string;
  disabled?: boolean;
  onCoordsChange: (lat: string, lng: string) => void;
};

export function EngineeringSurveyMap({
  latitude,
  longitude,
  disabled,
  onCoordsChange,
}: EngineeringSurveyMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const lat = parseCoord(latitude);
  const lng = parseCoord(longitude);
  const hasPin = lat !== null && lng !== null;

  useEffect(() => {
    if (!googleMapsApiKey()) {
      setMapError("أضف NEXT_PUBLIC_GOOGLE_MAPS_API_KEY لتفعيل خريطة Google.");
      return;
    }

    let cancelled = false;

    loadGoogleMapsApi()
      .then((google) => {
        if (cancelled || !containerRef.current) return;

        const center = hasPin ? { lat: lat!, lng: lng! } : DEFAULT_CENTER;
        const zoom = hasPin ? PIN_ZOOM : DEFAULT_ZOOM;

        const map = new google.maps.Map(containerRef.current, {
          center,
          zoom,
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: true,
          gestureHandling: disabled ? "none" : "greedy",
        });

        mapRef.current = map;

        const marker = new google.maps.Marker({
          map: hasPin ? map : undefined,
          position: hasPin ? center : undefined,
          draggable: !disabled,
        });
        markerRef.current = marker;

        if (!disabled) {
          map.addListener("click", (event: google.maps.MapMouseEvent) => {
            const pos = event.latLng;
            if (!pos) return;
            marker.setMap(map);
            marker.setPosition(pos);
            map.panTo(pos);
            if (map.getZoom()! < PIN_ZOOM) map.setZoom(PIN_ZOOM);
            onCoordsChange(pos.lat().toFixed(6), pos.lng().toFixed(6));
          });

          marker.addListener("dragend", () => {
            const pos = marker.getPosition();
            if (!pos) return;
            onCoordsChange(pos.lat().toFixed(6), pos.lng().toFixed(6));
          });
        }

        setMapReady(true);
        setMapError(null);
      })
      .catch(() => {
        if (!cancelled) {
          setMapError("تعذر تحميل خريطة Google — تحقق من مفتاح API والاتصال.");
        }
      });

    return () => {
      cancelled = true;
      markerRef.current?.setMap(null);
      markerRef.current = null;
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled]);

  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!mapReady || !map || !marker) return;

    if (!hasPin) {
      marker.setMap(null);
      return;
    }

    const position = { lat: lat!, lng: lng! };
    marker.setMap(map);
    marker.setPosition(position);
    map.panTo(position);
    if (map.getZoom()! < PIN_ZOOM) map.setZoom(PIN_ZOOM);
  }, [mapReady, hasPin, lat, lng]);

  if (mapError) {
    return (
      <div className="eng-office-map-placeholder">
        <p>{mapError}</p>
        {hasPin ? (
          <a
            href={googleMapsSearchUrl(lat!, lng!)}
            target="_blank"
            rel="noopener noreferrer"
            className="eng-office-map-link"
          >
            فتح الموقع في Google Maps ({latitude}, {longitude})
          </a>
        ) : (
          <span>أدخل الإحداثيات أو استخدم «موقعي الحالي»</span>
        )}
      </div>
    );
  }

  return (
    <div className="eng-office-map-frame">
      <div ref={containerRef} className="eng-office-map-canvas" aria-label="خريطة Google" />
      {!mapReady ? (
        <div className="eng-office-map-loading">جاري تحميل الخريطة…</div>
      ) : null}
      {!hasPin && mapReady ? (
        <p className="eng-office-map-hint">
          اضغط على الخريطة لتحديد موقع العقار، أو أدخل الإحداثيات يدوياً.
        </p>
      ) : null}
    </div>
  );
}
