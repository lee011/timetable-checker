const DAYS = " MTWRFS", FULL_REGEX = /.*f.*u.*l.*l.*/i;

if (location.href === "https://banweb.cityu.edu.hk/pls/PROD/bwskfshd.P_CrseSchdDetl") {
    let classes = [];
    let z = $(".datadisplaytable");
    for (let i = 0; i < z.length; i += 2) {
        let j = {};
        j['name'] = z.eq(i).find("caption").text().split(" - ");
        j['crn'] = parseInt(z.eq(i).find("tr").eq(1).children().eq(1).text());
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
        let ctd$;
        $(".body table[border] tr").each((i, v) => {
            if (i === 0) {
                let th1$ = $("<th></th>").text("Status");
                let th2$ = $("<th></th>").text("Actions").attr("colspan", "2");
                $(v).append([th1$, th2$]);
            } else {
                let flag = true;
                let crash = null;
                let td1$ = $("<td></td>");
                let td2$ = $("<td></td>");
                let td3$ = $("<td></td>");
                if ($(v).is("[bgcolor='#ffccff']")) {
                    if (ttb.findIndex(u => u.crn === parseInt($(v).children().eq(0).text())) !== -1) {
                        td1$.css("color", "red").text(`Course registered`);
                    } else {
                        if ($(v).children().eq(6).text().trim() !== "")
                            ctd$ = $(v);
                        if (FULL_REGEX.test(ctd$.children().eq(6).text())) {
                            if (FULL_REGEX.test(ctd$.children().eq(8).text())) {
                                td1$.css("color", "red").text("Section is full, waitlist full");
                            } else if (ctd$.children().eq(8).text().includes("N")) {
                                td1$.css("color", "red").text("Section is full, waitlist not available");
                            } else {
                                if ($(v).children().eq(11).text().trim() === "") {
                                    td1$.css("color", "darkorange").html("Section is full, waitlist available<br />Registrable");
                                    if ($(v).children().eq(0).text().trim() !== "") {
                                        td2$.append($("<a></a>").text("Add to Wishlist").attr({ "data-crn": $(v).children().eq(0).text(), "href": "#" }).click(addCRNToWishlist));
                                    }
                                } else {
                                    let day = DAYS.indexOf($(v).children().eq(10).text());
                                    let ztime = $(v).children().eq(11).text().split(" - ").map(t => new moment(t, "HH:mm"));
                                    y: for (let i of ttb) {
                                        for (let j of i.times) {
                                            let times = j.time.map(t => new moment(t, "hh:mm a"));
                                            if (day === j.day && (ztime.some(m => m.isBetween(times[0], times[1], undefined, "[]")) || times.some(m => m.isBetween(ztime[0], ztime[1], undefined, "[]")))) {
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
                                        if ($(v).children().eq(11).text().trim() !== "") {
                                            td3$.append($("<a></a>").text("Preview").attr("href", "#").click(preview));
                                        }
                                    } else {
                                        td1$.css("color", "red").html(`Section is full, waitlist available<br />Conflicts with ${crash}`);
                                        if ($(v).children().eq(0).text().trim() !== "") {
                                            td2$.append($("<a></a>").text("Add to Wishlist").attr({ "data-crn": $(v).children().eq(0).text(), "data-crash": "true", "data-waitlist": "true", "href": "#" }).click(addCRNToWishlist));
                                        }
                                        if ($(v).children().eq(11).text().trim() !== "") {
                                            td3$.append($("<a></a>").text("Preview").attr("href", "#").click(preview));
                                        }
                                    }
                                }
                            }
                        } else {
                            if ($(v).children().eq(11).text().trim() === "") {
                                td1$.css("color", "green").text("Registrable");
                                if ($(v).children().eq(0).text().trim() !== "") {
                                    td2$.append($("<a></a>").text("Add to Wishlist").attr({ "data-crn": $(v).children().eq(0).text(), "href": "#" }).click(addCRNToWishlist));
                                }
                            } else {
                                let day = DAYS.indexOf($(v).children().eq(10).text());
                                let ztime = $(v).children().eq(11).text().split(" - ").map(t => new moment(t, "HH:mm"));
                                x: for (let i of ttb) {
                                    for (let j of i.times) {
                                        let times = j.time.map(t => new moment(t, "hh:mm a"));
                                        if (day === j.day && (ztime.some(m => m.isBetween(times[0], times[1], undefined, "[]")) || times.some(m => m.isBetween(ztime[0], ztime[1], undefined, "[]")))) {
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
                                    if ($(v).children().eq(11).text().trim() !== "") {
                                        td3$.append($("<a></a>").text("Preview").attr("href", "#").click(preview));
                                    }
                                } else {
                                    td1$.css("color", "red").text(`Conflicts with ${crash}`);
                                    if ($(v).children().eq(0).text().trim() !== "") {
                                        td2$.append($("<a></a>").text("Add to Wishlist").attr({ "data-crn": $(v).children().eq(0).text(), "data-crash": "true", "href": "#" }).click(addCRNToWishlist));
                                    }
                                    if ($(v).children().eq(11).text().trim() !== "") {
                                        td3$.append($("<a></a>").text("Preview").attr("href", "#").click(preview));
                                    }
                                }
                            }
                        }
                    }
                } else if ($(v).children().length === 16) {
                    if ($(v).children().eq(8).text().includes("N")) {
                        td1$.css("color", "red").text("Section not web-enabled");
                    }
                }
                $(v).append([td1$, td2$, td3$]);
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

function preview() {
    let params = new URLSearchParams(location.search);
    let td$ = $(this).parents("tr");
    let ctd$ = td$;
    while (ctd$.children().eq(0).text().trim() === "") {
        ctd$ = ctd$.prev();
    }
    chrome.runtime.sendMessage({
        type: "preview",
        data: {
            course: `${params.get("subj")}${params.get("crse")}`,
            crn: parseInt(ctd$.children().eq(0).text()),
            day: DAYS.indexOf(td$.children().eq(10).text()),
            time: td$.children().eq(11).text().split(" - "),
            section: ctd$.children().eq(1).text()
        }
    });
    return false;
}

function addCRNToWishlist() {
    console.log("add to wishlist triggered with crn:", $(this).data("crn"));
    chrome.storage.local.get(["ttb", "wishlist"], ({ ttb, wishlist }) => {
        if (wishlist == null) {
            wishlist = [];
        }
        if (ttb.findIndex(v => v.crn === $(this).data("crn")) !== -1) {
            let f$ = $("<div></div>").css({ "font-size": "18px", "padding": "8px", "position": "fixed", "top": "20px", "right": "20px", "background-color": "white", "border": "5px solid red", "color": "red" }).text("This course is been already registered").appendTo(document.body);
            setTimeout(() => f$.remove(), 5000);
            return false;
        }
        if (wishlist.includes($(this).data("crn"))) {
            let f$ = $("<div></div>").css({ "font-size": "18px", "padding": "8px", "position": "fixed", "top": "20px", "right": "20px", "background-color": "white", "border": "5px solid red", "color": "red" }).text("CRN already exist").appendTo(document.body);
            setTimeout(() => f$.remove(), 5000);
            return false;
        }
        if ($(this).data("crash")) {
            if (!confirm("This course section is conflicted with a course that you have been registered.\n\nYou must change/drop the conflicted course if you want to add this course.\n\nProceed anyway?"))
                return false;
        }
        if ($(this).data("waitlist")) {
            if (!confirm("This course section is full and waitlist available.\n\nYou will be put into the waitlist if you try to register this course.\n\nYOU MAY NOT BE ABLE TO REGISTER THIS COURSE AT THE END.\n\nProceed anyway?"))
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