import * as topojson from 'topojson';
import * as dfd from 'danfojs';
import capitals from './data/country-capitals.json';
import worldCountries from './data/world_countries_neocarto.json';


// const updateList = () => {
//   const dropdown = document.getElementById("source-country");
//   for (const capital of capitals) {
//     var option = document.createElement("option");
//     option.text = capital.CountryName;
//     option.value = capital.CountryCode;
//     dropdown.add(option);
//   }
// }

const getCountryMap = () => {
  return topojson.feature(
    worldCountries,
    worldCountries.objects.world_countries_data
  );
}

const getLocationMap = () => {
  // Generate location map from list of capitals
  return capitals.reduce((acc, loc) => {
    acc[loc.CountryCode] = [loc.CapitalLongitude, loc.CapitalLatitude];
    return acc;
  }, {});
}

const getLocationNames = () => {
  return capitals.reduce((acc, loc) => {
    acc[loc.CountryCode] = loc.CountryName;
    return acc;
  }, {});
}

const loadData = async (file) => {
  const data = {};

  // Load data
  const df = await dfd.readCSV(file);
  df["weight"].describe().print();
  
  // Determine categories
  data.categories = [];
  console.log(df.columns);
  for (const column of df.columns) {
    if (!['source', 'target', 'weight'].includes(column)) {
      data.categories.push({
        name: column,
        values: df[column].unique().sortValues().values.map(val => val.toString())
      });
    }
  }

  // Links
  const links = dfd.toJSON(df);

  //data.nodes.forEach((d, i) => !d.id && (d.id = `node-${i}`));
  links.forEach((d, i) => !d.id && (d.id = `link-${i}`));
  //data.nodes.forEach((d) => !d.weight && (d.weight = 1));
  links.forEach((d) => !d.weight && (d.weight = 1));
  //links.forEach((d) => (d.directed = "yes"));

  data.links = links;
  //console.log(links);
  // links.forEach(
  //   (d) => (!locMap[d.source] || !locMap[d.target]) && console.log(d)
  // );

  return data;
};

export { loadData, getCountryMap, getLocationMap, getLocationNames };
