import { useD3 } from './useD3';
import React from 'react';
import BarChart from './charts/BarChart';
import { humanFormatNumber } from './util';
import SVGMenu from './SVGMenu';

function CountryTotals({data}) {
  const totals = data.totals.slice(0, 12); // fix at top 12 values
  const width = totals.length * 28 + 160;

  const refSVG = useD3(
    (svg) => {

      // Clean up
      svg.selectAll("*").remove();

      BarChart(svg, totals, {
        x: d => d.countryName,
        y: d => d.weight,
        width: width,
        marginLeft: 60,
        marginRight: 60,
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
        width: width,
        height: 460,
        paddingRight: 38
      }}
      >
      </svg>
      <SVGMenu refSVG={refSVG}/>
    </div>
  );
}

export default CountryTotals;
