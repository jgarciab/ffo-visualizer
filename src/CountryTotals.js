import { useD3 } from './hooks/useD3';
import React, { useContext } from 'react';
import AppContext from './AppContext';
import BarChart from './BarChart';

function CountryTotals() {
  const { data } = useContext(AppContext);
  const totals = data.totals.slice(0, 20); // fix at top 20 values
  const width = totals.length * 28 + 100;

  const ref = useD3(
    (svg) => {
      console.log("BARCHART", totals);

      // Clean up
      svg.selectAll("*").remove();

      BarChart(svg, totals, {
        x: d => d.sourceName,
        y: d => d.weight_total,
        width: width,
        marginLeft: 90,
        color: 'steelblue'
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
