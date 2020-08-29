chrome.tabs.onUpdated.addListener(function (i, c, t) {
    chrome.tabs.query({ url: [ "https://banweb.cityu.edu.hk/*" ] }, function(tabs) {
        for (i = 0; i < tabs.length; i++) { 
            chrome.pageAction.show(tabs[i].id);
        }
    });
});

chrome.runtime.onMessage.addListener(({type, data}, s) => {
    if (type === "preview") {
        chrome.storage.local.set({ preview: data }, () => {
            chrome.windows.create({
                url: "preview.html",
                type: "popup",
                width: 900,
                focused: true
            });
        });
    }
});