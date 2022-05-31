import './App.css';
import GeoFlowVis from './GeoFlowVis';
import MultiSelect from './MultiSelect';
import { getCountryMap, getLocationNames, loadData } from './DataStore';
import React, { useState, useEffect } from 'react';
import AppContext from './AppContext';

function App() {
  // Pre-loaded (static) locations and map
  const [allLocations] = useState(getLocationNames());
  const [countryMap] = useState(getCountryMap());
  
  // The data from the csv file
  const [data, setData] = useState({ links: [], categories: [] });
  
  // Locations extracted from the data (to fill sources & targets)
  const [usedLocations, setUsedLocations] = useState([]);
  
  // Selection state
  const [selectedSources, setSelectedSources] = useState([]);
  const [selectedTargets, setSelectedTargets] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState({}); // object with arrays
  
  // The data after being filtered for sources/targets/categories
  const [filteredData, setFilteredData] = useState({ links: [], categories: [] });

  // Handle file selection
  const onFileChanged = async (event) => {
    const fileList = event.target.files;
    if (fileList.length > 0) {
      setData(await loadData(fileList[0]));
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
    const result = {};
    result.links = data.links.filter(link => selectedSources.includes(link.source));
    result.links = result.links.filter(link => selectedTargets.includes(link.target));
    Object.keys(selectedCategories).forEach(key => {
      result.links = result.links.filter(link => selectedCategories[key].includes(link[key].toString()))
    });
    setFilteredData(result);
  }, [selectedSources, selectedTargets, selectedCategories, data]);

  // updateUsedLocations
  useEffect(() => {
    const result = {};
    for (const [key, value] of Object.entries(allLocations)) {
      if (data.links.find(el => el.source === key || el.target === key)) {
        result[key] = value;
      }
    }
    setUsedLocations(result);

    // Buy default, select all sources, targets and categories
    setSelectedSources(Object.keys(result));
    setSelectedTargets(Object.keys(result));
    setSelectedCategories(data.categories.reduce((selectionObj, category) => {
      selectionObj[category.name] = category.values;
      return selectionObj;
    }, {}));
  }, [setUsedLocations, data, allLocations])

  // These variables will be available through the AppContext
  const globalData = {
    data, setData,
    filteredData, setFilteredData
  };

  return (
    <AppContext.Provider value={globalData}>
      <div className="App">
        <input type="file" id="fileInput" accept=".csv" onChange={onFileChanged} />
        <MultiSelect label="Sources" options={usedLocations} selection={selectedSources} onChanged={selection => setSelectedSources(selection)} />
        <MultiSelect label="Targets" options={usedLocations} selection={selectedTargets} onChanged={selection => setSelectedTargets(selection)} />
        { data.categories.map(category => (
          <MultiSelect label={category.name} options={category.values} selection={selectedCategories[category.name] || []} onChanged={selection => changeCategorySelection(category, selection)} />
        ))}
        <GeoFlowVis countryMap={countryMap}/>
      </div>
    </AppContext.Provider>
  );
}

export default App;
