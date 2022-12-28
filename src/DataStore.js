import * as dfd from 'danfojs';
import { makeAutoObservable, runInAction } from 'mobx';
import { FlowMode, SourceTargetOperator } from './components/mappings';
import { getLocationNames } from './GeoData';

const COLUMN_SOURCE = 'source';
const COLUMN_TARGET = 'target';
const COLUMN_WEIGHT = 'weight';
const FIXED_COLUMNS = [COLUMN_SOURCE, COLUMN_TARGET, COLUMN_WEIGHT];

const MAX_LINK_COUNT = 1000;

/** This class contains the data model and is a mobx Observable.
 */
export default class DataStore {

  allLocations = getLocationNames();

  // Danfo dataframes at various levels of filtering
  dfAllData = null;
  dfLinkToSelf = null;
  dfLinkToOther = null;
  dfFiltered = null;
  dfLinkTotals = null;
  dfCountryTotals = null;
  dfTimeSeries = null;

  categories = [];
  minLinkWeight = 0;
  maxLinkWeight = 0;
  minTotalWeight = 0;
  maxTotalWeight = 0;
  
  sourceTargetOperator = SourceTargetOperator.And;
  selectedSources = [];
  selectedTargets = [];
  selectedCategories = {};
  flowMode = FlowMode.Outflow;
  _topN = 20;
  stickTopNToMax = true;


  constructor() {
    makeAutoObservable(this);
  }

  set topN(value) {
    this.stickTopNToMax = value === this.linkCountAfterProcessing || value === MAX_LINK_COUNT;
    this._topN = value;
  }

  get topN() {
    if (this.stickTopNToMax) {
      return Math.min(MAX_LINK_COUNT, Math.max(this._topN, this.linkCountAfterProcessing));
    }
    else {
      return Math.min(this._topN, this.linkCountAfterProcessing);
    }
  }

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
    if (!FIXED_COLUMNS.reduce((found, column) => found && df.columns.includes(column), true)) {
      throw new Error(`One or more required columns (${FIXED_COLUMNS}) not found`);
    }
  
    // Determine categories (all columns beside the standard ones will be categories)
    let categories = [];
    for (const column of df.columns) {
      if (!FIXED_COLUMNS.includes(column)) {
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
    const columns = df.columns.filter(item => item !== COLUMN_WEIGHT);
    df = df.groupby(columns).col([COLUMN_WEIGHT]).sum();
    df.rename({ [`${COLUMN_WEIGHT}_sum`]: COLUMN_WEIGHT }, { inplace: true });

    // Split links to self and links to other countries
    let dfLinkToSelf = df.query(df['source'].eq(df['target']));
    if (dfLinkToSelf.shape[0] > 0) {
      dfLinkToSelf.resetIndex({ inplace: true });
    }
    let dfLinkToOther = df.query(df['source'].ne(df['target']));
    if (dfLinkToOther.shape[0] > 0) {
      dfLinkToOther.resetIndex({ inplace: true });
    }
  
    // Update model properties (needs runInAction because async)
    runInAction(() => {
      this.dfAllData = df;
      this.dfLinkToSelf = dfLinkToSelf;
      this.dfLinkToOther = dfLinkToOther;
      this.categories = categories;

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

  get filteredDataFrame() {
    let df = this.flowMode === FlowMode.Self ? this.dfLinkToSelf : this.dfLinkToOther;
    if (df === null || df.shape[0] === 0) {
      return null;
    }

    // Filter on source and/or target
    const sourceSelected = df['source'].map(source => this.selectedSources.includes(source));
    const targetSelected = df['target'].map(target => this.selectedTargets.includes(target));
    let rowSelected = this.sourceTargetOperator === SourceTargetOperator.And ?
      sourceSelected.and(targetSelected) : sourceSelected.or(targetSelected);

    // Filter for categories
    Object.keys(this.selectedCategories).forEach(key => {
      const categorySelected = df[key].map(value => this.selectedCategories[key].includes(value.toString()));
      rowSelected = rowSelected.and(categorySelected);
    });

    // Apply the selection
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
    let dfAggregated = df.groupby(['source', 'sourceName', 'target', 'targetName']).col([COLUMN_WEIGHT]).sum();
    dfAggregated.rename({ [`${COLUMN_WEIGHT}_sum`]: COLUMN_WEIGHT }, { inplace: true });

    // Sort
    dfAggregated = dfAggregated.sortValues(COLUMN_WEIGHT, { ascending: false });
    dfAggregated.resetIndex({ inplace: true });

    runInAction(() => {
      // Min/max weights
      this.minLinkWeight = dfAggregated[COLUMN_WEIGHT].min();
      this.maxLinkWeight = dfAggregated[COLUMN_WEIGHT].max();
  
      this.dfLinkTotals = dfAggregated;
    });
    const links = dfd.toJSON(dfAggregated);
    return links.slice(0, this.topN);
  }

  get linkCountAfterProcessing() {
    return this.dfLinkTotals === null ? 0 : this.dfLinkTotals.shape[0];
  }

  /** Aggregate weight by node (source or target country) */
  get aggregatedByNode() {
    const df = this.filteredDataFrame;
    if (df === null || df.shape[0] === 0) {
      return null;
    }

    // Calculate country totals
    const aggregateTotals = (groupByColumns, outputColumn) => {
      let dfTotals = df.groupby(groupByColumns).col([COLUMN_WEIGHT]).sum();
      dfTotals.rename({ [`${COLUMN_WEIGHT}_sum`]: outputColumn }, { inplace: true });
      dfTotals.rename({ [groupByColumns[0]]: 'countryCode', [groupByColumns[1]]: 'countryName'}, { inplace: true });
      return dfTotals;
    }
    const dfTotalsIn = aggregateTotals(['target', 'targetName'], 'weight_in');
    const dfTotalsOut = aggregateTotals(['source', 'sourceName'], 'weight_out');
    const dfTotals = dfd.merge({ left: dfTotalsIn, right: dfTotalsOut, on: ['countryCode', 'countryName'], how: 'outer' });
    dfTotals.fillNa([0.0, 0.0], {columns: ['weight_in', 'weight_out'], inplace: true});

    runInAction(() => {
      // Min/max weights (will be used for the color scale)
      const column = this.flowMode === FlowMode.Outflow ? 'weight_out' : 'weight_in';
      dfTotals.sortValues(column, { ascending: false, inplace: true });
      this.minTotalWeight = dfTotals[column].min();
      this.maxTotalWeight = dfTotals[column].max();

      this.dfCountryTotals = dfTotals;
    });
    return dfd.toJSON(dfTotals);
  }

  get timeSeriesData() {
    const df = this.filteredDataFrame;
    if (df === null || df.shape[0] === 0) {
      return [];
    }
    const groupByColumns = this.flowMode === FlowMode.Outflow ? ['source', 'sourceName', 'year'] :
                                                                ['target', 'targetName', 'year'];

    // Time series
    let dfTime = df.groupby(groupByColumns).col([COLUMN_WEIGHT]).sum();
    dfTime.rename({ [`${COLUMN_WEIGHT}_sum`]: COLUMN_WEIGHT }, { inplace: true });
    dfTime.sortValues('year', { ascending: false, inplace: true });
    dfTime.rename({ [groupByColumns[0]]: 'countryCode', [groupByColumns[1]]: 'countryName'}, { inplace: true });
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
    // Note that the visualization expects the 'weight' property. // links.forEach(d => d['weight'] = d[COLUMN_WEIGHT]);
    links.forEach((d) => { if (d.source !== d.target) d.directed = "yes"; });

    // Nodes (link source or target after top-n filtering, so only for visible links)
    const nodes = new Set();
    links.forEach(link => { nodes.add(link.source); nodes.add(link.target); });

    // Totals and time series
    const totals = this.aggregatedByNode;
    const timeSeries = this.timeSeriesData;

    return {
      links,
      nodes: [...nodes], // list of country codes used as either source or target
      totals,
      timeSeries,
      minLinkWeight: this.minLinkWeight,
      maxLinkWeight: this.maxLinkWeight,
      minTotalWeight: this.minTotalWeight,
      maxTotalWeight: this.maxTotalWeight
    };
  }

  selectAsSource(countryCode) {
    this.selectedSources = [countryCode];
    this.selectedTargets = Object.keys(this.usedLocations);
    this.flowMode = FlowMode.Inflow;
  }

  selectAsTarget(countryCode) {
    this.selectedTargets = [countryCode];
    this.selectedSources = Object.keys(this.usedLocations);
    this.flowMode = FlowMode.Outflow;
  }
}
