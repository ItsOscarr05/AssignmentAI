// Assignment: Complete sumArray(arr) to return the sum of numbers in an array.
function sumArray(arr){
// Assignment: Complete sumArray(arr) to return the sum of numbers in an array.
}
function sumArray(arr) {
module.exports = { sumArray };
  if (!Array.isArray(arr)) {
    throw new TypeError('Input must be an array');
  }
  
  return arr.reduce((accumulator, currentValue) => {
    if (typeof currentValue !== 'number') {
      throw new TypeError('Array must contain only numbers');
    }
    return accumulator + currentValue;
  }, 0);
}

module.exports = { sumArray };