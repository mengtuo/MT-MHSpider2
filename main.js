var http = require('http');
var request = require('request');
var cheerio = require('cheerio');
var fs = require('fs');
var Sites = require('./sites');
var site = new Sites();
var baseURL = "http://www.dm5.com";
var MHInfoArray = [];

(async function(){
	// 打开页面分类页面 http://www.dm5.com/manhua-list/
	var manHuaListHTML = await site.asyncHttp(baseURL+"/manhua-list/");
	var $ = cheerio.load(manHuaListHTML);
	var new_span_bakList = $('.new_span_bak');
	var titlArray = new_span_bakList[0].children;
	// console.log(titlArray);
	for(var i=0;i<titlArray.length;i++){
		console.log("第"+i+"个")
		var titleObj = titlArray[i];
		var MHInfo = {}
		if (i==7) {
			continue;
		}
		if (titleObj.name=='a') {
			var mhArray = []; //章节数组
			MHInfo.href = titleObj.attribs.href; //url
			MHInfo.title = titleObj.children[0].data; //名称
			MHInfo.titleArray = [];
			// 加载每一类型的详细页面
			await site.createDir(__dirname+'/'+MHInfo.title);
			var DetailHTML = await site.asyncHttp(baseURL+MHInfo.href);
			var $ = cheerio.load(DetailHTML);
			var redzi = $('.redzi');
			// 获取当前类型漫画的总片数
			var totalPageStr = redzi[1].children[0].data;
			var splitIndex = totalPageStr.indexOf("/");
			var totalPage = totalPageStr.slice(splitIndex+1,totalPageStr.length);
			for(var j=1;j<=totalPage;j++){
				var pageURL = baseURL+MHInfo.href.slice(0,-1)+'-p'+j+'/';
				var pageHTML = await site.asyncHttp(pageURL);
				var $ = cheerio.load(pageHTML);
				var red_ljList = $('.red_lj');
				for(var k=0;k<red_ljList.length;k++){
					var red_ljListObj = red_ljList[k].children;
					var mhObj = {};
					mhObj.href = red_ljListObj[1].attribs.href;
					mhObj.title = red_ljListObj[1].attribs.title;
					console.log(red_ljListObj[1].attribs.href);
					console.log(red_ljListObj[1].attribs.title);
					// 获取章节名称数组
					var chapeterArray = [];
					var chapterHTML = await site.asyncHttp(baseURL+mhObj.href);
					var $ = cheerio.load(chapterHTML);
					var cbc_1 = $('#cbc_1 a');
					var chapeterArray = []; //章节数组
					for(let k=0;k<cbc_1.length;k++){
						var chapte = cbc_1[k];
						if (chapte.attribs.class != null) {
							var newObj = {};
							newObj.href = chapte.attribs.href;
							newObj.title = chapte.attribs.title+k;
							chapeterArray.push(newObj);	
						}
					}
					var cbc2 = $('#cbc_2 a');
					for(let k=0;k<cbc2.length;k++){
							var chapte = cbc2[k];
							var newObj = {};
							newObj.href = chapte.attribs.href;
							newObj.title = chapte.attribs.title+k;
							chapeterArray.push(newObj);	
					}
					mhObj.chapeterArray = chapeterArray;
					MHInfo.titleArray.push(mhObj);
				}

			}
			mhArray.push(MHInfo);
			await site.writeData(mhArray,__dirname+'/'+MHInfo.title+'/'+MHInfo.title+".json");
			console.log(mhArray);
			// var chapterList = $();
			console.log("睡眠开始");
			await site.sleep(3000);
			console.log("睡眠结束");
		}
	}
}())





