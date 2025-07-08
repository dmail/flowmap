/*
 * Copyright (c) Flowmap.gl contributors
 * SPDX-License-Identifier: MIT
 */

import { Deck } from "@deck.gl/core";
import { getViewStateForLocations } from "@flowmap.gl/data";
import { FlowmapLayer } from "@flowmap.gl/layers";
import { effect, signal } from "@preact/signals";
import { render } from "preact";
import flowCsv from "./flow.csv?raw";
import locationCsv from "./location.csv?raw";

const animationEnabledSignal = signal(false);

const init = async () => {
  const locations = locationCsv
    .split("\n")
    .slice(1)
    .map((line) => {
      const [id, name, lat, lon] = line.split(",");
      return {
        id,
        name,
        lat: Number(lat),
        lon: Number(lon),
      };
    });
  const flows = flowCsv
    .split("\n")
    .slice(1)
    .map((line) => {
      const [origin, dest, count] = line.split(",");
      return {
        origin,
        dest,
        count: Number(count),
      };
    });

  const [width, height] = [globalThis.innerWidth, globalThis.innerHeight];
  const initialViewState = getViewStateForLocations(
    locations,
    (loc) => [loc.lon, loc.lat],
    [width, height],
    { pad: 0.3 },
  );

  const canvas = document.querySelector("#deck-canvas");
  const deck = new Deck({
    canvas,
    width: "100%",
    height: "100%",
    initialViewState,
    layers: [],
  });

  const createFlowmapLayer = (animationEnabled = false) =>
    new FlowmapLayer({
      id: "my-flowmap-layer",
      data: { locations, flows },
      pickable: true,
      animationEnabled,
      getLocationId: (loc) => loc.id,
      getLocationLat: (loc) => loc.lat,
      getLocationLon: (loc) => loc.lon,
      getFlowOriginId: (flow) => flow.origin,
      getFlowDestId: (flow) => flow.dest,
      getFlowMagnitude: (flow) => flow.count,
      getLocationName: (loc) => loc.name,
    });

  // Initialize with the first layer
  deck.setProps({
    layers: [createFlowmapLayer(animationEnabledSignal.value)],
  });

  effect(() => {
    const animationEnabled = animationEnabledSignal.value;
    // Create a new layer instance with updated props
    const updatedLayer = createFlowmapLayer(animationEnabled);
    deck.setProps({
      layers: [updatedLayer],
    });
  });

  render(<UI />, document.querySelector("#ui"));
};

const UI = () => {
  // https://github.com/visgl/flowmap.gl/blob/main/examples/react-app/src/App.tsx
  return (
    <div style="background: white;">
      <label>
        Animations:
        <input
          type="checkbox"
          onChange={(e) => {
            animationEnabledSignal.value = e.target.checked;
          }}
          checked={animationEnabledSignal.value}
        />
      </label>
    </div>
  );
};

await init();
