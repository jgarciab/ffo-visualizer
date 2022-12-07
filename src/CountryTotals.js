import { useD3 } from './hooks/useD3';
import React from 'react';
import BarChart from './charts/BarChart';
import { humanFormatNumber } from './Util';

function CountryTotals({data}) {
  const totals = data.totals.slice(0, 20); // fix at top 20 values
  const width = totals.length * 28 + 100;

  const ref = useD3(
    (svg) => {

      // Clean up
      svg.selectAll("*").remove();

      BarChart(svg, totals, {
        x: d => d.sourceName,
        y: d => d.weight_total,
        width: width,
        marginLeft: 40,
        color: 'steelblue',
        yFormatFunc: humanFormatNumber
      });
    },
  [data]);

  return (
    <svg
      ref={ref}
      style={{
        width: width,
        height: "420"
      }}
    >
    </svg>
  );
}

export default CountryTotals;
