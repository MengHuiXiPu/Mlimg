


/**
 * @description 将后台的格式转换为前端需要的格式，即将inheritNodeIds+inheritVariables -》 inheritData
 * 示例：inheritNodeIds:[3,1,2] 与inheritVariables: [['dst'],['dst'],['imgclass', 'imgOut']] -》 [[3,"dst"],[1,"dst"],[2,"imgclass"],[2,"imgOut"]]
 * @param {*} inheritNodeIds 
 * @param {*} inheritVariables 
 * @returns 
 */
export function toInheritData(inheritNodeIds = [], inheritVariables = []) {
  // 如果 inheritNodeIds 或 inheritVariables 为 null 或 undefined，返回空数组
  if (!Array.isArray(inheritNodeIds) || !Array.isArray(inheritVariables)) {
    return [];
  }

  return inheritNodeIds.map((id, index) => {
    // 如果 inheritVariables[index] 不是数组，返回空数组
    if (!Array.isArray(inheritVariables[index])) {
      return [];
    }

    return inheritVariables[index].map(variable => [id, variable]);
  }).flat();
}

/**
 * @description: 将 inheritData 转换为 inheritNodeIds+inheritVariables
 * @param {*} inheritData 
 * @returns 
 */
export function fromInheritData(inheritData = []) {
  // 如果 inheritData 为 null 或 undefined，返回空对象
  if (!Array.isArray(inheritData)) {
    return { inheritNodeIds: [], inheritVariables: [] };
  }
  const inheritNodeIds = [];
  const inheritVariables = [];

  inheritData.forEach(([id, variable]) => {
    const index = inheritNodeIds.indexOf(id);

    // 如果 id 或 variable 为 null 或 undefined，跳过
    if (id == null || variable == null) {
      return;
    }
    if (index === -1) {
      inheritNodeIds.push(id);
      inheritVariables.push([variable]);
    } else {
      inheritVariables[index].push(variable);
    }
  });

  return { inheritNodeIds, inheritVariables };
}

/**
 * 将x6 graph导出的平铺形式的nodes/edges转换成children 递归形式的nodes/edges来保存
 * @param {*} nodes 
 * @param {*} edges 
 * @returns 
 */
export function transformToHierarchy(nodes, edges) {
  const nodeMap = new Map(); // 用于快速查找节点
  const resultNodes = [];
  const resultEdges = [];

  // 初始化节点映射表
  nodes.forEach(node => {
    nodeMap.set(node.id, { ...node, children: { nodes: [], edges: [] } });
  });

  // 构建层级结构
  nodes.forEach(node => {
    if (node.parent) {
      const parent = nodeMap.get(node.parent);
      if (parent) {
        parent.children.nodes.push(nodeMap.get(node.id));
      }
    } else {
      resultNodes.push(nodeMap.get(node.id));
    }
  });

  // 处理边
  edges.forEach(edge => {
    if (edge.parent) {
      const parent = nodeMap.get(edge.parent);
      if (parent) {
        parent.children.edges.push(edge);
      }
    } else {
      resultEdges.push(edge);
    }
  });

  return { nodes: resultNodes, edges: resultEdges };
}

// export function flattenHierarchy(nodes, edges) {
//   const flatNodes = [];
//   const flatEdges = [...edges]; // 顶层边不需要处理
//   function traverse(node, parentId = null) {
//     const { children, ...rest } = node;
//     flatNodes.push({ ...rest, parent: parentId });

//     if (children) {
//       children.nodes.forEach(child => traverse(child, node.id));
//       children.edges.forEach(edge => flatEdges.push({ ...edge, parent: node.id }));
//     }
//   }
//   nodes.forEach(node => traverse(node));
//   return { nodes: flatNodes, edges: flatEdges };
// }
/**
 * @description 将嵌套graph数据转为平铺，通过parent字段关联
 * @param {*} nodes 
 * @param {*} edges 
 * @returns 
 */
export function flattenHierarchy(nodes, edges) {
  const flatNodes = [];
  const flatEdges = [...edges]; // 顶层边不需要处理
  function traverse(node, parentId = null) {
    const { children, ...rest } = node;
    const nodeWithChildren = { ...rest, parent: parentId, children: [] };
    if (children) {
      // 添加子节点 ID 到 children 属性
      children.nodes.forEach(child => {
        nodeWithChildren.children.push(child.id); // 添加子节点的 id
        traverse(child, node.id);
      });
      // 添加子边 ID 到 children 属性
      children.edges.forEach(edge => {
        nodeWithChildren.children.push(edge.id); // 添加子边的 id
        flatEdges.push({ ...edge, parent: node.id });
      });
    }
    flatNodes.push(nodeWithChildren);
  }
  nodes.forEach(node => traverse(node));
  return { nodes: flatNodes, edges: flatEdges };
}




