import * as dfd from 'danfojs';
import { makeAutoObservable, runInAction } from 'mobx';
import { getLocationNames } from './GeoData';

/** This class contains the data model and is a mobx Observable.
 */
export default class DataModel {

  allLocations = getLocationNames();

  dfAllData = null;
  dfLinkToSelf = null;
  dfLinkToOther = null;
  dfFiltered = null;

  categories = [];
  minWeight = 0;
  maxWeight = 0;

  selectedSources = [];
  selectedTargets = [];
  selectedCategories = {};


  constructor() {
    makeAutoObservable(this);
  }

  weightColumn = 'weight';

  /**
   * Loads a CSV, does some basic processing and stores results in dataframes.
   */
  async loadData(file) {
  
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
  
    // Determine categories (all columns beside the standard ones will be categories)
    let categories = [];
    for (const column of df.columns) {
      if (!['source', 'target', 'weight'].includes(column)) {
        categories.push({
          name: column,
          values: df[column].unique().values.sort().map(val => val.toString())
        });
      }
    }
    
    // Look up and add full location names to data points
    const locationNames = getLocationNames();
    const sourceNames = df['source'].apply(v => locationNames[v], { axis: 1 });
    const targetNames = df['target'].apply(v => locationNames[v], { axis: 1 });
    df.addColumn('sourceName', sourceNames, { inplace: true });
    df.addColumn('targetName', targetNames, { inplace: true });

    // Merge duplicates (and sum weights)
    // TODO: this only applies if the data is not so well structured,
    // (e.g. user didn't include a column & didn't aggregate) maybe give a warning instead?
    const columns = df.columns.filter(item => item !== 'weight');
    df = df.groupby(columns).col(['weight']).sum();
    df.rename({ 'weight_sum': 'weight' }, { inplace: true });

    // Sort by weight of connections
    df = df.sortValues('weight', { ascending: false });
    df.resetIndex({ inplace: true });

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
  
    // Update model properties (needs runInAction because async)
    runInAction(() => {
      this.categories = categories;

      // Min/max weights
      this.minWeight = dfLinkToOther[this.weightColumn].min();
      this.maxWeight = dfLinkToOther[this.weightColumn].max();
      console.log(this.minWeight, this.maxWeight);
      //console.log(dfLinkToOther.query(dfLinkToOther[this.weightColumn].lt(1000)));

      this.dfAllData = df;
      this.dfLinkToSelf = dfLinkToSelf;
      this.dfLinkToOther = dfLinkToOther;
    });
  };

  
  get filteredData() {
    let df = this.dfLinkToOther;
    if (df === null) {
      return null;
    }

    const sourceSelected = df['source'].map(source => this.selectedSources.includes(source));
    const targetSelected = df['target'].map(target => this.selectedTargets.includes(target));
    let rowSelected = sourceSelected.and(targetSelected);

    // Filter for categories
    Object.keys(this.selectedCategories).forEach(key => {
      const categorySelected = df[key].map(value => this.selectedCategories[key].includes(value.toString()));
      rowSelected = rowSelected.and(categorySelected);
    });
    //TODO: result.linkCountAfterCategories = result.links.length;

    rowSelected = rowSelected.map(selected => selected ? 1 : 0); // dfd query on bool is not supported?
    df = df.addColumn('selected', rowSelected, { inplace: false });

    // Filter on the selection
    let dfFiltered = df.query(df['selected'].eq(1));
    this.dfFiltered = dfFiltered;
    return dfFiltered;

    // // First make sure the top-N value is within range or take a sensible default if needed (20)
    // if (topN === 0 && result.linkCountAfterCategories > 0) {
    //   setTopN(Math.min(20, result.linkCountAfterCategories));
    // }
    // if (topN > result.linkCountAfterCategories) {
    //   setTopN(result.linkCountAfterCategories);
    // }
    
    // // Select top-N connections
    // result.links = result.links.slice(0, topN);
    
    
    // return data;
  }

  /** Converts the dataframe to an object with links and nodes
   */
  get nodesAndLinks() {
    const df = this.filteredData;
    console.log(df);
    if (df === null) {
      return { links: [], nodes: [], totals: [], timeSeries: [], categories: [] }
    }

    // Links
    const links = dfd.toJSON(df);
    links.forEach((d, i) => !d.id && (d.id = `link-${i}`)); // assign ids to links
    links.forEach(d => d['weight'] = d[this.weightColumn]);
    links.forEach((d) => { if (d.source !== d.target) d.directed = "yes"; });

    // Nodes (link source or target)
    const nodes = new Set();
    links.forEach(link => { nodes.add(link.source); nodes.add(link.target); });

    return { links, nodes: [...nodes], totals: [], timeSeries: [], categories: [], minWeight: this.minWeight, maxWeight: this.maxWeight };
  }

  get aggregatedData() {
    const df = this.dfAllData;
    const dfLinkToSelf = this.dfLinkToSelf;
    const dfLinkToOther = this.dfLinkToOther;
    const weightColumn = this.weightColumn;

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
    return dfd.toJSON(dfTotals);
  }

  get timeSeries() {
    const df = this.dfAllData;
    const weightColumn = this.weightColumn;

    // Time series
    let dfTime = df.groupby(['source', 'sourceName', 'year']).col([weightColumn]).sum();
    dfTime.rename({ [`${weightColumn}_sum`]: 'weight_total' }, { inplace: true });
    dfTime.sortValues('year', { ascending: false, inplace: true });
    return dfd.toJSON(dfTime);
  }

  /** Returns a "dictionary" object of the sources and targets that are actually used in the loaded dataset,
   *  mapping ISO-2 country codes to country names. */
  get usedLocations() {
    if (this.dfAllData === null) {
      return [];
    }
    const sources = this.dfAllData['source'].unique().values;
    const targets = this.dfAllData['target'].unique().values;

    const result = {};
    for (const [key, value] of Object.entries(this.allLocations)) {
      if (sources.includes(key) || targets.includes(key)) {
        result[key] = value;
      }
    }
    return result;
  }

}
