<template>
    <div class="report">
        <a-divider plain>数据分析结果报表</a-divider>
        <div style="text-align:center">
            <a-spin v-if="tabs_loading"></a-spin>
        </div>
        <a-radio-group :value="value" size="middle" buttonStyle="solid" @change="handleChange" style="width:100%">
            <!--报表列表-->
            <a-radio-button v-for="tab in tabs" :key="tab.id" :value="tab.id" :style="radio_button_style">
                {{tab.name}}
            </a-radio-button>
            <!--导出报表-->
            <a-icon style="float: right;font-size: 20px;margin:20px;" type="download" @click="exportExcel" v-if="dataSource.length > 0" />
        </a-radio-group>
        <div style="text-align:center;height:150px;" v-if="table_loading&&!tabs_loading&&flag1">
            <a-spin size="large"></a-spin>
        </div>
        <!--报表内容-->
        <a-table :scroll="{ x: '1050px', y: value == 3 ? 'calc(100vh - 440px)' : '400px' }"
                 bordered
                 :pagination="value == 3 ? false : pagination"
                 :columns="columns"
                 :data-source="dataSource"
                 :rowKey="(record,index) =>index"
                 :customRow="customRow"
                 @resizeColumn="handleResizeColumn"
                 :loading="table_loading"
                 v-if="dataSource.length > 0">
        </a-table>
        <NoData class="nodata" v-if="!table_loading && !tabs_loading && dataSource.length===0"/>
    </div>
</template>

<script>
    import { axios } from '@/utils/request'
    import {
        getTabs,
        getTabData,
    } from "@/api/modelManage"
    import { NoData } from "@/components"
    import configSystem from "@/config/system";
    export default {
        name: 'Report',
        components: {
            NoData,
        },
        props: {//从父组件传来数据
            modelId: {//模型id
                type: String,
                default: null
            },
            taskId: {//离线报告id
                type: String,
                default: null
            }
        },
        data() {
            return {
                value: 1,//报表选框显示控制
                tabs:[],//报表列表
                columns: [],//当前报表表头
                dataSource: [],//当前报表数据内容
                pagination: {
                    total: 0,
                    pageSize: 100,
                    current: 1,
                    size: "small",
                    showSizeChanger: true,
                    pageSizeOptions: ["100", "500","1000", "2000", "10000"],
                    showTotal: function (total) {
                        return `共 ${total} 条`;
                    },
                    onShowSizeChange: (current, pageSize) => {//current为当前页码
                        console.log(current, pageSize);
                        this.pagination.pageSize = pageSize;
                        this.getData();
                    }
                },
                temp: null,
                tabs_loading:false,//报表选框是否正在加载中
                table_loading: false,//报表页面是否正在加载中
                flag1: true,//是否未进行过任何操作
                ImageId: null,//大图浏览id
                radio_button_style:null, 
            }
        },
        computed:{

        },
        mounted() {
            this.getTabs();//组件加载时调用读取报表列表函数
        },
        methods: {
            mysort(a, b) {//自定义排序函数，用于报表表头排序
                if (!isNaN(a) && !isNaN(b))
                    return parseInt(a) - parseInt(b);
                return a.localeCompare(b);
            },
            handleChange(e) {//单选框组切换
                this.value = e.target.value;
                this.getData();//读取对应报表数据
            },
            exportExcel() {//导出当前报表
                const url = "?indexName=" + this.tabs[this.value-1].name + "&modelId=" + this.modelId + "&taskId=" + this.taskId + "&pageNum=" + this.pagination.current + "&pageSize=" + this.pagination.pageSize;
                window.open("/api/v1/traincenter/modelManageInfo/downloadModelForecastDataanalysisTab" + url);
            },
            customRow(record) {//报表行格式
                return {
                    style: {
                        'height': '40px',
                    }
                }
            },
            clickEvent(row,col) {//点击显示图片 row:当前行数据 col:当前单元格列头
                return {
                    style: {
                        'cursor': 'pointer',
                    },
                    on: {
                        click: (event) => {
                            this.getImage(row[col]);//row[col]为当前单元格值
                        }
                    },
                }
            },
            handleResizeColumn: (w, col) => {
                col.width = w;
            },
            async getTabs() {//读取报表列表
                this.tabs_loading = true;
                const params = "?modelId=" + this.modelId + "&taskId=" + this.taskId;
                console.log("params: ", params);
                const res = await getTabs(params);
                console.log("res: ", res);
                if(res.code !== 0) {
                    this.tabs_loading = false;
                    return ;
                }
                const { data = [], code, msg } = res;
                let i = 1;
                // console.log("data: ", data)
                data.forEach(item => {
                    this.tabs.push({
                        id: i,
                        name: item
                    });
                    i++;
                })
                // this.radio_button_style = {//根据报表数量平均设置单选按钮宽度
                //     'width': 100 / this.tabs.length + '%',
                //     'text-align':'center'
                // }
                console.log(this.radio_button_style);
                this.value = 1;
                this.getData();//默认显示stat报表
                this.tabs_loading = false;
            },
            async getData() {//读取报表数据
                this.table_loading = true;
                const params = "?indexName=" + this.tabs[parseInt(this.value) - 1].name + "&modelId=" + this.modelId + "&taskId=" + this.taskId + "&pageNum="
                    + this.pagination.current + "&pageSize=" + this.pagination.pageSize;
                    console.log(222222);
                await getTabData(params).then((res) => {
                    console.log(55555);
                    const { data = [], code, msg } = res;
                    console.log(55555);
                    this.dataSource = data;
                    this.pagination.total = data.length;
                    console.log(this.pagination);
                    console.log("report res: ", res);
                    if (this.dataSource.length == 0) {
                        this.table_loading = false;
                        return;
                    }
                    for (let i = 0; i < this.dataSource.length; i++) {
                        for (let key in this.dataSource[i]) {
                            if (typeof (this.dataSource[i][key]) == "boolean")
                                this.dataSource[i][key] = this.dataSource[i][key].toString();
                            if (this.dataSource[i][key] === "" || this.dataSource[i][key] === null) 
                                this.dataSource[i][key] = "--";
                        }
                    }
                    let column_list = Object.keys(data[0]);
                    column_list = column_list.sort(this.mysort);//排好序后的表头
                    //自定义表头
                    this.columns = [];
                    let temp_columns = [];
                    for (let i = 0; i < column_list.length; i++) {
                        let width = column_list[i].length * 10 + 40 + 'px';
                        console.log(width);
                        if (column_list[i].length >= 16)
                            width = column_list[i].length * 8 + 50 + 'px';
                        else
                            width = column_list[i].length * 9 + 60 + 'px';
                        temp_columns.push({
                            title: column_list[i],//当前列标题
                            ellipsis: true,
                            dataIndex: column_list[i],
                            key: column_list[i],
                            width: width,
                            sorter: (a, b) => {
                                if (isNaN(a[column_list[i]]) == false || isNaN(a[column_list[i]]) == false) {//是数字
                                    //return a[column_list[i]] - b[column_list[i]];
                                    let inta, intb;
                                    if (a[column_list[i]] == "--") {
                                        inta = 0;
                                        intb = b[column_list[i]];
                                    }
                                    else if (b[column_list[i]] == "--") {
                                        intb = 0;
                                        inta = a[column_list[i]];
                                    }
                                    else {
                                        inta = a[column_list[i]];
                                        intb = b[column_list[i]];
                                    }
                                    return inta-intb;
                                }
                                else//不是数字
                                    return a[column_list[i]].localeCompare(b[column_list[i]]);
                            },
                        });
                    }
                    //添加各种事件
                    this.columns = temp_columns.map(item => {//item为当前表头，列标题为item.title
                        let filter_list = [];//当前列全部数据
                        this.dataSource.map(col => {//每行数据
                            filter_list.push(col[item.title]);
                        });
                        filter_list = Array.from(new Set(filter_list));//去重
                        let filters = filter_list.map(str => {
                            if(str.length>0)
                            return {
                                text: str,
                                value: str
                            }
                        });
                        //如果字段包含“Image_path”，则添加点击事件允许打开大图
                        if (item.title.indexOf("Image_path") != -1) {
                            //包含
                            return {
                                ...item,
                                filters: filters,
                                align: 'center',
                                onFilter: (value, record) => {
                                    if (record[item.title].indexOf(value) === 0)
                                        return true;
                                },
                                filterMultiple: true,
                                customCell: (row) => {
                                    return this.clickEvent(row, item.title);//为混淆矩阵添加点击事件
                                },
                                customHeaderCell: (row) => {
                                    return {
                                        style: {
                                            'background-color':'Gainsboro'//可点击的列设置灰色列头
                                        }
                                    }
                                },
                            }
                        }
                        else {
                            return {
                                ...item,
                                align: 'center',
                                filters: filters,
                                onFilter: (value, record) => {
                                    if (record[item.title].indexOf(value) === 0)
                                        return true;
                                },
                                filterMultiple: true,
                            }
                        }
                    })
                    this.table_loading = false;
                    this.flag1 = false;
                });
            },
            async getImage(id) {//点击显示大图
                // const url =   configSystem.webUrl  + id;
                const url = window.location.origin + id
                window.open(url);
            }
        }
    }
</script>

<style scoped lang="less">
.report {
    /deep/.ant-table-scroll .ant-table-hide-scrollbar {
    // margin-bottom: -10px !important;
    overflow: hidden !important;
}
}
.nodata {
    transform: unset;
    margin-top: 20px !important;
}
    /*设置scoped属性让样式表仅在当前组件内生效*/
    /deep/.ant-table-body {
        &::-webkit-scrollbar{
            height: 12px;
            width: 12px;
            overflow-y: auto;
        }
        &::-webkit-scrollbar-thumb {
            cursor: pointer;
        }
    } 
</style>