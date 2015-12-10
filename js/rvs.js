(function($, kr, websql) {

	var DB_VERSION_NUMBER = '1.0';
	var RV_TIME_UPDATE = 'RV_TIME_UPDATE';
	var RV_TIME_PUBDATE = 'RV_TIME_PUBDATE';
	var RV_TIME_UPDATE_SLIDER = 'RV_TIME_UPDATE_SLIDER';
	var RV_LAST_ID = "RV_LAST_ID";
	var RV_TIME_INTERVAL = 1000 * 60 * 1; //更新间隔(默认5分钟)

	var RV_SLIDER_GUID = 'RV_SLIDER_GUID';


	var PAGE_SIZE = 10;
	var MAX_INTEGER = Number.MAX_VALUE;

	var REGEX_SRC = /src=[\'\"]?([^\'\"]*)[\'\"]?/i;

	var IMAGE_DOWNLOAD = "IMAGE_DOWNLOAD";
	var IMAGE_DOWNLOAD_WHEN_WIFI = "true";
	var DIR_IMAGE = "_doc/image/news/";
	
	var APP_URL = 'http://elephantrv.cn-hangzhou.aliapp.com/';
	var RV_SLIDER_URL = 'http://elephantrv.cn-hangzhou.aliapp.com/?json=get_tag_posts&tag_slug=rv-slider'; //the first post as slider?
	var RV_URL = 'http://elephantrv.cn-hangzhou.aliapp.com/?json=get_category_posts'; //'http://www.36kr.com/feed';
	var RV_SQL_TABLE = 'DROP TABLE IF EXISTS all_rvs;CREATE TABLE all_rvs (guid INTEGER PRIMARY KEY,url TEXT,title TEXT,gearbox TEXT,location TEXT,capacity TEXT,price TEXT,cover TEXT,thumbnail TEXT,pubDate INTEGER,description TEXT, isSlider TEXT);';
	var RV_SQL_SELECT = 'SELECT guid,url,title,gearbox,location,capacity,price,cover,thumbnail,pubDate FROM all_rvs WHERE pubDate < ? ORDER BY pubDate DESC LIMIT ?;';
	var RV_SQL_INSERT = 'INSERT INTO all_rvs(guid,url,title,gearbox,location,capacity,price,cover,thumbnail,pubDate,description,isSlider) VALUES(?,?,?,?,?,?,?,?,?,?,?,?);';
	var RV_SQL_SELECT_DETAIL = 'SELECT * FROM all_rvs WHERE guid = ? LIMIT 1;';
	var RV_SQL_SELECT_SLIDER = 'SELECT * FROM all_rvs WHERE isSlider= ?;';
	var RV_SQL_UPDATE_THUMBNAIL = 'UPDATE all_rvs SET thumbnail = ? WHERE guid = ?;';
	var RV_SQL_UPDATE = 'UPDATE all_rvs SET url = ?,title = ?,gearbox=?,location=?,capacity=?,price=?,cover = ?,thumbnail=?,pubDate=?,description=?, isSlider=? WHERE guid = ?;';
	var RV_SQL_UPDATE_COVER = 'UPDATE all_rvs SET cover = ? WHERE guid = ?;';
	var RV_SQL_UPDATE_SLIDER = 'UPDATE all_rvs SET isSlider = ? WHERE guid = ?;';
	var RV_SQL_DELETE = 'DELETE FROM all_rvs';

	var UNITS = {
		'年': 31557600000,
		'月': 2629800000,
		'天': 86400000,
		'小时': 3600000,
		'分钟': 60000,
		'秒': 1000
	};
	kr.humanize = function(milliseconds) {
		var humanize = '';
		$.each(UNITS, function(unit, value) {
			if (milliseconds >= value) {
				humanize = Math.floor(milliseconds / value) + unit + '前';
				return false;
			}
			return true;
		});
		return humanize || '刚刚';
	};
	kr.format = function(milliseconds) {
		var diff = Date.now() - milliseconds;
		if (diff < UNITS['天']) {
			return kr.humanize(diff);
		}
		var date = new Date(milliseconds);
		var _format = function(number) {
			return (number < 10 ? ('0' + number) : number);
		};
		return date.getFullYear() + '/' + _format(date.getMonth() + 1) + '/' + _format(date.getDay()) + '-' + _format(date.getHours()) + ':' + _format(date.getMinutes());
	};
	kr.dbReady = function(successCallback, errorCallback) {
		html5sql.openDatabase("kr", "36Kr", 5 * 1024 * 1024);
		if (html5sql.database.version === '') {
			html5sql.changeVersion('', DB_VERSION_NUMBER, RV_SQL_TABLE, function() {
				successCallback && successCallback(true);
			}, function(error, failingQuery) {
				errorCallback && errorCallback(error, failingQuery);
			});
		} else {
			successCallback && successCallback(false);
		}
	};
	kr.toggleDownloadWhenWifi = function(whenWifi) {
		if (whenWifi) {
			localStorage.setItem(IMAGE_DOWNLOAD, IMAGE_DOWNLOAD_WHEN_WIFI);
		} else {
			localStorage.removeItem(IMAGE_DOWNLOAD);
		}
	};
	kr.isDownloadWhenWifi = function() {
		return !!localStorage.getItem(IMAGE_DOWNLOAD);
	};
	kr.isDownloadImage = function() {
		var currentType = plus.networkinfo.getCurrentType();
		if (currentType === plus.networkinfo.CONNECTION_NONE) {
			return false;
		} else if (currentType !== plus.networkinfo.CONNECTION_WIFI) {
			if (localStorage.getItem(IMAGE_DOWNLOAD)) {
				return false;
			}
		}
		return true;
	};

	kr.isDownloadImageAsync = function(callback) {
		callback = callback || mui.noop;
		mui.plusReady(function() {
			var currentType = plus.networkinfo.getCurrentType();
			if (currentType === plus.networkinfo.CONNECTION_NONE) {
				callback(false);
			} else if (currentType !== plus.networkinfo.CONNECTION_WIFI) {
				if (localStorage.getItem(IMAGE_DOWNLOAD)) {
					callback(false);
				}
			}
			callback(true);
		});
	};

	kr.clearCache = function() {
		plus.nativeUI.showWaiting('正在删除缓存...');
		kr.deleteNews(function() {
			//清除图片缓存
			plus.io.resolveLocalFileSystemURL(DIR_IMAGE, function(entry) {
				entry.removeRecursively(function() {
					plus.nativeUI.closeWaiting();
					plus.nativeUI.toast("缓存删除成功");
				}, function() {
					plus.nativeUI.closeWaiting();
				});
			}, function(e) {
				plus.nativeUI.closeWaiting();
			});
			//通知首页重新拉取最新
			localStorage.removeItem(RV_TIME_UPDATE); //移除上次更新时间
			localStorage.removeItem(RV_TIME_PUBDATE); //移除最新的feed更新时间
			//localStorage.removeItem(RV_TIME_UPDATE_SLIDER); //移除上次slider更新时间
			//localStorage.removeItem(RV_SLIDER_GUID); //移除上次slider的guid
			localStorage.removeItem(RV_LAST_ID);
			plus.webview.getWebviewById("news").evalJS('getFeed("true")');
		}, function() {});
	};
	kr.downloadImage = function(name, imgUrl, successCallback, errorCallback) {
		//var url = DIR_IMAGE + name + ".png";
		return plus.downloader.createDownload(imgUrl, {
			//filename: url
		}, function(download, status) {
			if (status != '200') {
				return successCallback(null);
			}
			successCallback(download.filename);
		});
	};
	kr.getSlider = function(successCallback) {
		//当前没有网络，显示本地缓存
		if (plus.networkinfo.getCurrentType() === plus.networkinfo.CONNECTION_NONE) {
			kr.getAllSliders(successCallback);
			return;
		}
		$.getJSON(RV_SLIDER_URL, function(response) {
			if (response && response.posts) {
				$.each(response.posts, function(index, post) {
					//localStorage.setItem(RV_SLIDER_GUID, post.id);
					//localStorage.setItem(RV_TIME_UPDATE_SLIDER, Date.parse(new Date()) + ''); //本地更新时间
					//更新本地数据库isSlider标志
					kr.updateRVSlider(post.id);			
				});
			}
			//显示本地缓存slider
			kr.getAllSliders(successCallback);
		});
	};
	/**
	 * 通过rss获取新闻数据
	 * @param {Function} successCallback
	 * @param {Function} errorCallback
	 */
	kr.getFeed = function(successCallback, errorCallback) {
		//若没有网络，则显示之前缓存数据，并给与提示
		if (plus.networkinfo.getCurrentType() === plus.networkinfo.CONNECTION_NONE) {
			plus.nativeUI.toast('似乎已断开与互联网的连接', {
				verticalAlign: 'top'
			});
			successCallback(false);
			return;
		}
		//避免频繁刷新，默认最短刷新间隔为10分钟
		var update = parseFloat(localStorage.getItem(RV_TIME_UPDATE));
		if (update && (update + RV_TIME_INTERVAL) > Date.parse(new Date())) {
			successCallback(false);
			return;
		}
		console.log("refesh rv list from server");
		$.getFeed(RV_URL + '&id=2', function(rvs) {
			if (rvs.posts ) {
				var rvlist = [];
				$.each(rvs.posts, function(index, post) {
					var gearbox = post.custom_fields.gearbox[0];
					var location = post.custom_fields.location[0];
					var capacity = post.custom_fields.capacity[0];
					var price = post.custom_fields.price[0];
					var cover = post.thumbnail;
					var thumbnail = post.thumbnail_images.thumbnail.url;
					//check if it's a slider post
					var isSlider = 'NO';
					if(post.tags)
					{
						$.each(post.tags, function(index, tag) {
							if(tag.slug == 'rv-slider')
							{
								isSlider = 'YES';
							}
						});
					}
					console.log("isSlider =" + isSlider);
					rvlist.push([post.id, post.url, post.title, gearbox,location,capacity,price,cover,thumbnail,Date.parse(post.date),post.content,isSlider]);
				});
				rvlist.reverse();
				console.log("getFeed: rvlist length is" + rvlist.length);
				kr.addNews(rvlist, function(){
					successCallback(rvlist.length);
				});
				if (rvs.posts[0]) {
					localStorage.setItem(RV_LAST_ID, rvs.posts[0].id);
				}
				localStorage.setItem(RV_TIME_PUBDATE, Date.parse(rvs.posts[0].date) + ''); //订阅发布时间
				localStorage.setItem(RV_TIME_UPDATE, Date.parse(new Date()) + ''); //本地更新时间
			}
		}, function(xhr) {
			errorCallback && errorCallback();
		});
	};
	kr.getNewsByGuid = function(guid, successCallback, errorCallback) {
		websql.process([{
			"sql": RV_SQL_SELECT_DETAIL,
			"data": [guid]
		}], function(tx, results) {
			console.log("guid is" + guid + "row lenght is" + results.rows.length);
			successCallback && successCallback(results.rows.length > 0 && results.rows.item(0));
		}, function(error, failingQuery) {
			errorCallback && errorCallback(error, failingQuery);
		});
	};
	kr.getNews = function(latestId, pageSize, successCallback, errorCallback) {
		if (typeof latestId === 'function') {
			successCallback = latestId;
			latestId = MAX_INTEGER;
			pageSize = PAGE_SIZE;
		} else if (typeof pageSize === 'function') {
			successCallback = pageSize;
			latestId = latestId || MAX_INTEGER;
			pageSize = PAGE_SIZE;
		} else {
			latestId = latestId || MAX_INTEGER;
			pageSize = pageSize || PAGE_SIZE;
		}
		websql.process([{
			"sql": RV_SQL_SELECT,
			"data": [latestId, pageSize]
		}], function(tx, results) {
			successCallback(results.rows);
		}, function(error, failingQuery) {
			errorCallback && errorCallback(error, failingQuery);
		});
	};
	kr.addNews = function(news, successCallback, errorCallback) {
		console.log("news is " + JSON.stringify(news));
		var sqls = [];
		$.each(news, function(index, item) {
			var ret = kr.getNewsByGuid(item[0], function(founded){
				if(founded)
				{
					//exchange the guid to the end
					item.push(item.shift());
					websql.process([{
						"sql": RV_SQL_UPDATE,
						"data": item
					}],	function(tx, results) {						
					},function(error, failingQuery) {
					});
				}else
				{
					websql.process([{
						"sql": RV_SQL_INSERT,
						"data": item
					}],	function(tx, results) {						
					},function(error, failingQuery) {
					});					
				}
			});
		});
	};
	kr.updateNews = function(news, successCallback, errorCallback) {
		var sqls = [];
		console.log("news is " + JSON.stringify(news));
		$.each(news, function(index, item) {
			sqls.push({
				"sql": RV_SQL_UPDATE,
				"data": item
			})
		});
		console.log("sqls is " + JSON.stringify(sqls));
		websql.process(sqls, function(tx, results) {
			console.log("news inserted:" + JSON.stringify(tx) + JSON.stringify(results));
			successCallback(true);
		}, function(error, failingQuery) {
			errorCallback && errorCallback(error, failingQuery);
		});

	};
	kr.updateRVThumbnail = function(guid, thumbnail, successCallback, errorCallback) {
		websql.process([{
			"sql": RV_SQL_UPDATE_THUMBNAIL,
			"data": [thumbnail, guid]
		}], function(tx, results) {
			successCallback && successCallback();
		}, function(error, failingQuery) {
			errorCallback && errorCallback(error, failingQuery);
		});
	};
	kr.updateRVCover = function(guid, cover, successCallback, errorCallback) {
		websql.process([{
			"sql": RV_SQL_UPDATE_COVER,
			"data": [cover, guid]
		}], function(tx, results) {
			successCallback && successCallback();
		}, function(error, failingQuery) {
			errorCallback && errorCallback(error, failingQuery);
		});
	};
	kr.updateRVSlider = function(guid, successCallback, errorCallback) {
		websql.process([{
			"sql": RV_SQL_UPDATE_SLIDER,
			"data": ['YES', guid]
		}], function(tx, results) {
			successCallback && successCallback();
		}, function(error, failingQuery) {
			errorCallback && errorCallback(error, failingQuery);
		});
	};
	kr.getAllSliders = function(successCallback, errorCallback) {
		websql.process([{
			"sql": RV_SQL_SELECT_SLIDER,
			"data": ['YES']
		}], function(tx, results) {
			successCallback(results.rows);
		}, function(error, failingQuery) {
			errorCallback && errorCallback(error, failingQuery);
		});
	};
	kr.deleteNews = function(successCallback, errorCallback) {
		websql.process(RV_SQL_DELETE, function(tx, results) {
			successCallback && successCallback();
		}, function(error, failingQuery) {
			errorCallback && errorCallback(error, failingQuery);
		});
	};
})(mui, kr, html5sql);