
function getAllChildNodes(graph, nodeId, visited = new Set(), result = []) {
  if (visited.has(nodeId)) {
    return result;
  }

  visited.add(nodeId);

  const edges = graph.getEdges();
  const children = edges
      .filter((edge) => edge.getModel().sourceId == nodeId)
      .map((edge) => edge.getTarget());

  // result.push(...children);
  children.forEach((child) => {
    if(!result.find(re => re._cfg.id == child._cfg.id)) { //避免重复
      result.push(child)
    }
    getAllChildNodes(graph, child.getModel().id, visited, result);
  });
  return result;
}

// 递归获取所有父节点
function getAllParentNodes(graph, nodeId, visited = new Set(), result = []) {
  if (visited.has(nodeId)) {
    return result;
  }

  visited.add(nodeId);

  const edges = graph.getEdges();
  const parents = edges
      .filter((edge) => edge.getModel().targetId == nodeId)
      .map((edge) => edge.getSource());
  parents.forEach(parent => {
    const model = parent.getModel()
    if(model.shape != "customDiamond" && !result.find(re => re._cfg.id == parent._cfg.id)) {
      // 加入结果集
      result.push(parent)
      // 递归查找父节点
      getAllParentNodes(graph, parent.getModel().id, visited, result);
    }
  })
  // result.push(...parents);

  // parents.forEach((parent) => {
  //   getAllParentNodes(graph, parent.getModel().id, visited, result);
  // });

  return result;
}
// 
/**
 * 递归获取所有父节点（会过滤掉正在删除的边），这样得到的所有父节点都是在删除节点/边之后仍存在路径关联的
 * @param {*} graph 
 * @param {*} nodeId 
 * @param {[]} edgeIds: 当删除节点时，是该节点关联的所有edge集合，当删除的是edge时，是[该edge的id]
 * @param {*} visited 
 * @param {*} result 
 * @returns 
 */
function _getAllParentNodes(graph, nodeId, edgeIds, visited = new Set(), result = []) {
  if (visited.has(nodeId)) {
    return result;
  }
  edgeIds = edgeIds.map(e => parseInt(e))
  visited.add(nodeId);
  // 过滤掉涉及删除的边
  const edges = graph.getEdges().filter(_edge => !edgeIds.includes(parseInt(_edge.getModel().id)) )
  const parents = edges
      .filter((edge) => edge.getModel().targetId == nodeId)
      .map((edge) => edge.getSource());
  parents.forEach(parent => {
    const model = parent.getModel()
    if(model.shape != "customDiamond" && !result.find(re => re._cfg.id == parent._cfg.id)) {
      // 加入结果集
      result.push(parent)
      // 递归查找父节点
      _getAllParentNodes(graph, parent.getModel().id, edgeIds, visited, result);
    }
  })
  return result;
}
function findEdgesBetweenNodes(graph, sourceNodeId, targetNodeId) {
  const edges = graph.getEdges().filter(
      (edge) =>
          edge.getModel().sourceId == sourceNodeId && edge.getModel().targetId == targetNodeId
  );
  return edges;
}
// 删除节点的函数
function deleteNode(graph, item) {
  let models = [];
  let nodeId = item.getModel().id;
  const allChildNodes = getAllChildNodes(graph, nodeId);

  const allParentNodes = getAllParentNodes(graph, nodeId);

  const parentNodeIds = allParentNodes.map((node) => node._cfg.id);
  // parentNodeIds.push(nodeId)
  // console.log('所有子节点:', allChildNodes);
  // console.log('所有父节点:', allParentNodes);
  // console.log('所有父节点id:', parentNodeIds);
  // 删除继承关系
  allChildNodes.forEach(node => {
    let model = node._cfg.model;
    // 获取当前子node的所有祖先节点
    const nodeAllParentsNodes = _getAllParentNodes(graph, model.id, item._cfg.edges.map(ed=> ed._cfg.id))
    const nodeAllParentsIds = nodeAllParentsNodes.map(nd => parseInt(nd._cfg.id));
    // 只有仅仅是sourceId节点的父节点的继承数据需要删除，既是sourceId又是当前node的父节点的节点说明仍有其他路径来保持继承关系
    const resNodeIdList = parentNodeIds.map(p=>parseInt(p)).filter(n => !nodeAllParentsIds.includes(n))
    // 将当前删除的节点加进来，以移除children中该节点的继承信息
    resNodeIdList.push(nodeId)
    model.items = model.items.map(item => {
      resNodeIdList.forEach(pNodeId => {
        const idx = (item.inheritNodeIds ||[]).findIndex(n => n == pNodeId)
        if(idx > -1) {
          item.inheritNodeIds.splice(idx, 1)
          item.inheritVariables.splice(idx, 1)
        }
      })
      return item;
    });
    models.push(model);
    // graph.update(node, model);
  });
  return models;
}

/**
 * 删除边的函数
 * @param {*} graph 
 * @param {*} item  要删除的边
 * @returns 
 */
function deleteEdge(graph, item) {
  let models = [];
  // 找到要删除的边的索引
  const allChildNodes = getAllChildNodes(graph, item.getModel().sourceId);

  const allParentNodes = getAllParentNodes(graph, item.getModel().sourceId);

  const parentNodeIds = allParentNodes.map((node) => node._cfg.id);
  parentNodeIds.push(item.getModel().sourceId)
  const edges = findEdgesBetweenNodes(graph, item.getModel().sourceId, item.getModel().targetId)
  // console.log('所有子节点:', allChildNodes);
  // console.log('所有父节点:', allParentNodes);
  // console.log('所有父节点id:', parentNodeIds);
  // console.log('所有的边id:', edges);
  // 该edge的target节点的item中的继承数据都是要清除的
  const { targetId,endVar,sourceId,startVar } = item.getModel()
  // 获取要删除的edge的起始节点+起始变量信息
  if(endVar) { //移除该节点上该变量的继承关系
    const targetNode = allChildNodes.find(child => child.getModel().id == targetId)
    const targetItem = (targetNode.getModel().items || []).find(item =>item.varName == endVar)
    if(Array.isArray(targetItem.inheritNodeIds) && targetItem.inheritNodeIds.length) {
      const idx = targetItem.inheritNodeIds.findIndex(n => n == sourceId)
      targetItem.inheritNodeIds.splice(idx, 1)
      targetItem.inheritVariables.splice(idx, 1)
    }
  }
  if (edges.length == 1) {  //说明该连线是两节点间唯一连线，可能导致继承路径中断，需要做更多判断
    // 检查节点中的items中的信息
    allChildNodes.forEach(node => {
      let model = node._cfg.model;
      
      // 获取当前子node的所有祖先节点
      const nodeAllParentsNodes = _getAllParentNodes(graph, model.id, [item.getModel().id])
      const nodeAllParentsIds = nodeAllParentsNodes.map(nd => parseInt(nd._cfg.id));

      // 说明sourceId节点与当前节点仍存在路径关联，则不需要删除继承关系
      if(nodeAllParentsIds.includes(parseInt(item.getModel().sourceId))) {
        return models.push(model); 
      }
      // 移除节点items中对应的继承信息
      // 只有仅仅是sourceId节点的父节点的继承数据需要删除，既是sourceId又是当前node的父节点的节点说明仍有其他路径来保持继承关系
      const resNodeIdList = parentNodeIds.map(p=>parseInt(p)).filter(n => !nodeAllParentsIds.includes(n))
      model.items = (model.items || []).map(item => {
        resNodeIdList.forEach(pNodeId => {
          const idx = (item.inheritNodeIds ||[]).findIndex(n => n == pNodeId)
          if(idx > -1) {
            // inheritNodeIds和inheritVariables中的节点和变量位置是对应的，所以splcie时都使用idx即可
            item.inheritNodeIds.splice(idx, 1)
            item.inheritVariables.splice(idx, 1)
          }
        })
        return item;
      });
      models.push(model);
      // graph.update(node, model);
    });
  }
  
  return models;
}

function deleteItem(graph, items) {
  let models = []
  items.map(item => {
    if (item.getType() === 'node') {
      models.concat(...deleteNode(graph, item));
    } else if (item.getType() === 'edge') {
      models.concat(...deleteEdge(graph, item));
    }
  });
  return models;
}

export {
  deleteItem
};