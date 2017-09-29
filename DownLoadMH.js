var fs = require('fs');
var cheerio = require('cheerio');
var http = require('http');
const phantom = require('phantom');
const request = require('request');
var parse = require('url').parse;
var Sites = require('./sites');

var site =  new Sites();
// 获取相应类型的MH数据文件
// var MHObj = require(__dirname+'/侦探推理漫画/侦探推理漫画3.json');
// var lastDownLoadMark = require(__dirname+'/lastDownLoadMark.json');

//获取要下载的链接列表
let MHObj = require(__dirname+'/侦探推理/侦探推理.json')[0].titleArray;
// 获取上次下载的信息
var lastDownLoadMark = require(__dirname+'/lastDownLoadMark.json');
console.log(lastDownLoadMark);
function downLoadChapater(index){
 	if (index>MHObj.length) {	
 		return;
 	}
	console.log(index);
	// 创建漫画名称对应的目录
	var obj = MHObj[index];
	console.log(obj.title);
	var title = "/侦探推理/"+MHObj[index].title;
	console.log(title);

	//创建目录,将相应的数据写入到分类目录中的文件
	var folderPath = __dirname+title;
	console.log(folderPath);

	 site.createDir(folderPath);

	// console.log(obj.chapaterArray);
	// 获取对应的章节数组
	var chapaterArray = obj.chapaterArray;
	console.log("漫画章节数"+chapaterArray.length);
	// 总页数
	var totalPage = lastDownLoadMark.totalPage;//总页数
	console.log("总页数"+totalPage);
	// 下载详细图片
	var downloadDetail = async function(i,pageNo){
		console.log("开始等待");
		var rs = await site.sleep(4000);
		console.log(rs);
		var chapater = chapaterArray[i];
		console.log("第"+i+"章"+chapater);
		var chapaterTitle =title+"/"+chapater.title;
		console.log(chapaterTitle);
		 folderPath = __dirname+title+"/"+chapater.title;
		 console.log("存放地址"+folderPath);
		 await site.createDir(folderPath);
		// 下载对应的章节的漫画图片
		var href = chapater.href;
		var downLoadURL = "http://www.dm5.com"+href.slice(0,-1)+'-p'+pageNo+'/';
		// 获取页面的页数		
		if (pageNo==0) {
			var totalImage = await site.asyncHttp(downLoadURL);
			// await site.sleep(500);
			// console.log(totalImage);
			let $ = cheerio.load(totalImage);
			var imgListHTML = $('#chapterpager a');
			totalPage = parseInt(imgListHTML[imgListHTML.length-1].children[0].data); 
			console.log("总页数"+totalPage);
		}
		var filename = pageNo+".jpg"
        var referrer = "http://www.dm5.com"+href;
        console.log("判断文件是否存在");
        // 判断该文件是否存在,而且该文件的长度要大于0,这样就可以避免重复下载
       	var isExists = await site.fileExits(folderPath+'/'+filename);
       	if (!isExists) {
	       	console.log("该文件是否存在"+isExists);
			console.log("判断结束")
	        console.log("开始下载");
		  	var imgSrc = await site.getImageURL(downLoadURL,'dm5');
	    	// 下载图片
			await downloadFile(imgSrc,filename,folderPath,referrer, function(){
				// console.log("图片下载完成");
				console.log("总页数"+totalPage+"当前页数"+pageNo);
				lastDownLoadMark.lastChapter=i;//最后一次下载的章节
				lastDownLoadMark.lastPageNo = pageNo;// 最后一次下载的页码
				lastDownLoadMark.lastMHNo = index;//最后一次下载
				lastDownLoadMark.totalPage = totalPage; //记录本章的页码总数
				if (pageNo<totalPage) {
					// 下载下一页的数据
					console.log("下载完成,继续下载下一页");
					console.log(rs);			
		    		downloadDetail(i,pageNo+1)
				}
	    	});
	    }else{
			if (pageNo<totalPage) {
				console.log("如果该文件已经存在,则继续下载下一个文件");			
				// 下载下一页的数据
	    		downloadDetail(i,pageNo+1)
			}
	    }		   
			  // 下一章
		if (pageNo>=totalPage) {
			console.log("pageNo:"+pageNo+"totalPage:"+totalPage);
			if (i<chapaterArray.length-1) {
				console.log("当前i是"+i+"下载下一章");				
				downloadDetail(i+1,0)				
			}else{
				//下载下一部漫画
				console.log("下载下一部漫画");
				lastDownLoadMark.lastPageNo = 0;
				lastDownLoadMark.totalPage = 0;
				lastDownLoadMark.lastChapter = 0;
			  	await site.writeData(lastDownLoadMark,__dirname+'/lastDownLoadMark.json');
    			downLoadChapater(index+1)
			}
		}
	}
	downloadDetail(lastDownLoadMark.lastChapter,lastDownLoadMark.lastPageNo);
	
}
//下载漫画
downLoadChapater(lastDownLoadMark.lastMHNo);

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



