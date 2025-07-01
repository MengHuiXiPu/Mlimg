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


export const getMarkPositions = (annotaitons) => {
  const temp = filterAnnotations(annotaitons)
  const markPositions = temp.map(item => {
    return {
      id: item.id,
      labelColor: "#FF0000",
      type: "polygon",
      positionList: convertPonitsStructure(item)
    }
  })
  return markPositions
}

// 数组的diff算法
export const arrayDiff = (A, B) => {
  const operations = [];
  const map = new Map();

  for (let i = 0; i < B.length; i++) {
    const item = B[i];
    if (!map.has(item)) {
      map.set(item, 0);
    }
    map.set(item, map.get(item) + 1);
  }

  for (let j = 0; j < A.length; j++) {
    const item = A[j];
    if (map.has(item) && map.get(item) > 0) {
      map.set(item, map.get(item) - 1);
    } else {
      operations.push({ type: 'delete', index: j, item });
    }
  }

  for (let k = 0; k < B.length; k++) {
    const item = B[k];
    if (map.has(item) && map.get(item) > 0) {
      operations.push({ type: 'insert', index: k, item });
      map.set(item, map.get(item) - 1);
    }
  }

  return operations;
}

// 防抖
export const debounce = (func, delay) => {
  let timer;
  return function () {
    const args = arguments;
    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(undefined, args);
    }, delay);
  };
}

// 控制并发
export const fetchDataConcurrently = async(requests, concurrencyLimit) => {
  const results = [];

  // 分组并发请求
  while (requests.length > 0) {
    const currentRequests = requests.slice(0, concurrencyLimit);
    const currentPromises = currentRequests.map(request => request);
    // console.log(currentPromises.length)
    try {
      const responses = await Promise.all(currentPromises);
      for (const response of responses) {
        results.push(response.data.records);
      }
    } catch (error) {
      console.error('Error in requests:', error);
    }

    // 移除已处理的请求
    requests = requests.slice(concurrencyLimit);
  }
  // console.log(results)
  // 返回所有结果
  return results.flat();
}

// const A = ['a', 'b', 'c'];
// const B = ['t', 'c', 'b', 'a', 'r'];

// const result4 = arrayDiff(A, B);
// 期望输出: [{ type: 'insert', index: 0, item: 't' }, { type: 'insert', index: 4, item: 'r' }]

// const A = ['a', 'b', 'c'];
// const B = ['a', 'c'];

// const result2 = arrayDiff(A, B);
// 期望输出: [{ type: 'delete', index: 1 }]