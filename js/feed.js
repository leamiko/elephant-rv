(function($) {
/*	var parseRVList = function(response) {
		var rvList = {
			title: '',
			link: '',
			pubDate: '',
			description: '',
			language: '',
			items: []
		};
		if(response.posts)
		{
			response.posts.forEach(function(srcItem) {
				rvList.posts.push({
					post_id: srcItem.post_id,
					title: srcItem.title,
					author: srcItem.author_name,
					pubDate: srcItem.published_at,
					link: "http://36kr.com/p/" + srcItem.post_id + ".html",
					cover: srcItem.cover,
					guid: srcItem.id.toString(),
					description: srcItem.content
				});
			});
		}
		//feed.items = items;
		return feed;
	};*/
	$.getFeed = function(url, success, error) {
		error = error || $.noop;
		$.ajax({
			type: "get",
			url: url,
			dataType: 'json',
			success: function(response) {
				if (!response) {
					return error();
				}
				success(response);
			},
			error: error
		});
	};
})(mui);