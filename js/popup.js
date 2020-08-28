const tabBar = new mdc.tabBar.MDCTabBar(document.querySelector(".mdc-tab-bar")),
    t_addCrn = new mdc.textField.MDCTextField(document.querySelector("#add-crn")),
    list = new mdc.list.MDCList(document.querySelector("#crn-list")),
    snackbar = new mdc.snackbar.MDCSnackbar(document.querySelector('.mdc-snackbar')),
    s_autofill = new mdc.switchControl.MDCSwitch(document.querySelector('#autofill-switch-container'));

snackbar.timeoutMs = 4000;

document.querySelectorAll(".mdc-button").forEach((v, i) => {
    mdc.ripple.MDCRipple.attachTo(v);
});

for (let i = 0; i < 16; i++) {
    for (let j = 0; j < 7; j++) {
        let div$ = $("<div></div");
        if (j >= 5) {
            div$.addClass("weekend");
        }
        $(".timetable .background").append(div$);
    }
}

tabBar.listen("MDCTabBar:activated", ({ detail: { index } }) => {
    $(".tabbed-content").hide();
    $(`.tabbed-content:eq(${index})`).show();
});

s_autofill.listen("change", () => {
    chrome.storage.local.set({ autofill: s_autofill.checked }, () => {
        snackbar.labelText = "Auto-fill setting changed.";
        snackbar.open();
    });
});

chrome.storage.local.get(["ttb", "wishlist", "autofill"], ({ ttb, wishlist, autofill }) => {
    s_autofill.checked = autofill || false;

    ttb.forEach((i) => {
        i.times.forEach(j => {
            let div$ = $("<div></div");
            let times = j.time.map(t => new moment(t, "hh:mm a"));
            div$.html(`${i.name[1].replace(" ", "")} <small>${i.name[2]}</small>`);
            div$.attr("title", i.name[0]);
            $(".timetable .content").append(div$);
            div$.css({
                "grid-row-start": `${times[0].hour() - 7}`,
                "grid-row-end": `${times[1].hour() - 6}`,
                "grid-column-start": `${j.day}`
            });
        });
    });

    if (wishlist != null) {
        wishlist.map(v => {
            let n = document.importNode(document.querySelector("#crn-item-template").content, true);
            $(n.children[0]).find(".mdc-checkbox__native-control").attr("id", `crn-${v}`);
            $(n.children[0]).find(".mdc-list-item__text").text(v).attr("for", `crn-${v}`);
            $(n.children[0]).attr("data-crn", v).appendTo("#crn-list");
        });

        document.querySelectorAll(".mdc-list-item").forEach((v, i) => {
            mdc.ripple.MDCRipple.attachTo(v);
        });

        document.querySelectorAll(".mdc-checkbox").forEach((v, i) => {
            mdc.checkbox.MDCCheckbox.attachTo(v);
        });

        list.layout();
    }
});

$("#crn-list").on("change", ".mdc-checkbox__native-control", (e) => {
    if (e.target.checked)
        $(e.target).parents("li").addClass("mdc-list-item--selected");
    else
        $(e.target).parents("li").removeClass("mdc-list-item--selected");
})

$("#empty-button").click(() => emptyWishlist());

$("#delete-button").click(() => deleteCRN());

$("#add-crn-button").click(() => {
    if (t_addCrn.valid && t_addCrn.value !== "") {
        addCRNToWishlist(parseInt(t_addCrn.value));
        t_addCrn.value = "";
    }
});

$("#add-crn-input").keydown((e) => {
    if (e.keyCode === 13) {
        if (t_addCrn.valid && t_addCrn.value !== "") {
            addCRNToWishlist(parseInt(t_addCrn.value));
            t_addCrn.value = "";
        }
    }
})

function deleteCRN() {
    chrome.storage.local.get("wishlist", ({ wishlist }) => {
        let sel$ = $("#crn-list .mdc-list-item.mdc-list-item--selected");
        if (sel$.length > 0) {
            sel$.each((i, li) => wishlist.splice(wishlist.indexOf($(li).data("crn")), 1));
            chrome.storage.local.set({ wishlist: wishlist }, () => {
                snackbar.labelText = "Selected CRNs are removed from wishlist.";
                snackbar.open();
                sel$.remove();
                list.layout();
            });
        } else {
            snackbar.labelText = "No CRN selected.";
            snackbar.open();
        }
    });
}

function emptyWishlist() {
    chrome.storage.local.set({ wishlist: [] }, () => {
        snackbar.labelText = "Wishlist cleared.";
        snackbar.open();
        $("#crn-list").empty();
        list.layout();
    });
}

function addCRNToWishlist(crn) {
    chrome.storage.local.get("wishlist", ({ wishlist }) => {
        if (wishlist == null) {
            wishlist = [];
        }
        if (wishlist.includes(crn)) {
            snackbar.labelText = "CRN already exists.";
            snackbar.open();
            return;
        }
        wishlist.push(crn);
        chrome.storage.local.set({ wishlist: wishlist }, () => {
            snackbar.labelText = "CRN added to wishlist.";
            snackbar.open();
            let n = document.importNode(document.querySelector("#crn-item-template").content, true);
            $(n.children[0]).find(".mdc-checkbox__native-control").attr("id", `crn-${crn}`);
            $(n.children[0]).find(".mdc-list-item__text").text(crn).attr("for", `crn-${crn}`);
            $(n.children[0]).attr("data-crn", crn).appendTo("#crn-list");

            list.layout();

            document.querySelectorAll(".mdc-list-item").forEach((v, i) => {
                mdc.ripple.MDCRipple.attachTo(v);
            });

            document.querySelectorAll(".mdc-checkbox").forEach((v, i) => {
                mdc.checkbox.MDCCheckbox.attachTo(v);
            });
        });
    });
    return false;
}