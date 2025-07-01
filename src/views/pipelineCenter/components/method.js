import Operator from "@/api/operator.js";
export default {
  methods: {
    convertObjectToArray(obj, id, funcName, prefix = "") {
      const result = [];
      const base64toBlob = (base64) => {
        const binaryString = window.atob(base64);
        const length = binaryString.length;
        const arrayBuffer = new ArrayBuffer(length);
        const uint8Array = new Uint8Array(arrayBuffer);

        for (let i = 0; i < length; i++) {
          uint8Array[i] = binaryString.charCodeAt(i);
        }

        return new Blob([arrayBuffer], { type: "image/jpeg" }); // 根据实际情况设置 MIME 类型
      };
      const processValue = async (value, id, funcName) => {
        // 在这里添加你的业务逻辑，例如判断是否是图片路径，然后调用接口转换成资源
        const imageFormats = [".png", ".jpg", ".jpeg"];
        if (
          typeof value === "string" &&
          imageFormats.some((format) => value.endsWith(format))
        ) {
          const res = await Operator[funcName]({
            id: id,
            imgPath: value,
          });
          const blobObject = base64toBlob(res.data);
          value = window.URL.createObjectURL(blobObject);
        }
        return value;
      };

      const traverse = async (obj, id, funcName, prefix = "") => {
        for (const [key, value] of Object.entries(obj)) {
          const varName = prefix ? `${prefix}.${key}` : key;

          if (typeof value === "object" && value !== null) {
            traverse(value, id, funcName, varName);
          } else {
            const val = await processValue(value, id, funcName);
            // 在这里调用处理值的函数，并将处理后的值加入结果数组
            result.push({ varName, value: val });
          }
        }
      };

      traverse(obj, id, funcName, prefix);

      return result;
    }
  }
}