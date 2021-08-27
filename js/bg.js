/* chrome.tabs.onUpdated.addListener(function (i, c, t) {
    chrome.tabs.query({ url: [ "https://banweb.cityu.edu.hk/*" ] }, function(tabs) {
        for (i = 0; i < tabs.length; i++) { 
            chrome.pageAction.show(tabs[i].id);
        }
    });
}); */

chrome.contextMenus.create({
    "title": "Go to Master Class Schedule",
    "id": "nav-mcs",
    "contexts": ["page"],
    "onclick": function (e, t) {
        chrome.tabs.sendMessage(t.id, { action: "mcs" });
    },
    "documentUrlPatterns": ["https://banweb.cityu.edu.hk/*"]
}, function () {
    if (chrome.runtime.lastError) console.error(chrome.runtime.lastError.message);
});

chrome.runtime.onMessage.addListener(({type, data}, s) => {
    if (type === "preview") {
        chrome.storage.local.set({ preview: data }, () => {
            chrome.windows.create({
                url: "preview.html",
                type: "popup",
                focused: true
            });
        });
    }
});

chrome.storage.local.get("wishlist", ({ wishlist }) => {
    if (wishlist) {
        chrome.browserAction.setBadgeText({
            text: `${wishlist.length}`
        });
    }
    chrome.browserAction.setBadgeBackgroundColor({
        color: "#68768a"
    });
})

chrome.storage.onChanged.addListener(({ wishlist }, n) => {
    if (n === "local" && wishlist != null) {
        chrome.browserAction.setBadgeText({
            text: `${wishlist.newValue.length}`
        });
    }
});