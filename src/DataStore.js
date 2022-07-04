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

  // Remove rows with missing values
  df.dropNa({ axis: 1, inplace: true });

  // Some validation
  // Check if there is data
  if (df.shape[0] <= 1 && df.shape[1] <= 1) {
    throw new Error("No data found in file");
  }
  // Check if the required columns are present
  if (!['source', 'target', 'weight'].reduce((found, column) => found && df.columns.includes(column), true)) {
    throw new Error("One or more required columns ('source', 'target', 'weight') not found");
  }

  // Determine categories
  data.categories = [];
  for (const column of df.columns) {
    if (!['source', 'target', 'weight'].includes(column)) {
      data.categories.push({
        name: column,
        values: df[column].unique().values.sort().map(val => val.toString())
      });
    }
  }

  // Merge duplicates (and sum weights)
  // TODO: this only applies if the data is not so well structured,
  // (e.g. user didn't include a column & didn't aggregate) maybe give a warning instead?
  const columns = df.columns.filter(item => item !== 'weight');
  df = df.groupby(columns).col(['weight']).sum();
  df.rename({ 'weight_sum': 'weight' }, { inplace: true });

  // Sort by weight of connections
  df = df.sortValues('weight', { ascending: false });
  df.resetIndex({ inplace: true });

  // Look up and add full location names to data points
  const locationNames = getLocationNames();
  const sourceNames = df['source'].apply(v => locationNames[v], { axis: 1 });
  const targetNames = df['target'].apply(v => locationNames[v], { axis: 1 });
  df.addColumn('sourceName', sourceNames, { inplace: true });
  df.addColumn('targetName', targetNames, { inplace: true });

  //TODO: we really don't want to hard-code scaling
  const scaledWeight = df['weight'].apply(v => v / 1000000000, { axis: 1 });
  df.addColumn('scaled_weight', scaledWeight, { inplace: true });
  const weightColumn = 'scaled_weight';

  // Split links to self and links to other countries
  let dfLinkToSelf = df.query(df['source'].eq(df['target']));
  if (dfLinkToSelf.shape[0] > 0) {
    dfLinkToSelf.resetIndex({ inplace: true });
  }
  let dfLinkToOther = df.query(df['source'].ne(df['target']));
  if (dfLinkToOther.shape[0] > 0) {
    dfLinkToOther.resetIndex({ inplace: true });
  }
  console.log(df.shape, dfLinkToSelf.shape, dfLinkToOther.shape);

  // Min/max weights
  data.minWeight = dfLinkToOther[weightColumn].min();
  data.maxWeight = dfLinkToOther[weightColumn].max();
  console.log(data.minWeight, data.maxWeight);
  console.log(dfLinkToOther.query(dfLinkToOther[weightColumn].lt(1000)));

  // Calculate country totals
  let dfTotals = df.groupby(['source', 'sourceName']).col([weightColumn]).sum();
  dfTotals.rename({ [`${weightColumn}_sum`]: 'weight_total' }, { inplace: true });

  if (dfLinkToSelf.shape[0] > 0) {
    const dfTotalsSelf = dfLinkToSelf.groupby(['source', 'sourceName']).col([weightColumn]).sum();
    dfTotalsSelf.rename({ [`${weightColumn}_sum`]: 'weight_self' }, { inplace: true });
    dfTotals = dfd.merge({ left: dfTotals, right: dfTotalsSelf, on: ['source', 'sourceName'], how: 'outer' });
  }
  if (dfLinkToOther.shape[0] > 0) {
    const dfTotalsOther = dfLinkToOther.groupby(['source', 'sourceName']).col([weightColumn]).sum();
    dfTotalsOther.rename({ [`${weightColumn}_sum`]: 'weight_other' }, { inplace: true });
    dfTotals = dfd.merge({ left: dfTotals, right: dfTotalsOther, on: ['source', 'sourceName'], how: 'outer' });
  }

  dfTotals.sortValues('weight_total', { ascending: false, inplace: true });
  data.totals = dfd.toJSON(dfTotals);
  console.log(data.totals);

  // Group and aggregate by source-&-target
  // df = df.groupby(['source', 'target']).col([weightColumn]).sum();
  // df.rename({ 'weight_sum': weightColumn }, { inplace: true });

  // Links
  const links = dfd.toJSON(dfLinkToOther);

  // Some additional processing
  //data.nodes.forEach((d, i) => !d.id && (d.id = `node-${i}`));
  links.forEach((d, i) => !d.id && (d.id = `link-${i}`));
  //data.nodes.forEach((d) => !d.weight && (d.weight = 1));
  //links.forEach((d) => !d.weight && (d.weight = 1));
  links.forEach(d => d['weight'] = d[weightColumn]);
  links.forEach((d) => { if (d.source !== d.target) d.directed = "yes"; });

  data.links = links;
  return data;
};

export { createEmptyData, loadData, getCountryMap, getLocationMap, getLocationNames };
