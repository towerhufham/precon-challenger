//https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
export const inPlaceShuffle = (array: any[]) => {
  let currentIndex = array.length,  randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex > 0) {

    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }

  return array;
}

//https://stackoverflow.com/questions/4550505/getting-a-random-value-from-a-javascript-array
export const choice = (arr: any[]) => {
  //returns a random element from the array
  if (arr.length < 1) throw new Error("UTIL ERROR: choice() given empty list")
  return arr[Math.floor(Math.random() * arr.length)]
}