import { useD3 } from './useD3';
import React from 'react';
import LineChart from './charts/LineChart';
import { humanFormatNumber } from './util';
import SVGMenu from './SVGMenu';

function TimeSeriesChart({data}) {
  const timeSeries = data.timeSeries;

  const refSVG = useD3(
    (svg) => {

      // Clean up
      svg.selectAll("*").remove();

      LineChart(svg, timeSeries, {
        x: d => d.year,
        y: d => d.weight,
        z: d => d.countryName,
        width: 480,
        marginLeft: 60,
        color: 'steelblue',
        yFormatFunc: humanFormatNumber
      });
    },
  [data]);

  return (
    <div style={{position: 'relative'}}>
      <svg
        ref={refSVG}
        style={{
          width: 520,
          height: 460
        }}
      >
      </svg>
      <SVGMenu refSVG={refSVG} />
    </div>
  );
}

export default TimeSeriesChart;
