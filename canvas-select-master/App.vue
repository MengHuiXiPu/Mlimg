<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>v-for指令</title>
</head>
<body>
<!-- 开发环境版本，包含了有帮助的命令行警告 -->
<script src="https://cdn.staticfile.org/vue/2.2.2/vue.min.js"></script>
<div id="app">
  <input type="button" value="新增菜谱" @click="add" />
  <input type="button" value="减少菜谱" @click="reduce" />
  <ul>
    <li v-for="(item,index) in arr">城市{{index+1}}：{{item}}</li>
  </ul>

  <h2 v-for="item in vegetables">{{item}}</h2>
</div>


<script>
  var vue = new Vue({
    el: "#app",
    data: {
      arr: ["北京", "上海", "广州", "深圳"],
      vegetables: ["蛋炒饭", "西红柿炒蛋", "水煮大白菜", "红烧牛肉"]
    },
    methods: {
      add:function(){
        this.vegetables.push("肉末茄子")
      },
      reduce:function(){
        this.vegetables.shift();/* 移除数组左边的一个元素 */
      }
    }
  })
</script>
</body>
</html>