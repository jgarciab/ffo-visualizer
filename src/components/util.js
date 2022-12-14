

const humanFormatNumber = number => {
  if (number === 0) return '0';
  var s = ['', ' th', ' mln', ' bln'];
  var e = Math.floor(Math.log(number) / Math.log(1000));
  return e < s.length ? (number / Math.pow(1000, e)).toFixed(1) + s[e] : number.toFixed(0);
}

const FlowMode = {
  Inflow: 'Inflow',
  Outflow: 'Outflow'
};

const SourceTargetOperator = {
  And: 'And',
  Or: 'Or'
}

export { humanFormatNumber, FlowMode, SourceTargetOperator }
