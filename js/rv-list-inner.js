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
	var priceFilter = require('../controls/price-filter/main');

	var self = exports;
	self.pickWelcomeDegree = function() {
		if (self.wdPicker == null) {
			self.wdPicker = new mui.PopPicker();
			self.wdPicker.setData([{
				text: "默认排序"
			}, {
				text: "评分 高→低"
			}, {
				text: "价格 低→高"
			}, {
				text: "价格 高→低"
			}, {
				text: "距离 近→远"
			}]);
		}
		self.wdPicker.show(function() {

		});
	};

	//设置价格过滤条件
	self.setPriceFilter = function() {
		priceFilter.show();
	};
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
		//第一次显示，从rss订阅中抓取
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
		kr.getSlider(isLocal, function(news) { //等feed完成后再加载slider
			//console.log("news 333:" + JSON.stringify(news));
			if (news) {
				if (typeof news === 'string') {
					//console.log("news:" + news);
					kr.getNewsByGuid(news, updateSlider);
				} else {
					updateSlider(news);
				}
			}
		});
	};

	function getFeed(isClearCache) {
		//console.log('getFeed=>' + isClearCache);
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
				//加载slider
				getSlider();
				//显示列表数据
				kr.getNews(function(news) {
					refresh(news);
				}, throwGetNewsError);
			}, function() {
				getSlider(); //加载slider
				mui('#pullrefresh').pullRefresh().endPullupToRefresh();
			});
		});
	}

	function pulldownRefresh() {
		//console.log('pulldown');
		kr.getFeed(function(hasNew) {
			//更新顶部轮播区域
			getSlider();
			if (hasNew) {
				kr.getNews(false, hasNew, function(news) {
					refresh(news);
				}, throwGetNewsError);
			} else {
				setTimeout(function() {
					mui('#pullrefresh').pullRefresh().endPulldownToRefresh();
				}, 800);
			}
		}, throwGetNewsError);
	};
	/**
	 * 更新新闻列表
	 * @param {Object} news  列表数据
	 */
	function refresh(news) {
		if (news) {
			if (latestPubDate === Number.MAX_VALUE && news && news.length > 0) {
				latestPubDate = news.item(news.length - 1).pubDate;
			}
			for (var i = news.length - 1; i >= 0; i--) {
				divEl.innerHTML = news_item(processNews(news.item(i)));
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
	function updateSlider(news) {
		//alert('sliderImageEl');
		//console.log("updateSlider news:" + JSON.stringify(news));
		if (news.image) {
			sliderImageEl.setAttribute('style', 'background-image: url("' + news.image + '");');
		} else {
			if (!news.image && news.cover) {
				kr.isDownloadImageAsync(function(yes) {
					if (!yes) return;
					(function(news) {
						news.id = news.guid; //.substring(news.guid.lastIndexOf('/') + 1, news.guid.length - 5);
						var cover = news.cover.replace('!heading', '!slider');
						addDownloadImage(news.id, cover, function(src) {
							kr.updateNews(news.guid, src); //更新数据库
							sliderImageEl.setAttribute('style', 'background-image: url("' + src + '");');
							//console.log('slider downloaded image:::' + src);
						});
					})(news);
				});
			}
		}
		sliderImageEl.setAttribute('data-guid', news.guid);
		sliderTitleEl.innerText = news.title;
	};

	function clearNewsList() {
		newsEl.innerHTML = '';
	};

	function pullupRefresh(noHandlePullrefresh, clear) {
		//console.log('pullup');
		kr.getNews(latestPubDate, undefined, function(news) {
			if (news && news.length > 0) {
				if (clear) {
					clearNewsList();
				}
				latestPubDate = news.item(news.length - 1).pubDate;
				console.time("template");
				for (var i = 0, len = news.length; i < len; i++) {
					divEl.innerHTML = news_item(processNews(news.item(i)));
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
		if (downloads.hasOwnProperty(id)) { //已存在该download
			var download = downloads[id];
			download.callbacks.push(callback); //增加回调
			if (download.finished) { //该download已完成
				callback(download.filepath); //直接回调
			}
		} else { //新增download
			//					console.log('新增download::::' + id + '::::' + url);
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

	function processNews(news) {
		var news = mui.extend({}, news); //需要clone出来一个新对象，旧对象无法赋值修改
		news.id = news.guid; //.substring(news.guid.lastIndexOf('/') + 1, news.guid.length - 5);
		news.humanize = kr.humanize(Date.now() - news.pubDate);
		if (!news.image && news.cover) {
			kr.isDownloadImageAsync(function(yes) {
				if (!yes) return;
				(function(news) {
					addDownloadImage(news.id, news.cover + '!slider', function(src) {
						if (src == null) return;
						kr.updateNews(news.guid, src); //更新数据库
						setTimeout(function() {
							var img = document.querySelector("#news_" + news.id + ' img');
							img.src = src;
							img.setAttribute('data-loaded', 'true');
						}, 100);
						//								console.log('list downloaded image:::' + src);
					});
				})(news);
			});
		}
		if (!news.image) {
			news.image = 'img/blank.jpg';
		}
		return news;
	}
});