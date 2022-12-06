import './App.css';
import React, { useState, useEffect } from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import AppContext from './AppContext';
import { getCountryMap, getLocationNames } from './DataStore';
import DataModel from './DataModel';
import MultiSelect from './MultiSelect';
import GeoFlowVis from './GeoFlowVis';
import CountryTotals from './CountryTotals';
import TimeSeriesChart from './TimeSeriesChart';
import { action } from 'mobx';

const App = observer(() => {
  const dataStore = useLocalObservable(() => new DataModel());

  // Pre-loaded (static) locations and map
  const [countryMap] = useState(getCountryMap());
  
  // Locations extracted from the data (to fill sources & targets)
  const usedLocations = dataStore.usedLocations;

  // Selection state
  const [topN, setTopN] = useState(20);

  // Error object to display in dialog
  const [error, setError] = useState();

  // Handle file selection
  const onFileChanged = async (event) => {
    const fileList = event.target.files;
    if (fileList.length > 0) {
      try {
        await dataStore.loadData(fileList[0]);
      }
      catch(e) {
        setError(e);
        console.log(e);
      }
    }
  };

  const loadDemoData = async (fileName) => {
    try {
      await dataStore.loadData(`${window.PUBLIC_URL}/data/${fileName}`);
    }
    catch(e) {
      setError(e);
      console.log(e);
    }
  };

  // Handle category selection
  // const changeCategorySelection = (category, selection) => {
  //   const newSelectedCategories = { ...dataStore.selectedCategories };
  //   newSelectedCategories[category.name] = selection;
  //   setSelectedCategories(newSelectedCategories);
  // }

  // // updateFilteredData
  // useEffect(() => {
  //   if (data.df !== undefined) {
  //     const result = filterData(data, {topN, selectedSources, selectedTargets, selectedCategories});
  //     setFilteredData(result);
  //   }
  // }, [topN, selectedSources, selectedTargets, selectedCategories, data]);

  // updateUsedLocations
  // useEffect(() => {
  //   const result = {};
  //   //const topNSources = data.totals.slice(0, topN).map(el => el.source);
  //   for (const [key, value] of Object.entries(allLocations)) {
  //     if (data.links.find(el => el.source === key || el.target === key)) { //&& topNSources.includes(el.source)
  //       result[key] = value;
  //     }
  //   }
  //   setUsedLocations(result);

  //   // By default, select all sources, targets and categories
  //   setSelectedSources(Object.keys(result));
  //   setSelectedTargets(Object.keys(result));
  //   setSelectedCategories(data.categories.reduce((selectionObj, category) => {
  //     selectionObj[category.name] = category.values;
  //     return selectionObj;
  //   }, {}));
  // }, [setUsedLocations, data, allLocations]) //topN

  // // These variables will be available through the AppContext
  // const globalData = {
  //   //data, setData,
  //   filteredData, setFilteredData
  // };

//  const totalLinks = data.links?.length;

  return (
    <AppContext.Provider value={null} data-theme="lemonade">

      <div className="App flex mb-4">
        <div className="w-1/4 z-30">

          {/* Side bar */}
          <div className="border border-base-300 bg-base-100 rounded-box p-4 content text-left">
            <input type="file" id="fileInput" accept=".csv" onChange={onFileChanged} /><br />
            or load a demo: <a href="#!"><button onClick={() => loadDemoData("demo_ffo.csv")}>fossil fuel owners</button></a> (<a href="https://www.tandfonline.com/doi/full/10.1080/09692290.2019.1665084" target="_blank" rel="noreferrer">info</a>)<br />
            demo 2 (time series): <a href="#!"><button onClick={() => loadDemoData("demo_ffo2.csv")}>fossil fuel owners</button></a><br />
            {/* Link count: {totalLinks} */}
          </div>
          <MultiSelect label="Sources" options={usedLocations} selection={dataStore.selectedSources} onChanged={action(selection => dataStore.selectedSources = selection)} />
          <MultiSelect label="Targets" options={usedLocations} selection={dataStore.selectedTargets} onChanged={action(selection => dataStore.selectedTargets = selection)} />
          { dataStore.categories.map(category => (
            <MultiSelect key={category.name} label={category.name} options={category.values} selection={dataStore.selectedCategories[category.name] || []} onChanged={action(selection => dataStore.selectedCategories[category.name] = selection)} />
          ))}
          {/* <div className="border border-base-300 bg-base-100 rounded-box p-4">
            <span>Top {topN}/{filteredData.linkCountAfterCategories} connections</span>
            <input type="range" className="range" min="1" max={Math.min(1000, filteredData.linkCountAfterCategories)} step="1" value={topN} onChange={e => setTopN(e.target.value)}/>
          </div> */}
        </div>
        
        {/* Main content */}
        <div className="w-3/4 z-0">

          {/* Map visualization */}
          <div className="">
            <GeoFlowVis countryMap={countryMap} filteredData={dataStore.nodesAndLinks}/>
          </div>

          {/* Bar chart */}
          <div className="flex flex-row">
            <div className="overflow-x-scroll">
              {/* <CountryTotals /> */}
            </div>
            {/* <TimeSeriesChart /> */}
          </div>
        </div>
      </div>

      {/* Error dialog */}
      { error && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">{error.name}</h3>
            <p className="py-4">{error.message}</p>
            <div className="modal-action">
              <button className="btn" onClick={() => setError(undefined)}>Close</button>
            </div>
          </div>
        </div>
      )}

    </AppContext.Provider>
  );
});

export default App;
