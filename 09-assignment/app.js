const http = require('http')
const path = require('path')

const express = require('express')
const bodyParser = require('body-parser')

const rootDir = require('./util/path')

const adminRoutes = require ('./routes/user')
const welcomeRoutes = require ('./routes/welcome')

const app = express()

app.use(bodyParser.urlencoded({extended: false}))
app.use(express.static(path.join(rootDir, 'public')))

app.use('/admin', adminRoutes)
app.use(welcomeRoutes)

app.use((req, res, next) => {
    res.status(404).sendFile(path.join(rootDir, '/views', '404.html'))
})

app.listen(3000)