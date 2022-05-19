import './App.css';
import GeoFlowVis from './GeoFlowVis';
import MultiSelect from './MultiSelect';
import { getCountryMap, getLocationMap, loadData } from './DataStore';
import React, { useState, useEffect } from 'react';
import AppContext from './AppContext';

function App() {
  const [data, setData] = useState({ links: [] });
  const [filteredData, setFilteredData] = useState({ links: [] });
  const [selectedSources, setSelectedSources] = useState([]);
  const [selectedTargets, setSelectedTargets] = useState([]);

  const countryMap = getCountryMap();
  const locationMap = getLocationMap();
  const countries = Object.keys(locationMap);

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

  const globalData = {
    data, setData,
    filteredData, setFilteredData
  };

  return (
    <AppContext.Provider value={globalData}>
      <div className="App">
        <input type="file" id="fileInput" accept=".csv" onChange={onFileChanged} />
        <MultiSelect options={countries} label="Sources" onChanged={selection => setSelectedSources(selection)} />
        <MultiSelect options={countries} label="Targets" onChanged={selection => setSelectedTargets(selection)} />
        <GeoFlowVis countryMap={countryMap}/>
      </div>
    </AppContext.Provider>
  );
}

export default App;
