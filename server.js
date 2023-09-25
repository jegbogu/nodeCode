const express = require('express')
const connectDB = require('./utils/connectDB')
const path = require('path')
const usersInfo = require('./data')
const bcrypt =  require('bcrypt')
const session = require('express-session')
 const MongoDBStore = require('connect-mongodb-session')(session)
const flash = require('connect-flash')
const User = require('./model/registrationSchema')
const Admin = require('./model/adminReg')
 
//connecting to database
connectDB()
const app = express()
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, '/views'))

app.use(express.json()) // for parsing application/json
app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencode

// setting up our public folders
app.use(express.static(path.join(__dirname, 'public')))
// console.log(users)


const store = new MongoDBStore({
    uri: 'mongodb://127.0.0.1:27017/db',
    collection: 'mySessions'
  });
  // Catch errors
 
 
//setup our flash with session
 app.use(session({
    secret: 'keyboard cat',
    saveUninitialized:false,
    resave: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
      },
      store:store
 }))
 app.use(flash());
  

const rand = Math.floor(Math.random() * 10) + 1
const username = 'josephDev'
const allCourses = ['WDD', 'AutoCAD', 'Graphics Design']
const data = {
    allCourses: allCourses,
    username: username,
    rand: rand
}
  
const isAuth = (req,res,next)=>{
    if(req.session.isAuth){
        next()
    }else{
        res.redirect('/login')
    }
}

app.get('/', (req, res) => {
    res.render('index.ejs')   
    console.log(req.sessionID)
})
 

app.get('/admindashboard',isAuth, async(req, res) => {
    const allUsers = await User.find()
    console.log(allUsers)
    res.render('admindashboard.ejs',{allUsers})
})
app.get('/courses', (req, res) => {
    res.render('courses.ejs', { data })
})
app.get('/allUsers', (req, res) => {
    res.render('allUsers.ejs', { users })
})
app.get('/weather', (req, res) => {
    res.render('weather.ejs')
})
app.get('/register', (req, res) => {
    res.render('register.ejs',{ messages: req.flash('info') })
})
app.get('/forgetpassword', (req, res) => {
    res.render('forgetpassword.ejs',{ messages: req.flash('info') })
})
app.get('/adminReg', (req, res) => {
    res.render('adminReg.ejs',{ messages: req.flash('info') })
})
app.get('/login', (req, res) => {
    res.render('login.ejs',{ messages: req.flash('info') })
})

// app.post('/registration',(req,res)=>{
//     const{username,password} = req.body
//     console.log({username,password} )
//     if(username.length<4 || password.length<7){
//         res.status(403).json({message:"Invalid Credentials"})
//     }else{
//         res.status(200).json({message:"User Registration is successfull"})
//     }

// })
//this is for admin registration
app.post('/adminregistration', async (req, res) => {
    try {
        const { username, password } = req.body
        console.log({ username, password })
       const foundUser = await Admin.findOne({username:username})
       if(foundUser){
        req.flash('info', 'User Alredy Exist!')
        res.redirect('/register')
       } 
        const hashedPassword = await bcrypt.hash(password,12)
        const user = new Admin({
            username: username,
            password: hashedPassword,
            role: 'Admin',
            active: true
        })
        await user.save()
        res.redirect('/login')
    } catch (error) {
        console.log(error)
    }


})
app.post('/registration', async (req, res) => {
    try {
        const { username, password,fullname,passport, phone} = req.body
        console.log({ username, password })
       const foundUser = await User.findOne({username:username})
       if(foundUser){
        req.flash('info', 'User Alredy Exist!')
        res.redirect('/register')
       } 
        const hashedPassword = await bcrypt.hash(password,12)
        const user = new User({
            username: username,
            password: hashedPassword,
            fullname:fullname,
            passport:passport,
            phone:phone,
            role: 'User',
            active: true
        })
        await user.save()
        res.redirect('/login')
    } catch (error) {
        console.log(error)
    }


})
let foundUser
app.post('/login',async (req,res)=>{
    const{username, password} = req.body
    foundUser = await User.findOne({username:username})
  
    if(foundUser){
            const user = await bcrypt.compare(password,foundUser.password)
            if(user){
                req.session.user = foundUser;
                req.session.isAuth = true
                res.redirect('/dashboard')
                console.log('data')
                console.log( req.session.user)
            }else{
                req.flash('info','Username or Password is Incorrect!')
                res.redirect('/login') 
        }
    }else{
        
        const foundAdmin = await Admin.findOne({username:username})
        if(foundAdmin){
            const user = await bcrypt.compare(password,foundAdmin.password)
            if(user){
                req.session.isAuth = true
                res.redirect('/admindashboard')
            }else{
                req.flash('info','Username or Password is Incorrect!')
                res.redirect('/login') 
            }
        }
    }
   
})

app.get('/dashboard', (req, res) => {
    console.log(foundUser)
    res.render('dashboard.ejs',{foundUser})
})

app.post('/forgetpassword', async(req,res)=>{
    const{username,newpassword} = req.body
    console.log({username,newpassword} )
    if(username.length<10 || newpassword.length<7){
        req.flash('info','Username must be greater than 10 and password must be greater than 7!')
        res.redirect('/forgetpassword')
    }else{
        const hashedPassword = await bcrypt.hash(newpassword,10)
      const user =  await User.findOneAndUpdate({username:username},{ $set: { password: hashedPassword}})
      console.log(user)
        req.flash('info','Password sucessfully updated!')
        res.redirect('/login')
    }

})
// app.post('/registration',(req,res)=>{
//     const{username,password} = req.body
//     console.log({username,password} )
//     if(username.length<4 || password.length<7){
//         res.redirect('/register')
//     }else{
//         res.redirect('/dashboard')
//     }

// })
//deleting user by the admin
app.get('/delete/:id', async (req,res)=>{
    const{id} = req.params
    
    await User.findByIdAndDelete({_id:id})
    res.redirect('/admindashboard')
})

app.post('/logout',(req,res)=>{
    req.session.destroy()
    res.redirect('/login')
})

// app.get('/:username', (req, res) => {
//     const { username } = req.params

//     const userInfo = usersInfo.find((el) => {

//         return el.username === username
//     })
//     if (userInfo && userInfo) {
//         console.log(userInfo)
//         res.render('userData.ejs', { userInfo })
//     }

// })

app.get('*', (req, res) => {
    // res.render('404.ejs')
    res.status(404).json({ message: 'not found' })
})

const PORT = 3000
app.listen(PORT, () => {
    console.log(`listening to port ${PORT}`)
})