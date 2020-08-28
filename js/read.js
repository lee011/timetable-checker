const DAYS = " MTWRFS", FULL_REGEX = /.*f.*u.*l.*l.*/i;

if (location.href === "https://banweb.cityu.edu.hk/pls/PROD/bwskfshd.P_CrseSchdDetl") {
    let classes = [];
    let z = $(".datadisplaytable");
    for (let i = 0; i < z.length; i += 2) {
        let j = {};
        j['name'] = z.eq(i).find("caption").text().split(" - ");
        j['times'] = z.eq(i + 1).find("tr").slice(1).get().map(v => {
            return {
                time: $(v).children().eq(1).text().split(" - "),
                day: DAYS.indexOf($(v).children().eq(2).text()),
                range: $(v).children().eq(4).text().split(" - ")
            }
        });
        classes.push(j);
    }
    chrome.storage.local.set({ ttb: classes }, () => {
        console.log("Saved timetable data", classes);
    });
} else if (location.href.startsWith("https://banweb.cityu.edu.hk/pls/PROD/hwscrssh_cityu.P_DispOneSection")) {
    chrome.storage.local.get("ttb", ({ ttb }) => {
        $(".body table[border] tr").each((i, v) => {
            if (i === 0) {
                let th1$ = $("<th></th>").text("Status");
                let th2$ = $("<th></th>").text("Add to Wishlist");
                $(v).append([th1$, th2$]);
            } else {
                let flag = true;
                let crash = null;
                let td1$ = $("<td></td>");
                let td2$ = $("<td></td>");
                if ($(v).is("[bgcolor='#ffccff']")) {
                    if (FULL_REGEX.test($(v).children().eq(6).text())) {
                        if (FULL_REGEX.test($(v).children().eq(8).text())) {
                            td1$.css("color", "red").text("Section is full, waitlist full");
                        } else if ($(v).children().eq(8).text().includes("N")) {
                            td1$.css("color", "red").text("Section is full, waitlist not available");
                        } else {
                            let day = DAYS.indexOf($(v).children().eq(10).text());
                            let ztime = $(v).children().eq(11).text().split(" - ").map(t => new moment(t, "HH:mm"));
                            y: for (let i of ttb) {
                                for (let j of i.times) {
                                    let times = j.time.map(t => new moment(t, "hh:mm a"));
                                    if (day === j.day && ztime.some(m => m.isBetween(times[0], times[1]))) {
                                        flag = false;
                                        crash = `${i.name[1].replace(" ", "")} ${i.name[2]}`;
                                        break y;
                                    }
                                }
                            }
                            if (flag) {
                                td1$.css("color", "darkorange").html("Section is full, waitlist available<br />No conflicts");
                                if ($(v).children().eq(0).text().trim() !== "") {
                                    td2$.append($("<a></a>").text("Add to Wishlist").attr({ "data-crn": $(v).children().eq(0).text(), "data-waitlist": "true", "href": "#" }).click(addCRNToWishlist));
                                }
                            } else {
                                td1$.css("color", "red").html(`Section is full, waitlist available<br />Conflict with ${crash}`);
                                if ($(v).children().eq(0).text().trim() !== "") {
                                    td2$.append($("<a></a>").text("Add to Wishlist").attr({ "data-crn": $(v).children().eq(0).text(), "data-crash": "true", "data-waitlist": "true", "href": "#" }).click(addCRNToWishlist));
                                }
                            }
                        }
                    } else {
                        let day = DAYS.indexOf($(v).children().eq(10).text());
                        let ztime = $(v).children().eq(11).text().split(" - ").map(t => new moment(t, "HH:mm"));
                        x: for (let i of ttb) {
                            for (let j of i.times) {
                                let times = j.time.map(t => new moment(t, "hh:mm a"));
                                if (day === j.day && ztime.some(m => m.isBetween(times[0], times[1]))) {
                                    flag = false;
                                    crash = `${i.name[1].replace(" ", "")} ${i.name[2]}`;
                                    break x;
                                }
                            }
                        }
                        if (flag) {
                            td1$.css("color", "green").text("No conflicts");
                            if ($(v).children().eq(0).text().trim() !== "") {
                                td2$.append($("<a></a>").text("Add to Wishlist").attr({ "data-crn": $(v).children().eq(0).text(), "href": "#" }).click(addCRNToWishlist));
                            }
                        } else {
                            td1$.css("color", "red").text(`Conflict with ${crash}`);
                            if ($(v).children().eq(0).text().trim() !== "") {
                                td2$.append($("<a></a>").text("Add to Wishlist").attr({ "data-crn": $(v).children().eq(0).text(), "data-crash": "true", "href": "#" }).click(addCRNToWishlist));
                            }
                        }
                    }
                }
                $(v).append([td1$, td2$]);
            }
        });
    });
} else if (location.href === "https://banweb.cityu.edu.hk/pls/PROD/bwskfreg.P_AltPin") {
    chrome.storage.local.get(["wishlist", "autofill"], ({ wishlist, autofill }) => {
        if (autofill) {
            wishlist.forEach((v, i) => {
                if (i < 10)
                    document.querySelectorAll("input[name='CRN_IN'][id]")[i].value = v;
            });
        }
    });
}

function addCRNToWishlist() {
    console.log("add to wishlist triggered with crn:", $(this).data("crn"));
    if ($(this).data("crash")) {
        if (!confirm("This course is conflicted with a course that you have been registered.\n\nYou must change/drop the conflicted course if you want to add this subject.\n\nProceed anyway?"))
            return false;
    }
    if ($(this).data("waitlist")) {
        if (!confirm("This course is full and waitlist available.\n\nYou will be put into the waitlist if you try to register this course.\n\nYOU MAY NOT BE ABLE TO REGISTER THIS COURSE AT THE END.\n\nProceed anyway?"))
            return false;
    }
    chrome.storage.local.get("wishlist", ({ wishlist }) => {
        if (wishlist == null) {
            wishlist = [];
        }
        if (wishlist.includes($(this).data("crn"))) {
            let f$ = $("<div></div>").css({ "font-size": "18px", "padding": "8px", "position": "fixed", "top": "20px", "right": "20px", "background-color": "white", "border": "5px solid red", "color": "red" }).text("CRN already exist").appendTo(document.body);
            setTimeout(() => f$.remove(), 5000);
            return false;
        }
        wishlist.push($(this).data("crn"));
        chrome.storage.local.set({ wishlist: wishlist }, () => {
            let f$ = $("<div></div>").css({ "font-size": "18px", "padding": "8px", "position": "fixed", "top": "20px", "right": "20px", "background-color": "white", "border": "5px solid black" }).text("CRN added to wishlist").appendTo(document.body);
            setTimeout(() => f$.remove(), 5000);
        });
    });
    return false;
}