var fs = require('fs');
var cheerio = require('cheerio');
var http = require('http');
const phantom = require('phantom');
const request = require('request');
var parse = require('url').parse;
var Sites = require('./sites');

var site =  new Sites();
//获取要下载的链接列表,自己替换
let MHListObj = require(__dirname+'/侦探推理/侦探推理.json')[0];
let titleArray = MHListObj.titleArray;
let CategoryTitle = MHListObj.title;
// 获取上次下载的信息
var lastDownLoadMark = require(__dirname+'/lastDownLoadMark.json');
var baseURL = "http://www.dm5.com";
// console.log(lastDownLoadMark);
// console.log(titleArray.length);
(async function(){
	//i是第几本漫画,lastDownLoadMark.lastMHNo记录的是上次下载到哪一本漫画
	for(let i=lastDownLoadMark.lastMHNo;i<titleArray.length;i++){
		var mhName = titleArray[i].title;//获取漫画的名称
		var chapeterArray = titleArray[i].chapeterArray;//获取漫画的章节
		await site.createDir(__dirname+"/"+CategoryTitle+"/"+mhName)
		// k代表当前漫画第几章,lastDownLoadMark.lastChapter代表最后一次下载到的章节
		for(var k=lastDownLoadMark.lastChapter;k<chapeterArray.length;k++){
			console.log("k="+k);
			console.log(lastDownLoadMark.lastPageNo);
			var title = chapeterArray[k].title;
			var href = chapeterArray[k].href;
			var folderPath = __dirname+"/"+CategoryTitle+"/"+mhName+"/"+title;
			//获取每一章漫画的总页数
			var chapeterData = await site.asyncHttp(baseURL+href);
			let $ = cheerio.load(chapeterData);
			var imgListHTML = $('#chapterpager a');
			var totalPage = parseInt(imgListHTML[imgListHTML.length-1].children[0].data); 
			console.log("总页数"+totalPage+"上一次下载到"+lastDownLoadMark.lastPageNo);
			var referrer = baseURL+href;
			// j代表当前下载第几页,lastDownLoadMark.lastPageNo最后一次下载完成的是第几页
			for(var j=lastDownLoadMark.lastPageNo;j<=totalPage;j++){
				console.log("j="+j);
				//为每一章漫画创建目录
				await site.createDir(folderPath);
				var fileName = j+".jpg";
				var fileExits = await site.fileExits(folderPath+"/"+fileName);
				if (fileExits) {
					console.log("该文件已存在");
					continue;
				}
				var downLoadURL = "http://www.dm5.com"+href.slice(0,-1)+'-p'+j+'/';
				var imgURL = await site.getImageURL(downLoadURL,"dm5");
				
				downloadFile(imgURL,fileName,folderPath,referrer,function(){
						console.log("图片下载完成");
				});
				lastDownLoadMark.lastChapter=k;//最后一次下载的章节
				lastDownLoadMark.lastPageNo = j;// 最后一次下载的页码
				lastDownLoadMark.lastMHNo = i;//最后一次下载
				// site.writeData(lastDownLoadMark,__dirname+'/lastDownLoadMark.json');
				if (j==totalPage) {
					console.log("最后一页了");
					// 如果这是最后一页,并且下载成功,那么就
					lastDownLoadMark.lastPageNo = 0;// 最后一次下载的页码
					console.log(lastDownLoadMark);
				}
				// 最后一章的时候,进行下载下一本漫画,下载历史除了lastMHNo之外都得清零
				if (k==titleArray.length-1) {
					console.log("最后一章了");
					lastDownLoadMark.lastPageNo = 0;
					lastDownLoadMark.lastChapter = 0;
				}
				await site.sleep(3000);
			}
		}

	}
}())

// 按住ctrl+c结束的时候,将最后一次下载的数据的标记写入到文件中
process.on('SIGINT', async function() {
  	// console.log('Got SIGINT.  Press Control-D/Control-C to exit.');
  	console.log("最后下载的的章节"+lastDownLoadMark.lastChapter+" 最后下载的页码"+lastDownLoadMark.lastPageNo+"最后下载的漫画"+lastDownLoadMark.lastMHNo);
  	// console.log(lastDownLoadMark);
  	await site.writeData(lastDownLoadMark,__dirname+'/lastDownLoadMark.json');
  	console.log("强制退出程序");
  	process.exit()
});
/*
	下载图片
	url: '图片地址',
	filename: 文件名称
	urlID: 图片的详情地址
*/
  function downloadFile(url,filename,folderPath,referrer,callback){
   //解析请求的url
   var host = parse(url).host;
   var Referer = 'http://'+parse(referrer).host+parse(referrer).path.slice(0,this.length);
   	//设置请求头
 	 var headers = {
		'Referer':Referer,
		'Host':host
  	 };
    var stream = fs.createWriteStream(folderPath+'/'+filename);
     request({  
      url: url,  
      headers: headers 
    }, function fetch(error, response, body) {  
        if (!error && response.statusCode == 200) {  
            // console.log(response);  
        } else {  
        	console.log(error);
            console.log('解析 HTML 错误或通讯故障。');  
            // downloadFile.apply(this,arguments)
            downloadFile(url,filename,folderPath,referrer,callback);
			site.writeData(lastDownLoadMark,__dirname+'/lastDownLoadMark.json');
        }  
    }).pipe(stream).on('close', callback);  
}

