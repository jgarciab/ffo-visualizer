import 'regenerator-runtime/runtime';
import "./styles.css";
import * as topojson from "topojson";
import * as d3 from "d3";
import * as d3_geo from "d3-geo-projection";
import * as dfd from "danfojs";
import { visualizeLinks } from "./linkvis";
import capitals from "/data/country-capitals.json";
import worldCountries from "/data/world_countries_neocarto.json";

document.getElementById("app").innerHTML = `
<div>
  <svg></svg>
</div>
`;

let projection, svg, locMap;

// const updateList = () => {
//   const dropdown = document.getElementById("source-country");
//   for (const capital of capitals) {
//     var option = document.createElement("option");
//     option.text = capital.CountryName;
//     option.value = capital.CountryCode;
//     dropdown.add(option);
//   }
// }

const initialize = () => {
//  updateList();

  loadMap();

  const fileSelector = document.getElementById('fileInput');
  fileSelector.addEventListener('change', (event) => {
    const fileList = event.target.files;
    console.log(fileList);
    if (fileList.length > 0) {
      loadData(fileList[0]);
    }
  });
}

const loadMap = () => {
  // Load map
  const countries = topojson.feature(
    worldCountries,
    worldCountries.objects.world_countries_data
  );

  // Generate location map from list of capitals
  locMap = capitals.reduce((acc, loc) => {
    acc[loc.CountryCode] = [loc.CapitalLongitude, loc.CapitalLatitude];
    return acc;
  }, {});
  // const locMap = data.locations.reduce((acc, loc) => {
  //   acc[loc.id] = [loc.long, loc.lat];
  //   return acc;
  // }, {});

  svg = d3
    .select("svg")
    .attr("viewBox", [0, 0, 960, 420])
    .style("width", "100%")
    .style("height", "auto");

  projection = d3_geo.geoAitoff();
  const path = d3.geoPath(projection);
  svg
    .append("path")
    .datum(countries)
    .attr("fill", "#ed87c8")
    .attr("stroke", "white")
    .attr("stroke-width", 0.4)
    .attr("d", path);

}

const loadData = async (file) => {
  svg.select(".link").selectAll("*").remove();

  // Load data
  const df = await dfd.readCSV(file);
  df["weight"].describe().print();
  const links = dfd.toJSON(df);

  //data.nodes.forEach((d, i) => !d.id && (d.id = `node-${i}`));
  links.forEach((d, i) => !d.id && (d.id = `link-${i}`));
  //data.nodes.forEach((d) => !d.weight && (d.weight = 1));
  links.forEach((d) => !d.weight && (d.weight = 1));
  //links.forEach((d) => (d.directed = "yes"));

  console.log(links);
  // links.forEach(
  //   (d) => (!locMap[d.source] || !locMap[d.target]) && console.log(d)
  // );

  visualizeLinks(links, [], projection, svg, locMap);
};

initialize();
