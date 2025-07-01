<template>
    <div>
        
        <div class="box">
            <div class="left">
                <canvas class="container"></canvas>
                <div>
                    <a-button type="primary" @click="change(1)" style="margin:5px">矩形</a-button>
                    <a-button type="primary" @click="change(2)" style="margin: 5px">多边形</a-button>
                    <a-button type="primary" @click="change(3)" style="margin: 5px">点</a-button>
                    <a-button type="primary" @click="change(4)" style="margin: 5px">折线</a-button>
                    <a-button type="primary" @click="change(5)" style="margin: 5px">圆</a-button>
                    <a-button type="primary" @click="change(0)" style="margin: 5px">取消</a-button>
                    <br />
                    <a-button type="primary" @click="zoom(true)" style="margin: 5px">+</a-button>
                    <a-button type="primary" @click="zoom(false)" style="margin: 5px">-</a-button>
                    <a-button type="primary" @click="fitting()" style="margin: 5px">图片自适应大小</a-button>
                    <a-button type="primary" @click="onFocus()" style="margin: 5px">仅显示当前选中标注</a-button>
                    <a-button type="primary" @click="update()" style="margin: 5px">更新</a-button>
                </div>
            </div>
            <div class="right">
                <div>output:(尝试修改下面的数据吧)</div>
                <textarea id="output" @change="changeData" ref="output"></textarea>
            </div>
            <div class="right">
                <pre>1.设置 instance.createType 指定需要创建形状类型。

2.创建矩形时，按住鼠标左键拖动完成创建。

3.创建多边形时，鼠标左键单击添加点，双击闭合完成创建，Escape退出创建，Backspace退一步删除选择点。

4.创建折线时，鼠标左键单击添加点，双击完成创建，Escape退出创建，Backspace退一步删除选择点。

5.按住鼠标右键拖动画布。

6.鼠标滚轮缩放画布。

7.选中形状，Backspace删除。
</pre>
                <h1>Have fun!</h1>
            </div>
        </div>
        
    </div>
</template>
<script>
    export default {
        name: 'CanvasSelect',
        components: {//引用的其他组件

        },
        props: {//从父组件传来数据

        },
        data() {
            return {
                instance: null,
            }
        },
        computed:{

        },
        mounted() {
            const option = [
                {
                    label: "rect",
                    labelFillStyle: "#f00",
                    textFillStyle: "#fff",
                    fillStyle: "rgba(130,22,220,.6)",
                    coor: [
                        [184, 183],
                        [275, 238]
                    ],
                    type: 1
                },
                {
                    label: "polygon",
                    active: false,
                    coor: [
                        [135, 291],
                        [129, 319],
                        [146, 346],
                        [174, 365],
                        [214, 362],
                        [196, 337],
                        [161, 288]
                    ],
                    type: 2
                },
                {
                    label: "dot",
                    coor: [345, 406],
                    type: 3
                },
                {
                    label: "line",
                    coor: [
                        [456, 153],
                        [489, 228],
                        [492, 296]
                    ],
                    type: 4
                },
                {
                    label: "circle",
                    coor: [369, 197],
                    radius: 38,
                    type: 5
                }
            ];
            const script = document.createElement('script');
            /*
            script.setAttribute('src', 'https://unpkg.com/canvas-select@^2/lib/canvas-select.min.js');
            document.head.appendChild(script);
            */
            script.type='text/javascript'
            // script.src = '../canvas-select.min.js';
            script.src = '@/assets/canvas-select.min.js';
            script.async = true;
            script.onload = () => {
                this.instance = new CanvasSelect(
                    ".container",
                    "https://cdn.jsdelivr.net/npm/@heylight/cdn@%5E1/img/onepiece.png"
                );
                this.instance.labelMaxLen = 10;
                this.instance.setData(option);

                // 图片加载完成
                this.instance.on("load", (src) => {
                    console.log("image loaded", src);
                });
                // 添加
                this.instance.on("add", (info) => {
                    console.log("add", info);
                    window.info = info;
                });
                // 删除
                this.instance.on("delete", (info) => {
                    console.log("delete", info);
                    window.info = info;
                });
                // 选中
                this.instance.on("select", (shape) => {
                    console.log("select", shape);
                    window.shape = shape;
                });
                this.instance.on("updated", (result) => {
                    const list = [...result];
                    list.sort((a, b) => a.index - b.index);
                    this.$refs.output.value = JSON.stringify(list, null, 2);
                });


            }
            document.body.appendChild(script)
            /*
            this.instance = new CanvasSelect(
                ".container",
                "https://cdn.jsdelivr.net/npm/@heylight/cdn@%5E1/img/onepiece.png"
            );
            */
            
            
        },
        methods: {
            change(num) {
                this.instance.createType = num;
            },
            zoom(type) {
                this.instance.setScale(type);
            },
            fitting() {
                this.instance.fitZoom();
            },
            changeData() {
                const data = JSON.parse(this.$refs.output.value);
                this.instance.setData(data);
            },
            onFocus() {
                this.instance.setFocusMode(!this.instance.focusMode);
            },
            update() {
                this.instance.updateData();
            }
        }
    }
</script>
<style scoped>
    .box {
        display: flex;
    }
    .container {
        background-color: #ccc;
        width: 500px;
        height: 500px;
    }
    .right {
        margin-left: 20px;
    }
    #output {
        height: 450px;
        width: 400px;
    }
</style>