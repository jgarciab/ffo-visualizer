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
  dfLinkTotals = null;
  dfCountryTotals = null;
  dfTimeSeries = null;

  categories = [];
  minWeight = 0;
  maxWeight = 0;

  selectedSources = [];
  selectedTargets = [];
  selectedCategories = {};
  topN = 20;


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
      this.dfAllData = df;
      this.dfLinkToSelf = dfLinkToSelf;
      this.dfLinkToOther = dfLinkToOther;
      this.categories = categories;

      // Min/max weights
      this.minWeight = dfLinkToOther[this.weightColumn].min();
      this.maxWeight = dfLinkToOther[this.weightColumn].max();
      console.log(this.minWeight, this.maxWeight);
      //console.log(dfLinkToOther.query(dfLinkToOther[this.weightColumn].lt(1000)));

      // Default selection
      const usedLocations = this.usedLocations;
      this.selectedSources = Object.keys(usedLocations);
      this.selectedTargets = Object.keys(usedLocations);
      this.selectedCategories = categories.reduce((selectionObj, category) => {
        selectionObj[category.name] = category.values;
        return selectionObj;
      }, {});
    });
  };

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

  get entryCount() {
    return this.dfAllData === null ? 0 : this.dfAllData.shape[0];
  }

  get linkCountAfterProcessing() {
    return this.dfLinkTotals === null ? 0 : this.dfLinkTotals.shape[0];
  }

  get filteredDataFrame() {
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

    // Filter on the selection
    df = df.addColumn('selected', rowSelected, { inplace: false });
    let dfFiltered = df.query(df['selected']);
    this.dfFiltered = dfFiltered;
    return dfFiltered;
  }

  /** Aggregate weight by link (source & target), used to display max 1 link between source & target pairs */
  get aggregatedByLink() {
    const df = this.filteredDataFrame;
    if (df === null || df.shape[0] === 0) {
      return null;
    }
    let dfAggregated = df.groupby(['source', 'sourceName', 'target', 'targetName']).col([this.weightColumn]).sum();
    dfAggregated.rename({ [`${this.weightColumn}_sum`]: 'weight' }, { inplace: true });

    // Sort
    dfAggregated = dfAggregated.sortValues('weight', { ascending: false });
    dfAggregated.resetIndex({ inplace: true });

    // Check if topN has proper value
    const linkCountAfterProcessing = dfAggregated.shape[0];
    if (this.topN === 0 && linkCountAfterProcessing > 0) {
      this.topN = Math.min(20, linkCountAfterProcessing)
    }
    if (this.topN > linkCountAfterProcessing) {
      this.topN = linkCountAfterProcessing;
    }

    runInAction(() => {
      this.dfLinkTotals = dfAggregated;
    });
    const links = dfd.toJSON(dfAggregated);
    return links.slice(0, this.topN);
  }

  /** Aggregate weight by source country */
  get aggregatedBySource() {
    const df = this.filteredDataFrame;
    if (df === null || df.shape[0] === 0) {
      return null;
    }
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
    this.dfCountryTotals = dfTotals;
    return dfd.toJSON(dfTotals);
  }

  get timeSeriesData() {
    const df = this.filteredDataFrame;
    if (df === null || df.shape[0] === 0) {
      return [];
    }
    const weightColumn = this.weightColumn;

    // Time series
    let dfTime = df.groupby(['source', 'sourceName', 'year']).col([weightColumn]).sum();
    dfTime.rename({ [`${weightColumn}_sum`]: 'weight_total' }, { inplace: true });
    dfTime.sortValues('year', { ascending: false, inplace: true });
    this.dfTimeSeries = dfTime;
    return dfd.toJSON(dfTime);
  }

  /** Wraps the filtered and aggregated data in an object to be used by the visualization components.
   */
   get nodesAndLinks() {
    const links = this.aggregatedByLink;
    if (links === null ) {
      return { links: [], nodes: [], totals: [], timeSeries: [] }
    }

    // Links
    links.forEach((d, i) => !d.id && (d.id = `link-${i}`)); // assign ids to links
    links.forEach(d => d['weight'] = d[this.weightColumn]);
    links.forEach((d) => { if (d.source !== d.target) d.directed = "yes"; });

    // Nodes (link source or target)
    const nodes = new Set();
    links.forEach(link => { nodes.add(link.source); nodes.add(link.target); });

    // Totals and time series
    const totals = this.aggregatedBySource;
    const timeSeries = this.timeSeriesData;

    return { links, nodes: [...nodes], totals, timeSeries, minWeight: this.minWeight, maxWeight: this.maxWeight };
  }

}
