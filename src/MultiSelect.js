import React from 'react';

const MultiSelect = ({ options, label }) => {

  return (<div className="dropdown">
    <label tabIndex="0" className="btn m-1">{label}</label>
    <div className="dropdown-content">
      <ul tabIndex="0" className="menu p-2 shadow bg-base-100 rounded-box w-52">
        { options.map(option => (
          <li><label><input type="checkbox" className="checkbox"/>{option}</label></li>
        )) }
      </ul>
    </div>
    </div>);

}

export default MultiSelect;
