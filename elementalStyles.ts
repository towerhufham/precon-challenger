import type { Elemental } from "./game";

const getElementalColor = (el: Elemental) => {
  switch(el) {
    case "Holy":
      return "#f5f5f5"
    case "Fire":
      return "#f87171"
    case "Stone":
      return "#fb923c"
    case "Thunder":
      return "#fbbf24"
    case "Plant":
      return "#a3e635"
    case "Wind":
      return "#2dd4bf"
    case "Water":
      return "#60a5fa"
    case "Dark":
      return "#e879f9"
  }
}

export const getElementalBackground = (elements: Elemental[]) => {
  if (elements.length === 0) return {"background-color": "rgb(170, 170, 170)"}
  if (elements.length === 1) return {"background-color": getElementalColor(elements[0])}
  let pairs = []
  let nextStop = 0
  for (const element of elements) {
    pairs.push(`${getElementalColor(element)} ${nextStop}%`)
    nextStop += 100 / (elements.length - 1)
  }
  const deg = elements.length <= 2 ? 180 : 135
  return {"background-image": `linear-gradient(${deg}deg, ${pairs.join(', ')})`}
}

export const getElementalBorder = (elements: Elemental[]) => {
  if (elements.length === 0) return {"border": "4px solid rgb(170, 170, 170)"}
  if (elements.length === 1) return {"border": `4px solid ${getElementalColor(elements[0])}`}
  let pairs = []
  let nextStop = 0
  for (const element of elements) {
    pairs.push(`${getElementalColor(element)} ${nextStop}%`)
    nextStop += 100 / (elements.length - 1)
  }
  // const deg = elements.length <= 2 ? 180 : 135
  return {
    "border": "4px solid transparent",
    "border-image": `linear-gradient(180deg, ${pairs.join(', ')})`,
    "border-image-slice": "1"
  }
}

export const getElementalText = (elements: Elemental[]) => {
  if (elements.length === 0) return {"color": "rgb(170, 170, 170)"}
  if (elements.length === 1) return {"color": getElementalColor(elements[0])}
  let pairs = []
  let nextStop = 0
  for (const element of elements) {
    pairs.push(`${getElementalColor(element)} ${nextStop}%`)
    nextStop += 100 / (elements.length - 1)
  }
  const deg = elements.length <= 2 ? 180 : 90
  return {
    "background-image": `linear-gradient(${deg}deg, ${pairs.join(', ')})`,
    "color": "transparent",
    "background-clip": "text"
  }
}