define(function(require, exports, module) {
	var utils = require('../libs/utils.js');
	var pageHepler = require('../common/page-helper');
	
	var aniShow = {};
	//3 default pages defined in html
	var tab_default_pages = ['app/home.html', 'app/tab-webview-subpage-chat.html', 'app/tab-webview-subpage-contact.html'];
	var subpage_style = {
		top: '44px',
		bottom: '51px'
	};
	
	mui.plusReady(function() {
		plus.navigator.setStatusBarStyle("UIStatusBarStyleBlackOpaque");
		if (mui.os.android) {
			plus.screen.lockOrientation("portrait-primary");
			var version = parseFloat(mui.os.version);
			if (version < 4.0 || version >= 4.1) {
				plus.webview.currentWebview().setStyle({
					render: "always"
				});
			}
		}
		//创建子页面，首个选项卡页面显示，其它均隐藏；			
		var self = plus.webview.currentWebview();
		for (var i = 0; i < 3; i++) {
			var temp = {};
			var sub = plus.webview.create(tab_default_pages[i], tab_default_pages[i], subpage_style);
			if (i > 0) {
				sub.hide();
			}else{
				temp[tab_default_pages[i]] = "true";
				mui.extend(aniShow,temp);
			}
			self.append(sub);
		}
		if (mui.os.stream) {
			//创建桌面快捷方式
			if (mui.isFunction(plus.navigator.createShortcut)) {
				var shortcut = plus.storage.getItem("SHORTCUT");
				if (!shortcut) {
					plus.navigator.createShortcut({
						name: "大象房车",
						icon: "img/icon.png"
					});
					plus.storage.setItem("SHORTCUT", "true");
				}
			}
			//向服务器发送激活请求，后续可删除
			plus.runtime.getProperty(plus.runtime.appid, function(info) {
				mui.get('http://stream.dcloud.net.cn/collect/data', {
					appid: plus.runtime.appid,
					version: info.version,
					logtype: 2,
					imei: plus.device.imei
				});
			});
		}
		//连续按下两次返回键退出应用
		mui.oldBack = mui.back;
		var backButtonPress = 0;
		mui.back = function() {
			backButtonPress++;
			if (backButtonPress > 1) {
				plus.runtime.quit();
			} else {
				plus.nativeUI.toast('再按一次退出应用', {
					duration: 'short'
				});
			}
			setTimeout(function() {
				backButtonPress = 0;
			}, 1000);
			return false;
		};
		//关闭 splash 画面
		plus.navigator.closeSplashscreen();
	});
	
/*	var self = exports;
	
	//初始化页面辅助模块
	pageHepler.init({
		handler: self,
		mvvm: true
	});*/
	
	 //当前激活选项
	var activepage = tab_default_pages[0];
	//var title = document.getElementById("title");
	 //选项卡点击事件
	mui('.mui-bar-tab').on('tap', 'a', function(e) {
		var target_tab_page = this.getAttribute('href');
		if (target_tab_page == activepage) {
			return;
		}
		//更换标题
		//title.innerHTML = this.querySelector('.mui-tab-label').innerHTML;
		//显示目标选项卡
		if(mui.os.ios||aniShow[target_tab_page]){
			plus.webview.show(target_tab_page);
		}else{
			var temp = {};
			temp[target_tab_page] = "true";
			mui.extend(aniShow,temp);
			plus.webview.show(target_tab_page,"fade-in",300);
		}
		//隐藏当前;
		plus.webview.hide(activepage);
		//更改当前活跃的选项卡
		activepage = target_tab_page;
	});
	//自定义事件，通知当前active的page
	document.addEventListener('notify-active-page', function(page){
		activepage = page;
	});
	//自定义事件，模拟点击“首页选项卡”
	document.addEventListener('gohome', function() {
		var defaultTab = document.getElementById("defaultTab");
		//模拟首页点击
		mui.trigger(defaultTab, 'tap');
		//切换选项卡高亮
		var current = document.querySelector(".mui-bar-tab>.mui-tab-item.mui-active");
		if (defaultTab !== current) {
			current.classList.remove('mui-active');
			defaultTab.classList.add('mui-active');
		}
	});
});