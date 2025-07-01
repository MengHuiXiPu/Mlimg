import { activeAreaConfig, makeSVG } from "@/components/ImagePreview/config";

export default {
  methods: {
    // 渲染svg(生成小图标注)
    // 入参：图片id，图片记录
    render(imageId, imageRecord, imgName, svgName) {
      const a = imgName + String(imageId)
      const b = svgName + String(imageId)
      const img = document.getElementById(a);
      const svg = document.getElementById(b);
      this.$nextTick(() => {
        svg && (svg.innerHTML = "");
      });
      if (img && img.naturalWidth) {
        const scaleX = img.naturalWidth / img.offsetWidth;
        const scaleY = img.naturalHeight / img.offsetHeight;
        imageRecord.markPositions.forEach((item) => {
          const { id, label, labelColor, type, position, positionList } = item;
          // 判断是否为多维数组
          const isMultiDimensionalArray = (data) => {
            if (Array.isArray(data)) {
              for (let i = 0; i < data.length; i++) {
                if (Array.isArray(data[i])) {
                  return true;
                }
              }
            }
            return false;
          }
          const makeSVGFunc = (index, position) => {
            const config = activeAreaConfig(
              {
                id: id + "_detail" + index,
                label,
                type,
                position,
                ...{ labelColor: '#FFFFFF' },
              },
              scaleX,
              scaleY,
              {}
            );
            const graphics = makeSVG(item.type, config);
            graphics.setAttribute("fill", '#FF000096');
            this.$nextTick(() => {
              svg && svg.appendChild(graphics);
              // console.log(svg)
            });
          }
          if (isMultiDimensionalArray(positionList)) {
            for (let i = 0; i < positionList.length; i++) {
              const element = positionList[i];
              makeSVGFunc(i, element)
            }
          }
          // else {
          //   makeSVGFunc('', position)
          // }
        });
      }
    },
  },
}
