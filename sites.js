var http = require('http');
var fs = require('fs');
const phantom = require('phantom');
class Sites {
	asyncHttp(url){
		return new Promise(function(resolve,reject){
			http.get(url,function(res){
				var data = '';
				res.on('data',function(chunk){
					data += chunk;
				});
				res.on('end',function(){
					resolve(data);
				})
			})
		})
	}
	 writeData(dataObj,filePath){
	 	return new Promise(function(resolve,reject){
			var w_data = new Buffer(JSON.stringify(dataObj));
			console.log(JSON.stringify(dataObj));
			fs.writeFile(filePath, w_data, {flag:'w',encoding:'utf8'}, function(err){
				if (err) {
					console.log(err);
					return;
				}else{
					console.log("数据写入成功");
					resolve();
				}
			})		
	 	})
		
	}
	// 异步阻塞
	sleep (time) {
	    return new Promise(function (resolve, reject) {
	        setTimeout(function () {
	            resolve("等"+time+"毫秒");
	        }, time);
	    })
	}
	fileExits(filePath){
		return new Promise(function(resolve,reject){
				 fs.exists(filePath, function (exists) {
        		 console.log(filePath);
		 		var fileExists = exists ?true : false;
				resolve(fileExists);
			});
		})
	}
    /*
		参数:
		DownLoadPageURL: 要渲染的页面
		website: 页面来源 dm5,dmzz等
    */
	getImageURL(DownLoadPageURL,website){
		return new Promise(function(resolve,reject){
			console.log(DownLoadPageURL);
			(async function() {
		    const instance = await phantom.create();
		    const page = await instance.createPage();
		    await page.on("onResourceRequested", function(requestData) {

		    var url = requestData.url;
		    if (website == "dm5") {
			    if (url.indexOf('cid')!=-1 && url.indexOf("key")!=-1 && (url.indexOf('png')!=-1 ||url.indexOf('jpg')!=-1)) {
						console.log("退出phantom");
		
						(async function(){
							var obj = {
									url: url,
								}							
							await instance.exit();
							resolve(obj);

						}())
					}	
			    }
		    });
		 
		    const status = await page.open(DownLoadPageURL);

		}());
		})
	}
	createDir(folderPath){
		//判断该目录是否已经存在,如果已经存在则不再创建,如果不存在则创建
		fs.exists(folderPath, function(exists){
			if (exists) {
				console.log("该目录已存在"+folderPath);
			}else {
				fs.mkdir(folderPath, function(err){
					if (err) {
						console.log("目录创建失败");
						console.log(err);
						return;
					}else{
						// console.log("目录创建成功");
					}
				})
			}
		})
	}
	
}

module.exports = Sites;
