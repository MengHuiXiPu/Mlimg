<template>
    <div class="page-content">
			<a-header
			:showNew="true"
			:showSearch="false"
			:showReload="true"
			:auth="{ add: 'mirror-list-add' }"
			:tab-list="tabList"
			:tab-active-key="tabActiveKey"
			:placeholderText="'请输入算法名称'"
			@tab-change="tabOnChange"
			@create="newtemplate"
			@reload="handReload"
			@search="handSearch"
        />
        <div class="content scrollbar" v-if="!progress">
            <split-pane :min-percent="10" :max-percent="30" :default-percent="15" split="vertical">
                <template slot="paneL">
                    <div style="text-align:center;height:150px;margin-top: 20px;" v-if="treeloading">
                        <a-spin size="middle"></a-spin>
                    </div>
                    <!--左侧节点列表-->
                    <a-list item-layout="horizontal" :data-source="listdata" v-if="!treeloading">
                        <a-list-item slot="renderItem" slot-scope="item"
                            @click="showdata(item)"
                            :style="{ 'background-color': item.nodeId == cur_node ? 'rgba(22, 119, 255,0.75)' : 'white', 'color': item.nodeId == cur_node ? 'white' : 'black' }">
                            <div class="list">
                                {{ item.nodeId }}
                            </div>
                        </a-list-item>
                    </a-list>
                </template>
                <template slot="paneR">
                    <!-- <span style="float:right;margin:10px;z-index:5">
                        <a-button type="primary" @click="newtemplate" style="z-index: 5;margin-right: 10px">新建</a-button>
                        <a-button icon="reload" class="reload" style="z-index:5" @click="handReload" />
                    </span> -->
                    <a-table :scroll="{ x: 600, y: hidden }" :pagination="false" :columns="columns" :data-source="datasource"
                        :rowKey="(record) => record.id" v-if="this.datasource.length > 0">
                        <span slot="operate" slot-scope="text, record">
                            <a @click="maketemplate(record)" style="margin-right: 15px">制作</a>
                            <a @click="delatetemplate(record)" style="margin-right: 15px">删除</a>
                        </span>
                    </a-table>
                    <div style="text-align:center;height:300px;margin-top: 80px;" v-if="tableloading">
                        <a-spin size="large"></a-spin>
                    </div>
                    <NoData v-if="!(this.datasource.length > 0) && !tableloading" style="transform:translate(0,100px)" />
                </template>
            </split-pane>
        </div>
        <template v-if="progress">
            <Stepform @returnlist="returnlist"></Stepform>
        </template>
    </div>
</template>

<script>
import { NoData } from "@/components"
import splitPane from "vue-splitpane"
import { axios } from '@/utils/request'
import Stepform from './Stepform'
import {
    getNodeLeftTreeList,
    getTemplateTabsList,
    deleteTemplate,
} from '@/api/imageManage'
export default {
    name: "Step1",
    components: {//引用的其他组件
        splitPane,
        Stepform,
        NoData,
    },
    props: {//从父组件传来数据

    },
    data() {
        return {
            progress: 0,// progress=0,主页面,>0,1-4步
            columns: [
                {
                    title: '模板ID',
                    dataIndex: "id",
                    key: "id",
                    width: '10%',
                    align: 'center'
                },
                {
                    title: '模板名',
                    dataIndex: "templateName",
                    key: "templateName",
                    width: '16%',
                    align: 'left'
                },
                {
                    title: '节点ID',
                    dataIndex: "nodeId",
                    key: "nodeId",
                    width: '10%',
                    align: 'center'
                },
                {
                    title: 'ClassID',
                    dataIndex: "classId",
                    key: "classId",
                    width: '16%',
                    // align: 'center'
                },
                {
                    title: 'eqpID',
                    dataIndex: "eqpId",
                    key: "eqpId",
                    width: '16%',
                    // align: 'center'
                },
                {
                    title: '状态',
                    dataIndex: "status",
                    key: "status",
                    width: '16%',
                    align: 'center'
                },
                {
                    title: '操作',
                    dataIndex: "operate",
                    key: "operate",
                    scopedSlots: { customRender: "operate" },
                    width: '16%',
                    align: 'center'
                },
            ],
            listdata: null,//左侧树形列表数据
            treeloading: true,//左侧树形列表加载情况
            tableloading: false,//右侧表格加载情况
            datasource: [],
            cur_node: 'T9',//当前选中的节点
        }
    },
    computed: {
    },
    mounted() {
        console.log("Step1 mounted!!!!!!!!")
        this.getTreeNode();//获取左侧树形列表
				this.showdata({nodeId: 'T9'})
    },
    methods: {
        nextStep() {
            if (true) {//若满足下一步条件
                this.$emit('nextStep')
            }
            else {

            }
        },
        cancel() {
            this.$emit('cancel')
        },
        handReload() {
            let item = {};
            // item.nodeId ="T10";
            this.getTreeNode()
            // this.showdata(item)
        },
        async showdata(item) {
					  console.log(item);
            this.tableloading = true;
            this.datasource = [];
            this.cur_node = item.nodeId;
            const params = {
                nodeId: item.nodeId,
            };
            const jsonparams = JSON.stringify(params);
            axios.post(`/api/v1/dataanalysis/aiTemplateMakeinfo/list`, jsonparams, {
                headers: {
                    'Content-Type': 'application/json',
                }
            }).then(response => {
                // 请求成功的回调，此时返回code===0
                response.data.records.sort((a, b) => {
                    return a.id - b.id;
                })
                response.data.records.forEach((item) => {
                    if (item.stepNum == 0)
                        item.status = "初始化";
                    else if (item.stepNum == 11)
                        item.status = "resize中";
                    else if (item.stepNum == 12)
                        item.status = "已resize";
                    else if (item.stepNum == 21)
                        item.status = "标注中";
                    else if (item.stepNum == 22)
                        item.status = "已标注";
                    else if (item.stepNum == 31)
                        item.status = "制作中";
                    else if (item.stepNum == 32)
                        item.status = "完成";
                })
                this.datasource = response.data.records;
                this.tableloading = false;
            }).catch(error => {
                // 请求失败的回调
            });
        },
        newtemplate() {//新建模板
            this.progress = 1;
            this.$store.commit('setBasicData', {
                id: null,
                templateName: null,
                nodeId: null,
                classId: null,
                eqpId: null
            });
        },
        maketemplate(record) {//制作模板
            let body = record;
            // let body =JSON.stringify(record);
            body.templateId = body.id;
            // 在上一个界面的组件中
            this.$store.commit('setBasicData', body);


            this.progress = 1;
        },
        delatetemplate(record) { //删除模板
            if (window.confirm("确认删除？被删除的数据无法恢复")) {
                deleteTemplate(record.id).then(res => {
                    if (res.msg = "success") {
                        alert("删除成功");
                        this.getTreeNode();//获取左侧树形列表
                        this.showdata(record);//重新加载
                        return;
                    }
                    alert("删除失败");

                })
            } else {
                alert("取消");
            }
        },
        async getTreeNode() {
            const res = await getNodeLeftTreeList();
            if (res.code != 0)
                return;
            this.listdata = res.data;
            //console.log(this.listdata)
            this.treeloading = false;
        },
        returnlist() {
            this.progress = 0;
        }
    }
}
</script>
<style lang="less">
.page-content {
	&>.content {
		.ant-list-item {
			margin: 6px;
		  border-radius: 8px;
			border-bottom: unset;
		}
	}
}
</style>
<style scoped lang="less">
.page-content {
	display: flex;
	flex-direction: column;
	.content {
		flex: 1;
		overflow: auto;
		background: #fff;
		border-radius: 16px;
	 &>.vue-splitter-container {
			height: 100%;
			min-height: unset;
		}
	}
}
/deep/ .bottom {
    padding-top: 10px;
}

.list {
    margin: 5px auto;
    font-family: '微软雅黑', sans-serif;
    cursor: pointer;
    font-size: 14px;
}

.list:hover {
    font-size: 18px;
}
</style>
