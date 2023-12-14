const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const cookieParser = require('cookie-parser');
app.use(cookieParser('secure_bytes'));
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const secretKey = 'YourSecretKey';
const NodeCache = require('node-cache');
const cache = new NodeCache();
const accountSid = "AC0f95cb0ec3c018d145054f2c6c83ccc3";
const authToken = "98b6f228996e4b0266ee9ff598379bb0";
const verifySid = "VA4b52daeec89b7be1339559c5d4744a05";
const client1 = require("twilio")(accountSid, authToken);
const request=require('request')
const multer = require('multer');
const { MongoClient, Binary } = require('mongodb');
const fs = require('fs');
const { ObjectId } = require('mongodb');
const FormData = require('form-data');
const qrcode = require('qrcode');
var mime = require('mime-to-extensions')
const axios=require('axios')
const crypto = require("crypto");
const notifier = require('node-notifier');
const upload = multer({
  dest: path.join(__dirname, '/uploads') // Set the destination folder for uploaded files
});


app.use(express.static(__dirname));

function encryptData(data) {
  const encryptedData = jwt.sign(data, secretKey);
  return encryptedData;
}


function decryptData(encryptedData,res) {
  if(typeof encryptedData === "undefined"){
    res.sendFile(path.join(__dirname+'/error.html'));
  }
  else{
    const decryptedData = jwt.verify(encryptedData, secretKey);
    return decryptedData;
  }
  
}

const uri = "mongodb+srv://admin:admin@cluster0.dbot6fn.mongodb.net/SecureByteData?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
const port=process.env.PORT || 3000

app.use(bodyParser.json({ limit: '130mb' }));
app.use(bodyParser.urlencoded({ limit: '130mb', extended: true }));

client.connect((err) => {
  if (err) {
    console.log("line 57")
    res.sendFile(path.join(__dirname+'/error.html'));
  }
  console.log('Connected to MongoDB Atlas');
  db = client.db("myproject").collection("project1");
});


app.get('/',(req,res)=>{
  res.sendFile(path.join(__dirname+'/index.html'));
})


app.use(session({
  secret: 'hellllloooo',
  resave: false,
  saveUninitialized: false
}));

// Initialize Passport.js
app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new GoogleStrategy(
    {
      clientID: '234673302290-ic1oma4gm5cqkh33esukoej7tgpdnq43.apps.googleusercontent.com',
      clientSecret: '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',
      callbackURL: 'https://securebyte-ppxd.onrender.com/auth/google/callback'
    },
    (accessToken, refreshToken, profile, done) => {
      done(null, profile);
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname + '/signup.html'));
});

let k;

function googleotp(email,name,res){
  function generateOTP() {
    var digits = '0123456789';
    let OTP = '';

    for (let i = 0; i < 6; i++ ) {
        OTP += digits[Math.floor(Math.random() * 10)];
    }
    return OTP;
}
const otp=generateOTP()
  const transporter = nodemailer.createTransport({
    service : 'Gmail',
    auth : {
      user : 'securebyte.sb@gmail.com',
      pass : 'qybnhpwhwnectjku'
    }
  });
  const htmlTemplate=fs.readFileSync('email.html','utf8');
  const dynamicData={
    otp:otp,
    username:name
  }
  const emailBody = htmlTemplate.replace(/\$\{(\w+)\}/g, (_, key) => dynamicData[key]);
        const text1={text:otp}
        const mail_option = {
          from : 'securebyte.sb@gmail.com' ,
          to : email,
          subject: 'Welcome to Secure Byte',
          html: emailBody
        };
  

  transporter.sendMail(mail_option, (error, info) => {
    if(error)
    {
      console.log("line 144");
      notifier.notify({
        title: 'ERROR SENDING OTP',
        message: 'Please re-login again!',
        icon:path.join(__dirname,'logo.png'),
        sound:true
      });
    res.redirect('/signin');
    }
  });
  console.log("generated otp is:",otp)
  return otp
}

app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  async(req, res) => {
    const cache1 = cache.get('dataKey');
    const body = decryptData(cache1,res);
    if(body['form2CheckboxStatus']=='checked'){
      const doc=await db.findOne({Email:req.user._json["email"]})



      if(!doc && body['verificationType1']=='sms'){
        const encryptedData1 = encryptData('sms');
        cache.set('verification', encryptedData1);
        res.sendFile(path.join(__dirname+'/signupimgnum.html'));      
      }



      else if(!doc && body['verificationType1']=='email'){
        res.redirect('/google-signup')
        }

      else{
        notifier.notify({
          title: 'YOUR EMAIL ID ALREADY EXISTS',
          message: 'Your acount is present in our databse! Please login',
          icon:path.join(__dirname,'logo.png'),
          sound:true
        });
        res.redirect('/signin');
      }
      
    }
    else if(body=='signin'){
      const opt = encryptData("google login");
      cache.set('type',opt);
      res.redirect('/signinauth');
    }



    else{
      const doc=await db.findOne({Email:req.user._json["email"]})
      if(!doc){
        const encryptedData1 = encryptData('nil');
        cache.set('verification', encryptedData1);
        res.sendFile(path.join(__dirname+'/signupimg.html')); 
      }
      else{
        notifier.notify({
          title: 'YOUR EMAIL ID ALREADY EXISTS',
          message: 'Your acount is present in our databse! Please login',
          icon:path.join(__dirname,'logo.png'),
          sound:true
        });
        res.redirect('/signin');
      }
      
    }
  });



app.get('/google-signup',async(req,res)=>{
  const Email=req.user._json["email"];
        const name=req.user._json['name'];
        const encryptedData1 = encryptData('email');
        cache.set('verification', encryptedData1);
        k=googleotp(Email,name,res);
        res.send(`
        <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Document</title>
      <style>
  html, body {
      height: 100%;
      margin: 0;
  }
  body {
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #d3d3d3;
  }
          .form {
    width: 29em;
    height: 25em;
    display: flex;
    flex-direction: column;
    border-radius: 19px;
    background-color: #d3d3d3;
    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
    transition: .4s ease-in-out;
    align-items:center;
    top: auto;
      bottom: auto;
      margin-top: -12em;
    
  }
  
  .form:hover {
    box-shadow: 1px 1px 1px rgba(0, 0, 0, 0.1);
    scale: 0.99;
  }
  
  .heading {
    position: relative;
    text-align: center;
    color: black;
    top: 3em;
    font-weight: bold;
  }
  
  .check {
    position: relative;
    align-self: center;
    top: 4em;
  }
  
  .input {
    position: relative;
    width: 2.5em;
    height: 2.5em;
    margin: 0.5em;
    border-radius: 5px;
    border: none;
    outline: none;
    background-color: rgb(235, 235, 235);
    box-shadow: inset 3px 3px 6px #d1d1d1,
              inset -3px -3px 6px #ffffff;
    top: 6.5em;
    left: 1em;
    padding-left: 15px;
    transition: .4s ease-in-out;
  }
  
  .input:hover {
    box-shadow: inset 0px 0px 0px #d1d1d1,
              inset 0px 0px 0px #ffffff;
    background-color: rgb(149, 149, 149);
  }
  
  .input:focus {
    box-shadow: inset 0px 0px 0px #d1d1d1,
              inset 0px 0px 0px #ffffff;
  }
  
  .btn1 {
    position: relative;
    top: 8.5em;
    left: 1.2em;
    width: 17em;
    height: 3em;
    border-radius: 5px;
    border: none;
    outline: none;
    transition: .4s ease-in-out;
    box-shadow: 1px 1px 3px #b5b5b5,
               -1px -1px 3px #ffffff;
  }
  
  .btn1:active {
    box-shadow: inset 3px 3px 6px #b5b5b5,
              inset -3px -3px 6px #ffffff;
  }
  
  .btn2 {
    position: relative;
    top: 9.5em;
    left: 1.2em;
    width: 17em;
    height: 3em;
    border-radius: 5px;
    border: none;
    outline: none;
    transition: .4s ease-in-out;
    box-shadow: 1px 1px 3px #b5b5b5,
               -1px -1px 3px #ffffff;
  }
  
  .btn2:active {
    box-shadow: inset 3px 3px 6px #b5b5b5,
              inset -3px -3px 6px #ffffff;
  }
      </style>
  <script>
      document.addEventListener("DOMContentLoaded", function () {
          var inputs = document.querySelectorAll('.input');
  
          inputs.forEach(function (input, index) {
              input.addEventListener('input', function () {
                  if (this.value.length === 1) {
                      if (index < inputs.length - 1) {
                          inputs[index + 1].focus();
                      }
                  }
              });
  
              input.addEventListener('keydown', function (e) {
                  if (e.key === 'Backspace' && index > 0) {
                      inputs[index - 1].focus();
                  }
              });
          });
      });
  </script>
  <style>
    #timer {
      display: none;
      position: relative;
    top: 9.5em;
    left: 1.2em;
    border-radius: 5px;
    border: none;
    outline: none;
    transition: .4s ease-in-out;

    }
    #resend{
        position: relative;
    top: 9.5em;
    left: 1.2em;
    border-radius: 5px;
    border: none;
    outline: none;
    transition: .4s ease-in-out;

    }
    #resendBtn {
      display: none;
    }
  </style>
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      // Function to display timer
      function startTimer(duration, display) {
        var timer = duration, minutes, seconds;
        setInterval(function () {
          minutes = parseInt(timer / 60, 10);
          seconds = parseInt(timer % 60, 10);

          minutes = minutes < 10 ? "0" + minutes : minutes;
          seconds = seconds < 10 ? "0" + seconds : seconds;

          display.textContent = minutes + ":" + seconds;

          if (--timer < 0) {
            // Timer has finished, display the resend button
            document.getElementById('timer').style.display = 'none';
            document.getElementById('resendBtn').style.display = 'block';
          }
        }, 1000);
      }

      // Set the duration of the timer (1 minute)
      var timerDuration = 30;

      // Display the timer after 1 second
      setTimeout(function () {
        document.getElementById('timer').style.display = 'block';
        var timerDisplay = document.querySelector('#timer');
        startTimer(timerDuration, timerDisplay);
      }, 1000);
    });
  </script>
  </head>
  <body>
      <form class="form" action="/check-gmailotp" method="post">
          <p class="heading">Verify</p>
          <svg class="check" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="60px" height="60px" viewBox="0 0 60 60" xml:space="preserve">  <image id="image0" width="60" height="60" x="0" y="0" href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAQAAACQ9RH5AAAABGdBTUEAALGPC/xhBQAAACBjSFJN
        AAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAAAmJLR0QA/4ePzL8AAAAJcEhZ
        cwAACxMAAAsTAQCanBgAAAAHdElNRQfnAg0NDzN/r+StAAACR0lEQVRYw+3Yy2sTURTH8W+bNgVf
        aGhFaxNiAoJou3FVEUQE1yL031BEROjCnf4PLlxILZSGYncuiiC48AEKxghaNGiliAojiBWZNnNd
        xDza3pl77jyCyPzO8ubcT85wmUkG0qT539In+MwgoxQoUqDAKDn2kSNLlp3AGi4uDt9xWOUTK3xg
        hVU2wsIZSkxwnHHGKZOxHKfBe6rUqFGlTkPaVmKGn6iYao1ZyhK2zJfY0FZ9ldBzsbMKxZwZjn/e
        5szGw6UsD5I0W6T+hBhjUjiF7bNInjz37Ruj3igGABjbtpIo3GIh30u4ww5wr3fwfJvNcFeznhBs
        YgXw70TYX2bY/ulkZhWfzfBbTdtrzjPFsvFI+T/L35jhp5q2owDs51VIVvHYDM9sa/LY8XdtKy1l
        FXfM8FVN2/X2ajctZxVXzPA5TZvHpfb6CFXxkerUWTOcY11LX9w0tc20inX2mmF4qG3upnNWrOKB
        hIXLPu3dF1x+kRWq6ysHpkjDl+7eQjatYoOCDIZF3006U0unVSxIWTgTsI3HNP3soSJkFaflMDwL
        3OoHrph9YsPCJJ5466DyOGUHY3Epg2rWloUxnMjsNw7aw3AhMjwVhgW4HYm9FZaFQZ/bp6QeMRQe
        hhHehWKXGY7CAuSpW7MfKUZlAUqWdJ3DcbAAB3guZl9yKC4WYLfmT4muFtgVJwvQx7T2t0mnXK6J
        XlGGyAQvfNkaJ5JBmxnipubJ5HKDbJJsM0eY38QucSx5tJWTVHBwqDDZOzRNmn87fwDoyM4J2hRz
        NgAAACV0RVh0ZGF0ZTpjcmVhdGUAMjAyMy0wMi0xM1QxMzoxNTo1MCswMDowMKC8JaoAAAAldEVY
        dGRhdGU6bW9kaWZ5ADIwMjMtMDItMTNUMTM6MTU6NTArMDA6MDDR4Z0WAAAAKHRFWHRkYXRlOnRp
        bWVzdGFtcAAyMDIzLTAyLTEzVDEzOjE1OjUxKzAwOjAwIIO3fQAAAABJRU5ErkJggg=="></image>
        </svg>
          <div class="box">
          <input class="input" type="password" maxlength="1" name="otp">
          <input class="input" type="password" maxlength="1" name="otp1"> 
          <input class="input" type="password" maxlength="1" name="otp2">
          <input class="input" type="password" maxlength="1" name="otp3">
          <input class="input" type="password" maxlength="1" name="otp4">
          <input class="input" type="password" maxlength="1" name="otp5">
          </div>
          <button type="submit" class="btn1">Verify</button>
          <div id="resend">Resend OTP in:</div>
          <div id="timer" class="timer"><span id="timerDisplay"></span></div>
  <button id="resendBtn" onclick="resendFunction()" class="btn2" form="form1">Resend</button>
      </form>
      <form action="/google-signup" id="form1" method="get"></form>
  </body>
  </html>
  `);

  
  app.post('/check-gmailotp',(req,res)=>{
    const otp=req.body.otp+req.body.otp1+req.body.otp2+req.body.otp3+req.body.otp4+req.body.otp5;
    if(otp==k){
      const encryptedData1 = encryptData('email');
      cache.set('verification', encryptedData1);
      res.sendFile(path.join(__dirname+'/signupimg.html')); 
    }
    else{
       notifier.notify({
        title: 'INVALID OTP',
        message: 'You have entered invalid otp! please enter a valid otp',
        icon: path.join(__dirname, 'logo.png'),
        sound: true
      });
      res.redirect('/google-signup');
    }
})
})
  









app.post('/signup', async (req, res) => {
  if(req.body['verificationType1']==''){
    req.body['verificationType1']='email';
  }
  else if(req.body['verificationType']==''){
    req.body['verificationType']='email';
  }
  const objectLength = Object.keys(req.body).length;
  if (objectLength==2) {
    const body=req.body;
    const encryptedData = encryptData(body);
    cache.set('dataKey', encryptedData);
    res.redirect('/auth/google');
  }



  else if(req.body.form1CheckboxStatus=='checked' && req.body.verificationType=='email'){
    const body=req.body;
    const encryptedData = encryptData(body);
    cache.set('dataKey', encryptedData);
    const Email=req.body.Email;
    const doc=await db.findOne({Email:Email})
    if(!doc){
      res.redirect('/signupwithemail');
    }
    else{
      notifier.notify({
        title: 'YOUR EMAIL ID ALREADY EXISTS',
        message: 'Your acount is present in our databse! Please login',
        icon:path.join(__dirname,'logo.png'),
        sound:true
      });
      res.redirect('/signin');
    }
  }


  else if(req.body.form1CheckboxStatus=='checked' && req.body.verificationType=='sms'){
        const encryptedData1 = encryptData('sms');
        cache.set('verification', encryptedData1);
        const encryptedData2 = encryptData(req.body);
        cache.set('signupnumwithoutgoogle', encryptedData2);
        res.sendFile(path.join(__dirname+'/signupimgnum.html'));
  }


  else{
    const body=req.body;
    const encryptedData = encryptData(body);
    cache.set('dataKey', encryptedData);
    const encryptedData1 = encryptData('nil');
    cache.set('verification', encryptedData1);
    res.sendFile(path.join(__dirname+'/signupimg.html'));
  }
})




app.get('/signupwithemail',async(req,res)=>{
  const cache7 = cache.get('dataKey');
  const body = decryptData(cache7,res);
  const name=body.Name;
  const Email=body.Email;
  const encryptedData2 = encryptData('email');
      cache.set('verification', encryptedData2);
      k=googleotp(Email,name,res);
      res.send(`
      <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Document</title>
      <style>
  html, body {
      height: 100%;
      margin: 0;
  }
  body {
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #d3d3d3;
  }
          .form {
    width: 29em;
    height: 25em;
    display: flex;
    flex-direction: column;
    border-radius: 19px;
    background-color: #d3d3d3;
    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
    transition: .4s ease-in-out;
    align-items:center;
    top: auto;
      bottom: auto;
      margin-top: -12em;
    
  }
  
  .form:hover {
    box-shadow: 1px 1px 1px rgba(0, 0, 0, 0.1);
    scale: 0.99;
  }
  
  .heading {
    position: relative;
    text-align: center;
    color: black;
    top: 3em;
    font-weight: bold;
  }
  
  .check {
    position: relative;
    align-self: center;
    top: 4em;
  }
  
  .input {
    position: relative;
    width: 2.5em;
    height: 2.5em;
    margin: 0.5em;
    border-radius: 5px;
    border: none;
    outline: none;
    background-color: rgb(235, 235, 235);
    box-shadow: inset 3px 3px 6px #d1d1d1,
              inset -3px -3px 6px #ffffff;
    top: 6.5em;
    left: 1em;
    padding-left: 15px;
    transition: .4s ease-in-out;
  }
  
  .input:hover {
    box-shadow: inset 0px 0px 0px #d1d1d1,
              inset 0px 0px 0px #ffffff;
    background-color: rgb(149, 149, 149);
  }
  
  .input:focus {
    box-shadow: inset 0px 0px 0px #d1d1d1,
              inset 0px 0px 0px #ffffff;
  }
  
  .btn1 {
    position: relative;
    top: 8.5em;
    left: 1.2em;
    width: 17em;
    height: 3em;
    border-radius: 5px;
    border: none;
    outline: none;
    transition: .4s ease-in-out;
    box-shadow: 1px 1px 3px #b5b5b5,
               -1px -1px 3px #ffffff;
  }
  
  .btn1:active {
    box-shadow: inset 3px 3px 6px #b5b5b5,
              inset -3px -3px 6px #ffffff;
  }
  
  .btn2 {
    position: relative;
    top: 9.5em;
    left: 1.2em;
    width: 17em;
    height: 3em;
    border-radius: 5px;
    border: none;
    outline: none;
    transition: .4s ease-in-out;
    box-shadow: 1px 1px 3px #b5b5b5,
               -1px -1px 3px #ffffff;
  }
  
  .btn2:active {
    box-shadow: inset 3px 3px 6px #b5b5b5,
              inset -3px -3px 6px #ffffff;
  }
      </style>
  <script>
      document.addEventListener("DOMContentLoaded", function () {
          var inputs = document.querySelectorAll('.input');
  
          inputs.forEach(function (input, index) {
              input.addEventListener('input', function () {
                  if (this.value.length === 1) {
                      if (index < inputs.length - 1) {
                          inputs[index + 1].focus();
                      }
                  }
              });
  
              input.addEventListener('keydown', function (e) {
                  if (e.key === 'Backspace' && index > 0) {
                      inputs[index - 1].focus();
                  }
              });
          });
      });
  </script>
  <style>
    #timer {
      display: none;
      position: relative;
    top: 9.5em;
    left: 1.2em;
    border-radius: 5px;
    border: none;
    outline: none;
    transition: .4s ease-in-out;

    }
    #resend{
        position: relative;
    top: 9.5em;
    left: 1.2em;
    border-radius: 5px;
    border: none;
    outline: none;
    transition: .4s ease-in-out;

    }
    #resendBtn {
      display: none;
    }
  </style>
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      // Function to display timer
      function startTimer(duration, display) {
        var timer = duration, minutes, seconds;
        setInterval(function () {
          minutes = parseInt(timer / 60, 10);
          seconds = parseInt(timer % 60, 10);

          minutes = minutes < 10 ? "0" + minutes : minutes;
          seconds = seconds < 10 ? "0" + seconds : seconds;

          display.textContent = minutes + ":" + seconds;

          if (--timer < 0) {
            // Timer has finished, display the resend button
            document.getElementById('timer').style.display = 'none';
            document.getElementById('resendBtn').style.display = 'block';
          }
        }, 1000);
      }

      // Set the duration of the timer (1 minute)
      var timerDuration = 30;

      // Display the timer after 1 second
      setTimeout(function () {
        document.getElementById('timer').style.display = 'block';
        var timerDisplay = document.querySelector('#timer');
        startTimer(timerDuration, timerDisplay);
      }, 1000);
    });
  </script>
  </head>
  <body>
      <form class="form" action="/check-gmailotp" method="post">
          <p class="heading">Verify</p>
          <svg class="check" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="60px" height="60px" viewBox="0 0 60 60" xml:space="preserve">  <image id="image0" width="60" height="60" x="0" y="0" href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAQAAACQ9RH5AAAABGdBTUEAALGPC/xhBQAAACBjSFJN
        AAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAAAmJLR0QA/4ePzL8AAAAJcEhZ
        cwAACxMAAAsTAQCanBgAAAAHdElNRQfnAg0NDzN/r+StAAACR0lEQVRYw+3Yy2sTURTH8W+bNgVf
        aGhFaxNiAoJou3FVEUQE1yL031BEROjCnf4PLlxILZSGYncuiiC48AEKxghaNGiliAojiBWZNnNd
        xDza3pl77jyCyPzO8ubcT85wmUkG0qT539In+MwgoxQoUqDAKDn2kSNLlp3AGi4uDt9xWOUTK3xg
        hVU2wsIZSkxwnHHGKZOxHKfBe6rUqFGlTkPaVmKGn6iYao1ZyhK2zJfY0FZ9ldBzsbMKxZwZjn/e
        5szGw6UsD5I0W6T+hBhjUjiF7bNInjz37Ruj3igGABjbtpIo3GIh30u4ww5wr3fwfJvNcFeznhBs
        YgXw70TYX2bY/ulkZhWfzfBbTdtrzjPFsvFI+T/L35jhp5q2owDs51VIVvHYDM9sa/LY8XdtKy1l
        FXfM8FVN2/X2ajctZxVXzPA5TZvHpfb6CFXxkerUWTOcY11LX9w0tc20inX2mmF4qG3upnNWrOKB
        hIXLPu3dF1x+kRWq6ysHpkjDl+7eQjatYoOCDIZF3006U0unVSxIWTgTsI3HNP3soSJkFaflMDwL
        3OoHrph9YsPCJJ5466DyOGUHY3Epg2rWloUxnMjsNw7aw3AhMjwVhgW4HYm9FZaFQZ/bp6QeMRQe
        hhHehWKXGY7CAuSpW7MfKUZlAUqWdJ3DcbAAB3guZl9yKC4WYLfmT4muFtgVJwvQx7T2t0mnXK6J
        XlGGyAQvfNkaJ5JBmxnipubJ5HKDbJJsM0eY38QucSx5tJWTVHBwqDDZOzRNmn87fwDoyM4J2hRz
        NgAAACV0RVh0ZGF0ZTpjcmVhdGUAMjAyMy0wMi0xM1QxMzoxNTo1MCswMDowMKC8JaoAAAAldEVY
        dGRhdGU6bW9kaWZ5ADIwMjMtMDItMTNUMTM6MTU6NTArMDA6MDDR4Z0WAAAAKHRFWHRkYXRlOnRp
        bWVzdGFtcAAyMDIzLTAyLTEzVDEzOjE1OjUxKzAwOjAwIIO3fQAAAABJRU5ErkJggg=="></image>
        </svg>
          <div class="box">
          <input class="input" type="password" maxlength="1" name="otp">
          <input class="input" type="password" maxlength="1" name="otp1"> 
          <input class="input" type="password" maxlength="1" name="otp2">
          <input class="input" type="password" maxlength="1" name="otp3">
          <input class="input" type="password" maxlength="1" name="otp4">
          <input class="input" type="password" maxlength="1" name="otp5">
          </div>
          <button type="submit" class="btn1">Verify</button>
          <div id="resend">Resend OTP in:</div>
          <div id="timer" class="timer"><span id="timerDisplay"></span></div>
  <button id="resendBtn" onclick="resendFunction()" class="btn2" form="form1">Resend</button>
      </form>
      <form action="/signupwithemail" id="form1" method="get"></form>
  </body>
  </html>
`);


app.post('/check-gmailotp',(req,res)=>{
  const otp=req.body.otp+req.body.otp1+req.body.otp2+req.body.otp3+req.body.otp4+req.body.otp5;
  if(otp==k){
    res.sendFile(path.join(__dirname+'/signupimg.html')); 
  }
})
  const encryptedData1 = encryptData('email');
  cache.set('verification', encryptedData1);
  
});




app.post('/signupimg', async(req, res) => {
  const objectLength = Object.keys(req.body).length;
  const cache1 = cache.get('verification');
  const verification = decryptData(cache1,res);
  var newUser={};
  if(objectLength==1 && req.user && verification=='email'){
    const Name=req.user._json['name'];
    const Email=req.user._json["email"];
    const Password=req.user._json["sub"];
    req.user={}
    newUser = {
      Name: Name,
      Email: Email,
      Password:Password,
      Base64Image:req.body.Base64Image,
      verification: 'email'
    };
  }
  else if(objectLength==1 && req.user && verification=='nil'){
    const Name=req.user._json['name'];
    const Email=req.user._json["email"];
    const Password=req.user._json["sub"];
    req.user={}
    newUser = {
      Name: Name,
      Email: Email,
      Password:Password,
      Base64Image:req.body.Base64Image,
      verification: 'nil'
    };
  }
  else if(!req.user && verification=='email'){
    const cache1 = cache.get('dataKey');
    const body = decryptData(cache1,res);
    const Name=body.Name;
    const Email=body.Email;
    const Password=body.Password;
    newUser = {
      Name: Name,
      Email: Email,
      Password:Password,
      Base64Image:req.body.Base64Image,
      verification:'email'
    };
  }
  else if(!req.user && verification=='nil'){
    const cache1 = cache.get('dataKey');
    const body = decryptData(cache1,res);
    const Name=body.Name;
    const Email=body.Email;
    const Password=body.Password;
    newUser = {
      Name: Name,
      Email: Email,
      Password:Password,
      Base64Image:req.body.Base64Image,
      verification:'nil'
    };
  }
  const mail=newUser.Email;
  const result = await db.findOne({Email:mail});
  if(!result){
    db.insertOne(newUser, function(err, result) {
      if (err) {
        console.log("line 717")
        res.sendFile(path.join(__dirname+'/error.html'));
      } else {
        notifier.notify({
          title: 'ACCOUNT CREATED SUCCESSFULLY',
          message: 'Your acount has been created in Securebyte! Happy Securing',
          icon:path.join(__dirname,'logo.png'),
          sound:true
        });
        res.redirect('/signin');}
    });
  }
  else{
    res.send("The user already exists")
  }
  });


app.post('/signupnum',(req,res)=>{
  var phone;
  var Base64Image;
  if(cache.has('phone') && cache.has('Base64Image')){
    const cache5 = cache.get('phone');
    phone = decryptData(cache5,res);
    const cache6=cache.get('Base64Image');
    Base64Image=decryptData(cache6,res)
  }
  else{
    phone="+91"+req.body.phone 
    Base64Image=req.body.imageData;
  }
  client1.verify.v2
  .services(verifySid)
  .verifications.create({ to: phone, channel: "sms" })
  .then((verification) => {
    console.log(verification.status);
      const encryptedData1 = encryptData(phone);
      cache.set('phone', encryptedData1);
      const encryptedData2 = encryptData(Base64Image);
      cache.set('Base64Image', encryptedData2);
      res.redirect('/verify');
  })
  .catch((error) => {
    console.log("line 750");
    notifier.notify({
      title: 'ERROR SENDING OTP',
      message: 'An error has occurred while sending otp! The otp will be resent! ',
      icon:path.join(__dirname,'logo.png'),
      sound:true
    });
    res.redirect('/signupnum')
  });
})


app.get("/verify", (req, res) => {
  res.send(`
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Document</title>
      <style>
  html, body {
      height: 100%;
      margin: 0;
  }
  body {
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #d3d3d3;
  }
          .form {
    width: 29em;
    height: 25em;
    display: flex;
    flex-direction: column;
    border-radius: 19px;
    background-color: #d3d3d3;
    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
    transition: .4s ease-in-out;
    align-items:center;
    top: auto;
      bottom: auto;
      margin-top: -12em;
    
  }
  
  .form:hover {
    box-shadow: 1px 1px 1px rgba(0, 0, 0, 0.1);
    scale: 0.99;
  }
  
  .heading {
    position: relative;
    text-align: center;
    color: black;
    top: 3em;
    font-weight: bold;
  }
  
  .check {
    position: relative;
    align-self: center;
    top: 4em;
  }
  
  .input {
    position: relative;
    width: 2.5em;
    height: 2.5em;
    margin: 0.5em;
    border-radius: 5px;
    border: none;
    outline: none;
    background-color: rgb(235, 235, 235);
    box-shadow: inset 3px 3px 6px #d1d1d1,
              inset -3px -3px 6px #ffffff;
    top: 6.5em;
    left: 1em;
    padding-left: 15px;
    transition: .4s ease-in-out;
  }
  
  .input:hover {
    box-shadow: inset 0px 0px 0px #d1d1d1,
              inset 0px 0px 0px #ffffff;
    background-color: rgb(149, 149, 149);
  }
  
  .input:focus {
    box-shadow: inset 0px 0px 0px #d1d1d1,
              inset 0px 0px 0px #ffffff;
  }
  
  .btn1 {
    position: relative;
    top: 8.5em;
    left: 1.2em;
    width: 17em;
    height: 3em;
    border-radius: 5px;
    border: none;
    outline: none;
    transition: .4s ease-in-out;
    box-shadow: 1px 1px 3px #b5b5b5,
               -1px -1px 3px #ffffff;
  }
  
  .btn1:active {
    box-shadow: inset 3px 3px 6px #b5b5b5,
              inset -3px -3px 6px #ffffff;
  }
  
  .btn2 {
    position: relative;
    top: 9.5em;
    left: 1.2em;
    width: 17em;
    height: 3em;
    border-radius: 5px;
    border: none;
    outline: none;
    transition: .4s ease-in-out;
    box-shadow: 1px 1px 3px #b5b5b5,
               -1px -1px 3px #ffffff;
  }
  
  .btn2:active {
    box-shadow: inset 3px 3px 6px #b5b5b5,
              inset -3px -3px 6px #ffffff;
  }
      </style>
  <script>
      document.addEventListener("DOMContentLoaded", function () {
          var inputs = document.querySelectorAll('.input');
  
          inputs.forEach(function (input, index) {
              input.addEventListener('input', function () {
                  if (this.value.length === 1) {
                      if (index < inputs.length - 1) {
                          inputs[index + 1].focus();
                      }
                  }
              });
  
              input.addEventListener('keydown', function (e) {
                  if (e.key === 'Backspace' && index > 0) {
                      inputs[index - 1].focus();
                  }
              });
          });
      });
  </script>
  <style>
    #timer {
      display: none;
      position: relative;
    top: 9.5em;
    left: 1.2em;
    border-radius: 5px;
    border: none;
    outline: none;
    transition: .4s ease-in-out;

    }
    #resend{
        position: relative;
    top: 9.5em;
    left: 1.2em;
    border-radius: 5px;
    border: none;
    outline: none;
    transition: .4s ease-in-out;

    }
    #resendBtn {
      display: none;
    }
  </style>
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      // Function to display timer
      function startTimer(duration, display) {
        var timer = duration, minutes, seconds;
        setInterval(function () {
          minutes = parseInt(timer / 60, 10);
          seconds = parseInt(timer % 60, 10);

          minutes = minutes < 10 ? "0" + minutes : minutes;
          seconds = seconds < 10 ? "0" + seconds : seconds;

          display.textContent = minutes + ":" + seconds;

          if (--timer < 0) {
            // Timer has finished, display the resend button
            document.getElementById('timer').style.display = 'none';
            document.getElementById('resendBtn').style.display = 'block';
          }
        }, 1000);
      }

      // Set the duration of the timer (1 minute)
      var timerDuration = 30;

      // Display the timer after 1 second
      setTimeout(function () {
        document.getElementById('timer').style.display = 'block';
        var timerDisplay = document.querySelector('#timer');
        startTimer(timerDuration, timerDisplay);
      }, 1000);
    });
  </script>
  </head>
  <body>
      <form class="form" action="/check-otp" method="post">
          <p class="heading">Verify</p>
          <svg class="check" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="60px" height="60px" viewBox="0 0 60 60" xml:space="preserve">  <image id="image0" width="60" height="60" x="0" y="0" href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAQAAACQ9RH5AAAABGdBTUEAALGPC/xhBQAAACBjSFJN
        AAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAAAmJLR0QA/4ePzL8AAAAJcEhZ
        cwAACxMAAAsTAQCanBgAAAAHdElNRQfnAg0NDzN/r+StAAACR0lEQVRYw+3Yy2sTURTH8W+bNgVf
        aGhFaxNiAoJou3FVEUQE1yL031BEROjCnf4PLlxILZSGYncuiiC48AEKxghaNGiliAojiBWZNnNd
        xDza3pl77jyCyPzO8ubcT85wmUkG0qT539In+MwgoxQoUqDAKDn2kSNLlp3AGi4uDt9xWOUTK3xg
        hVU2wsIZSkxwnHHGKZOxHKfBe6rUqFGlTkPaVmKGn6iYao1ZyhK2zJfY0FZ9ldBzsbMKxZwZjn/e
        5szGw6UsD5I0W6T+hBhjUjiF7bNInjz37Ruj3igGABjbtpIo3GIh30u4ww5wr3fwfJvNcFeznhBs
        YgXw70TYX2bY/ulkZhWfzfBbTdtrzjPFsvFI+T/L35jhp5q2owDs51VIVvHYDM9sa/LY8XdtKy1l
        FXfM8FVN2/X2ajctZxVXzPA5TZvHpfb6CFXxkerUWTOcY11LX9w0tc20inX2mmF4qG3upnNWrOKB
        hIXLPu3dF1x+kRWq6ysHpkjDl+7eQjatYoOCDIZF3006U0unVSxIWTgTsI3HNP3soSJkFaflMDwL
        3OoHrph9YsPCJJ5466DyOGUHY3Epg2rWloUxnMjsNw7aw3AhMjwVhgW4HYm9FZaFQZ/bp6QeMRQe
        hhHehWKXGY7CAuSpW7MfKUZlAUqWdJ3DcbAAB3guZl9yKC4WYLfmT4muFtgVJwvQx7T2t0mnXK6J
        XlGGyAQvfNkaJ5JBmxnipubJ5HKDbJJsM0eY38QucSx5tJWTVHBwqDDZOzRNmn87fwDoyM4J2hRz
        NgAAACV0RVh0ZGF0ZTpjcmVhdGUAMjAyMy0wMi0xM1QxMzoxNTo1MCswMDowMKC8JaoAAAAldEVY
        dGRhdGU6bW9kaWZ5ADIwMjMtMDItMTNUMTM6MTU6NTArMDA6MDDR4Z0WAAAAKHRFWHRkYXRlOnRp
        bWVzdGFtcAAyMDIzLTAyLTEzVDEzOjE1OjUxKzAwOjAwIIO3fQAAAABJRU5ErkJggg=="></image>
        </svg>
          <div class="box">
          <input class="input" type="password" maxlength="1" name="otp">
          <input class="input" type="password" maxlength="1" name="otp1"> 
          <input class="input" type="password" maxlength="1" name="otp2">
          <input class="input" type="password" maxlength="1" name="otp3">
          <input class="input" type="password" maxlength="1" name="otp4">
          <input class="input" type="password" maxlength="1" name="otp5">
          </div>
          <button type="submit" class="btn1">Verify</button>
          <div id="resend">Resend OTP in:</div>
          <div id="timer" class="timer"><span id="timerDisplay"></span></div>
  <button id="resendBtn" onclick="resendFunction()" class="btn2" form="form1">Resend</button>
      </form>
      <form action="/signupnum" id="form1" method="post"></form>
  </body>
  </html>
  `);
});
    
app.post("/check-otp", (req, res) => {
  const otpCode = req.body.otp+req.body.otp1+req.body.otp2+req.body.otp3+req.body.otp4+req.body.otp5;
  const cache1 = cache.get('phone');
  const phoneNumber = decryptData(cache1,res);
  client1.verify.v2
  .services(verifySid)
  .verificationChecks.create({ to: phoneNumber, code: otpCode })
  .then((verification_check) => {
    if (verification_check.status == 'approved') {
      res.redirect('/signupimgnumdata')
    }
    else{
      notifier.notify({
        title: 'INVALID OTP',
        message: 'The otp which you have entered is invalid! please enter again',
        icon:path.join(__dirname,'logo.png'),
        sound:true
      });
      res.redirect('/verify');
    }
  })
  .catch((error) => {
    console.log("line 961")
    res.sendFile(path.join(__dirname+'/error.html'));
  });
});

app.get('/signupimgnumdata',async(req,res)=>{
    const cache1 = cache.get('phone');
    const phone = decryptData(cache1,res);
    const cache3 = cache.get('verification');
    const verification = decryptData(cache3,res);
    const cache2 = cache.get('Base64Image');
    const Base64Image = decryptData(cache2,res);
    newUser={};
    if(req.user && verification=='email'){
      const Name=req.user._json['name'];
      const Email=req.user._json["email"];
      const Password=req.user._json["sub"];
      newUser = {
        Name: Name,
        Email: Email,
        phone:phone,
        Password:Password,
        Base64Image:Base64Image,
        verification:'email'
      }
    }
    else if(req.user && verification=='sms'){
      const Name=req.user._json['name'];
      const Email=req.user._json["email"];
      const Password=req.user._json["sub"];
      newUser = {
        Name: Name,
        Email: Email,
        phone:phone,
        Password:Password,
        Base64Image:Base64Image,
        verification:'sms'
      }
    }
    else if(req.user){
      const Name=req.user._json['name'];
      const Email=req.user._json["email"];
      const Password=req.user._json["sub"];
      newUser = {
        Name: Name,
        Email: Email,
        phone:phone,
        Password:Password,
        Base64Image:Base64Image,
        verification:'nil'
      }
    }
    else{
      const cache3 = cache.get('signupnumwithoutgoogle');
      const body = decryptData(cache3,res);
      const Name=body.Name;
      const Email=body.Email;
      const Password=body.Password;
      newUser = {
      Name: Name,
      Email: Email,
      Password:Password,
      phone:phone,
      Base64Image:Base64Image,
      verification:'sms'
    };
    }
    const mail=newUser.Email
    const result = await db.findOne({Email:mail});
  if(!result){
    db.insertOne(newUser, function(err, result) {
      if (err) {
        console.log("line 1036")
        res.sendFile(path.join(__dirname+'/error.html'));
      } else {
        notifier.notify({
          title: 'ACCOUNT CREATED SUCCESSFULLY',
          message: 'Your acount has been created in Securebyte! Happy Securing',
          icon:path.join(__dirname,'logo.png'),
          sound:true
        });
        res.redirect('/signin');}
    });
  }
  else{
    res.send("The user already exists")
  }
  });


app.get('/signin',(req,res)=>{
  res.sendFile(path.join(__dirname+'/signin.html'));
})


app.post('/signin',(req,res)=>{
  const objectLength = Object.keys(req.body).length;
  if (objectLength==0 || objectLength==1) {
    const body="signin";
    const encryptedData = encryptData(body);
    cache.set('dataKey', encryptedData);
    res.redirect('/auth/google');
  }
  else{
    const body =req.body;
    const encryptedData = encryptData(body);
    cache.set('signinauth', encryptedData);
    const opt = encryptData("simple login");
    cache.set('type',opt);
    res.redirect('/signinauth');
  }
})


app.get('/invalid', (req, res) => {
  notifier.notify({
    title: 'Invalid password',
    message: 'Invalid username or password',
    icon:path.join(__dirname,'logo.png'),
    sound:true
  });
  res.redirect('/signin');
});

app.get('/signinauth',async(req,res)=>{
  var newUser={};
  const opt = cache.get('type');
  const type = decryptData(opt,res);
  if(req.user && type=="google login"){
    const Name=req.user._json["name"];
    const Email=req.user._json["email"];
    const Password=req.user._json["sub"];
    newUser = {
      Name: Name,
      Email: Email,
      Password:Password,
    }
   
}
else{
  const cache1 = cache.get('signinauth');
    const body = decryptData(cache1,res);
    const Name=body.Name;
    const Email=body.Email;
    const Password=body.Password;
    newUser = {
      Name: Name,
      Email: Email,
      Password:Password,
    };
}
try {
  const result = await db.findOne(newUser);
  if (!result) {
    res.redirect(307, '/invalid');

  }
  else if(result.verification=='sms'){
    const encryptedData = encryptData(result.phone);
    const body = encryptData(result.Base64Image);
    cache.set('signinphone', encryptedData);
    cache.set('result', body);
    const objectId = new ObjectId(result._id);
    const idString = objectId.toString();
    const body1 = encryptData(idString);
    cache.set('some', body1);
    //res.sendFile(path.join(__dirname+'/signinimgnum.html'));
    res.redirect('/signinnum');
  }
  else if(result.verification=='email'){
    k=googleotp(result.Email,result.Name,res);
      res.send(`
      <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Document</title>
      <style>
  html, body {
      height: 100%;
      margin: 0;
  }
  body {
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #d3d3d3;
  }
          .form {
    width: 29em;
    height: 25em;
    display: flex;
    flex-direction: column;
    border-radius: 19px;
    background-color: #d3d3d3;
    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
    transition: .4s ease-in-out;
    align-items:center;
    top: auto;
      bottom: auto;
      margin-top: -12em;
    
  }
  
  .form:hover {
    box-shadow: 1px 1px 1px rgba(0, 0, 0, 0.1);
    scale: 0.99;
  }
  
  .heading {
    position: relative;
    text-align: center;
    color: black;
    top: 3em;
    font-weight: bold;
  }
  
  .check {
    position: relative;
    align-self: center;
    top: 4em;
  }
  
  .input {
    position: relative;
    width: 2.5em;
    height: 2.5em;
    margin: 0.5em;
    border-radius: 5px;
    border: none;
    outline: none;
    background-color: rgb(235, 235, 235);
    box-shadow: inset 3px 3px 6px #d1d1d1,
              inset -3px -3px 6px #ffffff;
    top: 6.5em;
    left: 1em;
    padding-left: 15px;
    transition: .4s ease-in-out;
  }
  
  .input:hover {
    box-shadow: inset 0px 0px 0px #d1d1d1,
              inset 0px 0px 0px #ffffff;
    background-color: rgb(149, 149, 149);
  }
  
  .input:focus {
    box-shadow: inset 0px 0px 0px #d1d1d1,
              inset 0px 0px 0px #ffffff;
  }
  
  .btn1 {
    position: relative;
    top: 8.5em;
    left: 1.2em;
    width: 17em;
    height: 3em;
    border-radius: 5px;
    border: none;
    outline: none;
    transition: .4s ease-in-out;
    box-shadow: 1px 1px 3px #b5b5b5,
               -1px -1px 3px #ffffff;
  }
  
  .btn1:active {
    box-shadow: inset 3px 3px 6px #b5b5b5,
              inset -3px -3px 6px #ffffff;
  }
  
  .btn2 {
    position: relative;
    top: 9.5em;
    left: 1.2em;
    width: 17em;
    height: 3em;
    border-radius: 5px;
    border: none;
    outline: none;
    transition: .4s ease-in-out;
    box-shadow: 1px 1px 3px #b5b5b5,
               -1px -1px 3px #ffffff;
  }
  
  .btn2:active {
    box-shadow: inset 3px 3px 6px #b5b5b5,
              inset -3px -3px 6px #ffffff;
  }
      </style>
  <script>
      document.addEventListener("DOMContentLoaded", function () {
          var inputs = document.querySelectorAll('.input');
  
          inputs.forEach(function (input, index) {
              input.addEventListener('input', function () {
                  if (this.value.length === 1) {
                      if (index < inputs.length - 1) {
                          inputs[index + 1].focus();
                      }
                  }
              });
  
              input.addEventListener('keydown', function (e) {
                  if (e.key === 'Backspace' && index > 0) {
                      inputs[index - 1].focus();
                  }
              });
          });
      });
  </script>
  <style>
    #timer {
      display: none;
      position: relative;
    top: 9.5em;
    left: 1.2em;
    border-radius: 5px;
    border: none;
    outline: none;
    transition: .4s ease-in-out;

    }
    #resend{
        position: relative;
    top: 9.5em;
    left: 1.2em;
    border-radius: 5px;
    border: none;
    outline: none;
    transition: .4s ease-in-out;

    }
    #resendBtn {
      display: none;
    }
  </style>
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      // Function to display timer
      function startTimer(duration, display) {
        var timer = duration, minutes, seconds;
        setInterval(function () {
          minutes = parseInt(timer / 60, 10);
          seconds = parseInt(timer % 60, 10);

          minutes = minutes < 10 ? "0" + minutes : minutes;
          seconds = seconds < 10 ? "0" + seconds : seconds;

          display.textContent = minutes + ":" + seconds;

          if (--timer < 0) {
            // Timer has finished, display the resend button
            document.getElementById('timer').style.display = 'none';
            document.getElementById('resendBtn').style.display = 'block';
          }
        }, 1000);
      }

      // Set the duration of the timer (1 minute)
      var timerDuration = 30;

      // Display the timer after 1 second
      setTimeout(function () {
        document.getElementById('timer').style.display = 'block';
        var timerDisplay = document.querySelector('#timer');
        startTimer(timerDuration, timerDisplay);
      }, 1000);
    });
  </script>
  </head>
  <body>
      <form class="form" action="/check-gmailotp" method="post">
          <p class="heading">Verify</p>
          <svg class="check" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="60px" height="60px" viewBox="0 0 60 60" xml:space="preserve">  <image id="image0" width="60" height="60" x="0" y="0" href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAQAAACQ9RH5AAAABGdBTUEAALGPC/xhBQAAACBjSFJN
        AAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAAAmJLR0QA/4ePzL8AAAAJcEhZ
        cwAACxMAAAsTAQCanBgAAAAHdElNRQfnAg0NDzN/r+StAAACR0lEQVRYw+3Yy2sTURTH8W+bNgVf
        aGhFaxNiAoJou3FVEUQE1yL031BEROjCnf4PLlxILZSGYncuiiC48AEKxghaNGiliAojiBWZNnNd
        xDza3pl77jyCyPzO8ubcT85wmUkG0qT539In+MwgoxQoUqDAKDn2kSNLlp3AGi4uDt9xWOUTK3xg
        hVU2wsIZSkxwnHHGKZOxHKfBe6rUqFGlTkPaVmKGn6iYao1ZyhK2zJfY0FZ9ldBzsbMKxZwZjn/e
        5szGw6UsD5I0W6T+hBhjUjiF7bNInjz37Ruj3igGABjbtpIo3GIh30u4ww5wr3fwfJvNcFeznhBs
        YgXw70TYX2bY/ulkZhWfzfBbTdtrzjPFsvFI+T/L35jhp5q2owDs51VIVvHYDM9sa/LY8XdtKy1l
        FXfM8FVN2/X2ajctZxVXzPA5TZvHpfb6CFXxkerUWTOcY11LX9w0tc20inX2mmF4qG3upnNWrOKB
        hIXLPu3dF1x+kRWq6ysHpkjDl+7eQjatYoOCDIZF3006U0unVSxIWTgTsI3HNP3soSJkFaflMDwL
        3OoHrph9YsPCJJ5466DyOGUHY3Epg2rWloUxnMjsNw7aw3AhMjwVhgW4HYm9FZaFQZ/bp6QeMRQe
        hhHehWKXGY7CAuSpW7MfKUZlAUqWdJ3DcbAAB3guZl9yKC4WYLfmT4muFtgVJwvQx7T2t0mnXK6J
        XlGGyAQvfNkaJ5JBmxnipubJ5HKDbJJsM0eY38QucSx5tJWTVHBwqDDZOzRNmn87fwDoyM4J2hRz
        NgAAACV0RVh0ZGF0ZTpjcmVhdGUAMjAyMy0wMi0xM1QxMzoxNTo1MCswMDowMKC8JaoAAAAldEVY
        dGRhdGU6bW9kaWZ5ADIwMjMtMDItMTNUMTM6MTU6NTArMDA6MDDR4Z0WAAAAKHRFWHRkYXRlOnRp
        bWVzdGFtcAAyMDIzLTAyLTEzVDEzOjE1OjUxKzAwOjAwIIO3fQAAAABJRU5ErkJggg=="></image>
        </svg>
          <div class="box">
          <input class="input" type="password" maxlength="1" name="otp">
          <input class="input" type="password" maxlength="1" name="otp1"> 
          <input class="input" type="password" maxlength="1" name="otp2">
          <input class="input" type="password" maxlength="1" name="otp3">
          <input class="input" type="password" maxlength="1" name="otp4">
          <input class="input" type="password" maxlength="1" name="otp5">
          </div>
          <button type="submit" class="btn1">Verify</button>
          <div id="resend">Resend OTP in:</div>
          <div id="timer" class="timer"><span id="timerDisplay"></span></div>
  <button id="resendBtn" onclick="resendFunction()" class="btn2" form="form1">Resend</button>
      </form>
      <form action="/signinauth" id="form1" method="get"></form>
  </body>
  </html>
`);


app.post('/check-gmailotp',(req,res)=>{
  const otp=req.body.otp+req.body.otp1+req.body.otp2+req.body.otp3+req.body.otp4+req.body.otp5;
  if(otp==k){
    const body = encryptData(result.Base64Image);
    cache.set('result', body);
    const objectId = new ObjectId(result._id);
    const idString = objectId.toString();
    const body1 = encryptData(idString);
    cache.set('some', body1);
    res.sendFile(path.join(__dirname+'/signinimgnum.html')); 
  }
})
  }
  else{
    const body = encryptData(result.Base64Image);
    cache.set('result', body);
    const objectId = new ObjectId(result._id);
    const idString = objectId.toString();
    const body1 = encryptData(idString);
    cache.set('some', body1);
    res.sendFile(path.join(__dirname+'/signinimg.html'));
  }
}
  catch (error) {
    console.log("line 1338")
    res.sendFile(path.join(__dirname+'/error.html'));
  }})
  

  app.get('/signinnum', (req, res) => {
    const cache1 = cache.get('signinphone');
    const phone = decryptData(cache1,res);
  
    client1.verify.v2
      .services(verifySid)
      .verifications.create({ to: phone, channel: "sms" })
      .then((verification) => {
        console.log(verification.status);
        const encryptedData1 = encryptData(phone);
        cache.set('phone', encryptedData1);
        res.redirect('/verifysignin');
      })
      .catch((error) => {
        console.log("line 1357");
        res.sendFile(path.join(__dirname+'/error.html'));

      });
  });
  

  app.get("/verifysignin", (req, res) => {
    res.send(`
    <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Document</title>
      <style>
  html, body {
      height: 100%;
      margin: 0;
  }
  body {
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #d3d3d3;
  }
          .form {
    width: 29em;
    height: 25em;
    display: flex;
    flex-direction: column;
    border-radius: 19px;
    background-color: #d3d3d3;
    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
    transition: .4s ease-in-out;
    align-items:center;
    top: auto;
      bottom: auto;
      margin-top: -12em;
    
  }
  
  .form:hover {
    box-shadow: 1px 1px 1px rgba(0, 0, 0, 0.1);
    scale: 0.99;
  }
  
  .heading {
    position: relative;
    text-align: center;
    color: black;
    top: 3em;
    font-weight: bold;
  }
  
  .check {
    position: relative;
    align-self: center;
    top: 4em;
  }
  
  .input {
    position: relative;
    width: 2.5em;
    height: 2.5em;
    margin: 0.5em;
    border-radius: 5px;
    border: none;
    outline: none;
    background-color: rgb(235, 235, 235);
    box-shadow: inset 3px 3px 6px #d1d1d1,
              inset -3px -3px 6px #ffffff;
    top: 6.5em;
    left: 1em;
    padding-left: 15px;
    transition: .4s ease-in-out;
  }
  
  .input:hover {
    box-shadow: inset 0px 0px 0px #d1d1d1,
              inset 0px 0px 0px #ffffff;
    background-color: rgb(149, 149, 149);
  }
  
  .input:focus {
    box-shadow: inset 0px 0px 0px #d1d1d1,
              inset 0px 0px 0px #ffffff;
  }
  
  .btn1 {
    position: relative;
    top: 8.5em;
    left: 1.2em;
    width: 17em;
    height: 3em;
    border-radius: 5px;
    border: none;
    outline: none;
    transition: .4s ease-in-out;
    box-shadow: 1px 1px 3px #b5b5b5,
               -1px -1px 3px #ffffff;
  }
  
  .btn1:active {
    box-shadow: inset 3px 3px 6px #b5b5b5,
              inset -3px -3px 6px #ffffff;
  }
  
  .btn2 {
    position: relative;
    top: 9.5em;
    left: 1.2em;
    width: 17em;
    height: 3em;
    border-radius: 5px;
    border: none;
    outline: none;
    transition: .4s ease-in-out;
    box-shadow: 1px 1px 3px #b5b5b5,
               -1px -1px 3px #ffffff;
  }
  
  .btn2:active {
    box-shadow: inset 3px 3px 6px #b5b5b5,
              inset -3px -3px 6px #ffffff;
  }
      </style>
  <script>
      document.addEventListener("DOMContentLoaded", function () {
          var inputs = document.querySelectorAll('.input');
  
          inputs.forEach(function (input, index) {
              input.addEventListener('input', function () {
                  if (this.value.length === 1) {
                      if (index < inputs.length - 1) {
                          inputs[index + 1].focus();
                      }
                  }
              });
  
              input.addEventListener('keydown', function (e) {
                  if (e.key === 'Backspace' && index > 0) {
                      inputs[index - 1].focus();
                  }
              });
          });
      });
  </script>
  <style>
    #timer {
      display: none;
      position: relative;
    top: 9.5em;
    left: 1.2em;
    border-radius: 5px;
    border: none;
    outline: none;
    transition: .4s ease-in-out;

    }
    #resend{
        position: relative;
    top: 9.5em;
    left: 1.2em;
    border-radius: 5px;
    border: none;
    outline: none;
    transition: .4s ease-in-out;

    }
    #resendBtn {
      display: none;
    }
  </style>
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      // Function to display timer
      function startTimer(duration, display) {
        var timer = duration, minutes, seconds;
        setInterval(function () {
          minutes = parseInt(timer / 60, 10);
          seconds = parseInt(timer % 60, 10);

          minutes = minutes < 10 ? "0" + minutes : minutes;
          seconds = seconds < 10 ? "0" + seconds : seconds;

          display.textContent = minutes + ":" + seconds;

          if (--timer < 0) {
            // Timer has finished, display the resend button
            document.getElementById('timer').style.display = 'none';
            document.getElementById('resendBtn').style.display = 'block';
          }
        }, 1000);
      }

      // Set the duration of the timer (1 minute)
      var timerDuration = 30;

      // Display the timer after 1 second
      setTimeout(function () {
        document.getElementById('timer').style.display = 'block';
        var timerDisplay = document.querySelector('#timer');
        startTimer(timerDuration, timerDisplay);
      }, 1000);
    });
  </script>
  </head>
  <body>
      <form class="form" action="/check-otpsignin" method="post">
          <p class="heading">Verify</p>
          <svg class="check" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="60px" height="60px" viewBox="0 0 60 60" xml:space="preserve">  <image id="image0" width="60" height="60" x="0" y="0" href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAQAAACQ9RH5AAAABGdBTUEAALGPC/xhBQAAACBjSFJN
        AAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAAAmJLR0QA/4ePzL8AAAAJcEhZ
        cwAACxMAAAsTAQCanBgAAAAHdElNRQfnAg0NDzN/r+StAAACR0lEQVRYw+3Yy2sTURTH8W+bNgVf
        aGhFaxNiAoJou3FVEUQE1yL031BEROjCnf4PLlxILZSGYncuiiC48AEKxghaNGiliAojiBWZNnNd
        xDza3pl77jyCyPzO8ubcT85wmUkG0qT539In+MwgoxQoUqDAKDn2kSNLlp3AGi4uDt9xWOUTK3xg
        hVU2wsIZSkxwnHHGKZOxHKfBe6rUqFGlTkPaVmKGn6iYao1ZyhK2zJfY0FZ9ldBzsbMKxZwZjn/e
        5szGw6UsD5I0W6T+hBhjUjiF7bNInjz37Ruj3igGABjbtpIo3GIh30u4ww5wr3fwfJvNcFeznhBs
        YgXw70TYX2bY/ulkZhWfzfBbTdtrzjPFsvFI+T/L35jhp5q2owDs51VIVvHYDM9sa/LY8XdtKy1l
        FXfM8FVN2/X2ajctZxVXzPA5TZvHpfb6CFXxkerUWTOcY11LX9w0tc20inX2mmF4qG3upnNWrOKB
        hIXLPu3dF1x+kRWq6ysHpkjDl+7eQjatYoOCDIZF3006U0unVSxIWTgTsI3HNP3soSJkFaflMDwL
        3OoHrph9YsPCJJ5466DyOGUHY3Epg2rWloUxnMjsNw7aw3AhMjwVhgW4HYm9FZaFQZ/bp6QeMRQe
        hhHehWKXGY7CAuSpW7MfKUZlAUqWdJ3DcbAAB3guZl9yKC4WYLfmT4muFtgVJwvQx7T2t0mnXK6J
        XlGGyAQvfNkaJ5JBmxnipubJ5HKDbJJsM0eY38QucSx5tJWTVHBwqDDZOzRNmn87fwDoyM4J2hRz
        NgAAACV0RVh0ZGF0ZTpjcmVhdGUAMjAyMy0wMi0xM1QxMzoxNTo1MCswMDowMKC8JaoAAAAldEVY
        dGRhdGU6bW9kaWZ5ADIwMjMtMDItMTNUMTM6MTU6NTArMDA6MDDR4Z0WAAAAKHRFWHRkYXRlOnRp
        bWVzdGFtcAAyMDIzLTAyLTEzVDEzOjE1OjUxKzAwOjAwIIO3fQAAAABJRU5ErkJggg=="></image>
        </svg>
          <div class="box">
          <input class="input" type="password" maxlength="1" name="otp">
          <input class="input" type="password" maxlength="1" name="otp1"> 
          <input class="input" type="password" maxlength="1" name="otp2">
          <input class="input" type="password" maxlength="1" name="otp3">
          <input class="input" type="password" maxlength="1" name="otp4">
          <input class="input" type="password" maxlength="1" name="otp5">
          </div>
          <button type="submit" class="btn1">Verify</button>
          <div id="resend">Resend OTP in:</div>
          <div id="timer" class="timer"><span id="timerDisplay"></span></div>
  <button id="resendBtn" onclick="resendFunction()" class="btn2" form="form1">Resend</button>
      </form>
      <form action="/signinnum" id="form1" method="get"></form>
  </body>
  </html>
    `);
  });

  app.post('/check-otpsignin', (req, res) => {
    const otpCode = req.body.otp+req.body.otp1+req.body.otp2+req.body.otp3+req.body.otp4+req.body.otp5;
    
    const cache1 = cache.get('signinphone'); // Typo: 'singinphone' should be 'signinphone'
    const phoneNumber = decryptData(cache1,res);
  
    client1.verify.v2
      .services(verifySid)
      .verificationChecks.create({ to: phoneNumber, code: otpCode })
      .then((verification_check) => {
        if (verification_check.status == 'approved') {
          res.sendFile(path.join(__dirname + '/signinimgnum.html'));
        }
        else{
          notifier.notify({
            title: 'INVALID OTP',
            message: 'The otp which you have entered is invalid! please enter again',
            icon:path.join(__dirname,'logo.png'),
            sound:true
          });
          res.redirect('/verifysignin');
        }
      })
      .catch((error) => {
        console.log("line 1565")
        notifier.notify({
          title: 'SOME ERROR HAS OCCURRED',
          message: 'Please relogin again to access your data!',
          icon:path.join(__dirname,'logo.png'),
          sound:true
        });
        res.redirect('/signin')
      });
  });


app.post('/compare', async (req, res) => {
  const cache1 = cache.get('result');
  const Base64Image1 = decryptData(cache1,res);
  const Base64Image2 = req.body.imageData;
  console.log(Base64Image2);

  try {

    const formData = new FormData();
    formData.append('api_key', 'LZBWzpb_HkZ178b-8y8OzkJFj-poxFB5');
    formData.append('api_secret', 'oIjgHqcskEzgJoPzT6qbScNomn1UU0gY');
    formData.append('image_base64_1', Base64Image1);
    formData.append('image_base64_2', Base64Image2);
    const response = await axios.post('https://api-us.faceplusplus.com/facepp/v3/compare', formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });

    const result = response.data;

    if (result.confidence > 85) {
      res.sendFile(path.join(__dirname + '/account.html'));
    } else {
      res.send("FACE IS NOT MATCHED");
    }
  } catch (error) {
    console.log("line 1604")
    notifier.notify({
      title: 'INVALID USER',
      message: 'Your face is not matching!',
      icon:path.join(__dirname,'logo.png'),
      sound:true
    });
    res.redirect('/signin')
  }
});






app.post('/Add', (req, res) => {
  if (cache.has('some')) {
    res.sendFile(__dirname + '/pdfup.html');
  } else {
    notifier.notify({
      title: 'YOU ARE AT WRONG PLACE',
      message: 'You are lost! let me take you to a safe location',
      icon: path.join(__dirname, 'logo.png'),
      sound: true
    });
    res.redirect('/signin');
  }
});

app.post('/upload', upload.array('files',5),async (req, res) => {
  try {
    const cache1 = cache.get('some');
    const id = decryptData(cache1,res);

    const numRecords = parseInt(req.body.numRecords, 10);
    let records = [];
    let record = {};
    const bodyLength = Object.keys(req.body).length;
    const filter = { _id: ObjectId(id)}
    const keys1=await db.findOne(filter);
    const keys = Object.keys(keys1);
    const lastKey = keys[keys.length - 1];
    if(lastKey=='verification'){
      var number=0;
    }
    else{
      const match = lastKey.match(/\d+/);
      var number = parseInt(match[0]);
    }
    
    const isFileInput = req.files && req.files.length > 0
      const files=req.files;
      if (isFileInput) {
        for (let i = 0; i <files.length ; i++) {
        const k=files[i];
        var filePath = k.path;
        const fileData = fs.readFileSync(filePath);
        const base64FileData = fileData.toString('base64');
        number=number+1;
        fs.unlinkSync(filePath);
        record["data"+(number)] = {
          filename: k.originalname,
          contentType: k.mimetype,
          data: fileData
        };
      } 
    }

    if(bodyLength>2){
      const dataKeys = Object.keys(req.body).filter(key => key.startsWith('data'));
      var temp=1;
      dataKeys.forEach(key => {
        const dataValue = req.body[key];
        record["data"+temp]=dataValue;
        temp=temp+1
      });
    }
    records.push(record);
    const update = { $set: {} };
    for (var item of records) {
      for(var i=0;i<Object.keys(item).length;i++){
        const field = Object.keys(item)[i];
        const value = item[field];
        update.$set[field] = value;
      }
     
    }
    const result = await db.updateOne(filter, update);
    notifier.notify({
      title: 'SUCCESSFULLY UPLOADED',
      message: 'Your files has been uploaded. You can access it by clicking on retreive!! Happy Securing',
      icon:path.join(__dirname,'logo.png'),
      sound:true
    });
    res.sendFile(__dirname + '/account.html');
  }
  catch(err){
    console.log("line 1699")
    notifier.notify({
      title: 'THE DATA YOU WANT TO UPLOAD IS TOO LARGE',
      message: 'The file is too large please upload the file within the size of 10mb',
      icon:path.join(__dirname,'logo.png'),
      sound:true
    });
    res.redirect('/Add');
  }
});






app.post('/retreive',async(req,res)=>{
if(cache.has('some')){
  try {
    const cache1 = cache.get('some');
    const id = decryptData(cache1,res);
    const fileId = id;

    if (!fileId) {
      res.status(400).send('File ID is missing');
      return;
    }




    const document = await db.findOne({ _id: new ObjectId(fileId) });

    const dataKeys = Object.keys(document).filter(key => key.startsWith('data'));
    const dataUrl = [];
    const qrCodes=[];
    const data=[];
    var cnt=0;
    const dataUrl1=[]
    const path = require('path')
    const dataUrl2=[]
    const promises = dataKeys.map(async key => {
      if (Object.keys(document[key]).length == 3) {
        const k = document[key];
        cnt=cnt+1
        const r = k.contentType;
const fileExtension = mime.extension(r);
const pa = path.extname(k.filename);
if (fileExtension == false) {
  const button=`${k.filename}`
  dataUrl2.push(button);
} else {
  const button=`${k.filename}`
  dataUrl2.push(button);
}
var cnt2=0;
var id = crypto.randomBytes(20).toString('hex');

const currentDate = new Date();
const cre_year = currentDate.getFullYear();
const cre_month = currentDate.getMonth() + 1; 
const cre_day = currentDate.getDate();
  
app.get(`/${id}`, (req1, res1) => {
   const currentDate = new Date();
  const curryear = currentDate.getFullYear();
  const currmonth = currentDate.getMonth() + 1; 
  const currday = currentDate.getDate();
  if(cnt2>=1 || cre_year!=curryear || cre_month!=currmonth || cre_day!=currday){
    res1.send("the link has expired")
  }
  else{
  cnt2+=1;
  res1.setHeader('Content-Type', k.contentType);
  res1.setHeader('Content-Disposition', `attachment; filename="${k.filename}"`);
  res1.send(k.data.buffer);
  }
      })
  var downloadUrl;
  if(process.env.PORT){
    downloadUrl =`https://securebyte-ppxd.onrender.com/${id}`;
  }
  else{
    downloadUrl =`localhost:3000/${id}`;
  }
  console.log(downloadUrl);
  dataUrl.push(downloadUrl);
  const downloadUrl1 = `data:${k.contentType};base64,${k.data.buffer.toString('base64')}`;
  dataUrl1.push(downloadUrl1);
        const qrCodeImage = await qrcode.toDataURL(downloadUrl);
        qrCodes.push(qrCodeImage);
    }
  })
        

    // Wait for all promises to resolve
    await Promise.all(promises);
    var html = `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>File Bar with QR Code</title>
        <style>
        .form {
          --background: #d3d3d3;
          --input-focus: #2d8cf0;
          --font-color: #000000;
          --font-color-sub: #000000;
          --bg-color: #fff;
          --main-color: #000000;
          padding: 20px;
          background: var(--background);
          gap: 20px;
          border-radius: 5px;
          border: 2px solid var(--main-color);
          box-shadow: 4px 4px var(--main-color);
          width: 300px; 
          overflow: hidden;
          word-wrap: break-word;
  
        }
        
        .form > p {
          font-family: var(--font-DelaGothicOne);
          color: var(--font-color);
          font-weight: 700;
          font-size: 20px;
          margin-bottom: 15px;
          display: flex;
          flex-direction: column;
        }
  
        .form > p > span {
          font-family: var(--font-SpaceMono);
          color: var(--font-color-sub);
          font-weight: 600;
          font-size: 17px;
        }
  
        .icon {
          width: 1.5rem;
          height: 1.5rem;
        }
  
        ::placeholder {
          color: #7b7b7b;
        }
  
        .container {
          display:flex;
          gap: 30px;
          margin-bottom: 40px;
        }
  
        .separator {
          width: 100%;
          margin-left: 0px;
          margin-top: 10px;
          align-items: center;
          justify-content: center;
          gap: 5px;
          display: flex;
        }
  
        .separator > div {
          width: 100px;
          height: 3px;
          border-radius: 35px;
          background-color: var(--font-color-sub);
        }
  
        .separator > span {
          color: var(--font-color);
          font-family: var(--font-SpaceMono);
          font-weight: 600;
        }
  
        .button {
          --main-focus: #2d8cf0;
          --font-color: #323232;
          --bg-color-sub: #dedede;
          --bg-color: #eee;
          --main-color: #323232;
          position: relative;
          width: 150px;
          height: 40px;
          cursor: pointer;
          display: flex;
          align-items: center;
          border: 2px solid var(--main-color);
          box-shadow: 4px 4px var(--main-color);
          background-color: var(--bg-color);
          border-radius: 10px;
          overflow: hidden;
        }
  
        .button, .button__icon, .button__text {
          transition: all 0.3s;
        }
  
        .button .button__text {
          transform: translateX(22px);
          color: var(--font-color);
          font-weight: 600;
        }
  
        .button .button__icon {
          position: absolute;
          transform: translateX(109px);
          height: 100%;
          width: 39px;
          background-color: var(--bg-color-sub);
          display: flex;
          align-items: center;
          justify-content: center;
        }
  
        .button .svg {
          width: 20px;
          fill: var(--main-color);
        }
  
        .button:hover {
          background: var(--bg-color);
        }
  
        .button:hover .button__text {
          color: transparent;
        }
  
        .button:hover .button__icon {
          width: 148px;
          transform: translateX(0);
        }
  
        .button:active {
          transform: translate(3px, 3px);
          box-shadow: 0px 0px var(--main-color);
        }
  
        /* Image growth effect on hover */
        .form > center > img {
          width: 120px;
          height: 120px;
          transition: transform 0.3s; /* Add a transition for smooth scaling */
        }
  
        .form > center > img:hover {
          transform: scale(1.3); /* Scale the image to 110% on hover */
        }
        .button1 {
          --main-focus: #2d8cf0;
          --font-color: #323232;
          --bg-color-sub: #d3d3d3;
          --bg-color: #d3d3d3;
          --main-color: #323232;
          position: relative;
          width: 40px;
          height: 40px;
          cursor: pointer;
          display: flex;
          border: 2px solid var(--main-color);
          box-shadow: 4px 4px var(--main-color);
          background-color: var(--bg-color);
          border-radius: 10px;
          overflow: hidden;
        }
        
        .button1, .button__icon, .button__text {
          transition: all 0.3s;
        }
        
        .button1 .button__text {
          transform: translateX(22px);
          color: var(--font-color);
          font-weight: 600;
        }
        
        .button1 .button__icon {
          position: absolute;
          transform: translateX(109px);
          height: 100%;
          width: px;
          background-color: var(--bg-color-sub);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .button1 .svg {
          width: 10px;
          fill: var(--main-color);
        }
        
        
        
        
        .button1:hover .button__icon {
          transform: translateX(0);
        }
        
        .button1:active {
          transform: translate(3px, 3px);
          box-shadow: 0px 0px var(--main-color);
        }
        .c1 {
            margin-left: 40px;
                  display:flex;
                  gap: 30px;
                  margin-bottom: 40px;
                }
        </style>
    </head>
    <body style="background-color: #d3d3d3;">
        <div class="container">`;

for (var i = 0; i < dataUrl.length; i++) {
    if (i > 0 && i % 4 === 0) {
        // Start a new container after every 4 containers
        html += `</div><div class="container">`;
    }

    html += `
        <div class="form">
            <center>
                <img src="${qrCodes[i]}" alt="QR Code" >
                <div style="font-family:'Trebuchet MS', 'Lucida Sans Unicode', 'Lucida Grande', 'Lucida Sans', Arial, sans-serif; font-weight: bolder;">${dataUrl2[i]}</div>
                <hr class="card-divider">
                <div class="separator">
                    <div></div>
                    <span>OR</span>
                    <div></div>
                </div>
                <br>
            </center>
            <div class="c1">
                <a href="${dataUrl1[i]}" download="${dataUrl2[i]}" style="text-decoration:none"> 
                    <button class="button" type="submit">
                        <span class="button__text">Download</span>
                        <span class="button__icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 35 35" id="bdd05811-e15d-428c-bb53-8661459f9307" data-name="Layer 2" class="svg"><path d="M17.5,22.131a1.249,1.249,0,0,1-1.25-1.25V2.187a1.25,1.25,0,0,1,2.5,0V20.881A1.25,1.25,0,0,1,17.5,22.131Z"></path><path d="M17.5,22.693a3.189,3.189,0,0,1-2.262-.936L8.487,15.006a1.249,1.249,0,0,1,1.767-1.767l6.751,6.751a.7.7,0,0,0,.99,0l6.751-6.751a1.25,1.25,0,0,1,1.768,1.767l-6.752,6.751A3.191,3.191,0,0,1,17.5,22.693Z"></path><path d="M31.436,34.063H3.564A3.318,3.318,0,0,1,.25,30.749V22.011a1.25,1.25,0,0,1,2.5,0v8.738a.815.815,0,0,0,.814.814H31.436a.815.815,0,0,0,.814-.814V22.011a1.25,1.25,0,1,1,2.5,0v8.738A3.318,3.318,0,0,1,31.436,34.063Z"></path></svg></span>
                    </button>
                </a>
                <button class="button1" type="submit" form="dlt${i}" id="button${i}">
                    <span class="button__icon"><svg xmlns="http://www.w3.org/2000/svg" width="26" height="200" fill="currentColor" class="bi bi-trash" viewBox="0 0 16 16" id="IconChangeColor"> <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 1-1 0V6a.5.5 0 0 1 1 0V6z" id="mainIconPathAttribute"></path> <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z" id="mainIconPathAttribute"></path> </svg></span>
                </button>
            </div>
            <form id="dlt${i}" method="post" action="/dlt">
                <input type="hidden" value="${dataKeys}" name="dataKeys">
                <input type="hidden" value="${i}" name="data">
                <input type="hidden" value="${fileId}" name="fileid">
            </form>
        </div>`;
}

html += `</div></body></html>`;
    res.send(html)
 }
 catch (error) {
  notifier.notify({
    title: 'YOU ARE AT WRONG PLACE',
    message: 'You are lost! let me take you to a safe location',
    icon:path.join(__dirname,'logo.png'),
    sound:true
  });
  res.redirect('/signin');
  }}
  else{
    notifier.notify({
      title: 'YOU ARE AT WRONG PLACE',
      message: 'You are lost! let me take you to a safe location',
      icon: path.join(__dirname, 'logo.png'),
      sound: true
    });
    res.redirect('/signin');
  }
});














app.get('/retreive',async(req,res)=>{

if(cache.has('some')){

try {
  const cache1 = cache.get('some');
  const id = decryptData(cache1,res);
  const fileId = id;

  if (!fileId) {
    res.status(400).send('File ID is missing');
    return;
  }

  const document = await db.findOne({ _id: new ObjectId(fileId) });

  const dataKeys = Object.keys(document).filter(key => key.startsWith('data'));
  console.log(dataKeys);
  const dataUrl = [];
  const qrCodes=[];
  const data=[];
  var cnt=0;
  const dataUrl1=[]
  const path = require('path')
  const dataUrl2=[]
  const promises = dataKeys.map(async key => {
    if (Object.keys(document[key]).length == 3) {
      const k = document[key];
      cnt=cnt+1
      const r = k.contentType;
const fileExtension = mime.extension(r);
const pa = path.extname(k.filename);
if (fileExtension == false) {
const button=`${k.filename}`
dataUrl2.push(button);
} else {
const button=`${k.filename}`
dataUrl2.push(button);
}
var cnt2=0;
var id = crypto.randomBytes(20).toString('hex');

const currentDate = new Date();
const cre_year = currentDate.getFullYear();
const cre_month = currentDate.getMonth() + 1; 
const cre_day = currentDate.getDate();

app.get(`/${id}`, (req1, res1) => {
 const currentDate = new Date();
const curryear = currentDate.getFullYear();
const currmonth = currentDate.getMonth() + 1; 
const currday = currentDate.getDate();
if(cnt2>=1 || cre_year!=curryear || cre_month!=currmonth || cre_day!=currday){
  res1.send("the link has expired")
}
else{
cnt2+=1;
res1.setHeader('Content-Type', k.contentType);
res1.setHeader('Content-Disposition', `attachment; filename="${k.filename}"`);
res1.send(k.data.buffer);
}
    })
var downloadUrl;
if(process.env.PORT){
  downloadUrl =`https://securebyte-ppxd.onrender.com/${id}`;
}
else{
  downloadUrl =`localhost:3000/${id}`;
}
console.log(downloadUrl);
dataUrl.push(downloadUrl);
const downloadUrl1 = `data:${k.contentType};base64,${k.data.buffer.toString('base64')}`;
dataUrl1.push(downloadUrl1);
      const qrCodeImage = await qrcode.toDataURL(downloadUrl);
      qrCodes.push(qrCodeImage);
  }
})
      

  // Wait for all promises to resolve
  await Promise.all(promises);
  var html=`<!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>File Bar with QR Code</title>
      <style>
      .form {
        --background: #d3d3d3;
        --input-focus: #2d8cf0;
        --font-color: #000000;
        --font-color-sub: #000000;
        --bg-color: #fff;
        --main-color: #000000;
        padding: 20px;
        background: var(--background);
        gap: 20px;
        border-radius: 5px;
        border: 2px solid var(--main-color);
        box-shadow: 4px 4px var(--main-color);
        width: 300px; 
        overflow: hidden;
        word-wrap: break-word;

      }
      
      .form > p {
        font-family: var(--font-DelaGothicOne);
        color: var(--font-color);
        font-weight: 700;
        font-size: 20px;
        margin-bottom: 15px;
        display: flex;
        flex-direction: column;
      }

      .form > p > span {
        font-family: var(--font-SpaceMono);
        color: var(--font-color-sub);
        font-weight: 600;
        font-size: 17px;
      }

      .icon {
        width: 1.5rem;
        height: 1.5rem;
      }

      ::placeholder {
        color: #7b7b7b;
      }

      .container {
        display:flex;
        gap: 30px;
        margin-bottom: 40px;
      }

      .separator {
        width: 100%;
        margin-left: 0px;
        margin-top: 10px;
        align-items: center;
        justify-content: center;
        gap: 5px;
        display: flex;
      }

      .separator > div {
        width: 100px;
        height: 3px;
        border-radius: 35px;
        background-color: var(--font-color-sub);
      }

      .separator > span {
        color: var(--font-color);
        font-family: var(--font-SpaceMono);
        font-weight: 600;
      }

      .button {
        --main-focus: #2d8cf0;
        --font-color: #323232;
        --bg-color-sub: #dedede;
        --bg-color: #eee;
        --main-color: #323232;
        position: relative;
        width: 150px;
        height: 40px;
        cursor: pointer;
        display: flex;
        align-items: center;
        border: 2px solid var(--main-color);
        box-shadow: 4px 4px var(--main-color);
        background-color: var(--bg-color);
        border-radius: 10px;
        overflow: hidden;
      }

      .button, .button__icon, .button__text {
        transition: all 0.3s;
      }

      .button .button__text {
        transform: translateX(22px);
        color: var(--font-color);
        font-weight: 600;
      }

      .button .button__icon {
        position: absolute;
        transform: translateX(109px);
        height: 100%;
        width: 39px;
        background-color: var(--bg-color-sub);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .button .svg {
        width: 20px;
        fill: var(--main-color);
      }

      .button:hover {
        background: var(--bg-color);
      }

      .button:hover .button__text {
        color: transparent;
      }

      .button:hover .button__icon {
        width: 148px;
        transform: translateX(0);
      }

      .button:active {
        transform: translate(3px, 3px);
        box-shadow: 0px 0px var(--main-color);
      }

      /* Image growth effect on hover */
      .form > center > img {
        width: 120px;
        height: 120px;
        transition: transform 0.3s; /* Add a transition for smooth scaling */
      }

      .form > center > img:hover {
        transform: scale(1.3); /* Scale the image to 110% on hover */
      }
      .button1 {
        --main-focus: #2d8cf0;
        --font-color: #323232;
        --bg-color-sub: #d3d3d3;
        --bg-color: #d3d3d3;
        --main-color: #323232;
        position: relative;
        width: 40px;
        height: 40px;
        cursor: pointer;
        display: flex;
        border: 2px solid var(--main-color);
        box-shadow: 4px 4px var(--main-color);
        background-color: var(--bg-color);
        border-radius: 10px;
        overflow: hidden;
      }
      
      .button1, .button__icon, .button__text {
        transition: all 0.3s;
      }
      
      .button1 .button__text {
        transform: translateX(22px);
        color: var(--font-color);
        font-weight: 600;
      }
      
      .button1 .button__icon {
        position: absolute;
        transform: translateX(109px);
        height: 100%;
        width: px;
        background-color: var(--bg-color-sub);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .button1 .svg {
        width: 10px;
        fill: var(--main-color);
      }
      
      
      
      
      .button1:hover .button__icon {
        transform: translateX(0);
      }
      
      .button1:active {
        transform: translate(3px, 3px);
        box-shadow: 0px 0px var(--main-color);
      }
      .c1 {
          margin-left: 40px;
                display:flex;
                gap: 30px;
                margin-bottom: 40px;
              }
      
  </style>
  </head>
  <body style="background-color: #d3d3d3;">
  <div class="container">`
  for(var i=0;i<dataUrl.length;i++){
    if((i+1)%5==0){
      html+=`</div>
            <div class="container">`
    }

    
      html+=`
      <div class="form">
      <center>
      <img src="${qrCodes[i]}" alt="QR Code" >
      <div style="font-family:'Trebuchet MS', 'Lucida Sans Unicode', 'Lucida Grande', 'Lucida Sans', Arial, sans-serif; font-weight: bolder;">${dataUrl2[i]}</div>
      <hr class="card-divider">
      <div class="separator">
      <div></div>
      <span>OR</span>
      <div></div>
    </div>
    <br>
    </center>
      <div class="c1">
        <a href="${dataUrl1[i]}" download="${dataUrl2[i]}" style="text-decoration:none"> 
        <button class="button" type="submit">
          <span class="button__text">Download</span>
          <span class="button__icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 35 35" id="bdd05811-e15d-428c-bb53-8661459f9307" data-name="Layer 2" class="svg"><path d="M17.5,22.131a1.249,1.249,0,0,1-1.25-1.25V2.187a1.25,1.25,0,0,1,2.5,0V20.881A1.25,1.25,0,0,1,17.5,22.131Z"></path><path d="M17.5,22.693a3.189,3.189,0,0,1-2.262-.936L8.487,15.006a1.249,1.249,0,0,1,1.767-1.767l6.751,6.751a.7.7,0,0,0,.99,0l6.751-6.751a1.25,1.25,0,0,1,1.768,1.767l-6.752,6.751A3.191,3.191,0,0,1,17.5,22.693Z"></path><path d="M31.436,34.063H3.564A3.318,3.318,0,0,1,.25,30.749V22.011a1.25,1.25,0,0,1,2.5,0v8.738a.815.815,0,0,0,.814.814H31.436a.815.815,0,0,0,.814-.814V22.011a1.25,1.25,0,1,1,2.5,0v8.738A3.318,3.318,0,0,1,31.436,34.063Z"></path></svg></span>
        </button>
      </a>
  <button class="button1" type="submit" form="dlt${i}" id="button${i}">
          <span class="button__icon"><svg xmlns="http://www.w3.org/2000/svg" width="26" height="200" fill="currentColor" class="bi bi-trash" viewBox="0 0 16 16" id="IconChangeColor"> <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" id="mainIconPathAttribute"></path> <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z" id="mainIconPathAttribute"></path> </svg></span>
        </button>
      </div>
      <form id="dlt${i}" method="post" action="/dlt">
          <input type="hidden" value="${dataKeys}" name="dataKeys">
          <input type="hidden" value="${i}" name="data">
          <input type="hidden" value="${fileId}" name="fileid">

      </form>
</div>`}

  html+=`</div>
  </body>
  </html>`
  res.send(html)
} catch (error) {
  console.log("line 2518")
  res.sendFile(path.join(__dirname+'/error.html'));
}
}

});




app.post('/dlt',async(req,res)=>{
  const id=req.body.data;
  const data=req.body.dataKeys;
  const dataKeysArray = data.split(',');
  const dataIndex = parseInt(id);
  const result = dataKeysArray[dataIndex];
  const filter = { _id: new ObjectId(req.body.fileid) };
  const update = { $unset: { [result]: 1 } };
  const result1 = await db.updateOne(filter, update);
  res.redirect('/retreive')
})


app.post('/logout',async(req,res)=>{
  if(cache.has('verification')){
    cache.del('verification');
  }
  if(cache.has('type')){
    cache.del('type');
  }
  if(cache.has('dataKey')){
    cache.del('dataKey');
  }
  if(cache.has('signupnumwithoutgoogle')){
    cache.del('signupnumwithoutgoogle');
  }
  if(cache.has('phone')){
    cache.del('phone');
  }
  if(cache.has('Base64Image')){
    cache.del('Base64Image');
  }
  if(cache.has('signinauth')){
    cache.del('signinauth');
  }
  if(cache.has('some')){
    cache.del('some');
  }
  if(cache.has('result')){
    cache.del('result');
  }
  if(cache.has('signinphone')){
    cache.del('signinphone');
  }
  await client.close();
  res.sendFile(path.join(__dirname + '/index.html'));
})


app.listen(port, () => {
  console.log('Server started on port 3000!');
});




