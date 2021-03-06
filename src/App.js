import React, { useState, Fragment } from 'react';

import DeckGL from '@deck.gl/react';
import { GeoJsonLayer, SolidPolygonLayer } from '@deck.gl/layers';
import { _GlobeView as GlobeView } from '@deck.gl/core';
import { latlonlineGeoJson, figureGeoJson } from './utils'

const settings = {
  initialViewState: {
    longitude: 140.0,
    latitude: 40.0,
    zoom: 1.2,
  },
  mapLayer: {
    color: [64, 64, 64],
    url: 'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_50m_land.geojson'
  },
  backgroundLayer: {
    color: [32, 32, 32]
  },
  latlonLineLayer: {
    color: [127, 127, 127]
  },
  latlonGridLayer: {
    color: [127, 255, 127]
  },
  figureLayer: {
    color: [255, 127, 127]
  },
  highlight: {
    color: [255, 127, 127, 127]
  },
};

function App() {
  const [position, setPosition] = useState(null);

  return (
    <Fragment>

      <DeckGL
        initialViewState={settings.initialViewState}
        controller={true}
      >

        <SolidPolygonLayer id='background-layer'
          data={[[[-180, 90], [0, 90], [180, 90], [180, -90], [0, -90], [-180, -90]]]}
          getPolygon={d => d}
          filled={true}
          getFillColor={settings.backgroundLayer.color}

          pickable={true}
          onClick={(info, event) => setPosition({ lon: info.coordinate[0], lat: info.coordinate[1] })}
        />

        <GeoJsonLayer id="map-layer"
          data={settings.mapLayer.url}
          filled={true}
          getFillColor={settings.mapLayer.color}

          pickable={true}
          onClick={(info, event) => setPosition({ lon: info.coordinate[0], lat: info.coordinate[1] })}
        />

        <GeoJsonLayer id="latlon-line-layer"
          data={latlonlineGeoJson}
          stroked={true}
          getLineColor={settings.latlonLineLayer.color}
          lineWidthUnits={'pixels'}
          lineWidthScale={1}
          getLineWidth={1}

          pickable={true}
          highlightColor={settings.highlight.color}
          autoHighlight={true}
        />

        <GeoJsonLayer id="figure-layer"
          data={figureGeoJson(position)}
          stroked={true}
          getLineColor={settings.figureLayer.color}
          lineWidthUnits={'pixels'}
          lineWidthScale={1}
          getLineWidth={3}

          pickable={true}
          highlightColor={settings.highlight.color}
          autoHighlight={true}
        />

        <GlobeView id="map" width="100%" controller={true} resolution={1} />
      </DeckGL>
    </Fragment >
  );
}

export default App;
