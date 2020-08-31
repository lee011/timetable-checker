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

    if (ttb != null) {
        ttb.forEach((i) => {
            i.times.forEach(j => {
                let times = j.time.map(t => new moment(t, "hh:mm a"));
                let id = `ttb-${j.day}-${times[0].hour() - 7}-${times[1].hour() - 6}`;
                if ($(`#${id}`).length === 0) {
                    let div$ = $("<div></div");
                    div$.html(`${i.name[1].replace(" ", "")} <small>${i.name[2]}</small>`);
                    div$.attr("title", `${i.name[0]}\n${i.crn}\n${times[0].format("HH:mm")} - ${times[1].format("HH:mm")}`);
                    div$.attr("id", id);
                    div$.css({
                        "grid-row-start": `${times[0].hour() - 7}`,
                        "grid-row-end": `${times[1].hour() - 6}`,
                        "grid-column-start": `${j.day}`
                    });
                    $(".timetable .content").append(div$);
                }
            });
        });
    }

    if (wishlist != null) {
        wishlist.forEach(({ crn, status: { course, section, avail, cap, waitlist, conflict, updated } }) => {
            let n = document.importNode(document.querySelector("#crn-item-template").content, true);
            $(n.children[0]).find(".mdc-checkbox__native-control").attr("id", `crn-${crn}`);
            $(n.children[0]).find(".mdc-list-item__text").attr("for", `crn-${crn}`);
            $(n.children[0]).find(".mdc-list-item__primary-text").text(`${crn} (${course} ${section})`);
            if (status == null)
                $(n.children[0]).find(".mdc-list-item__secondary-text").append($("<span></span>").css("color", "red").text("Check Master Class Schedule for details."));
            else {
                if (avail === 0) {
                    if (waitlist === false) {
                        $(n.children[0]).find(".mdc-list-item__secondary-text").append($("<span></span>").css("color", "red").text(`Section is full, waitlist not available`));
                    } else if (waitlist === 0) {
                        $(n.children[0]).find(".mdc-list-item__secondary-text").append($("<span></span>").css("color", "red").text(`Section is full, waitlist full`));
                    } else {
                        $(n.children[0]).find(".mdc-list-item__secondary-text").append($("<span></span>").css("color", "darkorange").text(`Section is full, waitlist remaining ${waitlist}`));
                    }
                } else {
                    $(n.children[0]).find(".mdc-list-item__secondary-text").append($("<span></span>").css("color", "green").text(`Available: ${avail} / ${cap}`));
                }
                $(n.children[0]).find(".mdc-list-item__secondary-text").append("; ");
                if (conflict) {
                    $(n.children[0]).find(".mdc-list-item__secondary-text").append($("<span></span>").css("color", "red").text(`Conflicts with ${conflict}`));
                } else {
                    $(n.children[0]).find(".mdc-list-item__secondary-text").append($("<span></span>").css("color", "green").text(`No conflicts`));
                }
                $(n.children[0]).find(".mdc-list-item__secondary-text").append("; ");
                $(n.children[0]).find(".mdc-list-item__secondary-text").append(`Updated ${moment(updated).fromNow()}`);
            }
            $(n.children[0]).attr("data-crn", crn).appendTo("#crn-list");
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
            sel$.each((i, li) => wishlist.splice(wishlist.findIndex(({ crn }) => crn === $(li).data("crn")), 1));
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
    chrome.storage.local.get(["ttb", "wishlist"], ({ ttb, wishlist }) => {
        if (wishlist == null) {
            wishlist = [];
        }
        if (ttb.findIndex(v => v.crn === crn) !== -1) {
            snackbar.labelText = "This course is already registered.";
            snackbar.open();
            return;
        }
        if (wishlist.includes(crn)) {
            snackbar.labelText = "CRN already exists.";
            snackbar.open();
            return;
        }
        wishlist.push({ crn: crn, status: null });
        chrome.storage.local.set({ wishlist: wishlist }, () => {
            snackbar.labelText = "CRN added to wishlist.";
            snackbar.open();
            let n = document.importNode(document.querySelector("#crn-item-template").content, true);
            $(n.children[0]).find(".mdc-checkbox__native-control").attr("id", `crn-${crn}`);
            $(n.children[0]).find(".mdc-list-item__text").attr("for", `crn-${crn}`);
            $(n.children[0]).find(".mdc-list-item__primary-text").text(crn);
            $(n.children[0]).find(".mdc-list-item__secondary-text").text("No details saved; Please check Master Class Schedule for details.");
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