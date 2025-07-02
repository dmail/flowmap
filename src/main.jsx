/*
 * Copyright (c) Flowmap.gl contributors
 * SPDX-License-Identifier: MIT
 */

import { Deck } from "@deck.gl/core";
import { getViewStateForLocations } from "@flowmap.gl/data";
import { FlowmapLayer } from "@flowmap.gl/layers";
import { csv } from "d3-fetch";
import { render } from "preact";

const DATA_PATH = `https://gist.githubusercontent.com/ilyabo/68d3dba61d86164b940ffe60e9d36931/raw/a72938b5d51b6df9fa7bba9aa1fb7df00cd0f06a`;

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

  const flowmapLayer = new FlowmapLayer({
    id: "my-flowmap-layer",
    data: { locations, flows },
    pickable: true,
    getLocationId: (loc) => loc.id,
    getLocationLat: (loc) => loc.lat,
    getLocationLon: (loc) => loc.lon,
    getFlowOriginId: (flow) => flow.origin,
    getFlowDestId: (flow) => flow.dest,
    getFlowMagnitude: (flow) => flow.count,
    getLocationName: (loc) => loc.name,
  });

  deck.setProps({
    layers: [flowmapLayer],
  });

  render(<UI />, document.querySelector("#ui"));
};

const UI = () => {
  return "hello world";
};

await init();
