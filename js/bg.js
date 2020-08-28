chrome.tabs.onUpdated.addListener(function (i, c, t) {
    chrome.tabs.query({ url: [ "https://banweb.cityu.edu.hk/*" ] }, function(tabs) {
        for (i = 0; i < tabs.length; i++) { 
            chrome.pageAction.show(tabs[i].id);
        }
    });
});