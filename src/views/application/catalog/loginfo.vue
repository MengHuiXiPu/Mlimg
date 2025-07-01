<template>
<div class="log-viewer">
    <!-- 查询区域 -->
      <el-form  label-width="90px"  label-position="left">
        <el-row :gutter="5" class="selectors">
          <el-col :span="8">
            <el-form-item label="版本:" label-position="left" >
              <el-select
                v-model="selectedVersion"
                placeholder="请先选择版本"
                @change="filteredInstances"
                style="width: 100%;"
              >
                <el-option
                  v-for="version in versions"
                  :key="version.version"
                  :label="version.version"
                  :value="version.version"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8" >

            <el-form-item label="实例:" label-position="left" >
              <el-select
                v-model="selectedInstance"
                placeholder="选择实例"
                :disabled="!selectedVersion"
                style="width: 100%;"
                @change="fetchLogsAuto"
                clearable="true"
              >
              <el-option-group label="运行实例">
                <el-option
                  v-for="instance in currentInstances"
                  :key="instance"
                  :label="instance"
                  :value="instance"
                />
              </el-option-group>
              <el-option-group label="历史实例">
                <el-option
                  v-for="instance in historyInstances"
                  :key="instance"
                  :label="instance"
                  :value="instance"
                />
              </el-option-group>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="日志级别:" label-position="left">
              <el-select
                v-model="logLevel"
                placeholder="选择日志级别"
                style="width: 100%;"
                clearable="true"
              >
                <el-option
                  v-for="item in logLevels"
                  :key="item"
                  :label="item"
                  :value="item"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="5" class="time-filters">
          <el-col :span="8">
            <el-form-item label="时间段选择:" label-position="left">
              <el-button-group>

                <el-button
                  :class="{ 'active-button': activePeriod === 'today' }"
                  @click="setTimePeriod('today')"
                  size="small"
                  style="flex: 1;width:25%;"
                >今天</el-button>
                <el-button
                  :class="{ 'active-button': activePeriod === '7days' }"
                  @click="setTimePeriod('7days')"
                  size="small"
                  style="flex: 1;width:25%;"
                >近7天</el-button>
                <el-button
                  :class="{ 'active-button': activePeriod === '30days' }"
                  @click="setTimePeriod('30days')"
                  size="small"
                  style="flex: 1;width:25%;"
                >近30天</el-button>
                <el-button
                  :class="{ 'active-button': activePeriod === 'custom' }"
                  @click="toggleCustomDate"
                  size="small"
                  style="flex: 1; width:25%;"
                >自定义</el-button>
              </el-button-group>
            </el-form-item>
          </el-col>
          <el-col span="8">
            <el-date-picker
                v-model="dateRange"
                type="datetimerange"
                range-separator="-"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                format="yyyy-MM-dd HH:mm:ss"
                :value-format="null"
                :disabled="!customDateEnabled"
                style="width: 100%;"
                @change="handleDateChange"
              />
          </el-col>
        </el-row>

        <el-row :gutter="5" class="keyword-search">
          <el-col :span="16">
            <el-form-item label="搜索关键字:" label-position="left">
              <el-input
                v-model="searchKeyword"
                placeholder="多个关键字请用英文逗号分割"
                style="width: 100%;"
                clearable="true"
              />
            </el-form-item>
          </el-col>
          <el-col :span="6" >
            <el-button-group>
            <el-button type="primary" :loading="isLoading" icon="el-icon-search" @click="fetchLogsByUser">查询</el-button>
            <el-button icon="el-icon-refresh" @click="clearFilters">清空</el-button>
            <el-button title="支持下载30天内日志" :loading="isDownloading" icon="el-icon-download" @click="downloadLogs" :disabled="isDownloading">下载</el-button>
            </el-button-group>
          </el-col>
        </el-row>
      </el-form>

    <!-- 日志显示区域 -->
    <div class="log-display" ref="logDisplay" @scroll="handleScroll"> 
      <pre>
        <div class="log-data" v-for="(log, index) in displayedLogs" :key="index" @click="pauseScrolling">
          <span class="log-date">{{formatNanoTimestamp(log.nanoTimestamp)}}</span>
          <span class="log-line">{{log.logLine}}</span>
        </div>
      </pre>
      
    </div>
    <!-- 显示条数选择器 -->
    <el-row class="logcount">
        <el-col :span="2">显示条数：</el-col>
        <el-col :span="2">
            <el-select v-model="logCount" @change="fetchLogs" style="width: 100%;">
                <el-option
                v-for="count in logCountOptions"
                :key="count"
                :label="count"
                :value="count"
                />
            </el-select>
        </el-col>
    </el-row>
  </div>
</template>

<script>
import { getlokiLogs,getlokiLabels,getlokiLabelsName,getVerionsInstance } from '@/api/loginfo.js';
import JSZip from 'jszip';
import {saveAs} from 'file-saver';
import { axios } from '@/utils/request'
import * as MonitorApi from "@/api/monitor";
import streamSaver from 'streamsaver';

export default {
  name:"logInfo",
  props:{
    loginfo : {
      default: {},
      type: Object
    }
  },
  data() {
    return {
      versions:[],
      instances:[],
      data: [],
      selectedVersion: null,
      selectedInstance: null,
      searchKeyword: '',
      customDateEnabled: false,
      dateRange: [], // 用于存储日期时间范围
      activePeriod: '',
      logInterval: null,
      lastTimestamp: null,
      autoScrollEnabled: false,
      isLoading: false,
      noMoreData: false,
      displayedLogs: [],
      autoQueryEnabled: false,
      logCount: 1000, 
      logCountOptions: [100, 200, 500, 1000, 2000],
      logLevel:'',
      logLevels:[],
      taskId : '',
      taskName:'',
      isDownloading: false, // 用于跟踪下载状态
      currentInstances:[],  // 当前存活实例
      historyInstances:[],  // 历史存活实例
    };
  },
  computed: {
    
  },
  methods: {

    //查询版本与实例
    async fetchVIData(){
      try{
        //const response = await getVerionsInstance(1);
        const response = await MonitorApi.queryServiceInfoById(this.taskId);
        this.versions = response.data.versions;
      }catch(error){
        this.$message.error("查询版本与实例异常，请刷新重试！"+error);
      }
    },
    //根据选择的版本更新实例选择框
    filteredInstances() {
      const selectedVersionData = this.versions.find(
        version => version.version === this.selectedVersion
      );
      if (selectedVersionData) {
        //this.instances= [...new Set([...selectedVersionData.runningInstances, ...selectedVersionData.historyInstances])];
        this.currentInstances = selectedVersionData.runningInstances;
        this.historyInstances = selectedVersionData.historyInstances;
       
      }else{
        this.instances= [];
      }
      
    },
    // //查询Loki标签
    // async fetchlabelData(){
    //   const response =await getlokiLabels();
    //   this.versions = response.data;
    //  },
    // async getInstances(){
    //   this.selectedInstance = ''
    //   const response =await getlokiLabelsName(this.selectedVersion);
    //   if(response.data){
    //     this.instances = response.data;
    //   }else{
    //     this.instances = [];
    //   }
    //   //this.instances = response.data;
    // },
    //查询日志级别
    async getLevels(){
      //this.selectedInstance = ''
      const response =await getlokiLabelsName('level');
      if(response.data){
        this.logLevels = response.data;
      }else{
        this.logLevels = [];
      }
      
    },
    //自动查询日志
    fetchLogsAuto(){
        //清空日志信息
        this.displayedLogs =[];
        //重置查询时间
        this.lastTimestamp = null;
        //设置自动滚动到底部,如果关键字查询，则不自动滚到底部
        if (!this.searchKeyword || this.searchKeyword.trim() === ''){
          this.autoScrollEnabled =true;
        }
        this.autoQueryEnabled=true;
        //设置定时器查询日志
        clearInterval(this.logInterval);
        this.logInterval = setInterval(this.fetchLogs, 1000);
    },
    //用户点击查询按钮查询日志
    fetchLogsByUser() {
      this.displayedLogs = [];
      this.lastTimestamp = null;
      this.isLoading = true;
      this.fetchLogs().finally(() => {
        this.isLoading = false; // 加载完成
        this.scrollToBottom();  //滚动到底部
      });
      if (this.searchKeyword.trim() !== '') {
        this.autoQueryEnabled = false;
        if (this.logInterval) {
          clearInterval(this.logInterval);
        }
      }
    },
    //查询日志
    async fetchLogs() {
      //if(this.isLoading==true) return;
      if(!this.selectedInstance ) {
        this.$message.warning("请选择实例后查询日志信息！");
        //清除定时器，避免一直报错
        clearInterval(this.logInterval);
        return;
      }
      
      this.noMoreData = false;
      let keywordQuery = '';
      let level='';
      if (this.searchKeyword) {
        const keywords = this.searchKeyword.split(',').map(kw => kw.trim()).filter(kw => kw);
        keywordQuery = `|~"(${keywords.map(kw => kw).join('|')})"`;
      }

      //const query = `instance="${this.selectedInstance}"`;
      //const query = `${this.selectedVersion}="${this.selectedInstance}"`;
      //const query = `server="${this.loginfo.taskName}",instance="${this.selectedInstance}"`;
      const query = `instance="${this.selectedVersion}"`;//先适配查询出日志
      if(this.logLevel){
        level = `,level="${this.logLevel}"`;
        //level = `|~"${this.logLevel}"`
      }
      const startTime = this.displayedLogs.length > 0 
                        ? this.displayedLogs[this.displayedLogs.length -1].nanoTimestamp
                        : (this.dateRange[0] 
                            ? this.dateRange[0].getTime() * 1000000 
                            : Date.now()* 1000000);
      const endTime = this.dateRange[1] 
                        ? this.dateRange[1].getTime() * 1000000 
                        : Date.now()* 1000000;
      await getlokiLogs({
        query: `{${query} ${level}} ${keywordQuery}`,
        limit: 200,
        direction: 'BACKWARD',
        start: startTime,
        end: endTime
      }).then(response => {
        const streams = response.data.result;
        const newLogs = streams.flatMap(stream =>
          stream.values.filter(value=> value[0]>this.lastTimestamp)
          .map(value => ({
            nanoTimestamp: value[0],
            message: value[1],
          }))
        )
        .sort((a, b) => parseInt(a.nanoTimestamp) - parseInt(b.nanoTimestamp));

        if (newLogs && newLogs.length > 0) {
          //记录查询到的最后时间信息
          this.lastTimestamp = newLogs[newLogs.length - 1].nanoTimestamp;
          //日志格式整理
          const formattedLogs = newLogs.map(log => ({
            nanoTimestamp:log.nanoTimestamp,
            logLine:`${log.message}`,
            //logLine:`${this.formatNanoTimestamp(log.nanoTimestamp)} ${log.message}`,
          }));
          //记录查询到的所有日志
          //this.displayedLogs = [...this.displayedLogs,...formattedLogs].slice(-this.logCount);
          //processLogsInBatches(formattedLogs)
          this.displayedLogs.push(...formattedLogs);
          this.displayedLogs = this.displayedLogs.slice(-this.logCount);
        } else {
          this.noMoreData = true;
          this.autoScrollEnabled = false
          clearInterval(this.logInterval);
        }

        if (this.autoScrollEnabled) {
          this.scrollToBottom();
        }else{

        }
      }).catch(error => {
        this.$message.error('获取日志时出错，请稍后重试。'+error);
      }).finally(() => {
        this.isLoading = false;
      });
    },
    //向上滚动查询日志
    async fetchLogsForward() {
      if(this.isLoading==true) return;
      if (!this.selectedInstance && !this.selectedVersion) {
        this.$message.warning("请选择实例后查询日志信息！");
        return;
      }
      //this.isLoading = true;
      this.noMoreData = false;
      let keywordQuery = '';
      let level='';
      if (this.searchKeyword) {
        const keywords = this.searchKeyword.split(',').map(kw => kw.trim()).filter(kw => kw);
        keywordQuery = `|~"(${keywords.map(kw => kw).join('|')})"`;
      }

      //const query = `instance="${this.selectedInstance}"`;
      //const query = `${this.selectedVersion}="${this.selectedInstance}"`;
      //const query = `server="${this.loginfo.taskName}",instance="${this.selectedInstance}"`;
      const query = `instance="${this.selectedVersion}"`;//先适配查询出日志
      if(this.logLevel){
        level = `,level="${this.logLevel}"`;
      }
      const startTime = this.dateRange[0] 
                            ? this.dateRange[0].getTime() * 1000000 
                            : 0;
      // 使用当前显示的最早日志的时间戳作为新的结束时间
      const endTime = this.displayedLogs.length > 0
        ? this.displayedLogs[0].nanoTimestamp
        : (this.dateRange[1] ? this.dateRange[1].getTime() * 1000000 : Date.now() * 1000000);

      const logDisplay = this.$refs.logDisplay;
      const currentScrollHeight = logDisplay.scrollHeight;
      const currentScrollTop = logDisplay.scrollTop;  

      await getlokiLogs({
        query: `{${query} ${level}}${keywordQuery}`,
        limit: 100,
        direction: 'BACKWARD',
        start: startTime,
        end: endTime
      }).then(response => {
        const streams = response.data.result;
        const newLogs = streams.flatMap(stream =>
          stream.values
          .map(value => ({
            nanoTimestamp: value[0],
            message: value[1],
          }))
        )
        .sort((a, b) => parseInt(a.nanoTimestamp) - parseInt(b.nanoTimestamp));

        if (newLogs && newLogs.length > 0) {
          //记录查询到的最后时间信息
          //this.lastTimestamp = newLogs[newLogs.length - 1].nanoTimestamp;
          //日志格式整理
          const formattedLogs = newLogs.map(log => ({
            nanoTimestamp: log.nanoTimestamp,
            logLine: `${log.message}`,
          }));
          //记录查询到的所有日志
          //过滤关键字后展示
          //this.displayedLogs = [...this.displayedLogs,...formattedLogs].slice(-this.logCount);

          this.displayedLogs.unshift(...formattedLogs);
          //this.displayedLogs = this.displayedLogs.slice(this.logCount);
          this.$nextTick(() => {
            const newScrollHeight = logDisplay.scrollHeight;
            logDisplay.scrollTop = currentScrollTop + (newScrollHeight - currentScrollHeight);
          });
        } else {
          this.noMoreData = true;
          this.autoScrollEnabled = false
          clearInterval(this.logInterval);
        }

        if (this.autoScrollEnabled) {
          this.scrollToBottom();
        }
      }).catch(error => {
        this.$message.error('获取日志时出错，请稍后重试。'+error);
      }).finally(() => {
        this.isLoading = false;
      });
    },
    //使用 requestAnimationFrame 分批处理渲染过程
  //   processLogsInBatches(logs) {
  //   const batchSize = 100;
  //   let index = 0;

  //   const processBatch = () => {
  //     const batch = logs.slice(index, index + batchSize);
  //     this.displayedLogs.push(...batch);
  //     index += batchSize;

  //     if (index < logs.length) {
  //      window.requestAnimationFrame(processBatch); // 在下一次重绘之前处理下一个批次
  //     } else {
  //       //this.isLoading = false;
  //     }
  //   };

  //   //this.isLoading = true;
  //   processBatch();
  // },

    //关键字输入后过滤
    // filterDisplayedLogs() {
      
    //   if ( !this.searchKeyword || this.searchKeyword.length === 0) {
    //     this.displayedLogs = this.filteredLogs;
    //     this.autoQueryEnabled = true;
    //     this.scrollToBottom();//滚动到最底部
    //     this.startAutoQuery();
    //   } else {
    //     const keywords = this.searchKeyword.toLowerCase().split(',').map(kw => kw.trim()).filter(kw => kw);
    //     this.displayedLogs = this.filteredLogs.filter(log =>
    //       keywords.some(keyword => log.logLine.toLowerCase().includes(keyword))
    //     );
    //     this.autoQueryEnabled = false;
    //     if (this.logInterval) {
    //       clearInterval(this.logInterval);
    //     }
    //   }
    // },
    
    setTimePeriod(period) {
      if (this.activePeriod === period) return; // 如果当前选中的时间段与点击的相同，则不做任何操作

      const now = new Date();
      const endnow = new Date();
      let start, end;
      switch (period) {
        case 'today':
          start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
          end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
          break;
        case '7days':
          start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7, 0, 0, 0, 0);
          end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
          break;
        case '30days':
          start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29, 0, 0, 0, 0);
          end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
          break;
      }

      this.dateRange = [start, end];
      this.customDateEnabled = false;
      this.activePeriod = period;
    },
    //点击自定义按钮
    toggleCustomDate() {
      if (this.activePeriod === 'custom') return; // 如果当前选中的是自定义，则不做任何操作
      this.customDateEnabled = true;
      this.activePeriod = 'custom';
    },
    //点击清空按钮
    clearFilters() {
      this.searchKeyword = '';
      this.setTimePeriod('today');
      this.logLevel='';
      this.displayedLogs = [];
      this.lastTimestamp = null;
      this.autoScrollEnabled = true;
      this.autoQueryEnabled = true;
      this.logInterval = setInterval(this.fetchLogs, 1000);
    },
    //点击下载按钮
    async downloadLogs() {
      if(!this.selectedInstance){
        this.$message.warning("请选择实例后下载对应日志");
        return;
      }
      if (!this.dateRange.length) {
        this.$message.warning("请选择时间范围后下载日志");
        return;
      }

      //const zip = new JSZip();
      const chunkSize = 1000; // 每次请求的日志条数
      let allLogs = [];
      let startTime = this.dateRange[0].getTime() * 1000000;
      const endTime = this.dateRange[1].getTime() * 1000000;

      this.isDownloading =true;
      try {
        const fileStream = streamSaver.createWriteStream(`${this.taskName}-logs.txt`); 
        const writer = fileStream.getWriter();

        while (startTime < endTime) {
          const logs = await this.fetchLogChunk(startTime, endTime, chunkSize);
          if (logs.length === 0) break; // 如果没有更多数据，退出循环
          startTime = parseInt(logs[logs.length - 1].nanoTimestamp)+1; // 更新开始时间为最后一条日志的时间戳加1
          //allLogs = allLogs.concat(logs);
          const logContent = logs.map(log => log.logLine).join('\n');
          writer.write(new TextEncoder().encode(logContent + '\n'));
        }
        writer.close();
        
        //const logContent = allLogs.map(log => log.logLine).join('\n');
        //const blob = new Blob([logContent], { type: 'text/plain;charset=utf-8' });
        //saveAs(blob, `${this.taskName}-logs.txt`);
        //zip.file('logs.txt', logContent);

        //const content = await zip.generateAsync({ type: 'blob' });
        //saveAs(content, 'logs.zip');
        //const blob = new Blob([logContent], { type: 'text/plain;charset=utf-8' });
        // 创建一个隐藏的 <a> 标签
        // const url = URL.createObjectURL(blob);
        // const a = document.createElement('a');
        // a.href = url;
        // a.download = `${this.taskName}-logs.txt`;
        // document.body.appendChild(a);
        // a.click();
        // document.body.removeChild(a);
        // URL.revokeObjectURL(url); // 释放 URL 对象
        //saveAs(blob, 'logs.txt');
      } catch (error) {
        console.error('下载日志失败:', error);
        this.$message.error('下载日志时出错:'+error);
      }
      finally{
        this.isDownloading =false;
      }
    },
    async fetchLogChunk(startTime, endTime, limit) {
      //const query = `${this.selectedVersion}="${this.selectedInstance}"`;
      //const query = `server="${this.loginfo.taskName}",instance="${this.selectedInstance}"`;
      const query = `instance="${this.selectedVersion}"`;//先适配查询出日志
      let level = '';
      if (this.logLevel) {
        level = `,level="${this.logLevel}"`;
      }
      try{
      const response = await getlokiLogs({
        query: `{${query} ${level}}`,
        limit: limit,
        direction: 'FORWARD',
        start: startTime,
        end: endTime
      });

      const streams = response.data.result;
      return streams.flatMap(stream =>
        stream.values.filter(value=> value[0]>startTime)
        .map(value => ({
          nanoTimestamp: value[0],
          logLine: `${this.formatNanoTimestamp(value[0])} ${value[1]}`,
        }))
      );
      }
      catch{
        throw"没有查询到可下载日志！";
      }
    },
    //时间格式转换
    formatDate(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    },
    //纳秒转日期时间戳
    formatNanoTimestamp(nanoTimestamp) {
      const milliseconds = Math.floor(nanoTimestamp / 1e6);
      const nanoseconds = nanoTimestamp % 1e6;
      const date = new Date(milliseconds);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      //return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${String(nanoseconds).padStart(6, '0')}`;
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    },
    //滚动到底部
    scrollToBottom() {
      this.$nextTick(() => {
        const logDisplay = this.$refs.logDisplay;
        if (logDisplay) {
          logDisplay.scrollTop = logDisplay.scrollHeight;
        }
      });
    },
    pauseScrolling() {
      this.autoScrollEnabled = false;
    },
    // 防抖函数
    debounce(func, wait) {
      return (...args) => {
        if (this.debounceTimeout) {
          clearTimeout(this.debounceTimeout);
        }
        this.debounceTimeout = setTimeout(() => {
          func.apply(this, args);
        }, wait);
      };
    },
    // 监控滚动条事件
    handleScroll() {
      
      const logDisplay = this.$refs.logDisplay;
      if (logDisplay.scrollTop + logDisplay.clientHeight >= logDisplay.scrollHeight - 10) {
        if(this.autoQueryEnabled) return;
        // 使用防抖函数包装 fetchLogs
        this.debounce(() => {
          this.fetchLogs();
        }, 1000)(); // 1000 毫秒的防抖时间，可以根据需要调整
      }else if(logDisplay.scrollTop<10){//滚动到顶部，查询往前的数据
        this.autoQueryEnabled=false;
        this.debounce(()=>{
          this.fetchLogsForward();
        },500)();
      }
      else{
        this.autoQueryEnabled=false;
      }
    },
    //日期选择不能超过31天
    handleDateChange(value){
      if(value && value.length ===2)
      {
        const [startdate,enddate] = value;
        const startTime = new Date(startdate);
        const endTime = new Date(enddate);
        //计算时间差，以毫秒为单位
        const timeDiff = endTime-startTime;
        //将时间差转换成天数
        const dateDiff = timeDiff/(1000*60*60*24);
        //判断是否超出30天
        if(dateDiff >30){
          this.$message.warning("时间选择范围不能超出30天");
          this.dateRange=[];
        }

      }
    }
  },
   mounted() {
    this.taskId = this.loginfo.taskId;
    this.taskName = this.loginfo.taskName;//任务名称
    //this.fetchlabelData();
    this.getLevels();
    this.fetchVIData();
    this.setTimePeriod('today'); // 初始化时设置时间段为今天
    this.$refs.logDisplay.addEventListener('scroll', this.handleScroll);

  },
  beforeDestroy() {
    if (this.logInterval) {
      clearInterval(this.logInterval);
    }
    this.$refs.logDisplay.removeEventListener('scroll', this.handleScroll);
  }
};
</script>

<style scoped>
.log-viewer {
  padding: 10px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden; /* 确保父容器没有滚动条 */
}

.query-section {
  background-color: #ffffff;
  padding: 5px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 5px;
  display: flex;
}

.selectors, .time-filters, .keyword-search {
  margin-bottom: 1px;
  display: flex;
  position: relative;
}
.log-settings{
  margin-bottom: 1px;
}
.el-form-item {
  margin-bottom: 1px; /* 减少底部外边距 */
}
.el-col{
  margin-bottom: 1px;
  padding: 1px;
  position: relative;
}
.el-row{
  margin-bottom: 1px;
}
.el-select, .el-input,.el-button-group {
  
  margin-bottom: 1px;
  display: flex;
}
.el-button{
  display: flex;
  align-items: center; /* 垂直居中 */
  justify-content: center; /* 水平居中 */
  text-align: center;
}

.log-display {
  background-color: #1e1e1e;
  color: #ffffff;
  border-radius: 8px;
  flex-grow: 1;
  border: 1px solid #333;
  padding: 0px;
  margin: 0;
  overflow-y: auto;
  content-visibility: visible;
}

.log-display pre {
    text-align: left;
    color: #c3f2c2;
    line-height: 1;
    margin: 0;
    padding: 0;
    white-space: pre-line; /* 去除空格，允许自动换行 */
    word-wrap: break-word;
    overflow: hidden;
    font-family: 'Microsoft YaHei', Courier, monospace; /* 设置字体族 */
  }

pre span {
  display: block;
  cursor: pointer;
  padding: 0;
  margin: 0;
}

.log-data {
  display: flex;
  align-items: flex-start; /* 确保子元素向上对齐 */
  padding: 5px;
}

.log-date {
  color: #f1d7ed;
  margin-right: 5px;
  white-space: nowrap; /* 防止日期换行 */
  line-height: 1.5;
  font-family: 'Microsoft YaHei', Courier, monospace; /* 设置字体族 */
}

.log-line {
  color: #457145;
  font-family: 'Microsoft YaHei', Courier, monospace; /* 设置字体族 */
  word-break: break-word; /* 允许长单词换行 */
  flex-grow: 1; /* 让日志内容占据剩余空间 */
  line-height: 1.5;
  margin-left: 5px ;
}
.logcount {
  padding: 1px; /* 添加一些内边距 */
  margin-top: 1px; /* 确保与其他元素有间距 */
  margin-bottom: 1px;
}

.loading-indicator, .no-more-data {
  text-align: center;
  color: #ffffff;
  margin-top: 10px;
}

.active-button {
  background-color: #409EFF ; /* 蓝色背景 */
  color: #fff ; /* 白色文字 */
}
</style>