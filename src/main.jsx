/*
 * Copyright (c) Flowmap.gl contributors
 * SPDX-License-Identifier: MIT
 */

import { Deck } from "@deck.gl/core";
import { getViewStateForLocations } from "@flowmap.gl/data";
import { FlowmapLayer } from "@flowmap.gl/layers";
import { effect, signal } from "@preact/signals";
import { csv } from "d3-fetch";
import { render } from "preact";

const DATA_PATH = `https://gist.githubusercontent.com/ilyabo/68d3dba61d86164b940ffe60e9d36931/raw/a72938b5d51b6df9fa7bba9aa1fb7df00cd0f06a`;

const animationEnabledSignal = signal(false);

const init = async () => {
  const [locations, flows] = await Promise.all([
    csv(`${DATA_PATH}/locations.csv`, (row) => ({
      id: row.id,
      name: row.name,
      lat: Number(row.lat),
      lon: Number(row.lon),
    })),
    csv(`${DATA_PATH}/flows.csv`, (row) => ({
      origin: row.origin,
      dest: row.dest,
      count: Number(row.count),
    })),
  ]);

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
