import { useD3 } from './hooks/useD3';
import React, { useContext } from 'react';
import AppContext from './AppContext';
import LineChart from './charts/LineChart';

function TimeSeriesChart() {
  const { data } = useContext(AppContext);
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
        color: 'steelblue'
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
