define(function(require, exports, module) {
	//初始化下拉刷新模块  
	mui.init({
		pullRefresh: {
			container: '#pullrefresh',
			down: {
				callback: pulldownRefresh
			},
			up: {
				contentrefresh: '正在加载...',
				callback: pullupRefresh
			}
		}
	});
	
	var utils = require('../libs/utils.js');
	var pageHepler = require('../common/page-helper');

	pageHepler.init({
		handler: self
	});
	
	console.time("进入页面到呈现");
	var divEl = document.createElement("div");
	var newsEl = document.getElementById("kr-news");
	var sliderEl = document.getElementById("slider");

	function throwGetNewsError() {
		mui.plusReady(function() {
			mui('#pullrefresh').pullRefresh().endPulldownToRefresh();
			mui.toast("获取新闻时发生了异常");
		});
	};
	 //点击新闻列表，打开新闻详情
	mui('#pullrefresh').on('tap', 'a', function() {
		open_new_detail(this.getAttribute('data-guid'));
	});
	 //TODO 为了解决系统分享闪屏问题，临时变成双webview
	var detailMainWebview = null; //详情页面父webview
	var detailWebview = null; //详情页面子webview
	function open_new_detail(id) {
		//console.log("open_new_detail");
		if (!detailMainWebview) {
			detailMainWebview = plus.webview.getWebviewById('detail_main');
		}
		if (!detailWebview) {
			detailWebview = plus.webview.getWebviewById('detail');
		}
		//触发子窗口变更新闻详情
		mui.fire(detailWebview, 'mui.view.beforeshow', {
			guid: id
		});
		//显示新闻详情页面
		detailMainWebview.show('pop-in', 200);
	};
	/** 新版首次进入执行代码开始 **/
	kr.dbReady(function(isFirst) {
		//document.body.style.backgroundColor = '#efeff4';
		//第一次显示，在线读取
		if (isFirst) {
			clearNewsList();
			mui.plusReady(function() {
				getFeed();
				mui('#pullrefresh').pullRefresh().endPullupToRefresh();
			});
		} else {
			//非第一次，直接从本地数据库中读取
			//加载初始化数据
			pullupRefresh(true, true);
		}
	});
	mui.plusReady(function() {
		//关闭splash界面
		plus.navigator.closeSplashscreen();
		//获取图片轮播区的新闻
		getSlider(true);
		//2秒之后，自动刷新
		setTimeout(function() {
			pulldownRefresh();
		}, 2000);
	});
	
	var latestPubDate = Number.MAX_VALUE;
	var hasMore = true;
	/**
	 * 获取顶部图片轮播区文章详情
	 * @param {Boolean} isLocal :是否已缓存本地
	 */
	function getSlider(isLocal) {
		//sliderEl.classList.remove('mui-hidden');
		console.log("getSlider: isLocal" + (isLocal?"true":"false"));
		kr.getSlider(isLocal, function(rv) { //等feed完成后再加载slider
			console.log("rv 333:" + JSON.stringify(rv));
			if (rv) {
				if (typeof rv === 'string') {
					console.log("rvlist:" + rv);
					kr.getNewsByGuid(rv, updateSlider);
				} else {
					updateSlider(rv);
				}
			}
		});
	};

	function getFeed(isClearCache) {
		console.log('getFeed=>' + isClearCache);
		if (isClearCache === 'true') {
			latestPubDate = Number.MAX_VALUE;
			newsEl.innerHTML = ''; //清空所有
			if (!hasMore) { //当清除缓存之前已上拉加载到底需要重置pullrefresh
				mui('#pullrefresh').pullRefresh().refresh(true);
				hasMore = true;
			}
		}
		//加载数据时，显示雪花进度条
		mui('#pullrefresh').pullRefresh().pullupLoading(function() {
			//获取新闻列表，存储数据库
			kr.getFeed(function(hasNew) {
				//显示列表数据
				kr.getNews(function(rvs) {
					console.log("refersh rvs:" + JSON.stringify(rvs));
					refresh(rvs);
				}, throwGetNewsError);
				//加载slider
				getSlider();
				mui('#pullrefresh').pullRefresh().endPullupToRefresh();
			}, function() {
				getSlider(); //加载slider
				mui('#pullrefresh').pullRefresh().endPullupToRefresh();
			});
		});
	}

	function pulldownRefresh() {
		console.log('pulldown');
		kr.getFeed(function(hasNew) {
			if (hasNew) {
				kr.getNews(function(rvs) {
					refresh(rvs);
				}, throwGetNewsError);
			} else {
				setTimeout(function() {
					mui('#pullrefresh').pullRefresh().endPulldownToRefresh();
				}, 800);
			}
		}, throwGetNewsError);
		//更新顶部轮播区域
		getSlider();
		mui('#pullrefresh').pullRefresh().endPulldownToRefresh();
	};
	/**
	 * 更新房车列表
	 * @param {Object} rvs  列表数据
	 */
	function refresh(rvs) {
		if (rvs) {
			if (latestPubDate === Number.MAX_VALUE && rvs && rvs.length > 0) {
				latestPubDate = rvs.item(rvs.length - 1).pubDate;
			}
			for (var i = rvs.length - 1; i >= 0; i--) {
				console.log("add rvs template:" + JSON.stringify(rvs));
				divEl.innerHTML = news_item(processRVS(rvs.item(i)));
				newsEl.insertBefore(divEl.firstElementChild, newsEl.firstElementChild);
			}
		}
		mui('#pullrefresh').pullRefresh().endPulldownToRefresh();
	};
	/**
	 * 更新顶部图片轮播内容
	 * @param {Object} 图片轮播区广告详情
	 */
	var sliderImageEl = document.getElementById("slider-image");
	var sliderTitleEl = document.getElementById("slider-title");
	 //			sliderImageEl.addEventListener('tap', function() {
	 //				console.log("sliderImageEl tap");
	 //				if (sliderImageEl.newsId) {
	 //					open_new_detail(sliderImageEl.newsId);
	 //				}
	 //			});
	function updateSlider(rv) {
		//alert('sliderImageEl');
		console.log("updateSlider rvlist:" + JSON.stringify(rv));
		if (rv.cover.indexOf('http') == -1) {
			//slider 图片已下载到本地
			console.log("cover is a local image");
			sliderImageEl.setAttribute('style', 'background-image: url("' + rv.cover + '");');
		} else {
			//下载并更新slider图片
			kr.isDownloadImageAsync(function(yes) {
				console.log((yes?' yes':' no') + 'slider start download image:::' + rv.thumbnail);
				if (!yes) return;
				(function(rv) {
					addDownloadImage(rv.guid +'cover', rv.cover, function(src) {
						kr.updateRVCover(rv.guid, src); //更新数据库
						sliderImageEl.setAttribute('style', 'background-image: url("' + src + '");');
						console.log('slider downloaded image:::' + src);
					});
				})(rv);
			});
		}
		sliderImageEl.setAttribute('data-guid', rv.guid);
		sliderTitleEl.innerText = rv.title;
	};

	function clearNewsList() {
		newsEl.innerHTML = '';
	};

	function pullupRefresh(noHandlePullrefresh, clear) {
		console.log('pullup');
		kr.getNews(latestPubDate, undefined, function(news) {
			console.log("news length: " + JSON.stringify(news));
			if (news && news.length > 0) {
				if (clear) {
					clearNewsList();
				}
				latestPubDate = news.item(news.length - 1).pubDate;
				console.time("template");
				for (var i = 0, len = news.length; i < len; i++) {
					console.log("pullupRefresh: add news template" + JSON.stringify(news));
					divEl.innerHTML = news_item(processRVS(news.item(i)));
					newsEl.appendChild(divEl.firstElementChild);
				}
				console.timeEnd("template");
				if (!noHandlePullrefresh) {
					mui('#pullrefresh').pullRefresh().endPullupToRefresh();
				}
			} else {
				hasMore = false;
				if (!noHandlePullrefresh) {
					mui('#pullrefresh').pullRefresh().endPullupToRefresh(true);
				}
				if (clear) {
					clearNewsList();
				}
			}
			console.timeEnd("进入页面到呈现");
		}, function() {
			if (!noHandlePullrefresh) {
				mui('#pullrefresh').pullRefresh().endPullupToRefresh();
			}
		});
	}
	var downloads = {};

	function addDownloadImage(id, url, callback) {
		console.log("downloading image: id=" + id + "url=" + url);
		if (downloads.hasOwnProperty(id)) { //已存在该download
			var download = downloads[id];
			download.callbacks.push(callback); //增加回调
			if (download.finished) { //该download已完成
				callback(download.filepath); //直接回调
			}
		} else { //新增download
			console.log('新增download::::' + id + '::::' + url);
			var download = {
				callbacks: [callback],
				finished: false,
				filepath: false
			}
			downloads[id] = download;
			mui.plusReady(function() {
				kr.downloadImage(id, url, function(imgUrl) {
					if (imgUrl == null) {
						return callback(null);
					}
					plus.io.resolveLocalFileSystemURL(imgUrl, function(entry) {
						download.finished = true;
						download.filepath = entry.toLocalURL();
						mui.each(download.callbacks, function(index, callback) {
							callback(download.filepath);
						});
					}, function(e) {});
				}).start();
			});
		}
	}

	function processRVS(rvs) {
		var rvs = mui.extend({}, rvs); //需要clone出来一个新对象，旧对象无法赋值修改
		//rvs.id = rvs.guid; //.substring(news.guid.lastIndexOf('/') + 1, news.guid.length - 5);
		rvs.humanize = kr.humanize(Date.now() - rvs.pubDate);
		if (rvs.thumbnail) {
			kr.isDownloadImageAsync(function(yes) {
				if (!yes) return;
				(function(rvs) {
					addDownloadImage(rvs.guid + 'thumbnail', rvs.thumbnail, function(thumbnail) {
						if (thumbnail == null) return;
						kr.updateRVThumbnail(rvs.guid, thumbnail); //更新数据库
						console.log("update rv thumbnail");
						setTimeout(function() {
							var img = document.querySelector("#news_" + rvs.guid + ' img');
							img.src = thumbnail;
							img.setAttribute('data-loaded', 'true');
						}, 100);
						//								console.log('list downloaded image:::' + src);
					});
				})(rvs);
			});
		}
		if (!rvs.thumbnail) {
			rvs.thumbnail = 'img/blank.jpg';
		}
		return rvs;
	}
});