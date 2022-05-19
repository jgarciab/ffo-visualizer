import './App.css';
import GeoFlowVis from './GeoFlowVis';
import MultiSelect from './MultiSelect';
import { getCountryMap, getLocationNames, loadData } from './DataStore';
import React, { useState, useEffect } from 'react';
import AppContext from './AppContext';

function App() {
  const [data, setData] = useState({ links: [] });
  const [filteredData, setFilteredData] = useState({ links: [] });
  const [selectedSources, setSelectedSources] = useState([]);
  const [selectedTargets, setSelectedTargets] = useState([]);
  const [usedLocations, setUsedLocations] = useState([]);
  const [allLocations] = useState(getLocationNames());
  const [countryMap] = useState(getCountryMap());

  const onFileChanged = async (event) => {
    const fileList = event.target.files;
    if (fileList.length > 0) {
      setData(await loadData(fileList[0]));
    }
  };

  // updateFilteredData
  useEffect(() => {
    const result = {};
    result.links = data.links.filter(link => selectedSources.includes(link.source));
    result.links = result.links.filter(link => selectedTargets.includes(link.target));
    setFilteredData(result);
  }, [selectedSources, selectedTargets, data]);

  // updateUsedLocations
  useEffect(() => {
    const result = {};
    for (const [key, value] of Object.entries(allLocations)) {
      if (data.links.find(el => el.source === key || el.target === key)) {
        result[key] = value;
      }
    }
    setUsedLocations(result);
    setSelectedSources(Object.keys(result));
    setSelectedTargets(Object.keys(result));
  }, [setUsedLocations, data, allLocations])

  const globalData = {
    data, setData,
    filteredData, setFilteredData
  };

  return (
    <AppContext.Provider value={globalData}>
      <div className="App">
        <input type="file" id="fileInput" accept=".csv" onChange={onFileChanged} />
        <MultiSelect options={usedLocations} selection={selectedSources} label="Sources" onChanged={selection => setSelectedSources(selection)} />
        <MultiSelect options={usedLocations} selection={selectedTargets} label="Targets" onChanged={selection => setSelectedTargets(selection)} />
        <GeoFlowVis countryMap={countryMap}/>
      </div>
    </AppContext.Provider>
  );
}

export default App;
