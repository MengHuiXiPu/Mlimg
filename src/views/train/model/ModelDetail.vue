<template>
  <div class="page-content modelDetail">
    <a-header
      pageTitle="模型详情"
      :showReload="activeRightKey === '4'"
      :auth="{ add: 'dataMrg-list-add' }"
      :tab-list="modelInfo.modelType === 1 ? tabList1 : tabList"
      :tab-active-key="modelInfo.modelType !== 1 ? activeKey : activeRightKey"
      :placeholderText="'请输入数据集名称'"
      newText="新建"
      :showNew="activeRightKey === '4'"
      :showSearch="activeRightKey === '4'"
      @tab-change="callback"
      @create="handCreate"
      @reload="$refs.offline.handReload()"
      @search="search"
    />
    <a-card v-if="isShowDetail" :bordered="false" class="content-card">
      <back-title url="/train/model" :title="modelInfo.modelName || 'null'" />
      <template v-if="modelInfo.modelType  === 1"><!--modeltype=1,通用模型 =2,业务模型-->
          <a-tabs v-model="activeKey">
              <a-tab-pane key="1" tab="模型信息">
                  <a-card :bordered="false" class="basic-card">
                      <a-row>
                          <a-col :span="12">
                              <a-descriptions :column="{ xs: 1, sm: 1, md: 1}" title="基本信息">
                                  <a-descriptions-item label="算法名称">{{ `${modelInfo.imageName}(${modelInfo.imageVersionLabel})` }}</a-descriptions-item>
                                  <a-descriptions-item label="算法">{{ modelInfo.algorithmName }}</a-descriptions-item>
                                  <a-descriptions-item label="算法类型">{{ modelInfo.tagType }}</a-descriptions-item>
                                  <!-- <a-descriptions-item label="创建用户">{{ modelInfo.createBy }}</a-descriptions-item>
                                 <a-descriptions-item label="创建时间">{{ modelInfo.createTime }}</a-descriptions-item> -->
                              </a-descriptions>
                          </a-col>
                          <a-col :span="12" style="padding-top: 44px">
                              <a-descriptions :column="{ xs: 1, sm: 1, md: 1}" title>
                                  <!-- <a-descriptions-item label="修改用户">{{ modelInfo.updateBy }}</a-descriptions-item>
                                  <a-descriptions-item label="修改时间">{{ modelInfo.updateTime }}</a-descriptions-item> -->
                                  <a-descriptions-item label="模型创建人">{{ modelInfo.createBy }}</a-descriptions-item>
                                  <a-descriptions-item label="模型创建时间">{{ modelInfo.createTime }}</a-descriptions-item>
                                  <a-descriptions-item label="模型版本">{{ modelInfo.modelVersionLabel }}</a-descriptions-item>
                              </a-descriptions>
                          </a-col>
                      </a-row>
                      <div class="remake">
                          <span>模型备注：</span>
                          <a-textarea v-model="modelInfo.modelDescription" />
                          <a-button type="primary" @click="saveRemake">保存</a-button>
                      </div>
                  </a-card>
                  <a-card :bordered="false" class="data-card">
                      <a-descriptions :column="{ xs: 1, sm: 1, md: 1 }" title="数据集信息">
                      </a-descriptions>
                      <a-row :gutter="24" type="flex" justify="space-between">
                          <a-col :span="12">
                              <!--<a-spin :spinning="loading">-->
                              <div ref="refTable" class="data-card-left">
                                  <!--模型信息详表-->
                                  <a-table :scroll="{ x: 300, y: this.scrollYheight }"
                                           :pagination="false"
                                           :columns="columns"
                                           :data-source="data"
                                           :customRow="getCustomRow"
                                           :rowClassName="getRowClassName"
                                           rowKey="dlId"
                                           v-if="this.data.length > 0">
                                      <!--打开以下超链接会导致数据集信息表格中数据集名称成为超链接，联动右边柱状图-->
                                        <!--
                                        <template slot="name" slot-scope="text, record">
                                            <a href="javascript:;" class="action-text" @click="clickDlName(record)" >
                                            {{ text }}
                                            </a>
                                        </template>
                                        -->
                                  </a-table>
                                  <NoData v-else />
                              </div>
                              <!--</a-spin>-->
                          </a-col>
                          <a-col :span="12">
                              <a-spin :spinning="barLodaing">
                                  <div class="data-card-right" ref="refChart">
                                      <echart :styleObj="echartWidth"
                                              v-if="this.barData.length > 0"
                                              :option="option" />
                                      <NoData v-else />
                                  </div>
                              </a-spin>
                          </a-col>
                      </a-row>
                  </a-card>
              </a-tab-pane>
              <a-tab-pane key="2" tab="数据集检测">
                  <!--<umodeldetail />-->
                  <a-card>
                      <template v-if="!isadding">
                          <a-button type="primary" @click="adddatalist" class="right" v-if="taskStatus==0||taskStatus==1">添加数据集</a-button>
                          <a-button type="primary" @click="adddatalist" class="right" v-if="taskStatus>1" disabled>添加数据集</a-button>
                          <a-descriptions title="数据集基本信息">
                          </a-descriptions>
                          <a-table :scroll="{ x: 300, y:hidden }"
                                   :pagination="false"
                                   :columns="columns_0"
                                   :data-source="data"
                                   :customRow="getCustomRow"
                                   :rowClassName="getRowClassName"
                                   :key="key"
                                   rowKey="dlId"
                                   v-if="this.data.length > 0">
                              <span slot="action" slot-scope="text, record">
                                  <a @click="deldatalist(record)"
                                     style="margin-right: 5px" v-if="delable()&&taskStatus<=1">删除</a>
                                  <span v-if="!delable()">至少应使用一个数据集</span>
                              </span>
                          </a-table>
                          <a-form-model :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }" :rules="rules" layout="horizontal" style="max-width: 700px; margin: 20px;">
                              <a-form-model-item label="预测类别选择">
                                  <a-checkbox :indeterminate="indeterminate_" :checked="checkAll_" @change="onCheckAllChange" :disabled="taskStatus>1">
                                      全选
                                  </a-checkbox>
                                  <a-radio-group v-model="sortType" @change="sortChange" :disabled="taskStatus>1">
                                      <a-radio :value="1">名称<a-icon type="arrow-down" /></a-radio>
                                      <a-radio :value="2">数量<a-icon type="arrow-down" /></a-radio>
                                  </a-radio-group>
                                  <br />
                                  <a-checkbox-group v-model="selectedType"
                                                    :options="selectedTypeList"
                                                     :disabled="taskStatus>1"
                                                    @change="onChange"
                                                    @load="onChange">
                                      <span slot="label" slot-scope="option">
                                          {{ `${option.value}(${option.number})` }}
                                      </span>
                                  </a-checkbox-group>
                              </a-form-model-item>
                          </a-form-model>
                          <a-button type="primary" @click="setdata" class="right" v-if="taskStatus==0||taskStatus==1" ref="btn1" v-bind:disable="tempdis">确定</a-button>
                          <a-button type="primary" @click="setdata" class="right" v-if="taskStatus>1" disabled>确定</a-button>
                      </template>
                      <template v-if="isadding">
                          <a-button type="primary" @click="endadd" class="right" style="z-index:99" :disabled="!dlId.length">完成添加</a-button>
                          <a-table class="table-content"
                                   :loading="loading"
                                   :rowKey="(record)=>record.id"
                                   :row-selection="rowSelection"
                                   @change="tableDataChange"
                                   :columns="columns_datalist"
                                   :data-source="tableData"
                                   :pagination="pagination">
                              <a slot="dlName" slot-scope="text, record">
                                  <a-tag color="#4aa6e8"
                                         style="zoom: 0.7; margin-right: 2px;border-radius: 10px;"
                                         :style="{ display: ['分割', '目标检测'].includes(record.dlTagType) ? '' : 'none' }">
                                      {{ record.markFileType === 1 ? 'JSON' : 'XML' }}
                                  </a-tag>
                                  <a-tag color="#12d2ae"
                                         style="zoom: 0.7; margin-right: 2px;border-radius: 10px;"
                                         :style="{ display: record.containSpecial ? '' : 'none' }">
                                      业务
                                  </a-tag>
                                  {{ text }}
                              </a>
                          </a-table>
                      </template>


                  </a-card>
                  <a-card :bordered="false" class="basic-card">
                      <!--
                            {{haverequest}}
                            <template v-if="haverequest">
                            </template>
                            <template v-else>
                                暂无特殊训练集数据要求
                            </template>
                      -->
                      <a-row v-if="haverequest">
                          <a-col :span="12">
                              <a-descriptions :column="{ xs: 1, sm: 1, md: 1}" title="检查及分析项">
                                  <a-form-model-item>
                                      <a-checkbox style="width: 200px; height: 50px; ">
                                          <span>
                                              结合线上code density分析
                                              <a-upload :showUploadList="false" :before-upload="code_density_Upload" v-if="taskStatus==0||taskStatus==1">
                                                  <a-button type="default" style="width: 200px; height: auto; left: 24px;"><a-icon type="upload"></a-icon>上传</a-button>
                                              </a-upload>
                                              <a-upload :showUploadList="false" :before-upload="code_density_Upload" v-if="taskStatus>1" disabled>
                                                  <a-button type="default" style="width: 200px; height: auto; left: 24px;"><a-icon type="upload"></a-icon>上传</a-button>
                                              </a-upload>
                                          </span>
                                      </a-checkbox>
                                  </a-form-model-item>
                                  <a-form-model-item>
                                      <!--checkbox需要在switch-form之内才起效-->
                                      <a-checkbox style="width:200px;height:50px;">
                                          <span>
                                              检查类别最少标注数量
                                              <!--初始值为api返回的最少标注数量-->
                                              <a-input v-model="this.checkInfo['mincount']" class="middle" />
                                          </span>
                                      </a-checkbox>
                                  </a-form-model-item>
                                  <a-form-model-item>
                                      <a-checkbox>
                                          <span>
                                              检查图片清晰度异常
                                              <a-checkbox style="display: block; margin-left: 2rem;">
                                                  <span class="inner">上下裁切(%)</span>
                                                  <a-input class="small" v-model="this.checkInfo['cut_up_down']"/>
                                              </a-checkbox>
                                              <a-checkbox style="display: block; margin-left: 2rem;">
                                                  <span class="inner">左右裁切(%)</span>
                                                  <a-input class="small" v-model="this.checkInfo['cut_left_right']"/>
                                              </a-checkbox>
                                              <a-checkbox style="display: block; margin-left: 2rem; ">
                                                  <span class="inner">模糊阈值</span>
                                                  <a-input class="small" v-model="this.checkInfo['blur']"/>
                                              </a-checkbox>
                                          </span>
                                      </a-checkbox>
                                  </a-form-model-item>
                                  <a-form-model-item>
                                      <a-checkbox>
                                          检查图片平均灰度值范围异常
                                          <span>
                                              检查图片平均灰度值范围异常
                                              <a-checkbox style="display: block; margin-left: 2rem;">
                                                  <span class="inner">最低灰度值</span>
                                                  <a-input class="small" v-model="this.checkInfo['min_grey_level']"/>
                                              </a-checkbox>
                                              <a-checkbox style="display: block; margin-left: 2rem;">
                                                  <span class="inner">最高灰度值</span>
                                                  <a-input class="small" v-model="this.checkInfo['max_grey_level']"/>
                                              </a-checkbox>
                                          </span>
                                      </a-checkbox>
                                  </a-form-model-item>
                              </a-descriptions>
                          </a-col>
                          <a-col :span="12" style="padding-top: 44px">
                              <a-descriptions :column="{ xs: 1, sm: 1, md: 1}" >
                                  <a-form-model-item>
                                      <a-checkbox>
                                          检查分辨率一致性
                                      </a-checkbox>
                                  </a-form-model-item>
                                  <a-form-model-item>
                                      <a-checkbox style="width:200px;height:50px;">
                                          <span>
                                              检查类别最少图片数量
                                              <a-input v-model="this.checkInfo['minpiccount']" class="middle" />
                                          </span>
                                      </a-checkbox>
                                  </a-form-model-item>
                              </a-descriptions>
                          </a-col>
                      </a-row>
                      <template v-else>
                          暂无数据集检查项
                      </template>
                      <a-button type="primary" @click="checkdata" class="right" v-if="taskStatus==0||taskStatus==1">开始检查</a-button>
                      <a-button type="primary" @click="checkdata" class="right" v-if="taskStatus>1" disabled>开始检查</a-button>
                  </a-card>
                  <a-card>
                      <a-descriptions title="数据集统计信息">
                      </a-descriptions>
                      <!--
                        taskStatus={{taskStatus}}
                        类别图片数量分布
                        类别标注数量分布
                        类别标注面积分布
                        图片模糊值分布
                        图片灰度值分布
                        图片分辨率分布
                      -->
                      <!--通用模型数据集详情-->
                      <!--
                      <keep-alive>
                      <a-table :scroll="{ x: 300, y: this.scrollYheight }"
                               :pagination="false"
                               :columns="columns_1"
                               :data-source="datalist"
                               :loading="this.loading"
                               v-if="this.datalist.length > 0&&modeltype==1">
                      </a-table>
                      <NoData v-else />
                      </keep-alive>
                      <keep-alive>
                          <a-table :scroll="{ x: 300, y: this.scrollYheight }"
                                   :pagination="false"
                                   :columns="columns_2"
                                   :data-source="datalist"
                                   :loading="this.loading"
                                   v-if="this.datalist.length > 0&&modeltype==2">
                          </a-table>
                      </keep-alive>
                      -->
                  </a-card>
                  <a-card>
                      <a-descriptions :column="{ xs: 1, sm: 1, md: 1}" title="数据集洞察结果">
                          数据集存在  张模糊图片
                          数据集存在  张平均灰度值异常图片
                            标注数量不足  ，请补充


                      </a-descriptions>
                  </a-card>
              </a-tab-pane>
              <a-tab-pane key="3" tab="训练参数">
                  <a-radio-group v-model="smallActiveKey" style="margin-top: 15px">
                      <a-radio-button value="1">
                          算法参数
                      </a-radio-button>
                      <a-radio-button value="2">
                          业务参数
                      </a-radio-button>
                  </a-radio-group>
                  <div class="editContent">
                      <a-icon type="edit" v-show="suanfaDis" @click="suanfaDis = false" />
                      <a-button v-show="!suanfaDis" @click="confirmClick" type="primary" style="margin-right:10px">确定</a-button>
                      <a-button v-show="!suanfaDis" @click="cancelClick">取消</a-button>
                  </div>
                  <template v-if="smallActiveKey === '1'">
                      <a-card :bordered="false" class="basic-card">
                          <a-empty v-if="algorithmParam.length === 0" />
                          <template v-else>
                              <div class="mirror-params-list">
                                  <a-tree showLine
                                          :tree-data="algorithmParam"
                                          :replace-fields="replaceFields"
                                          @select="selectParamChange"></a-tree>
                              </div>
                              <a-input type="textarea"
                                       v-model="algorithmParamValue"
                                       :disabled="!selectObj.name || suanfaDis"
                                       @blur="changeAlgorithmParam"
                                       class="text-area algorithmParam"></a-input>
                          </template>
                      </a-card>
                  </template>
                  <template v-else>
                      <a-card :bordered="false" class="basic-card">
                          <a-input type="textarea"
                                   style="min-height:calc(100vh - 279px)"
                                   :disabled="suanfaDis"
                                   v-model="modelInfo.businessParam"
                                   @blur="confirmJSON" />
                          <p v-if="showJSONError" style="color: red">当前参数不符合JSON规范，请重新填写</p>
                      </a-card>
                  </template>
                  <a-button type="primary" style="margin: 0 auto;" @click="startTrain" :loading="saveLoading" v-if="taskStatus==0||taskStatus==1">开始训练</a-button>
                  <a-button type="primary" style="margin: 0 auto;" @click="startTrain" :loading="saveLoading" v-if="taskStatus>1" disabled>开始训练</a-button>
              </a-tab-pane>
              <a-tab-pane key="4" tab="训练监控">
                  <a-card :bordered="false" class="basic-card">
                      <monitor :modelDetail="modelInfo" />
                  </a-card>
              </a-tab-pane>
              <a-tab-pane key="5" tab="结果洞察">
                  <a-card :bordered="false" class="basic-card">
                      <Result type="model" :paramId="dataId" :datalist="modelInfo.dataList" :modelType="modelInfo.modelType"
                              :modelId="modelId"/>
                  </a-card>
              </a-tab-pane>
              <a-tab-pane key="6" tab="离线评估">
                  <a-card :bordered="false" class="basic-card">
                      <ModelOfflineList :modelDetail="modelInfo" />
                  </a-card>
              </a-tab-pane>
          </a-tabs>
      </template>
      <template v-if="modelInfo.modelType === 2"><!--业务模型-->
        <a-tabs v-model="activeRightKey" @change="callback">
          <a-tab-pane key="1" tab="模型信息">
            <a-card :bordered="false" class="basic-card">
              <a-row>
                <a-col :span="12">
                  <a-descriptions :column="{ xs: 1, sm: 1, md: 1}" title="基本信息">
                    <a-descriptions-item label="算法名称">{{ `${imagesInfo.imageName}(${modelInfo.versionLabel})` }}</a-descriptions-item>
                    <a-descriptions-item label="算法名称">{{ imagesInfo.algorithm }}</a-descriptions-item>
                    <a-descriptions-item label="算法类型">{{ imagesInfo.tagType }}</a-descriptions-item>
                    <!-- <a-descriptions-item label="创建用户">{{ modelInfo.createBy }}</a-descriptions-item>
                    <a-descriptions-item label="创建时间">{{ modelInfo.createTime }}</a-descriptions-item> -->
                  </a-descriptions>
                </a-col>
                <a-col :span="12" style="padding-top: 44px">
                  <a-descriptions :column="{ xs: 1, sm: 1, md: 1}" >
                    <!-- <a-descriptions-item label="修改用户">{{ modelInfo.updateBy }}</a-descriptions-item>
                    <a-descriptions-item label="修改时间">{{ modelInfo.updateTime }}</a-descriptions-item> -->
                    <a-descriptions-item label="创建用户">{{ modelInfo.createBy }}</a-descriptions-item>
                    <a-descriptions-item label="创建时间">{{ new Date(modelInfo.createTime).toLocaleString() }}</a-descriptions-item>
                    <a-descriptions-item label="模型版本">{{ modelInfo.versionLabel }}</a-descriptions-item>
                  </a-descriptions>
                </a-col>
              </a-row>
              <div class="remake">
                <span>模型备注：</span>
                <a-textarea v-model="modelInfo.modelDescription" />
                <a-button type="primary" @click="saveRemake">保存</a-button>
              </div>
            </a-card>
          </a-tab-pane>
          <a-tab-pane key="2" tab="数据集检测">
              <!--<bmodeldetail />-->
              <!--业务模型数据集详情-->
          </a-tab-pane>
          <a-tab-pane key="3" tab="模型参数">
            <div class="params">
              <div class="params-top">
                <a-card
                  title="依赖通用模型">
                  <a-list :data-source="params.universalMirrorList" size="small">
                    <a-list-item slot="renderItem" slot-scope="item, index">
                      <div class="universalMirrorName">
                        {{ item.name }}
                      </div>
                      <div class="universalMirrorValue">
                        <a-tree-select
                          v-model="item.value"
                          show-search
                          style="width: 50%"
                          :dropdown-style="{ maxHeight: '400px', overflow: 'auto' }"
                          placeholder="请选择算法"
                          allow-clear
                          disabled
                          :replaceFields="{
                            key: 'id',
                            value: 'value',
                            children: 'child',
                            title: 'modelName'
                          }"
                          @select="(val, node) => selectImageChange(val, node, index)"
                          :tree-data="params.universalMirror"
                        >
                        </a-tree-select>
                        <a-select v-model="item.id" style="width: 50%" disabled>
                          <a-select-option v-for="child in item.list" :key="child.id" :value="child.id">
                            {{ child.versionLabel }}
                          </a-select-option>
                        </a-select>
                      </div>
                    </a-list-item>
                  </a-list>
                </a-card>
              </div>
              <div class="params-middle">
                <a-card
                  title="依赖外部模型">
                  <div class="upload-list">
                    <span>目录：</span>
                    <a-radio-group v-model="params.selectFileList" @change="changeExternal">
                      <a-radio v-for="(item, index) in params.externalList" :key="index" :value="Object.keys(item)[0]">
                        {{ Object.keys(item)[0] }}
                      </a-radio>
                    </a-radio-group>
                  </div>
                  <div class="upload-content">
                    <!-- <a-empty /> -->
                    <!-- fileList完全受控状态需要手动往fileList中添加文件 -->
                    <a-upload
                      name="file"
                      :fileList="params.externalDepend"
                      :showUploadList="{
                        showRemoveIcon: false
                      }"
                      :defaultFileList="params.externalDepend"
                      :before-upload="() => { return false }"
                    >
                      <a-button type="text" shape="circle" title="新增文件" hidden><a-icon type="plus"></a-icon></a-button>
                    </a-upload>
                  </div>
                </a-card>
              </div>
              <div class="editBusinessContent">
                <span style="margin-right: 10px">调整参数：</span>
                <a-icon type="edit" v-show="businessDis" @click="businessDis = false"/>
                <a-button v-show="!businessDis" @click="confirmClick" type="primary" style="margin-right:10px">确定</a-button>
                <a-button v-show="!businessDis" @click="cancelClick">取消</a-button>
              </div>
              <div class="params-bottom">
                <a-card
                  title="算法参数"
                  class="bottom">
                  <a-empty v-if="algorithmParam.length === 0"/>
                  <template v-else>
                    <div class="mirror-params-list">
                      <a-tree
                        showLine
                        :tree-data="algorithmParam"
                        :replace-fields="replaceFields"
                        @select="selectParamChange"
                      ></a-tree>
                    </div>
                    <a-input
                      type="textarea"
                      v-model="algorithmParamValue"
                      :disabled="!selectObj.name || businessDis"
                      class="text-area algorithmParam"
                      @blur="changeAlgorithmParam"
                    ></a-input>
                  </template>
                </a-card>
              </div>
              <div class="params-bottom footer">
                <a-card
                  title="业务参数"
                  class="bottom">
                  <a-input
                    v-model="modelInfo.businessParam"
                    type="textarea"
                    placeholder="请输入业务参数"
                    :rows="3"
                    :disabled="businessDis"
                    @blur="confirmJSON"/>
                  <p v-if="showJSONError" style="color: red" >当前参数不符合JSON规范，请重新填写</p>
                </a-card>
              </div>
            </div>
          </a-tab-pane>
          <a-tab-pane key="4" tab="离线评估">
            <a-card :bordered="false" class="basic-card">
              <ModelOfflineList ref="offline" :value="keyword" :modelDetail="modelInfo"/>
            </a-card>
          </a-tab-pane>
        </a-tabs>
      </template>
    </a-card>
    <Step2OffLine v-else />
  </div>
</template>

<script>
import { axios } from '@/utils/request'
import { Echart, NoData, umodeldetail, bmodeldetail } from "@/components"
import Result from "@/views/train/model/components/Result"
import { getParams } from '@/utils/util'
import { getImageManageById } from '@/api/imageManage'
import {
    getDataSetList,
} from "@/api/dataCenter"
import {getModelInfoById,
        getModelDepend,
        getModelDLtByDLId,
        getFileCategory,
        getBusinessModelManageInfo, 
        modelVersion,
        editModelParams,
        saveRemake,
        getCodeData,
        //selectDatasetSeNoAddMinMustAdd,//获取部分模型检测内容，已废弃
        getCheckItems,//获取完整模型检测内容
        getCodeList,
        setDataSet,
        uploadCodeDensity,
        setTrainStart,
       } from "@/api/modelManage"
import ModelOfflineList from "./components/ModelOfflineList"
import { getBarOption } from '@/views/train/model/util'
import Step2OffLine from './modelOfflineStep'
import { mapState } from 'vuex'
import monitor from './components/monitor'
const columns = [
    {
        title: "数据集名称",
        dataIndex: "dlName",
        ellipsis: true,
        key: "dlName",
        scopedSlots: { customRender: 'name' },//对应table的插槽名
        width: '20%',
    },
    {
        title: "图片数量(已标注)",
        dataIndex: "markNum",
        key: "markNum",
        width: '20%',
    },
    {
        title: "类别数量",
        dataIndex: "categoryNum",
        key: "categoryNum",
        width: '20%',
    },
    {
        title: "最大类别",
        ellipsis: true,
        dataIndex: "maxCategory",
        key: "maxCategory",
        width: '20%',
    },
    {
        title: "最小类别",
        ellipsis: true,
        dataIndex: "minCategory",
        key: "minCategory",
        width: '20%',
    },
]
const columns_0 = [
    {
        title: "数据集名称",
        dataIndex: "dlName",
        ellipsis: true,
        key: "dlName",
        scopedSlots: { customRender: 'name' },//对应table的插槽名
        width: '16.7%',
    },
    {
        title: "图片数量(已标注)",
        dataIndex: "markNum",
        key: "markNum",
        width: '16.7%',
    },
    {
        title: "类别数量",
        dataIndex: "categoryNum",
        key: "categoryNum",
        width: '16.7%',
    },
    {
        title: "最大类别",
        ellipsis: true,
        dataIndex: "maxCategory",
        key: "maxCategory",
        width: '16.6%',
    },
    {
        title: "最小类别",
        ellipsis: true,
        dataIndex: "minCategory",
        key: "minCategory",
        width: '16.6%',
    },
    {
        title: "操作",
        ellipsis: true,
        dataIndex: "action",
        key: "action",
        scopedSlots: { customRender: "action" },
        width: '16.7%',
    }
]
const columns_1 = [
  {
      title: "code",//列名
      dataIndex: "folderName",//与dataSource中数据匹配的标识符
      ellipsis: true,
      key: "folderName",
      width: '33%',
  },
  {
      title: "分辨率",
      dataIndex: "resolution",
      key: "resolution",
      width: '33%',
  },
  {
      title: "图片数量",
      dataIndex: "pixelCount",
      key: "pixelCount",
      width: '33%',
  },
]
const columns_2 = [
  {
      title: "code",//列名
      dataIndex: "folderName",//与dataSource中数据匹配的标识符
      ellipsis: true,
      key: "folderName",
      width: '25%',
  },
  {
      title: "分辨率",
      dataIndex: "resolution",
      key: "resolution",
      width: '25%',
  },
  {
      title: "图片数量",
      dataIndex: "pixelCount",
      key: "pixelCount",
      width: '25%',
  },
  {
      title: "标注数量",
      dataIndex: "diffPixelAntCount",
      key: "diffPixelAntCount",
      width: '25%',
      ellipsis: true,
  },
]
const columns_datalist= [
    {
        title: '数据集名称',
        ellipsis: true,
        dataIndex: "dlName",
        scopedSlots: { customRender: "dlName" },
        // width: '25%'
    },
    {
        title: "样本量",
        dataIndex: "sampleNum",
        width: 80
    },
    {
        title: "数据集路径",
        ellipsis: true,
        dataIndex: "dlRealDir"
    },
    {
        title: "创建时间",
        dataIndex: "createTime",
        width: 140
    }
]
export default {
  name: "ModelDetail",
  components: {
      Echart,
      Result,
      ModelOfflineList,
      Step2OffLine,
      NoData,
      monitor,
  },/*在此处注册模型详情组件的子组件*/
  data () {
    return {
        keyword: '',
        tabList1: [
          {
            name: "模型信息",
            key: "1"
          },
          {
            name: "数据集检测",
            key: "2"
          },
          {
            name: "训练参数",
            key: "3"
          },
          {
            name: "训练监控",
            key: "4"
          },
          {
            name: "结果洞察",
            key: "5"
          },
          {
            name: "离线评估",
            key: "6"
          },
        ],
        tabList: [
          {
            name: "模型信息",
            key: "1"
          },
          {
            name: "数据集检测",
            key: "2"
          },
          {
            name: "模型参数",
            key: "3"
          },
          {
            name: "离线评估",
            key: "4"
          },
        ],
        activeKey: "3",
        activeRightKey: '1',
        columns,
        columns_0,
        columns_1,
        columns_2,
        columns_datalist,
        data: [],//数据集基本信息
        datalist: [],//数据集分code统计信息
        tempdatalist:[],//数据集增删时未保存的数据集列表
        dlTagType:"",//本模型所使用的数据集类型，分类/目标检测
        option: {},
        modelInfo: {},//空对象
        modeltype: 0,
        loading: false,
        logShow: false,
        barLodaing: false,
        barData: [],
        barTitle: [],
        scrollYheight: 50,
        clickRowId: null,
        record: {},
        smallActiveKey: '1',
        algorithmParam: [],
        algorithmParamValue: '',
        backupAlgorithmParam: null,
        backupBusinessParam: null,
        suanfaDis: true,
        businessDis: true,
        showJSONError: false,
        selectObj: {},
        replaceFields: {
            children: 'childreans',
            title: 'name'
        },
        pagination: {//数据集列表分页数据
            total: 0,
            pageSize: 10,
            current: 1,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "30", "50"],
            showTotal: function (total) {
                return `共 ${total} 条`
            }
        },
        params: {
            universalMirrorList: [{
                name: 'image1',
                id: ''
            }],
            universalMirror: [],
            externalList: [
              {
                '目录1': [],
              }, {
                '目录2': []
              }
            ],
            externalDepend: [],
            changeFile: null,
            algorithmParams: '',
            selectFileList: '',
            traceNo: '',
        },
        imagesInfo: {},
        dataId: null,
        //数据集详情
        tabActiveKey: "1",
        haverequest: false,
        codedensity: false,//是否结合线上code density分析
        resolution:false,//是否检查分辨率一致性
        wrongcodelist: "null",//不能被选中的code
        mustcodelist: "null",//必须被选中的code
        saveLoading: false,
        taskStatus: 0,
        modelId:"",
        checkitemlist: [],
        checkInfo: {//检测项默认值，调用api获得初值
            mincount: -1,//最少标注数量
            minpiccount: -1,//最少图片数量
            cut_up_down: -1,//检查分辨率异常 上下裁切 比例
            cut_left_right: -1,//检查分辨率异常 左右裁切 比例
            blur: -1,//模糊阈值
            min_grey_level: -1,//最小灰度值
            max_grey_level:-1,//最大灰度值
        },
        selectedTypeList: [],//储存可以被选中加入预测类别的code列表
        selectedType: [],//储存已选中的code列表
        indeterminate: false,
        checkAll: false,
        isadding: false,//是否正在添加数据集,true表示是
        tableData: [],//所有可选的数据集列表
        code_density_File: null,//用户上传的code_density文件
        tempdis: false,//按钮在保存中是否可用
        key:0,//用于刷新数据集列表
    }
  },
  beforeRouteEnter (to, from, next) {//获取模型基本信息
    next(vm => {
        const { key, modelType, id, taskStatus,modelId } = to.query;
        vm.activeKey = key || "1";
        vm.activeRightKey = key || '1';
        vm.$store.commit('setmodelType', modelType);
        const _id = vm.$store.state.model.currentModel || id;
        vm.dataId = _id;
        vm.modelType = modelType;
        vm.taskStatus = taskStatus;//获取模型状态
        vm.modelId = modelId;
        if (modelType === '1') {//modeltype=1,通用模型,modeltype=2,业务模型
            vm.getModelInfoById(_id);
        }
        else {
            vm.getBusinessModelManageInfoData(_id);
        }
    })
  },
  beforeRouteLeave (to, from, next) {
    next()
    this.$store.commit('setisShowDetail', true)
  },
  mounted() {
    /*this.getData({ isFirst: true, dlTagType: this.modelInfo.tagType })*/
  },
  computed: {
    ...mapState({
        isShowDetail: state => state.model.isShowDetail,
        dlId: state => state.model.tempdatalist,
    }),
    echartWidth () {
        return {
            width: this.barData.length > 0 ? `${this.barData.length * 70}px` : ''
        }
    },
    founddata(code) {
        for (var i = 0; i < checkitemlist; i++) {
            if (checkitemlist[i].checkCode == code)
                return checkitemlist[i].baseValue;
        }
    },
    rowSelection() {//添加数据集选中行
        return {
            onChange: (selectedRowKeys, selectedRows) => {
                this.$nextTick(() => {
                    this.$store.commit('settempdlId', selectedRowKeys);//保存临时数据集id数组 
                })
            },
            //selectedRowKeys必须是点击后可变的！否则会导致无法选中/取消选中
            selectedRowKeys: this.dlId,//设置初始数据
        }
    },
    indeterminate_() {
        return this.selectedType.length > 0 && this.selectedType.length !== this.selectedTypeList.length;
    },
    checkAll_() {
        return this.selectedType.length !== 0 && this.selectedType.length === this.selectedTypeList.length;
    },
        
  },
  watch: {

  },
  methods: {
    search (value) {
      this.keyword = value
      this.$refs.offline.onSearchChange(value)
    },
    handCreate () {
      console.log('88888', this.$refs.offline)
      this.$refs.offline.onCreate()
    },
    callback (key) {
      console.log(this.modelInfo.modelType)
      if (this.modelInfo.modelType === 2) {
        this.activeRightKey = key
        return
      }
      this.activeKey = key
    },
    fomat (num) {
      return (num).toFixed(2) * 100 + '%'
    },
    clear(str) {//清除字符串中除了逗号外的标点符号
        str = str.toString().replace(/[`:_.~!@#$%^&*() \+ =<>?"{}| \/ ;' \\ [ \] ·~！@#￥%……&*（）—— \+ ={}|《》？：“”【】、；‘’，。、]/g, '');//将对象转化为字符串然后调用str方法
        return str.replace(/,/g, ' , ');//拉大逗号占用空间，让视觉不紧张
    },
    activeBusinessData () {
      if (this.modelInfo.modelDepend) {//若存在，则将其解析为js数组
        this.params.universalMirrorList = JSON.parse(this.modelInfo.modelDepend)
        this.params.universalMirrorList.forEach(item => {//遍历整个元素并更新数据
          this.getChildren(item.parentId || item.id).then(res => {
            item.list = [ ...res ]
            item.value = res[0]?.modelName
          })
        })
      }
      if (this.modelInfo.externalDepend) {
        const data = JSON.parse(this.modelInfo.externalDepend)
        this.params.externalList = [ ...data ]
        this.params.selectFileList = Object.keys(this.params.externalList[0])[0]
        this.changeExternal()
      }
    },
    async getChildren (id) {
      const res = await modelVersion.getImageVersionList({ sourceVersionId: id })
      if (res.code !== 0) return false
      return res.data
    },
    // 查询基本信息
    async getModelInfoById (id) {
        this.loading = true;//先设置加载中动效，载入数据后取消此动效
        //调用api获取模型数据集信息并赋值给modelInfo
        const data = await getModelInfoById(id)
        if (data.code === 0) {//成功返回code为0
            this.modelInfo = data?.data
            console.log("this.modelInfo: ", this.modelInfo);
            this.tempdatalist = this.modelInfo.dataList;
            let datalist = this.modelInfo.dataList.split(",");
            datalist = datalist.map(Number);
            this.$store.commit('settempdlId', datalist);
            this.$store.commit('setmodelInfo', data?.data)//获取到的数据提交到vuex的store中
            this.$nextTick(() => {
            //获取数据表格信息，用于模型信息左下角数据集信息表格展示
                this.getModelDLtByDLId();
                this.getCodeData();
                this.getCodeList(true);
                this.businessParamConfig = this.modelInfo.businessParam;
                if (this.modelInfo.algorithmParam) {
                    this.getActiveParams(this.modelInfo.algorithmParam);
                }
            })
        }
    },
    async getBusinessModelManageInfoData (id) {
        const data = await getBusinessModelManageInfo(id)
        if (data.code === 0) {
            getImageManageById(data.data.imagesId).then(res => {
                if (res.code === 0) {
                    this.imagesInfo = res.data
                    this.getModelDependData(this.imagesInfo.id)
                }
            })
            this.modelInfo = data?.data
            this.businessParamConfig = this.modelInfo.businessParam
            if (this.modelInfo.algorithmParam) this.getActiveParams(this.modelInfo.algorithmParam)
            this.$store.commit('setmodelInfo', data?.data)
            this.$nextTick(() => {
                this.activeBusinessData()
            })
        }
    },
    // 查询数据集列表 
    async getModelDLtByDLId () {
        if (!this.modelInfo.dataList) return false
        //调用import的axios函数，通过后端接口获取数据库数据
        const res = await getModelDLtByDLId(this.modelInfo.dataList)//返回一个包含dlID的对象
        const { data = [], code, msg } = res
        if (code === 0) {
            this.data = data.map(item => {
                const { id, maxCategoryName, maxCategoryRatio, minCategoryName, minCategoryRatio } = item//数据拆分
                return {
                    ...item,
                    key: id,
                    //将maxCategoryName和转换成百分数的maxCategoryRatio拼接成字符串
                    maxCategory: `${maxCategoryName} (${this.fomat(maxCategoryRatio)})`,
                    minCategory: `${minCategoryName} (${this.fomat(minCategoryRatio)})`,
                }
            })
            this.$nextTick(() => {//DOM更新后立即调用
                if (this.data.length > 0 && this.data[0].dlId !== undefined) {
                    this.clickRowId = this.data[0].dlId
                    this.getFileCategory(this.data[0].dlId)
                    this.barTitle = this.data[0].dlName
                }
                const tableDom = this.$refs.refTable
                this.$nextTick(() => {
                    if (tableDom) {
                        this.scrollYheight = tableDom?.offsetHeight - 34;
                        window.addEventListener("resize", () => {//窗口大小改变时重新计算表格滚动高度
                            this.scrollYheight = tableDom?.offsetHeight - 34;
                        })
                    }
                })
            })  
        }
        else {
        }
        //查询训练数据集要求
        /*
        var params = this.modelInfo.dataList + "?imagesId=" +this.modelInfo.imageId;
        selectDatasetSeNoAddMinMustAdd(params).then(res => {//读取算法对训练数据的要求
            if (res.code == 0 && res.data.length) {//校验码为0表示正确
                this.haverequest = true;
                this.wrongcodelist = this.clear(res.data.noAddCode);
                this.mincount = res.data.min_count;//所有被选中code的数据数量必须达到的最小值
                if (res.data.type == "segmentation") {//分割：segmentation 分类：classification
                    this.mustcodelist = this.clear(res.data.mustAddCode);//必须被选中的code
                    this.mustmincount = res.data.mustAddCodeMinCount;//必选code的数据数量必须达到的最小值
                }
            }
        })
        */
        var params = 2;//数据集检测栏内获取模型训练参数，params=2
        getCheckItems(params).then(res => {//读取算法对训练数据的要求
            if (res.code == 0 && res.data.length) {//校验码为0表示正确
                this.haverequest = true;
                //将读取到的检查项列表存为本页内的数据
                this.checkitemlist = res.data.map(checkitem => {
                    switch (checkitem.checkCode) {
                        case "CK_100003"://最少标注数量
                            this.checkInfo.mincount = checkitem.baseValue;
                            break;
                        case "CK_100004"://最少图片数量
                            this.checkInfo.minpiccount = checkitem.baseValue;
                            break;
                        case "CK_100005"://清晰度异常-上下裁切%
                            this.checkInfo.cut_up_down = checkitem.baseValue;
                            break;
                        case "CK_100006"://清晰度异常-左右裁切%
                            this.checkInfo.cut_left_right = checkitem.baseValue;
                            break;
                        case "CK_100007"://清晰度异常-模糊阈值
                            this.checkInfo.blur = checkitem.baseValue;
                            break;
                        case "CK_100008"://最低灰度值
                            this.checkInfo.min_grey_level = checkitem.baseValue;
                            break;
                        case "CK_100009"://最高灰度值
                            this.checkInfo.max_grey_level = checkitem.baseValue;
                            break;
                    }
                    return {
                        baseValue: checkitem.baseValue,
                        checkCode: checkitem.checkCode,
                        checkName: checkitem.checkName,
                    }
                })
            }
        })
    },
    //获取code 图片及标注数量（及分辨率）信息
    async getCodeData() {
        if (!this.modelInfo.dataList) return false  
        //调用import的axios函数，通过后端接口获取数据库数据，根据modelInfo.dataList获取数据表
        let dataList = this.modelInfo.dataList.split(',');//数据集列表数组，每个元素是一个数据集id
        for (var i = 0; i < dataList.length;i++) {
            const res = await getCodeData(dataList[i]);//调用接口每次回复一个数据集的统计信息
            const { data = [], code, msg } = res//数据解构
            if (code === 0) {//将各数据集的详细信息合并显示
                //遍历data数组中的每个元素item，拆分出item的四个属性，然后添加新属性，把每个元素拆分出来保存为data0
                let data0 = data.map(item => {
                    const { pixelWidth, pixelHeight } = item//数据拆分
                    return {
                        ...item,
                        resolution: `${pixelWidth}×${pixelHeight}`,//拼合分辨率数据
                    }
                })
                for (var j in data0) {//把新读到的列表和已有数据表比对，已有则更新，没有则添加
                    var flag = 0;
                    for (var k in this.datalist) {//已有数据
                        if (data0[j].folderName == this.datalist[k].folderName && data0[j].resolution == this.datalist[k].resolution) {
                            this.datalist[k].pixelCount += data0[j].pixelCount;
                            flag = 1;//表示该类数据已有
                        }
                    }
                    if (!flag) {//该类数据尚未存入已有数据表
                        this.datalist.push(data0[j]);
                    }
                }
                this.$nextTick(() => {//DOM更新后立即调用
                    if (this.datalist.length > 0 && this.datalist[0].dlId !== undefined) {
                        this.clickRowId = this.datalist[0].dlId
                        this.getFileCategory(this.datalist[0].dlId)
                        this.barTitle = this.datalist[0].dlName
                    }
                    const tableDom = this.$refs.refTable
                    this.$nextTick(() => {
                        if (tableDom) {
                            this.scrollYheight = tableDom?.offsetHeight - 34
                            window.addEventListener("resize", () => {//窗口大小改变时重新计算表格滚动高度
                                this.scrollYheight = tableDom?.offsetHeight - 34
                            })
                        }
                    })
                })
                this.loading = false;
            }
        } 
        this.loading = false;
    },
    // 查询当前模型数据集目录类别信息及完成设置选定目录信息
    async getCodeList(flag) {
        if (!this.modelInfo.id||!this.modelInfo.dataList) return false
        //调用import的axios函数，传输模型id，通过后端接口获取数据集code选择列表
        let params = this.modelInfo.id;
        params = params + "?dlId="+this.modelInfo.dataList;
        const res = await getCodeList(params);//输入模型和数据集，返回codelist选中项
        const { data = [], code, msg } = res
        if (code === 0) {
            //将可选的codelist保存到this.selectedTypeList中
            this.selectedTypeList = data.dataListFileCategoryCountList.map(item => {
                const { fileCategory, count } = item//数据拆分
                return {
                    value: fileCategory,
                    number: count
                }
            })
            const selectedtypearr = data.dataSetDirs.split(",");//将选中项转化为数组
            if (flag) {//数据集临时增删时调用此函数，flag=false，不重置code选择列表
                this.$set(this, 'selectedType', selectedtypearr.map(item => item));//赋值给selectedType对象，反映到复选框的选中状态
                if (selectedtypearr.length == this.selectedTypeList.length) {//全选
                    this.checkAll = true;
                    this.indeterminate = false;
                }
                else if (selectedtypearr.length > 0) {
                    this.checkAll = false;
                    this.indeterminate = true;
                }
            }
            else {
                this.indeterminate = !!this.selectedType.length && this.selectedType.length < this.selectedTypeList.length;
                this.checkAll = this.selectedType.length === this.selectedTypeList.length;
                //删掉selectedType里面不属于更新后selectedTypeList的元素,防止全选框显示错误
                this.selectedType = this.selectedType.filter((item) => this.selectedTypeList.some((x)=>item==x.value));
            }  
        }
    },
    // 查询柱状图
    async getFileCategory (dlId) {
        if (!dlId) return
        this.barLodaing = true
        const res = await getFileCategory(dlId)
        const { data = [], code } = res
        if (code === 0) {
            this.barData = data.sort((a, b) => {
                return b.num - a.num
            })
            this.$nextTick(() => {
                this.option = getBarOption(this.barData, this.barTitle, '图片数量')
                this.barLodaing = false
            })
        }
        else {
            this.barLodaing = false
        }
      },
      async getData(param) {//获取数据集列表
          const params = getParams(param, this, "modelDataMrg");//调用api整理参数
          const responseData = await getDataSetList(params);//调用api返回可用数据集列表
          if (responseData.code === 0) {//校验码正确
              this.loading = false;
              this.tableData = responseData.data.records;//设置表格数据
              this.pagination.total = responseData.data.total;
              if (param?.isFirst) {
                  this.total = responseData.data.total;//设置分页参数
              }
              else {
                  getDataSetList({
                      dlType: this.tabActiveKey,
                      // dlTagType: param.dlTagType,
                      source: 'traincenter',
                  }).then(res => {
                      this.total = res.data.total
                  })
              }
          }
      },
      tableDataChange(pagination, filters) {//表格更新时更新pageSize和current
          if (filters.dlTagType) this.filterDlTagType = true
          this.getData({//调用getDataList并传入参数
              pageSize: pagination.pageSize,
              pageIndex: pagination.current,
              dlTagType: filters?.dlTagType ? filters.dlTagType[0] : (this.filterDlTagType ? '' : this.step1ImageItem.tagType)
          })
          this.pagination.pageSize = pagination.pageSize;//更新分页
          this.pagination.current = pagination.current;
      },
      checkdata() {//根据选中的数据检查数据集
          const params = {

          }
          const jsonparams = JSON.stringify(params);
          //检查数据集是否满足条件
          axios.post(`/api/v1/dataanalysis/datasetCheck/checkDatasetCondition`, jsonparams, {
              headers: {
                  'Content-Type': 'application/json',

              }
          }).then(response => {
              // 请求成功的回调，此时返回code===0
              this.$forceUpdate();//刷新
          }).catch(error => {
              // 请求失败的回调
          });
      },
      adddatalist() {//添加数据集
          this.isadding = !this.isadding;//开始添加数据集
          const params = {
              pageSize: this.pagination.pageSize,
              pageIndex: this.pagination.current,
              isFirst: true,
              dlTagType: this.modelInfo.tagType
          }
          this.getData(params);
      },
      endadd() {//完成添加
          this.isadding = !this.isadding;//结束添加数据集
          this.modelInfo.dataList = this.dlId.toString();/*重设数据集列表*/
          this.getModelDLtByDLId();
          this.getCodeList(false);
      },
      deldatalist(record) {//删除数据集
          let temp = this.modelInfo.dataList.split(",");//当前数据列表string转数组
          temp = temp.filter(item => item != record.dlId);//去除删除的数据集编号
          temp = temp.map(Number);//确保dlId存储着数字数组
          this.$store.commit('settempdlId', temp);//更新临时数据集列表 
          this.modelInfo.dataList = temp.join(",");//数组转string,回写
          this.getModelDLtByDLId();
          this.getCodeList(false);
      },
      delable() {
          let temp = this.modelInfo.dataList.split(",");//当前数据列表string转数组
          if (temp.length > 1)
              return true;
          return false;
      },
      setdata() {//设置数据集及选中项
          this.isadding = false;
          this.$refs.btn1.$el.innerText = "保存中";
          this.tempdis = true;
          const params = {
              modelId: this.modelInfo.id,//模型id
              dlId: this.modelInfo.dataList.toString(),//数据集id id之间以逗号分隔
              selectedType: this.selectedType.toString(),//选中的code列表
          }
          const jsonparams = JSON.stringify(params);
          axios.post(`/api/v1/traincenter/modelManageInfo/completeSetMergeDatasetAndSelectedType/`, jsonparams, {
              headers: {
                  'Content-Type': 'application/json',

              }
          }).then(response => {
              // 请求成功的回调，此时返回code===0
              this.$forceUpdate();//刷新
          }).catch(error => {
              // 请求失败的回调
          });
          this.key++;
          this.$refs.btn1.$el.innerText = "确定";
          this.tempdis = false;
      },
      onChange(checkedList) {//改变类别复选框状态时，更新全选复选框状态
          this.indeterminate = !!checkedList.length && checkedList.length < this.selectedTypeList.length;
          this.checkAll = checkedList.length === this.selectedTypeList.length;
      },
      onCheckAllChange(e) {//改变全选复选框状态时，更新类别复选框状态
          this.$set(this, 'selectedType', e.target.checked ? this.selectedTypeList.map(item => item.value) : []);//要更改的数据源，具体数据，重新赋的值
          Object.assign(this, {//赋值更新全选框状态
              indeterminate: false,
              checkAll: e.target.checked,
          });
          if (e.target.checked == false)
              return;
      },
      sortChange() {//排序预测类别复选框
          if (this.sortType === 1) {//若sortType=1，则按字母顺序排序
              const typeList = this.selectedTypeList.map(item => item.value).sort()
              this.selectedTypeList = typeList.map(item => {
                  return {
                      value: item,
                      number: this.selectedTypeList.filter(code => code.value === item)[0].number
                  }
              })
          } else {//若sortType!=1，则按各类型数量排序
              this.selectedTypeList = this.selectedTypeList.sort((a, b) => {
                  return b.number - a.number
              })
          }
      },
      code_density_Upload(file) {//上传code_density文件
          var formdata = new FormData();
          //upload.append('modelId', this.modelInfo.id);
          formdata.append('file', file);
          axios.post(`/api/v1/datacenter/file/uploadModelCodeDensity/${this.modelInfo.id}`, formdata, {
              headers: {
                  'Content-Type': 'multipart/form-data', // 指定Content-Type为multipart/form-data

              }
          }).then(response => {
              // 请求成功的回调，此时返回code===0 
          }).catch(error => {
              // 请求失败的回调
          });
          return false
      },
      async startTrain() {//模型开始训练
          const params = {
              modelId: this.modelInfo.id,
          }
          const jsonparams = JSON.stringify(params);
          axios.post(`/api/v1/traincenter/modelManageInfo/completeSetTrainStart/`, jsonparams, {
              headers: {
                  'Content-Type': 'application/json',

              }
          }).then(response => {
              // 请求成功的回调，此时返回code===0
              this.$forceUpdate();//刷新
          }).catch(error => {
              // 请求失败的回调
          });
      },
    //自定义行点击事件
    getCustomRow (record) {
      return {
        on: {
          click: () => {
            this.clickRowId = record.dlId 
            this.record = record
            this.getFileCategory(record?.dlId)
            this.barTitle = record?.dlName
          }
        }
      }
    },
    getRowClassName (record) {
      return this.clickRowId === record.dlId && 'row-selection'
    },
    selectImageChange (val, node, index) {
      this.params.universalMirrorList[index].id = node.eventKey
    },
    changeExternal () {
      // 切换选中的文件目录
      const selectData = this.params.externalList.filter(item => {
        return Object.keys(item)[0] === this.params.selectFileList
      })[0]
      this.params.externalDepend = selectData[this.params.selectFileList].map((item, index) => {
        return {
          uid: String(index),
          name: item,
          status: 'done'
        }
      })
    },
    getModelDependData (id) {
      // 这里记得更换成id
      getModelDepend(id).then(res => {
        const data = res.data
        this.params.universalMirror = data.map((item, index) => {
          item.child.forEach(child => {
            child.value = child.modelName
          })
          return {
            modelName: item.tagType,
            child: item.child,
            value: item.tagType,
            id: '0-' + index,
            disabled: true
          }
        })
      })
    },
    getActiveParams (data) {
      const _data = JSON.parse(data).map((item, index) => {
        if (item.type) {
          let children = null
          if (item.type === 1) {
            children = item.childreans.map((child, childIndex) => {
              return {
                ...child,
                key: `${index}-${childIndex}-${child.name}`
              }
            })
          } else {
            delete item.childreans
          }
          return {
            ...item,
            childreans: children || undefined,
            key: `${index}-${item.name}`
          }
        } else {
          const child = Object.keys(item)[0]
          return {
            name: child,
            type: 2,
            content: item[child],
            key: `${index}-${child}`
          }
        }
      })
      this.backupAlgorithmParam = JSON.parse(JSON.stringify(_data))
      this.algorithmParam = _data
    },
    selectParamChange (selectedKeys, obj) {
      this.selectObj = { ...obj.node.dataRef }
      if (this.selectObj.type !== 2) return false
      this.algorithmParamValue = this.selectObj.content
    },
    async confirmClick () {
      if (this.showJSONError) {
        return false
      }
      if(this.algorithmParam[0].content.includes("config_dir")) {
        let index = this.algorithmParam[0].content.indexOf("config_dir")
        let tmpStr = this.algorithmParam[0].content.substring(index + 1, this.algorithmParam[0].content.length).split("'")[1]
        this.algorithmParam[1].name = tmpStr
      }
      this.$set(this.modelInfo, 'algorithmParam', JSON.stringify(this.algorithmParam))
      const data = await editModelParams({
        id: this.modelInfo.id,
        algorithmParam: this.modelInfo.algorithmParam,
        businessParam: this.modelInfo.businessParam,
        imageId: this.modelInfo.imageId || this.modelInfo.imagesId
      })
      if (data.code === 0) {
        this.backupBusinessParam = this.modelInfo.businessParam
        this.backupAlgorithmParam = JSON.parse(this.modelInfo.algorithmParam)
        this.$message.success("修改成功！")
        this.suanfaDis = true
        this.businessDis = true
      }
    },
    cancelClick () {
      this.algorithmParam = JSON.parse(JSON.stringify(this.backupAlgorithmParam))
      this.selectParamChange(null, {
        node: { dataRef: this.selectObj }
      })
      this.$set(this.modelInfo, 'businessParam', this.backupBusinessParam)
      this.suanfaDis = true
      this.businessDis = true
      this.showJSONError = false
    },
    confirmJSON (e) {
      const val = e.target.value
      if (!val) {
        // 当前参数为空时
        this.showJSONError = false
      } else {
        if (!isNaN(val)) {
          this.showJSONError = true
          return false
        }
        try {
          const jsonString = JSON.parse(val)
        } catch (err) {
          this.showJSONError = true
          return false
        }
        this.showJSONError = false
      }
    },
    changeAlgorithmParam () {
      this.algorithmParam.forEach(item => {
        if (item.key === this.selectObj.key) {
          item.content = this.algorithmParamValue
        } else if (item.childreans) {
          item.childreans.forEach(child => {
            if (child.key === this.selectObj.key) {
              child.content = this.algorithmParamValue
            }
          })
        }
      })
    },
    async saveRemake () {
      const params = {
        desc: this.modelInfo.modelDescription,
        modelId: this.modelInfo.id
      }
      const res = await saveRemake(params)
      if (res.code !== 0) return false
      this.$message.success('保存成功')
    },
  }
}
</script>

<style lang="less">
@import "~@/config/theme.less";
.modelDetail .content-card .ant-tabs-nav-wrap {
  display: none;
}
.modelDetail .content-card .ant-tabs-bar {
  display: none;
}
    // .modelDetail /deep/ {
        .ant-tabs-tabpane
    {
        /*width:90%;*/
    }
    .modelDetail .ant-tabs-tabpane .params{
  margin: 0 auto;
  width: 100%;
  max-height: calc(100vh - 260px);
  overflow: auto;
  padding-right: 6px;
  .scrollbar();
  &>div{
    .ant-card{
      width: 100%;
      margin-bottom: 5px;
      &.bottom{
        border-bottom: 1px solid #e8e8e8;
        padding-bottom: 10px;
      }
      &-head{
        min-height: auto;
        padding-left: 15px;
        background: #4064dfcc;
        color: #fff;
        &-title{
          padding: 3px 0;
          font-size: 14px;
        }
      }
    &-body {
        padding: 0px 24px;
        /*width:90%;*/
    }
    }
  }
  &-top{
    .ant-card-body{
      height: 80px;
      overflow-y: auto;
      .ant-list-items{
        border-radius: 3px;
        li{
          overflow: hidden;
          padding: 5px 0;
          .universalMirrorValue{
            width: 70%;
            .ant-select{
              width: 100%;
            }
          }
        }
      }
    }
  }
  &-middle{
    .upload-list{
      margin-top: 10px;
    }
    .upload-content{
      position: relative;
      .ant-upload{
        display: block;
      }
      .ant-upload-list{
        height: 100px;
        overflow-y: auto;
      }
      button{
        position: absolute;
        right: 10px;
        bottom: 10px;
        background: rgba(0,0,0,0.3);
        color: #fff;
        z-index: 1;
      }
    }
  }
  &-bottom{
    position: relative;
    .mirror-params-list{
      margin-top: 10px;
      width: 200px;
      float: left;
      height: 25vh;
      margin-right: 10px;
      overflow-y: auto;
      border-right: 1px solid #e8e8e8;
    }
    .ant-tree li .ant-tree-node-content-wrapper {
      text-overflow: ellipsis;
      overflow: hidden;
      width: calc(100% - 24px);
      &.ant-tree-node-selected{
        background: #0072C6;
        color: #fff;
      }
    }
    .text-area{
      height: 25vh;
      margin: 10px 0px;
      &.algorithmParam{
        width: calc(100% - 210px);
      }
    }
    button{
      position: absolute;
      right: 35px;
      bottom: 25px;
      background: rgba(0,0,0,0.3);
      color: #fff;
      z-index: 1;
    }
    &.footer{
      .bottom{
        .ant-card-body{
          margin-top: 10px;
        }
      }
      p{
        color: red;
      } 
    }
  }
}
// }
</style>

<style lang="less" scoped>
    
/deep/ .remake{
  display: flex;
  &>span{
    width: 100px;
  }
  button{
    margin-left: 10px;
  }
}
.page-content {
  .content-card {
    border-radius: 16px;
    margin-top: 16px;
  }
  .content-card /deep/ .ant-card-body
    {
        padding: 15px 20px 20px 20px;
    }
    .basic-card /deep/ .ant-card-body {
        padding: 15px 0px 0px 0px;
        width:100%
    }
  /deep/ .ant-descriptions-item-label {
    font-size: 12px;
    font-family: '微软雅黑', sans-serif;
    font-weight: 500;
    color: rgba(9, 16, 47, 0.5);
    line-height: 17px;
  }
  /deep/ .ant-descriptions-item-content {
    font-size: 12px;
    font-family: '微软雅黑', sans-serif;
    font-weight: 400;
    color: rgba(9, 16, 47, 1);
    line-height: 17px;
  }
  .data-card {
    /deep/  .ant-spin {
      max-height: 100%;
    }
    /deep/ .ant-card-body {
      width: 100%;
      height: 100%;
      padding: 0;
      .ant-table-wrapper {
        margin: 0;
        .row-selection{
            // antd 默认的hover颜色
            background: #f0f5ff;
        }
      }
    }
    .data-card-left{
      height: calc(100vh - 433px);
      min-height: 385px;
      border: 1px solid #E6E7EA;
    }
    .data-card-right{
      height: calc(100vh - 433px);
      min-height: 385px;
      border: 1px solid #E6E7EA;
      overflow-x: auto;
      overflow-Y: null;
    }
  }
  /deep/ .ant-descriptions-item-colon::after {
    content: " ";
  }

  .bar-chart {
    height: 300px;
  }
  .ant-input[disabled]{
    color: #000;
  }
  .text-area{
    height: 60vh;
    margin:10px 0px;
    &.algorithmParam{
      width: calc(100% - 210px);
    }
  }
  .mirror-params-list{
    margin-top: 10px;
    width: 200px;
    float: left;
    height: 60vh;
    margin-right: 10px;
    overflow-y: auto;
    border-right: 1px solid #e8e8e8;
  }
  /deep/ .ant-tree li .ant-tree-node-content-wrapper {
    text-overflow: ellipsis;
    overflow: hidden;
    width: calc(100% - 24px);
    &.ant-tree-node-selected{
      background: #0072C6;
      color: #fff;
    }
  }
    .ant-tabs-tabpane {
        position: relative;
    }
  .editContent {
    position: absolute;
    top: 30px;
    right: 0;
    z-index: 1;
  }
  .editBusinessContent{
    text-align: right;
    line-height: 32px;
  }
}
    .a-form-model-item {
        margin-bottom: 20px;
    }
    .middle {
        width: 200px;
        margin: 5px auto;
        display: block;
        position: absolute;
        height: auto;
        left: 0px;
    }
    .small{
        width:100px;
        height:auto;
    }
    .content{
        display:flex;
        flex-direction:column;
        align-items:center;
        width:200px;
    }
    span{
        position:relative;
    }
    a-checkbox {
        width: 200px;
        height: 50px;
    }
    .inner{
        width:80px;
        display:inline-block 
    }
    .right {
        margin-bottom: 20px;
        margin-right: 5%;
        float: right
    }
</style>
