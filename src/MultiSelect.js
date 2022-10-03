import React, { useState } from 'react';

const MultiSelect = ({ options, label, selection, onChanged }) => {
  const [filter, setFilter] = useState("");
  const lowerCaseFilter = filter.toLowerCase();

  const updateSelection = (key, selected) => {
    const index = selection.indexOf(key);
    const newSelOptions = selected ? [...selection, key] :
      [...selection.slice(0, index), ...selection.slice(index + 1)];
    onChanged && onChanged(newSelOptions);
  }

  // If options are passed as an array, convert it to an object
  // (also converts values to string)
  if (Array.isArray(options)) {
    options = options.reduce((obj, val) => {obj[val] = val.toString(); return obj}, {});
  }

  let summary;
  if (selection.length === 0) summary = "none";
  else if (selection.length === Object.keys(options).length) summary = "all";
  else summary = `${selection.length} of ${Object.keys(options).length}`;

  return (<div tabIndex="0" className="collapse collapse-arrow border border-base-300 bg-base-100 rounded-box">
    <input type="checkbox" /> { /* to enable hiding */ }
    <div className="collapse-title text-lg font-medium">{label} <span className="text-sm text-gray-400">({summary})</span></div>
    <div className="collapse-content pd-2 h-96 overflow-y-auto">
      <div className="grid grid-cols-2 divide-x">
        <button className="btn m-1" onClick={() => onChanged(Object.keys(options))}>All</button>
        <button className="btn m-1" onClick={() => onChanged([])}>None</button>
      </div>
      <input className="placeholder:italic placeholder:text-slate-400 block bg-white w-full border border-slate-300 rounded-md py-2 pl-3 pr-3 shadow-sm focus:outline-none focus:border-sky-500 focus:ring-sky-500 focus:ring-1 sm:text-sm"
        type="search" placeholder="Filter..." onChange={e => setFilter(e.target.value)} ></input>
      <ul tabIndex="0">
        { Object.keys(options).map(key => (
          (filter === "" || options[key].toLowerCase().includes(lowerCaseFilter)) && <li key={key} className="flex">
              <div className="form-control">
                <label className="label cursor-pointer p-0.5 gap-1">
                  <input type="checkbox" className="checkbox" checked={selection.includes(key)}
                          onChange={event => updateSelection(key, event.target.checked)}/>
                  <span className="label-text">{options[key]}</span>
                </label>
              </div>
            </li>
        )) }
      </ul>
    </div>
  </div>);

}

export default MultiSelect;
