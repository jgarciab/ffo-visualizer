import { useD3 } from './useD3';
import React from 'react';
import BarChart from './charts/BarChart';
import { FlowMode, humanFormatNumber } from './mappings';
import SVGMenu from './SVGMenu';

function CountryTotals({data, flowMode}) {
  const totals = data.totals.slice(0, 12); // fix at top 12 values
  const width = totals.length * 28 + 160;

  const refSVG = useD3(
    (svg) => {

      // Clean up
      svg.selectAll("*").remove();

      BarChart(svg, totals, {
        x: d => d.countryName,
        y: d => flowMode === FlowMode.Inflow ? d.weight_in : d.weight_out,
        width: width,
        marginLeft: 60,
        marginRight: 60,
        color: 'steelblue',
        yFormatFunc: humanFormatNumber
      });
    },
  [data, flowMode]);

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
