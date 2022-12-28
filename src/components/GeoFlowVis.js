import React, { useRef, useState } from 'react';
import { useD3 } from './useD3';
import { visualizeGeoFlow } from './LinkVis';
import { humanFormatNumber } from './mappings';
import SVGMenu from './SVGMenu';

function GeoFlowVis({ filteredData, countryMap, locationMapping, flowMode, 
      selectAsSource, selectAsTarget }) {
  const [tooltipData, setTooltipData] = useState(null);
  const refContextMenu = useRef();
  const [contextData, setContextData] = useState(null);

  const showTooltip = (event, data) => {
    setTooltipData(event.type === 'mouseout' ? null : {
      ...data,
      top: event.pageY + 16,
      left: event.pageX + 16});
  }

  const showContextMenu = (event, countryCode) => {
    setContextData({left: event.pageX, top: event.pageY, countryCode });
  }

  const refSVG = useD3(
    (svg) => {
      visualizeGeoFlow(svg, filteredData, countryMap, locationMapping, flowMode, showTooltip, showContextMenu);
    },
  [filteredData, flowMode]);

  return (
    <div>
      <div style={{position: 'relative'}}>
        {/* Map */}
        <svg id="svg"
          ref={refSVG}
          style={{
            width: "100%",
            height: "100%",
          }}
          viewBox={[160, 0, 800, 420]}>
          <g className="map" />
        </svg>
        {/* SVG menu button (for export) */}
        <SVGMenu refSVG={refSVG} />
      </div>

      {/* Tooltip */}
      <div className="tooltip" style={{
          top: tooltipData ? `${tooltipData.top}px` : 0,
          left: tooltipData ? `${tooltipData.left}px` : 0,
          visibility: tooltipData ? 'visible' : 'hidden'}}>
        Source: {tooltipData && (tooltipData.sourceName || tooltipData.countryName) }<br />
        Target: {tooltipData && (tooltipData.targetName || tooltipData.countryName) }<br />
        {tooltipData && !isNaN(tooltipData.weight) && (<span>Weight: {humanFormatNumber(tooltipData.weight)}</span>)}
        {tooltipData && !isNaN(tooltipData.weight_in) && (<span>Weight IN: {humanFormatNumber(tooltipData.weight_in)}</span>)}
        <br />
        {tooltipData && !isNaN(tooltipData.weight_out) && (<span>Weight OUT: {humanFormatNumber(tooltipData.weight_out)}</span>)}
      </div>

      {/* Context menu (select as source/target) */}
      { contextData &&
        (<div ref={refContextMenu} style={{position: 'absolute', left: contextData.left, top: contextData.top}}>
          <ul tabIndex={0} className="menu p-2 shadow bg-base-100 rounded-box w-52">
            <li><button onClick={() => { selectAsSource(contextData.countryCode); setContextData(null); }}>Select as source</button></li>
            <li><button onClick={() => { selectAsTarget(contextData.countryCode); setContextData(null); }}>Select as target</button></li>
          </ul>
        </div>)}
    </div>
  );
}

export default GeoFlowVis;
