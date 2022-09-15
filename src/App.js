import './App.css';
import GeoFlowVis from './GeoFlowVis';
import MultiSelect from './MultiSelect';
import { createEmptyData, getCountryMap, getLocationNames, loadData } from './DataStore';
import React, { useState, useEffect } from 'react';
import AppContext from './AppContext';
import CountryTotals from './CountryTotals';

function App() {
  // Pre-loaded (static) locations and map
  const [allLocations] = useState(getLocationNames());
  const [countryMap] = useState(getCountryMap());
  
  // The data from the csv file
  const [data, setData] = useState(createEmptyData());
  
  // Locations extracted from the data (to fill sources & targets)
  const [usedLocations, setUsedLocations] = useState([]);
  
  // Selection state
  const [topN, setTopN] = useState(20);
  const [selectedSources, setSelectedSources] = useState([]);
  const [selectedTargets, setSelectedTargets] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState({}); // object with arrays
  
  // The data after being filtered for sources/targets/categories
  const [filteredData, setFilteredData] = useState(createEmptyData());

  // Error object to display in dialog
  const [error, setError] = useState();

  // Handle file selection
  const onFileChanged = async (event) => {
    const fileList = event.target.files;
    if (fileList.length > 0) {
      try {
        setData(await loadData(fileList[0]));
      }
      catch(e) {
        setError(e);
        console.log(e);
      }
    }
  };

  const loadDemoData = async (fileName) => {
    try {
      setData(await loadData(`${window.PUBLIC_URL}/data/${fileName}`));
    }
    catch(e) {
      setError(e);
      console.log(e);
    }
  };

  // Handle category selection
  const changeCategorySelection = (category, selection) => {
    const newSelectedCategories = { ...selectedCategories };
    newSelectedCategories[category.name] = selection;
    setSelectedCategories(newSelectedCategories);
  }

  // updateFilteredData
  useEffect(() => {
    const result = { ...data };

    // Filter links for source OR target in selection
    result.links = result.links.filter(link => selectedSources.includes(link.source) || selectedTargets.includes(link.target));

    // Filter for categories
    Object.keys(selectedCategories).forEach(key => {
      result.links = result.links.filter(link => selectedCategories[key].includes(link[key].toString()))
    });
    result.linkCountAfterCategories = result.links.length;

    // First make sure the top-N value is within range or take a sensible default if needed (20)
    if (topN === 0 && result.linkCountAfterCategories > 0) {
      setTopN(Math.min(20, result.linkCountAfterCategories));
    }
    if (topN > result.linkCountAfterCategories) {
      setTopN(result.linkCountAfterCategories);
    }

    // Select top-N connections
    result.links = result.links.slice(0, topN);

    // List of nodes used as link source or target
    const nodes = new Set();
    result.links.forEach(link => { nodes.add(link.source); nodes.add(link.target); });
    result.nodes = [...nodes];

    setFilteredData(result);
  }, [topN, selectedSources, selectedTargets, selectedCategories, data]);

  // updateUsedLocations
  useEffect(() => {
    const result = {};
    //const topNSources = data.totals.slice(0, topN).map(el => el.source);
    for (const [key, value] of Object.entries(allLocations)) {
      if (data.links.find(el => el.source === key || el.target === key)) { //&& topNSources.includes(el.source)
        result[key] = value;
      }
    }
    setUsedLocations(result);

    // By default, select all sources, targets and categories
    setSelectedSources(Object.keys(result));
    setSelectedTargets(Object.keys(result));
    setSelectedCategories(data.categories.reduce((selectionObj, category) => {
      selectionObj[category.name] = category.values;
      return selectionObj;
    }, {}));
  }, [setUsedLocations, data, allLocations]) //topN

  // These variables will be available through the AppContext
  const globalData = {
    data, setData,
    filteredData, setFilteredData
  };

  const totalLinks = data.links.length;

  return (
    <AppContext.Provider value={globalData} data-theme="lemonade">

      <div className="App flex mb-4">
        <div className="w-1/4 z-30">

          {/* Side bar */}
          <div className="border border-base-300 bg-base-100 rounded-box p-4 content text-left">
            <input type="file" id="fileInput" accept=".csv" onChange={onFileChanged} /><br />
            or load a demo: <a href="#!"><button onClick={() => loadDemoData("demo_ffo.csv")}>fossil fuel owners</button></a> (<a href="https://www.tandfonline.com/doi/full/10.1080/09692290.2019.1665084" target="_blank" rel="noreferrer">info</a>)<br />
            demo 2: <a href="#!"><button onClick={() => loadDemoData("demo_ffo2.csv")}>fossil fuel owners</button></a><br />
            Link count: {totalLinks}
          </div>
          <MultiSelect label="Sources" options={usedLocations} selection={selectedSources} onChanged={selection => setSelectedSources(selection)} />
          <MultiSelect label="Targets" options={usedLocations} selection={selectedTargets} onChanged={selection => setSelectedTargets(selection)} />
          { data.categories.map(category => (
            <MultiSelect key={category.name} label={category.name} options={category.values} selection={selectedCategories[category.name] || []} onChanged={selection => changeCategorySelection(category, selection)} />
          ))}
          <div className="border border-base-300 bg-base-100 rounded-box p-4">
            <span>Top {topN}/{filteredData.linkCountAfterCategories} connections</span>
            <input type="range" className="range" min="1" max={Math.min(1000, filteredData.linkCountAfterCategories)} step="1" value={topN} onChange={e => setTopN(e.target.value)}/>
          </div>
        </div>
        
        {/* Main content */}
        <div className="w-3/4 z-0">

          {/* Map visualization */}
          <div className="">
            <GeoFlowVis countryMap={countryMap}/>
          </div>

          {/* Bar chart */}
          <div className="overflow-x-scroll">
            <CountryTotals />
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
}

export default App;
