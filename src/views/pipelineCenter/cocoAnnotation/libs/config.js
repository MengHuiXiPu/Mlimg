export const preferences = {
  "bbox": {
    "blackOrWhite": true,
    "auto": true,
    "radius": 10
  },
  "polygon": {
    "guidance": true,
    "completeDistance": 5,
    "minDistance": 2,
    "blackOrWhite": true,
    "auto": true,
    "radius": 10
  },
  "eraser": {
    "strokeColor": "white",
    "radius": 30
  },
  "brush": {
    "strokeColor": "white",
    "radius": 30
  },
  "magicwand": {
    "threshold": 30,
    "blur": 40
  },
  "select": {
    "showText": true
  },
  "settings": {
    "shortcuts": [
      {
        "name": "Move Up Annotations",
        "keys": [
          "arrowup"
        ]
      },
      {
        "name": "Move Down Annotations",
        "keys": [
          "arrowdown"
        ]
      },
      {
        "name": "Expand Category",
        "keys": [
          "arrowright"
        ]
      },
      {
        "name": "Collapse Category",
        "keys": [
          "arrowleft"
        ]
      },
      {
        "name": "New Annotation",
        "keys": [
          "space"
        ]
      },
      {
        "name": "Delete Current Annotation",
        "keys": [
          "backspace"
        ]
      },
      {
        "name": "Undo Last Action",
        "keys": [
          "control",
          "z"
        ]
      },
      {
        "name": "Select Tool",
        "keys": [
          "s"
        ]
      },
      {
        "name": "BBox Tool",
        "keys": [
          "r"
        ]
      },
      {
        "name": "Next Image",
        "keys": [
          "n"
        ]
      },
      {
        "name": "Previous Image",
        "keys": [
          "p"
        ]
      },
      {
        "name": "Polygon Tool",
        "keys": [
          "v"
        ]
      },
      {
        "name": "Magic Wand Tool",
        "keys": [
          "w"
        ]
      },
      {
        "name": "Keypoints Tool",
        "keys": [
          "k"
        ]
      },
      {
        "name": "Brush Tool",
        "keys": [
          "b"
        ]
      },
      {
        "name": "Eraser Tool",
        "keys": [
          "e"
        ]
      },
      {
        "name": "Center Image",
        "keys": [
          "c"
        ]
      },
      {
        "name": "Save",
        "keys": [
          "control",
          "s"
        ]
      },
      {
        "name": "Remove Current BBox",
        "keys": [
          "escape"
        ]
      },
      {
        "name": "Remove Current Polygon",
        "keys": [
          "escape"
        ]
      },
      {
        "name": "Increase Radius",
        "keys": [
          "["
        ]
      },
      {
        "name": "Decrease Radius",
        "keys": [
          "]"
        ]
      },
      {
        "name": "Increase Radius",
        "keys": [
          "["
        ]
      },
      {
        "name": "Decrease Radius",
        "keys": [
          "]"
        ]
      },
      {
        "name": "Subtract Selection",
        "keys": [
          "shift",
          "click"
        ]
      }
    ]
  }
}

export const paperjs_to_coco = (image_width, image_height, paperjs) => {
  // Given a paperjs CompoundPath, converts path into coco segmentation format based on children paths

  // Check assertions
  if (!(image_width > 0)) {
    throw new Error("Assertion failed: image_width must be greater than 0");
  }
  if (!(image_height > 0)) {
    throw new Error("Assertion failed: image_height must be greater than 0");
  }
  if (!(paperjs.length == 2)) {
    throw new Error("Assertion failed: paperjs length must be 2");
  }

  // Compute segmentation
  // paperjs points are relative to the center, so we must shift them relative to the top left.
  var segments = [];
  var center = [image_width / 2, image_height / 2];

  var compound_path;
  if (paperjs[0] === "Path") {
    compound_path = { "children": [paperjs] };
  } else {
    compound_path = paperjs[1];
  }

  var children = compound_path.children || [];

  for (var i = 0; i < children.length; i++) {
    var child = children[i];

    var child_segments = child[1].segments || [];
    var segments_to_add = [];

    for (var j = 0; j < child_segments.length; j++) {
      var point = child_segments[j];

      // Curve
      if (point.length === 4) {
        point = point[0];
      }

      // Point
      if (point.length === 2) {
        var x = Math.round(center[0] + point[0], 2);
        var y = Math.round(center[1] + point[1], 2);
        segments_to_add.push(x, y);
      }
    }

    // Make sure shape is not all outside the image
    if (segments_to_add.reduce((a, b) => a + b, 0) === 0) {
      continue;
    }

    if (segments_to_add.length === 4) {
      // Length 4 means this is a line with no width; it contributes
      // no area to the mask, and if we include it, coco will treat
      // it instead as a bbox (and throw an error)
      continue;
    }

    var num_widths = segments_to_add.filter(function (value) {
      return value === image_width;
    }).length;
    var num_heights = segments_to_add.filter(function (value) {
      return value === image_height;
    }).length;
    if (num_widths + num_heights === segments_to_add.length) {
      continue;
    }

    segments.push(segments_to_add);
  }

  if (segments.length < 1) {
    return [];
  }

  // var result = get_segmentation_area_and_bbox(segments, image_height, image_width);
  // var area = result[0];
  // var bbox = result[1];

  return segments
}

// 从labels中取出所有的标注annotation记录
export const getAnnotations = (labels) => {
  const result = [];

  for (const label of labels) {
    if (label.annotations && Array.isArray(label.annotations)) {
      result.push(...label.annotations);
    }
  }

  return result;
}

// 坐标转换[[11,12,13,14]] => [{x: 11, y: 12}, {x: 13, y: 14}]
// [[11,12,13,14], [1,2,3,4]] => [[{x: 11, y: 12}, {x: 13, y: 14}], [{x: 1, y: 2}, {x: 3, y: 4}]]
export const convertPonitsStructure = (data) => {
  if (!data.segmentation || !Array.isArray(data.segmentation)) {
    // 数据结构不符合要求，返回原始数据
    return data;
  }
  // const flatArr = data.segmentation.flat()
  
  const result = [];
  for (let i = 0; i < data.segmentation.length; i++) {
    const element = data.segmentation[i];

    const res = [];
    for (let i = 0; i < element.length; i += 2) {
      const obj = {
        x: element[i],
        y: element[i + 1]
      };
      res.push(obj);
    }
    result.push(res)
  }

  return result;
}

export const filterAnnotations = (annotaitons) => {
  return annotaitons.filter(item => item.segmentation.length)
}


export const getMarkPositions = (labels) => {
  const temp = getAnnotations(labels)
  const annotaitons = filterAnnotations(temp)
  const markPositions = annotaitons.map(item => {
    return {
      id: item.id,
      labelColor: "#FF0000",
      type: "polygon",
      positionList: convertPonitsStructure(item)
    }
  })
  return markPositions
}

export const convertToRectangle = (obj, type) => {
  if (obj.length !== 1 || obj[0].length !== 8) {
      return null; // 输入格式不正确
  }

  const x1 = obj[0][0];
  const y1 = obj[0][1];
  const x2 = obj[0][2];
  const y2 = obj[0][3];
  const x3 = obj[0][4];
  const y3 = obj[0][5];
  const x4 = obj[0][6];
  const y4 = obj[0][7];

  const minX = Math.min(x1, x2, x3, x4);
  const minY = Math.min(y1, y2, y3, y4);
  const maxX = Math.max(x1, x2, x3, x4);
  const maxY = Math.max(y1, y2, y3, y4);

  const width = maxX - minX;
  const height = maxY - minY;
  if (type === 'ScreenShot') {
    return {
      x1: minX,
      y1: minY,
      x2: maxX,
      y2: maxY
    }
  } else {
    return {
        x: minX,
        y: minY,
        w: width,
        h: height
    };
  }
}

export const convertToCoordinates = (obj) => {
  if (!obj || typeof obj !== 'object') {
      return []; // 返回空数组，处理 null、undefined 和非对象的情况
  }

  const x = obj.x;
  const y = obj.y;
  const w = obj.w;
  const h = obj.h;

  if (typeof x !== 'number' || typeof y !== 'number') {
      return []; // 返回空数组，处理 x 或 y 不是数字的情况
  }

  if (typeof w === 'undefined' || typeof h === 'undefined') {
      return [[x, y]]; // 只有 x 和 y 的情况，返回一个包含 x 和 y 的二维数组
  }

  if (typeof w !== 'number' || typeof h !== 'number') {
      return []; // 返回空数组，处理 w 或 h 不是数字的情况
  }

  const x1 = x;
  const y1 = y;
  const x2 = x + w;
  const y2 = y;
  const x3 = x
  const y3 = y + h;
  const x4 = x + w;
  const y4 = y + h;

  // return [[x1, y1, x2, y2, x3, y3, x4, y4]];
  return [[x2, y2, x4, y4, x3, y3, x1, y1]];
}

export const getCenterPoint = (obj) => {
  if (obj.length !== 1 || obj[0].length !== 8) {
      return null; // 输入格式不正确
  }

  const x1 = obj[0][0];
  const y1 = obj[0][1];
  const x2 = obj[0][2];
  const y2 = obj[0][3];
  const x3 = obj[0][4];
  const y3 = obj[0][5];
  const x4 = obj[0][6];
  const y4 = obj[0][7];

  // 计算矩形的中心点坐标
  const centerX = (x1 + x2 + x3 + x4) / 4;
  const centerY = (y1 + y2 + y3 + y4) / 4;

  // 返回中心点坐标
  return {
    x: centerX,
    y: centerY
  }
}
/**
 * 返回取整的中心点
 */
export const getIntCenterPoint = (obj) => {
  if (obj.length !== 1 || obj[0].length !== 8) {
    return null; // 输入格式不正确
  }
  const { x, y } = getCenterPoint(obj)
  return {
    x: Math.round(x),
    y: Math.round(y)
  }
}