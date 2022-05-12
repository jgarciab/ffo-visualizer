import './App.css';
import GeoFlowVis from './GeoFlowVis';
import MultiSelect from './MultiSelect';
import { getCountryMap, getLocationMap, loadData } from './DataStore';
import React, { useState } from 'react';
import AppContext from './AppContext';

function App() {
  const [data, setData] = useState({ links: [] });

  const countryMap = getCountryMap();
  const locationMap = getLocationMap();
  const countries = Object.keys(locationMap);

  const onFileChanged = async (event) => {
    const fileList = event.target.files;
    if (fileList.length > 0) {
      setData(await loadData(fileList[0]));
    }
  };

  const globalData = {
    data, setData
  };

  return (
    <AppContext.Provider value={globalData}>
      <div className="App">
        <input type="file" id="fileInput" accept=".csv" onChange={onFileChanged} />
        <MultiSelect options={countries} label="Sources" />
        <MultiSelect options={countries} label="Targets" />
        <GeoFlowVis countryMap={countryMap}/>
      </div>
    </AppContext.Provider>
  );
}

export default App;
