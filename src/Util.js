

const humanFormatNumber = number => {
  if (number === 0) return '0';
  var s = ['', 'K', 'M', 'G'];
  var e = Math.floor(Math.log(number) / Math.log(1000));
  return (number / Math.pow(1000, e)).toFixed(1) + s[e];
}

export { humanFormatNumber }
