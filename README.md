
0. npm install 
1. main.js 是生成不同类型漫画的json数据 执行命令: node main.js

2. DownLoadMH.js  执行命令: node DownLoadMH.js 

自动下载漫画,但为了不给别人的服务器造成太大的压力,这个下载功能是同步的.下载时间可能会比较长

3. sites.js 抽取出来的公共类

4. lastDownLoadMark.json 该文件是记录异常断开时记录下载到哪个位置,比如ctrl-c

	lastChapter: 最后一次下载的第几章

	lastPageNo: 最后一次下载的是第几页

	lastMHNo: 最后一次下载的第几本漫画

如果不能运行,请加Q群 157998605