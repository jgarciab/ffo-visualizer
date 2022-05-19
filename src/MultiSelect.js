import React, {useEffect, useState} from 'react';

const MultiSelect = ({ options, label, onChanged }) => {
  const [selectedOptions, setSelectedOptions] = useState([]);

  const updateSelection = (option, selected) => {
    const index = selectedOptions.indexOf(option);
    const newSelOptions = selected ? [...selectedOptions, option] :
      [...selectedOptions.slice(0, index), ...selectedOptions.slice(index + 1)];
    setSelectedOptions(newSelOptions);
  }

  // Fire event when selection changes
  useEffect(() => {
    onChanged && onChanged(selectedOptions);
  }, [selectedOptions, onChanged]);

  return (<div className="dropdown">
    <label tabIndex="0" className="btn m-1">{label}</label>
    <div className="dropdown-content">
      <button className="btn m-1" onClick={() => setSelectedOptions(options)}>All</button>
      <button className="btn m-1" onClick={() => setSelectedOptions([])}>None</button>
      <input type="text"></input>
      <ul tabIndex="0" className="menu p-2 shadow bg-base-100 rounded-box w-52">
        { options.map(option => (
          <li><label><input type="checkbox" className="checkbox" checked={selectedOptions.includes(option)}
             onChange={event => updateSelection(option, event.target.checked)}/>{option}</label></li>
        )) }
      </ul>
    </div>
    </div>);

}

export default MultiSelect;
