import G6 from "@antv/g6/build/g6";
import {truncateStringToFitWidth, uniqueId} from '../../utils'
import Shape from '@antv/g/src/shapes'

const customDiamond = {
  init() {
    G6.registerNode("customDiamond", {
      draw(cfg, group) {
        let size = cfg.size;
        if(!size){
          size=[170,34]
        }
        if(!cfg.label.includes(cfg.id || '')) {
          // 节点名称拼接上id
          cfg.label = `${cfg.id}${cfg.label}`
        }
        // 此处必须是NUMBER 不然bbox不正常
        const width = parseInt(size[0]);
        const height = parseInt(size[1]);
        const color = cfg.color;
        // 此处必须有偏移 不然drag-node错位
        const offsetX = -width / 2
        const offsetY = -height / 2
        const mainId = 'diamond' + uniqueId()

        const points = [
          [0, offsetY],
          [-offsetX, 0],
          [0, -offsetY],
          [offsetX, 0],
        ];
        // const points = [
        //   [width / 2, 0],
        //   [width, height / 2],
        //   [width / 2, height],
        //   [0, height / 2],
        // ];

        const path = [];
        for (let i = 0; i < points.length; i++) {
          const point = points[i];
          if (i === 0) {
            path.push(['M', point[0], point[1]]);
          } else {
            path.push(['L', point[0], point[1]]);
          }
        }
        path.push(['Z']);

        const shape = group.addShape("path", {
          attrs: {
            id: mainId,
            x: offsetX,
            y: offsetY,
            width: width,
            height: height,
            stroke: "#ced4d9",
            fill: '#fff',//此处必须有fill 不然不能触发事件
            radius: 4,
            path: path,
          }
        });
        group.addShape("path", {
          attrs: {
            x: offsetX,
            y: offsetY,
            width: 4,
            height: height,
            fill: color,
            parent: mainId,
            radius: [4, 0, 0, 4],
            path: path,
          }
        });
        group.addShape("image", {
          attrs: {
            x: offsetX + 16,
            y: offsetY + 8,
            width: 20,
            height: 16,
            img: cfg.image,
            parent: mainId
          }
        });
        group.addShape("image", {
          attrs: {
            x: offsetX + width - 32,
            y: offsetY + 8,
            width: 16,
            height: 16,
            parent: mainId,
            img: cfg.stateImage
          }
        });
        if(cfg.backImage){
          const clip = new Shape.Rect({
            attrs: {
              x: offsetX,
              y: offsetY,
              width: width,
              height: height,
              fill:'#fff',
              radius: 4
            }
        });
          group.addShape("image", {
            attrs: {
              x: offsetX,
              y: offsetY,
              width: width,
              height: height,
              img: cfg.backImage,
              clip: clip
            }
          });
        }
        // group.addShape("text", {
        //   attrs: {
        //     id: 'logic' + uniqueId(),
        //     x: offsetX,
        //     y: 0,
        //     textAlign: "center",
        //     textBaseline: "middle",
        //     text: "True",
        //     parent: mainId,
        //     fill: "#27659a",
        //     fontSize: 15
        //   }
        // });
        // group.addShape("text", {
        //   attrs: {
        //     id: 'logic' + uniqueId(),
        //     x: -offsetX,
        //     y: 0,
        //     textAlign: "center",
        //     textBaseline: "middle",
        //     text: "False",
        //     parent: mainId,
        //     fill: "#27659a",
        //     fontSize: 15
        //   }
        // });
        if (cfg.label) {
           group.addShape("text", {
            attrs: {
              id: 'label' + uniqueId(),
              x: offsetX + width / 2,
              y: offsetY + height / 2,
              textAlign: "center",
              textBaseline: "middle",
              text: cfg.label,
              parent: mainId,
              fill: "#27659a",
              fontSize: 15
            }
          });
        }
        if (cfg.inPoints) {
          for (let i = 0; i < cfg.inPoints.length; i++) {
            let x,
              y = 0;
            //0为顶 1为底
            if (cfg.inPoints[i][0] === 0) {
              y = 0;
            } else if (cfg.outPoints[i][0] === 0.5){
              y = height * cfg.outPoints[i][0];
            }else {
              y = height;
            }
            x = width * cfg.inPoints[i][1];
            const id = 'circle' + uniqueId()
            group.addShape("circle", {
              attrs: {
                id: 'circle' + uniqueId(),
                parent: id,
                x: x + offsetX,
                y: y + offsetY,
                r: 10,
                isInPointOut: true,
                fill: "#1890ff",
                opacity: 0,
                item: cfg.inPoints[i][2],
                index: i,
              }
            });
            group.addShape("circle", {
              attrs: {
                id: id,
                x: x + offsetX,
                y: y + offsetY,
                r: 3,
                isInPoint: true,
                fill: "#fff",
                stroke: "#1890ff",
                opacity: 0,
                item: cfg.inPoints[i][2],
                index: i,
              }
            });

            group.addShape("text", {
              attrs: {
                id: 'InPoint' + uniqueId(),
                x: x + offsetX,
                y: y + offsetY + 6,
                textAlign: "center",
                textBaseline: "middle",
                text: truncateStringToFitWidth(cfg.inPoints[i][2]['varName'], parseInt(width/(cfg.inPoints.length)), 10),
                parent: mainId,
                fill: "#27659a",
                fontSize: 10,
              }
            });
          }
        }
        if (cfg.outPoints) {
          for (let i = 0; i < cfg.outPoints.length; i++) {
            let x,
              y = 0;
            //0为顶 1为底
            if (cfg.outPoints[i][0] === 0) {
              y = 0;
            } else if (cfg.outPoints[i][0] === 0.5){
              y = height * cfg.outPoints[i][0];
            } else {
              y = height;
            }
            x = width * cfg.outPoints[i][1];
            const id = 'circle' + uniqueId()
            group.addShape("circle", {
              attrs: {
                id: 'circle' + uniqueId(),
                parent: id,
                x: x + offsetX,
                y: y + offsetY,
                r: 10,
                isOutPointOut: true,
                fill: "#1890ff",
                opacity: 0,//默認0 需要時改成0.3
                item: cfg.outPoints[i][2],
                index: i,
              }
            });
            group.addShape("circle", {
              attrs: {
                id: id,
                x: x + offsetX,
                y: y + offsetY,
                r: 3,
                isOutPoint: true,
                fill: "#fff",
                stroke: "#1890ff",
                opacity: 0,
                item: cfg.outPoints[i][2],
                index: i,
              }
            });

            group.addShape("text", {
              attrs: {
                id: 'OutPoint' + uniqueId(),
                x: x + offsetX,
                y: y + offsetY - 6,
                textAlign: "center",
                textBaseline: "middle",
                text: truncateStringToFitWidth(cfg.outPoints[i][2]['varName'], parseInt(width/(cfg.outPoints.length)), 10),
                parent: mainId,
                fill: "#27659a",
                fontSize: 10,
              }
            });
          }
        }
        //group.sort()
        // 添加文本、更多图形
        return shape;
      },
      //设置状态
      setState(name, value, item) {
        const group = item.getContainer();
        const shape = group.get("children")[0]; // 顺序根据 draw 时确定

        const children = group.findAll(g => {
          return g._attrs.parent === shape._attrs.id
        });
        const circles = group.findAll(circle => {
          return circle._attrs.isInPoint || circle._attrs.isOutPoint;
        });
        const selectStyles = () => {
          shape.attr("fill", "#f3f9ff");
          shape.attr("stroke", "#6ab7ff");
          shape.attr("cursor", "move");
          children.forEach(child => {
            child.attr("cursor", "move");
          });
          circles.forEach(circle => {
            circle.attr('opacity', 1)
          })
        };
        const unSelectStyles = () => {
          shape.attr("fill", "#fff");
          shape.attr("stroke", "#ced4d9");
          circles.forEach(circle => {
            circle.attr('opacity', 0)
          })
        };
        switch (name) {
          case "selected":
          case "hover":
            if (value) {
              selectStyles()
            } else {
              unSelectStyles()
            }
            break;
        }
      }
    });
  }
}

export default customDiamond
