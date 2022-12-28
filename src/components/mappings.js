import * as d3 from "d3";
import * as d3_geo from "d3-geo-projection";

const humanFormatNumber = number => {
  if (number === 0) return '0';
  const s = ['', ' th', ' mln', ' bln', ' tln'];
  const e = Math.floor(Math.log(number) / Math.log(1000));
  const value = (number / Math.pow(1000, e)).toFixed(1);
  const exponent = e < s.length ? s[e] : `E${3*e}`;
  return `${value}${exponent}`;
}

const FlowMode = {
  Inflow: 'Inflow',
  Outflow: 'Outflow',
  Self: 'Self'
};

const SourceTargetOperator = {
  And: 'And',
  Or: 'Or'
};

const projection = () => {
  return d3_geo.geoAitoff();
}

const linkColor = (links) => {
  return d => ["#ff9100"];
};

const countryColor = (min, max) => {
  return min !== undefined ?
    d3.scaleSymlog(d3.interpolateBlues)
      .domain([0, min, max])
      .range(d3.schemeBlues[3]) :
    () => "#ccc";
}

export {
  humanFormatNumber,
  FlowMode,
  SourceTargetOperator,
  projection,
  linkColor,
  countryColor
};
