import * as topojson from 'topojson';
import * as dfd from 'danfojs';
import capitals from './data/country-capitals.json';
import worldCountries from './data/world_countries_neocarto.json';


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

const createEmptyData = () => { return { links: [], totals: [], categories: [] }};

const loadData = async (file) => {
  const data = {};

  // Load data
  let df = await dfd.readCSV(file);
  df.dropNa({ axis: 1, inplace: true }); // remove rows with missing values

  // Some validation
  // Check if there is data
  if (df.shape[0] <= 1 && df.shape[1] <= 1) {
    throw new Error("No data found in file");
  }
  // Check if the required columns are present
  if (!['source', 'target', 'weight'].reduce((found, column) => found && df.columns.includes(column), true)) {
    throw new Error("One or more required columns ('source', 'target', 'weight') not found");
  }

  // Merge duplicates (and sum weights)
  // TODO: this only applies if the data is not so well structured,
  // (e.g. user didn't include a column & didn't aggregate) maybe give a warning instead?
  const columns = df.columns.filter(item => item !== 'weight');
  df = df.groupby(columns).col(['weight']).sum();
  df.rename({ 'weight_sum': 'weight' }, { inplace: true });

  // Sort by weight of connections
  let dfSorted = df.sortValues('weight', { ascending: false });
  dfSorted = dfSorted.query(dfSorted['source'].ne(dfSorted['target']));
  df = dfSorted;

  // Min/max weights
  data.minWeight = dfSorted['weight'].min();
  data.maxWeight = dfSorted['weight'].max();
  
  // Calculate country totals
  const dfTotals = df.groupby(['source']).col(['weight']).sum()
  dfTotals.rename({ 'weight_sum': 'weight' }, { inplace: true });
  dfTotals.sortValues('weight', { ascending: false, inplace: true });
  data.totals = dfd.toJSON(dfTotals);

  // Group and aggregate by source-&-target
  // df = df.groupby(['source', 'target']).col(['weight']).sum();
  // df.rename({ 'weight_sum': 'weight' }, { inplace: true });

  // Determine categories
  data.categories = [];
  for (const column of df.columns) {
    if (!['source', 'target', 'weight'].includes(column)) {
      data.categories.push({
        name: column,
        values: df[column].unique().sortValues().values.map(val => val.toString())
      });
    }
  }

  // Links
  const links = dfd.toJSON(dfSorted);

  //data.nodes.forEach((d, i) => !d.id && (d.id = `node-${i}`));
  links.forEach((d, i) => !d.id && (d.id = `link-${i}`));
  //data.nodes.forEach((d) => !d.weight && (d.weight = 1));
  links.forEach((d) => !d.weight && (d.weight = 1));
  links.forEach((d) => { if (d.source !== d.target) d.directed = "yes"; });

  data.links = links;
  //console.log(links);
  // links.forEach(
  //   (d) => (!locMap[d.source] || !locMap[d.target]) && console.log(d)
  // );

  return data;
};

export { createEmptyData, loadData, getCountryMap, getLocationMap, getLocationNames };
