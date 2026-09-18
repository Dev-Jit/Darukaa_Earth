import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { mapSiteColors } from "../theme.js";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN?.trim();
const DEFAULT_CENTER = [77.214, 28.619];
const DEFAULT_ZOOM = 10;

function siteToFeatureCollection(site) {
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        id: site.id,
        properties: { name: site.name },
        geometry: site.geometry,
      },
    ],
  };
}

function fitMapToSite(map, site) {
  if (!site?.geometry?.coordinates?.[0]?.length) {
    map.setCenter(DEFAULT_CENTER);
    map.setZoom(DEFAULT_ZOOM);
    return;
  }

  const bounds = new mapboxgl.LngLatBounds();
  site.geometry.coordinates[0].forEach((coordinate) => {
    bounds.extend(coordinate);
  });
  map.fitBounds(bounds, { padding: 40, maxZoom: 15 });
}

export default function SitePolygonMap({ site }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const siteRef = useRef(site);
  const [mapReady, setMapReady] = useState(false);

  siteRef.current = site;

  useEffect(() => {
    if (!MAPBOX_TOKEN || !mapContainerRef.current || mapRef.current) {
      return undefined;
    }

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/outdoors-v12",
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      interactive: true,
    });

    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    map.on("load", () => {
      map.addSource("site", {
        type: "geojson",
        data: siteToFeatureCollection(siteRef.current),
      });

      map.addLayer({
        id: "site-fill",
        type: "fill",
        source: "site",
        paint: {
          "fill-color": mapSiteColors.fill,
          "fill-opacity": mapSiteColors.fillOpacity,
        },
      });

      map.addLayer({
        id: "site-outline",
        type: "line",
        source: "site",
        paint: {
          "line-color": mapSiteColors.outline,
          "line-width": 2,
        },
      });

      fitMapToSite(map, siteRef.current);
      setMapReady(true);
    });

    mapRef.current = map;

    return () => {
      setMapReady(false);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map || !site) {
      return;
    }

    const source = map.getSource("site");
    if (source) {
      source.setData(siteToFeatureCollection(site));
      fitMapToSite(map, site);
    }
  }, [site, mapReady]);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-950">
        <p className="font-medium">Mapbox access token missing</p>
        <p className="mt-2 text-amber-900">
          Set <code className="rounded bg-amber-100 px-1">VITE_MAPBOX_TOKEN</code> in{" "}
          <code className="rounded bg-amber-100 px-1">frontend/.env</code> to preview the site
          boundary.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={mapContainerRef}
      className="surface h-56 w-full overflow-hidden sm:h-64"
      aria-label={`Map of site ${site?.name ?? "boundary"}`}
    />
  );
}
