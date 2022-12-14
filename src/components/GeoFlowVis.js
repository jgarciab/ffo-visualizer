import React, { useState } from 'react';
import { useD3 } from './useD3';
import * as d3 from 'd3';
import * as d3_geo from 'd3-geo-projection';
import { visualizeLinks } from './LinkVis';
import { humanFormatNumber } from './util';
import SVGMenu from './SVGMenu';

function GeoFlowVis({ countryMap, filteredData, locationMapping, flowMode }) {
  const [tooltipData, setTooltipData] = useState(null);

  const showTooltip = (event, data) => {
    setTooltipData(event.type === 'mouseout' ? null : {
      ...data,
      top: event.clientY + 16,
      left: event.clientX + 16});
  }

  const refSVG = useD3(
    (svg) => {
      console.log("RENDERING", filteredData);
      const projection = d3_geo.geoAitoff();
      const path = d3.geoPath(projection);

      // Clean up
      svg.selectAll(".link").remove();
      svg.selectAll(".node").remove();

      // Render base map
      svg
        .select(".map")
        .selectAll(".country")
        .data(countryMap.features)
        .enter()
        .append("path")
        .attr("class", "country")
        .attr("d", path)
        .attr("fill", "#b5b1a7")
        .attr("stroke", "white")
        .attr("stroke-width", 0.4);
        // .on("mouseover", function() { d3.select(this).style("fill", "#488c48") })
        // .on("mouseout", function() { d3.select(this).style("fill", "#b5b1a7") });

      // Render links
      if (filteredData.links.length > 0) {
        visualizeLinks(filteredData, projection, svg, locationMapping, showTooltip, flowMode);
      }
    },
  [filteredData, flowMode]);

  return (
    <div>
      <div style={{position: 'relative'}}>
        <svg id="svg"
          ref={refSVG}
          style={{
            width: "100%",
            height: "100%",
          }}
          viewBox={[160, 0, 800, 420]}>
          <g className="map" />
        </svg>
        <SVGMenu refSVG={refSVG} />
      </div>
      <div className="tooltip" style={{
          top: tooltipData ? `${tooltipData.top}px` : 0,
          left: tooltipData ? `${tooltipData.left}px` : 0,
          visibility: tooltipData ? 'visible' : 'hidden'}}>
        Source: {tooltipData && tooltipData.sourceName}<br />
        Target: {tooltipData && tooltipData.targetName}<br />
        Weight: {tooltipData && humanFormatNumber(tooltipData.weight)}
      </div>
    </div>
  );
}

export default GeoFlowVis;
