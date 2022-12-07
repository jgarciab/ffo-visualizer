

const humanFormatNumber = number => {
  var s = ['', 'K', 'M', 'G'];
  var e = Math.floor(Math.log(number) / Math.log(1000));
  return (number / Math.pow(1000, e)).toFixed(2) + s[e];
}

export { humanFormatNumber }
