import { useD3 } from './hooks/useD3';
import React, { useContext } from 'react';
import * as d3 from 'd3';
import * as d3_geo from 'd3-geo-projection';
import { visualizeLinks } from './LinkVis';
import AppContext from './AppContext';
import { getLocationMap } from './DataStore';

function GeoFlowVis({ countryMap }) {
  const { data } = useContext(AppContext);

  const ref = useD3(
    (svg) => {
      console.log("RENDERING", data);
      const projection = d3_geo.geoAitoff();
      const path = d3.geoPath(projection);

      // Render base map
      svg
        .select(".map")
        .datum(countryMap)
        .attr("fill", "#ed87c8")
        .attr("stroke", "white")
        .attr("stroke-width", 0.4)
        .attr("d", path);

      // Render links
      if (data.links.length > 0) {
        svg.selectAll(".link").remove();
        visualizeLinks(data.links, [], projection, svg, getLocationMap());
      }
    },
  [data]);

  return (
    <svg
      ref={ref}
      style={{
        width: "100%",
        height: "auto",
      }}
      viewBox={[0, 0, 960, 420]}
    >
      <path className="map" />
      <g className="links" />
    </svg>
  );
}

export default GeoFlowVis;
