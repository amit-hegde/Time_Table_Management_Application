const { urlencoded } = require('express');
const express = require('express');
const ejs = require('ejs');
const mongoose = require('mongoose');
const _ = require('lodash');
var cookieParser = require('cookie-parser');

const app = express()
const port =process.env.PORT ||  3000
app.use(urlencoded({ extended: true }))
app.set('view engine', 'ejs')
app.use(express.static("public"))
app.use(cookieParser());

mongoose.connect("mongodb://localhost:27017/timetableDB", { useUnifiedTopology: true, useNewUrlParser: true });

const AdminSchema = {
    branch: String,
    name: String,
    uname: String,
    pass: String,
    auth: Number
}


const TimetableSchema = {
    branch: String,
    sem: String,
    sec: String,
    status: String,
    week: [{
        day: String,
        dayno: Number,

        subs: [{
            time: String,
            class: String
        }]
    }]

}

const weeks = ["MON", "TUE", "WED", "THUR", "FRI", "SAT"]

const admin = mongoose.model("admin", AdminSchema)
const classes = mongoose.model("timetable", TimetableSchema)

app.get('/', (req, res) => {
    classes.distinct("branch", (err, val) => {
        console.log(val)
        res.render("home", { dept: val })
    })
}
)

app.get("/branch/:id", (req, res) => {
    let branch = req.params.id
    classes.distinct("sem", { branch: branch }, (err, val) => {
        res.render("sem", { Branch: branch, sems: val })
    })
})

app.get("/branch/:id/:sem/div/:div/:day", (req, res) => {
    console.log(req.params)
    let b = req.params.id
    let s = req.params.sem
    let d = req.params.div
    let w = req.params.day
    classes.findOne({ branch: b, sem: s, sec: d, "week.dayno": w }, (err, val) => {

        if (!err) {
            if (val) {
                let val2 = []
                val2 = val.week[w]

                res.render("timetable", { data: val, tt: val2 })

            }
            else {
                res.render("timetable", { data: { branch: b, sem: s, sec: d }, tt: { day: weeks[w], dayno: w, subs: [] } })
            }

        }
        else {
            res.redirect("/branch/" + b)

        }
    })

})

app.get("/login", (req, res) => {
    res.render("login")
})

app.get('/create', (req, res) => {
    let user = req.cookies.adminid
    if (user) {
        res.render("reg")
    }
    else {
        res.redirect("/login")
    }
})

app.get('/dashboard', (req, res) => {
    let user = req.cookies.userid
    if (user) {
        admin.findById(user, (err, data) => {

            classes.find({ branch: data.branch }, (err, val) => {
                console.log(val)
                res.render("dashboard", { tt: val, branch: data.branch })
            }).sort({ sem: -1, sec: 1, "week.dayno": 1 })
        })
    }
    else {
        res.redirect("/login")
    }

})

app.get("/new", (req, res) => {
    let user = req.cookies.userid
    if (user) {
        admin.findById(user, (err, data) => {

            res.render("new", { user: data })
        })

    }
    else {
        res.redirect("/login")
    }
})

app.get("/about", (req, res) => {
    res.render("about")
})

app.get("/aboutdev", (req, res) => {
    res.render("aboutdev")
})


app.get("/admin", (req, res) => {
    let user = req.cookies.adminid
    if (user) {
        admin.find({}, (err, data) => {

            if (!err) {
                res.render("admin", { user: data })
            }
        })
    }
    else {
        res.redirect("/login")
    }
})

app.post("/create", (req, res) => {
    console.log(req.body)
    let d = req.body
    admin.insertMany([{
        branch: d.branch,
        name: d.name,
        uname: d.uname,
        pass: d.pass
    }])
    res.redirect("/admin")
})

app.post("/login", (req, res) => {
    let d = req.body

    admin.findOne({ uname: d.uname, pass: d.pass }, (err, user) => {
        if (!err) {
            if (user) {
                if (user.auth === 1) {

                    res.cookie("adminid", user._id, { expire: 4000 + Date.now() });
                    res.cookie("userid", user._id, { expire: 4000 + Date.now() });
                    res.redirect("/admin")
                }
                else {
                    res.cookie("userid", user._id, { expire: 4000 + Date.now() });
                    res.redirect("/dashboard")
                }
            }
            else {
                res.redirect("/login")
            }
        }
    })
})

app.post("/add", (req, res) => {
    let d = req.body
    // console.log(d)

    classes.findOne({ branch: d.branch, sem: d.sem, sec: d.div }, (err, val) => {
        if (!err) {
            if (!val) {
                classes.insertMany([{ branch: d.branch, sem: d.sem, sec: d.div, status: 1, week: [{ day: weeks[Number(d.day)], dayno: d.day, subs: [{ time: d.t1, class: d.c1 }, { time: d.t2, class: d.c2 }, { time: d.t3, class: d.c3 }, { time: d.t4, class: d.c4 }, { time: d.t5, class: d.c5 }, { time: d.t6, class: d.c6 }, { time: d.t7, class: d.c7 }, { time: d.t8, class: d.c8 }, { time: d.t9, class: d.c9 }, { time: d.t10, class: d.c10 }] }] }])
                // classes.updateMany([{ branch: d.branch, sem: d.sem, sec: d.div }, { $set: { weeks: [{ day: weeks[Number(d.day)], dayno: d.day, status: 1, subs: [{ time: d.t1, class: d.c1 }, { time: d.t2, class: d.c2 }, { time: d.t3, class: d.c3 }, { time: d.t4, class: d.c4 }, { time: d.t5, class: d.c5 }, { time: d.t6, class: d.c6 }, { time: d.t7, class: d.c7 }, { time: d.t8, class: d.c8 }, { time: d.t9, class: d.c9 }, { time: d.t10, class: d.c10 }] }] } }, { upsert: true } ])
            }
            else {
                classes.findOne({ branch: d.branch, sem: d.sem, sec: d.div, "week.dayno": d.day }, (err, val) => {
                    if (!err) {
                        // console.log(val._id)
                        let shedule = { day: weeks[Number(d.day)], dayno: d.day, subs: [{ time: d.t1, class: d.c1 }, { time: d.t2, class: d.c2 }, { time: d.t3, class: d.c3 }, { time: d.t4, class: d.c4 }, { time: d.t5, class: d.c5 }, { time: d.t6, class: d.c6 }, { time: d.t7, class: d.c7 }, { time: d.t8, class: d.c8 }, { time: d.t9, class: d.c9 }, { time: d.t10, class: d.c10 }] }
                        if (!val) {
                            console.log(shedule)
                            classes.findOneAndUpdate({ branch: d.branch, sem: d.sem, sec: d.div }, { $push: { week: { $each: [shedule], $sort: { dayno: 1 } } } }, (err, ok) => {
                                if (err) {
                                    console.log(err)
                                } else {
                                    console.log(ok)
                                }
                            })
                        }
                        else {
                            classes.updateOne({ _id: val._id, "week.dayno": d.day }, { $set: { "week.$": shedule } }, (err, ok) => {
                                if (err) {
                                    console.log(err)
                                } else {
                                    console.log(ok)
                                }
                            })
                        }
                    }
                })
            }
        }
    })


    res.redirect("/new")
})

app.post("/update", (req, res) => {
    console.log(req.body)
    classes.findOne({ _id: req.body.id, "week.dayno": req.body.dayno }, (err, val) => {
        if (val) {
            res.render("edit", { user: val, tt: val.week[req.body.index] })
        }
    })

})

app.post("/deletetable", (req, res) => {
    classes.deleteOne({ _id: req.body.tid }, (err, ok) => {
        if (err) {
            console.log(err)
        }
        else {
            console.log(ok)
        }
    })
    res.redirect("/dashboard")
})

app.post("/edit", (req, res) => {
    let d = req.body
    console.log(d)
    let shedule = { day: weeks[Number(d.day)], dayno: d.day, subs: [{ time: d.t1, class: d.c1 }, { time: d.t2, class: d.c2 }, { time: d.t3, class: d.c3 }, { time: d.t4, class: d.c4 }, { time: d.t5, class: d.c5 }, { time: d.t6, class: d.c6 }, { time: d.t7, class: d.c7 }, { time: d.t8, class: d.c8 }, { time: d.t9, class: d.c9 }, { time: d.t10, class: d.c10 }] }


    classes.updateOne({ _id: d.id, "week.dayno": d.day }, { $set: { "week.$": shedule } }, (err, ok) => {
        if (err) {
            console.log(err)
        } else {
            console.log(ok)
            res.redirect("/dashboard")
        }
    })
})

app.post("/makeadmin", (req, res) => {
    let d = req.body
    console.log(d)
    admin.updateOne({ _id: d.id }, { $set: { auth: d.status } }, (err, ok) => {
        if (err) {
            console.log(err)
        }
        else {
            console.log(ok)
        }
        res.redirect("/admin")
    })
})
app.post("/deleteadmin", (req, res) => {
    let d = req.body
    admin.deleteOne({ _id: d.id }, (err, ok) => {
        if (err) {
            console.log(err)
        }
        else {
            console.log(ok)
        }
        res.redirect("/admin")
    })
})

app.post("/logout", (req, res) => {
    res.clearCookie('userid');
    res.clearCookie('adminid');
    res.redirect("/login")
})


app.listen(port, () => console.log(`Example app listening on port port!`))
