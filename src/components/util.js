

const humanFormatNumber = number => {
  if (number === 0) return '0';
  const s = ['', ' th', ' mln', ' bln'];
  const e = Math.floor(Math.log(number) / Math.log(1000));
  const value = (number / Math.pow(1000, e)).toFixed(1);
  const exponent = e < s.length ? s[e] : `E${3*e}`
  return `${value}${exponent}`;
}

const FlowMode = {
  Inflow: 'Inflow',
  Outflow: 'Outflow',
  Self: 'Self'
};

const SourceTargetOperator = {
  And: 'And',
  Or: 'Or'
}

export { humanFormatNumber, FlowMode, SourceTargetOperator }
