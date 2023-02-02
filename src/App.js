import './App.css';
import React, { useState } from 'react';
import { action } from 'mobx';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { getCountryMap, getLocationMap } from './GeoData';
import DataStore from './DataStore';
import MultiSelect from './components/MultiSelect';
import GeoFlowVis from './components/GeoFlowVis';
import CountryTotals from './components/CountryTotals';
import TimeSeriesChart from './components/TimeSeriesChart';
import { FlowMode, SourceTargetOperator } from './components/mappings';

const App = observer(() => {
  const dataStore = useLocalObservable(() => new DataStore());

  // Pre-loaded (static) locations and map
  const [countryMap] = useState(getCountryMap());
  const [locationMapping] = useState(getLocationMap());
  
  // Locations extracted from the data (to fill sources & targets)
  const usedLocations = dataStore.usedLocations;

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

  return (
    <div data-theme="lemonade">

      <div className="App flex mb-4">
        <div className="w-1/4 z-30">

          {/* Side bar */}

          {/* File selection */}
          <div className="border border-base-300 bg-base-100 rounded-box m-2 p-4 content text-left">
            <input type="file" id="fileInput" accept=".csv" onChange={onFileChanged} /><br />
            or load a demo: <a href="#!"><button onClick={() => loadDemoData("demo_ffo.csv")}>fossil fuel owners</button></a> (<a href="https://www.tandfonline.com/doi/full/10.1080/09692290.2019.1665084" target="_blank" rel="noreferrer">info</a>)<br />
            demo 2 (time series): <a href="#!"><button onClick={() => loadDemoData("demo_ffo2.csv")}>fossil fuel owners</button></a><br />
            Row count: {dataStore.entryCount}
          </div>

          {/* Source & target filters */}
          <div className="border border-base-300 rounded-box m-2">
            <MultiSelect label="Sources" options={usedLocations} selection={dataStore.selectedSources} onChanged={action(selection => dataStore.selectedSources = selection)} />
            <div className="">
              <select className="select select-bordered w-full text-center" value={dataStore.sourceTargetOperator}
                  onChange={action(e => dataStore.sourceTargetOperator = e.target.value)}>
                <option value={SourceTargetOperator.And}>Combine: AND</option>
                <option value={SourceTargetOperator.Or}>Combine: OR</option>
              </select>
            </div>
            <MultiSelect label="Targets" options={usedLocations} selection={dataStore.selectedTargets} onChanged={action(selection => dataStore.selectedTargets = selection)} />
          </div>

          {/* Category filters */}
          <div className="border border-base-300 rounded-box m-2">
            { dataStore.categories.map(category => (
              <MultiSelect key={category.name} label={category.name} options={category.values} selection={dataStore.selectedCategories[category.name] || []} onChanged={action(selection => dataStore.selectedCategories[category.name] = selection)} />
            ))}
          </div>
        </div>
        
        {/* Main content */}
        <div className="w-3/4 z-0">

          {/* Top controls */}
          <div className="flex">

            {/* In / outflow */}
            <select className="select select-bordered w-full max-w-xs m-2 text-lg" value={dataStore.flowMode}
                onChange={action(e => dataStore.flowMode = e.target.value)}>
              <option value={FlowMode.Outflow}>Visualize outflow</option>
              <option value={FlowMode.Inflow}>Visualize inflow</option>
              <option value={FlowMode.Self}>Visualize flow to self</option>
            </select>

            {/* Top N */}
            <div className="border border-base-300 bg-base-100 rounded-box m-2 p-3 w-1/2 flex">
              <span className="mr-3" style={{whiteSpace: 'nowrap'}}>Top {dataStore.topN}/{dataStore.linkCountAfterProcessing}</span>
              <input type="range" className="range" min="1" max={Math.min(1000, dataStore.linkCountAfterProcessing)} step="1" value={dataStore.topN} onChange={action(e => dataStore.topN = e.target.value)}/>
            </div>
          </div>

          {/* Map visualization */}
          <div>
            <GeoFlowVis countryMap={countryMap} filteredData={dataStore.nodesAndLinks}
              locationMapping={locationMapping} flowMode={dataStore.flowMode}
              selectAsSource={dataStore.selectAsSource.bind(dataStore)}
              selectAsTarget={dataStore.selectAsTarget.bind(dataStore)} />
          </div>

          {/* Totals & time series charts */}
          <div className="flex flex-row">
            <div className="overflow-x-scroll">
              <CountryTotals data={dataStore.nodesAndLinks} flowMode={dataStore.flowMode} />
            </div>
            <TimeSeriesChart data={dataStore.nodesAndLinks}/>
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

    </div>
  );
});

export default App;
