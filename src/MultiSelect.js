import React from 'react';

const MultiSelect = ({ options, label, selection, onChanged }) => {

  const updateSelection = (key, selected) => {
    const index = selection.indexOf(key);
    const newSelOptions = selected ? [...selection, key] :
      [...selection.slice(0, index), ...selection.slice(index + 1)];
    onChanged && onChanged(newSelOptions);
  }

  return (<div className="dropdown">
    <label tabIndex="0" className="btn m-1">{label}</label>
    <div className="dropdown-content">
      <button className="btn m-1" onClick={() => onChanged(Object.keys(options))}>All</button>
      <button className="btn m-1" onClick={() => onChanged([])}>None</button>
      <input type="text"></input>
      <ul tabIndex="0" className="menu p-2 shadow bg-base-100 rounded-box w-52">
        { Object.keys(options).map(key => (
          <li key={key}><label><input type="checkbox" className="checkbox" checked={selection.includes(key)}
             onChange={event => updateSelection(key, event.target.checked)}/>{options[key]}</label></li>
        )) }
      </ul>
    </div>
    </div>);

}

export default MultiSelect;
