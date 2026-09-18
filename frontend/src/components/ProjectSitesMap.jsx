import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import mapboxgl from "mapbox-gl";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import NewSiteDrawForm from "./NewSiteDrawForm.jsx";
import { mapSiteColors } from "../theme.js";
import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN?.trim();
const DEFAULT_CENTER = [77.214, 28.619];
const DEFAULT_ZOOM = 10;

function sitesToFeatureCollection(sites) {
  return {
    type: "FeatureCollection",
    features: sites.map((site) => ({
      type: "Feature",
      id: site.id,
      properties: {
        siteId: site.id,
        name: site.name,
      },
      geometry: site.geometry,
    })),
  };
}

function fitMapToSites(map, sites) {
  if (!sites.length) {
    map.setCenter(DEFAULT_CENTER);
    map.setZoom(DEFAULT_ZOOM);
    return;
  }

  const bounds = new mapboxgl.LngLatBounds();
  sites.forEach((site) => {
    site.geometry.coordinates[0].forEach((coordinate) => {
      bounds.extend(coordinate);
    });
  });
  map.fitBounds(bounds, { padding: 48, maxZoom: 14 });
}

export default function ProjectSitesMap({ projectId, sites, onSiteCreated }) {
  const navigate = useNavigate();
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const drawRef = useRef(null);
  const sitesRef = useRef(sites);
  const drawModeRef = useRef(false);
  const pendingGeometryRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const [drawMode, setDrawMode] = useState(false);
  const [pendingGeometry, setPendingGeometry] = useState(null);
  const [pendingFeatureId, setPendingFeatureId] = useState(null);

  sitesRef.current = sites;
  drawModeRef.current = drawMode;
  pendingGeometryRef.current = pendingGeometry;

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
    });

    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: {},
      defaultMode: "simple_select",
    });

    map.addControl(draw, "top-right");
    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    map.on("load", () => {
      map.addSource("sites", {
        type: "geojson",
        data: sitesToFeatureCollection(sitesRef.current),
      });

      map.addLayer({
        id: "sites-fill",
        type: "fill",
        source: "sites",
        paint: {
          "fill-color": mapSiteColors.fill,
          "fill-opacity": mapSiteColors.fillOpacity,
        },
      });

      map.addLayer({
        id: "sites-outline",
        type: "line",
        source: "sites",
        paint: {
          "line-color": mapSiteColors.outline,
          "line-width": 2,
        },
      });

      fitMapToSites(map, sitesRef.current);
      setMapReady(true);
    });

    map.on("mouseenter", "sites-fill", () => {
      if (!drawModeRef.current && !pendingGeometryRef.current) {
        map.getCanvas().style.cursor = "pointer";
      }
    });

    map.on("mouseleave", "sites-fill", () => {
      map.getCanvas().style.cursor = "";
    });

    map.on("click", "sites-fill", (event) => {
      if (drawModeRef.current || pendingGeometryRef.current) {
        return;
      }
      const siteId = event.features?.[0]?.properties?.siteId;
      if (siteId) {
        navigate(`/sites/${siteId}`);
      }
    });

    map.on("draw.create", (event) => {
      const feature = event.features[0];
      setPendingFeatureId(feature.id);
      setPendingGeometry(feature.geometry);
      setDrawMode(false);
      draw.changeMode("simple_select");
    });

    mapRef.current = map;
    drawRef.current = draw;

    return () => {
      setMapReady(false);
      map.remove();
      mapRef.current = null;
      drawRef.current = null;
    };
  }, [navigate]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) {
      return;
    }

    const source = map.getSource("sites");
    if (source) {
      source.setData(sitesToFeatureCollection(sites));
      fitMapToSites(map, sites);
    }
  }, [sites, mapReady]);

  useEffect(() => {
    const draw = drawRef.current;
    if (!draw) {
      return;
    }

    if (drawMode) {
      draw.changeMode("draw_polygon");
    } else if (!pendingGeometry) {
      draw.changeMode("simple_select");
    }
  }, [drawMode, pendingGeometry]);

  function clearPendingDrawing() {
    const draw = drawRef.current;
    if (draw && pendingFeatureId) {
      draw.delete(pendingFeatureId);
    }
    setPendingFeatureId(null);
    setPendingGeometry(null);
    setDrawMode(false);
  }

  function handleSiteCreated() {
    clearPendingDrawing();
    onSiteCreated();
  }

  function handleDrawToggle() {
    if (drawMode) {
      const draw = drawRef.current;
      if (draw) {
        draw.deleteAll();
        draw.changeMode("simple_select");
      }
      setDrawMode(false);
      return;
    }
    clearPendingDrawing();
    setDrawMode(true);
  }

  if (!MAPBOX_TOKEN) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-950">
        <p className="font-medium">Mapbox access token missing</p>
        <p className="mt-2 text-amber-900">
          Set <code className="rounded bg-amber-100 px-1">VITE_MAPBOX_TOKEN</code> in{" "}
          <code className="rounded bg-amber-100 px-1">frontend/.env</code>, then restart{" "}
          <code className="rounded bg-amber-100 px-1">npm run dev</code>.
        </p>
        <p className="mt-2 text-xs text-amber-800">
          Create a token at{" "}
          <a
            href="https://account.mapbox.com/access-tokens/"
            target="_blank"
            rel="noreferrer"
            className="font-medium underline hover:no-underline"
          >
            mapbox.com/access-tokens
          </a>{" "}
          (public token is fine for client-side maps).
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-bark">
          {sites.length === 0
            ? "No sites yet — draw a boundary to add the first one."
            : `${sites.length} site${sites.length === 1 ? "" : "s"} on map. Click a polygon to open its detail page.`}
        </p>
        <button
          type="button"
          onClick={handleDrawToggle}
          disabled={Boolean(pendingGeometry)}
          className={
            drawMode ? "btn-secondary disabled:opacity-60" : "btn-primary disabled:opacity-60"
          }
        >
          {drawMode ? "Cancel drawing" : "Draw new site"}
        </button>
      </div>

      <div
        ref={mapContainerRef}
        className="surface h-[min(70vh,560px)] w-full overflow-hidden"
        aria-label="Project sites map"
      />

      {drawMode && (
        <p className="caption pointer-events-none absolute left-4 top-16 z-10 rounded-[var(--radius-ui)] bg-surface/95 px-3 py-2 shadow-sm">
          Click on the map to place polygon vertices. Double-click the last point to finish.
        </p>
      )}

      {pendingGeometry && (
        <NewSiteDrawForm
          projectId={projectId}
          geometry={pendingGeometry}
          onCancel={clearPendingDrawing}
          onCreated={handleSiteCreated}
        />
      )}
    </div>
  );
}
