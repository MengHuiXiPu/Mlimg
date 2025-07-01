function activeAreaConfig (_data = {}, scaleX, scaleY, currentLabel = {}) {
  let config = null
  const data = JSON.parse(JSON.stringify(_data))
  if (scaleX && scaleY) {
    data.position.forEach(item => {
      item.x = item.x / scaleX
      item.y = item.y / scaleY
    })
  }
  let points = ''
  switch (data.type) {
  case 'rectangle':
    config = {
      x: Math.min(data.position[0].x, data.position[1].x),
      y: Math.min(data.position[0].y, data.position[1].y),
      width: Math.abs(data.position[1].x - data.position[0].x),
      height: Math.abs(data.position[1].y - data.position[0].y)
    }
    break
  case 'circle':
    const _y = Math.abs(data.position[1].y - data.position[0].y)
    const _x = Math.abs(data.position[1].x - data.position[0].x)
    const r = Math.sqrt(Math.pow(_x, 2) + Math.pow(_y, 2))
    config = {
      cx: data.position[0].x,
      cy: data.position[0].y,
      r
    }
    break
  case 'polygon':
    data.position.forEach(item => {
      points += item.x + ',' + item.y + ' '
    })
    config = {
      points
    }
    break
  case 'pointer':
    config = {
      cx: data.position[0].x,
      cy: data.position[0].y,
      r: 2,
      fill: data.labelColor || currentLabel.color || 'red'
    }
    break
  case 'line':
    config = {
      x1: data.position[0].x,
      y1: data.position[0].y,
      x2: data.position[1].x,
      y2: data.position[1].y
    }
    break
  case 'polyline':
    data.position.forEach(item => {
      points += item.x + ',' + item.y + ' '
    })
    config = {
      points
    }
    break
  }
  return {
    id: data.id,
    stroke: data.labelColor || currentLabel.color || 'red',
    'stroke-width': '1px',
    fill: 'rgba(0,0,0,0)',
    ...config
  }
}

function makeSVG (tag, attributes) {
  switch (tag) {
  case 'rectangle':
    tag = 'rect'
    break
  case 'pointer':
    tag = 'circle'
  }
  const elem = document.createElementNS('http://www.w3.org/2000/svg', tag)
  const ATTR_MAP = {
    'className': 'class',
    'svgHref': 'href'
  }
  const NS_MAP = {
    'svgHref': 'http://www.w3.org/1999/xlink'
  }
  for (const attr in attributes) {
    const name = (attr in ATTR_MAP ? ATTR_MAP[attr] : attr)
    const value = attributes[attr]
    if (attr in NS_MAP) {
      elem.setAttributeNS(NS_MAP[attr], name, value)
    } else {
      elem.setAttribute(name, value)
    }
  }
  return elem
}

function returnData (item, scale) {
  const { type, startX, startY, endX, endY } = item
  let data = []
  switch (type) {
  case 'rectangle':
  case 'line':
  case 'circle':
    data = [{
      x: startX,
      y: startY
    }]
    if (endX) data.push({
      x: endX,
      y: endY
    })
    break
  case 'pointer':
    data = [{
      x: startX,
      y: startY
    }]
    break
  case 'polygon':
  case 'polyline':
    data = item.points.map((point, index) => {
      return {
        x: point.split(',')[0],
        y: point.split(',')[1]
      }
    })
    break
  }
  data.forEach(item => {
    item.x = item.x * scale.x
    item.y = item.y * scale.y
  })
  return data
}

export { activeAreaConfig, makeSVG, returnData }