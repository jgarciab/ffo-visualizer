import { useD3 } from './useD3';
import React from 'react';
import LineChart from './charts/LineChart';
import { humanFormatNumber } from './util';

function TimeSeriesChart({data}) {
  const timeSeries = data.timeSeries;

  const ref = useD3(
    (svg) => {

      // Clean up
      svg.selectAll("*").remove();

      LineChart(svg, timeSeries, {
        x: d => d.year,
        y: d => d.weight_total,
        z: d => d.sourceName,
        width: 480,
        marginLeft: 60,
        color: 'steelblue',
        yFormatFunc: humanFormatNumber
      });
    },
  [data]);

  return (
    <svg
      ref={ref}
      style={{
        width: 520,
        height: 460
      }}
    >
    </svg>
  );
}

export default TimeSeriesChart;
