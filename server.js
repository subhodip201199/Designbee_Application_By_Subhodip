require('dotenv').config()

const express = require('express')
const session = require('express-session')
const passport = require('passport')
const flash = require('connect-flash')
const bodyParser = require('body-parser')

const pool = require('./config/database.js')

const app = express()

var url = require('url');
var cors = require('cors');
const { Console } = require("console");
const { SSL_OP_TLS_D5_BUG } = require("constants");

//-----------for file upload---------------

var formidable = require("formidable");
var fs = require("fs");



app.use(express.static(__dirname + '/uploads'));

//--------------------------

const PORT = process.env.PORT || 3000

//const routes = require('./routes/index')

app.use(express.static(__dirname + '/views'));


app.use(cors());

app.set('view engine', 'ejs')
app.use(session({
    secret: 'thatsecretthinggoeshere',
    resave: false,
    saveUninitialized: true
}));
app.use(bodyParser.urlencoded({
    extended: true
}))
app.use(bodyParser.json())
app.use(flash())
app.use(passport.initialize())
app.use(passport.session())

app.use(function(req, res, next){
    res.locals.message = req.flash('message');
    next();
});

//app.use('/', routes)
require('./config/passport')(passport)

app.listen(PORT, () => {
    console.log(`Application server started on port: ${PORT}`)
})


  
//------------------------ROUTINGS---------------------------//

app.get('/', (req, res) => {
  if (req.isAuthenticated()) {
      res.render('home', {
          title: 'Home',
          user: req.user,
          message: res.locals.message
      })
  } else {
      res.render('login', {
          title: 'Log In',
          user: req.user,
          message: res.locals.message
      })
  }
})

app.get('/login', (req, res) => {
  if (req.isAuthenticated()) {
      req.flash('message', 'Your are already logged in.')
      res.redirect('/home')
  } else {
      res.render('login', {
          title: 'Login',
          user: req.user,
          message: res.locals.message
      })
  }
})
app.post('/login', (req, res, next) => {
  if (req.isAuthenticated()) {
      req.flash('message', 'You are already logged in.')
      res.redirect('/home')
  } else {
      let user = (req.body.username).toLowerCase()
      let pass = req.body.password
      if (user.length === 0 || pass.length === 0) {
          req.flash('message', 'You must provide a username and password.')
          res.redirect('/login')
      } else {
          next()
      }
  }
}, passport.authenticate('login', {
  successRedirect : '/home',
  failureRedirect : '/login',
  failureFlash : true
}))


//-----------------disable it for registering admin------------------//
app.post('/register', (req, res, next) => {
  if (req.isAuthenticated()) {
      //req.flash('message', 'You are already logged in.')
      //res.redirect('/profile')
      let user = (req.body.username).toLowerCase()
      let pass = req.body.password
      let passConf = req.body.passConf
      let name = req.body.name
      let phone = req.body.phone
      let email = req.body.email
      if (user.length === 0 || pass.length === 0 || passConf.length === 0) {
          req.flash('message', 'You must provide a username, password, and password confirmation.')
          res.redirect('/add_user')
      } else if (pass != passConf) {
          req.flash('message', 'Your password and password confirmation must match.')
          res.redirect('/add_user')
      } else {
          next()
      }
  } else {
      res.redirect('/login')
  }
}, passport.authenticate('register', {
  successRedirect : '/logout',
  failureRedirect : '/logout',
  failureFlash : true
}))

//---------------------------------------------------------------//


//--------------------enable it for admin registration------------//
//app.get('/admin_registration', (req, res) => {
//  res.render('add_user');
//})
//
//app.post('/register', (req, res, next) => {
//  
//      //req.flash('message', 'You are already logged in.')
//      //res.redirect('/profile')
//      let user = (req.body.username).toLowerCase()
//      let pass = req.body.password
//      let passConf = req.body.passConf
//      let name = req.body.name
//      let phone = req.body.phone
//      let email = req.body.email
//      if (user.length === 0 || pass.length === 0 || passConf.length === 0) {
//          req.flash('message', 'You must provide a username, password, and password confirmation.')
//          res.redirect('/add_user')
//      } else if (pass != passConf) {
//          req.flash('message', 'Your password and password confirmation must match.')
//          res.redirect('/add_user')
//      } else {
//          next()
//      }
//   
//}, passport.authenticate('register', {
//  successRedirect : '/add_user',
//  failureRedirect : '/home',
//  failureFlash : true
//}))
//-------------------------------------------------------//

app.get('/logout', (req, res) => {
  if (req.isAuthenticated()) {
      console.log('User [' + req.user.username + '] has logged out.')
      req.logout()
      res.redirect('/');
  } else {
      res.redirect('/')
  }
})

app.post('/updpass', (req, res, next) => {
  if (req.isAuthenticated()) {
      let password = req.body.password
      let newpass = req.body.newpass
      let newpassconf = req.body.newpassconf
      if (password.length === 0 || newpass.length === 0 || newpassconf.length === 0) {
          req.flash('message', 'You must provide your current password, new password, and new password confirmation.')
          res.redirect('/edit-account')
      } else if (newpass != newpassconf) { 
          req.flash('message', 'Your password and password confirmation must match.')
          //res.redirect('/edit-account')
          res.send("<h2>Your password and password confirmation must match.</h2>")
      } else {
          next()
      }
  } else {
      res.redirect('/')
  }
}, passport.authenticate('updatePassword', {
  successRedirect : '/home',
  failureRedirect : '/home',
  failureFlash : true
}))

//-------------------------------------------------------------------------

app.get("/home", (req, res) => {
  if (req.isAuthenticated()) {
    res.render('home', {
        title: 'home',
        user: req.user,
        message: res.locals.message
    })
  } else {
      res.redirect('/login')
  }
})

app.get('/client', (req, res) => {
  if (req.isAuthenticated() && (req.user.username !== 'admin')) {
    var access = new Array();
    access.push(req.user.access1);
    access.push(req.user.access2);
    access.push(req.user.access3);
    access.push(req.user.access4);
    access.push(req.user.access5);
    


    var bool = access.includes("client");
    if(bool == true){
      console.log('Client is true');
      res.render('client', {
          title: 'client',
          user: req.user,
          message: res.locals.message
      }); 
     } else{ 
          res.send("<h2>User Name : [" +req.user.username + "] is not allowed to access Client Section!</h2>");
       }
  } else if(req.isAuthenticated() && (req.user.username == 'admin')){
      res.render('client', {
        title: 'client',
        user: req.user,
        message: res.locals.message
      });
  } else {
      res.redirect('/login')
  }
})




app.get('/add_client', (req, res) => {
  if (req.isAuthenticated() && (req.user.username !== 'admin')) {
    var access = new Array();
    access.push(req.user.access1);
    access.push(req.user.access2);
    access.push(req.user.access3);
    access.push(req.user.access4);
    access.push(req.user.access5);
    


    var bool = access.includes("client");
    if(bool == true){
      console.log('Client is true');
      res.render('add_client', {
          title: 'add_client',
          user: req.user,
          message: res.locals.message
      }); 
     } else{ 
      res.send("<h2>User Name : [" +req.user.username + "] is not allowed to access Client Section!</h2>");
       }
  } else if(req.isAuthenticated() && (req.user.username == 'admin')){
      res.render('add_client', {
        title: 'add_client',
        user: req.user,
        message: res.locals.message
      });
  } else {
      res.redirect('/login')
  }
})


app.get('/project', (req, res) => {
  if (req.isAuthenticated() && (req.user.username !== 'admin')) {
    var access = new Array();
    access.push(req.user.access1);
    access.push(req.user.access2);
    access.push(req.user.access3);
    access.push(req.user.access4);
    access.push(req.user.access5);
    


    var bool = access.includes("project");
    if(bool == true){
      console.log('Project is true');
      res.render('project', {
          title: 'project',
          user: req.user,
          message: res.locals.message
      }); 
     } else{ 
      res.send("<h2>User Name : [" +req.user.username + "] is not allowed to access Project Section!</h2>");
       }
  } else if(req.isAuthenticated() && (req.user.username == 'admin')){
      res.render('project', {
        title: 'project',
        user: req.user,
        message: res.locals.message
      });
  } else {
      res.redirect('/login')
  }
})


app.get('/add_employee', (req, res) => {
  if (req.isAuthenticated() && (req.user.username !== 'admin')) {
    var access = new Array();
    access.push(req.user.access1);
    access.push(req.user.access2);
    access.push(req.user.access3);
    access.push(req.user.access4);
    access.push(req.user.access5);
    


    var bool = access.includes("employee");
    if(bool == true){
      console.log('Employee is true');
      res.render('add_employee', {
          title: 'add_employee',
          user: req.user,
          message: res.locals.message
      }); 
     } else{ 
      res.send("<h2>User Name : [" +req.user.username + "] is not allowed to access Employee Section!</h2>");
       }
  } else if(req.isAuthenticated() && (req.user.username == 'admin')){
      res.render('add_employee', {
        title: 'add_employee',
        user: req.user,
        message: res.locals.message
      });
  } else {
      res.redirect('/login')
  }
})


app.get('/employee', (req, res) => {
  if (req.isAuthenticated() && (req.user.username !== 'admin')) {
    var access = new Array();
    access.push(req.user.access1);
    access.push(req.user.access2);
    access.push(req.user.access3);
    access.push(req.user.access4);
    access.push(req.user.access5);
    


    var bool = access.includes("employee");
    if(bool == true){
      console.log('Employee is true');
      res.render('employee', {
          title: 'employee',
          user: req.user,
          message: res.locals.message
      }); 
     } else{ 
      res.send("<h2>User Name : [" +req.user.username + "] is not allowed to access Employee Section!</h2>");
       }
  } else if(req.isAuthenticated() && (req.user.username == 'admin')){
      res.render('employee', {
        title: 'employee',
        user: req.user,
        message: res.locals.message
      });
  } else {
      res.redirect('/login')
  }
})


var employee_id;

app.get('/employee_profile', (req, res) => {
  if (req.isAuthenticated() && (req.user.username !== 'admin')) {
    var access = new Array();
    access.push(req.user.access1);
    access.push(req.user.access2);
    access.push(req.user.access3);
    access.push(req.user.access4);
    access.push(req.user.access5);
    


    var bool = access.includes("employee");
    if(bool == true){
      console.log('Employee is true');

      var data = url.parse(req.url, true);
      data = data.query;
      employee_id = data.employee_id;
      console.log(employee_id);

      res.render('employee_profile', {
          title: 'employee_profile',
          user: req.user,
          message: res.locals.message
      }); 
     } else{ 
      res.send("<h2>User Name : [" +req.user.username + "] is not allowed to access Employee Section!</h2>");
       }
  } else if(req.isAuthenticated() && (req.user.username == 'admin')){
        var data = url.parse(req.url, true);
        data = data.query;
        employee_id = data.employee_id;
        console.log(employee_id);
        res.render('employee_profile', {
        title: 'employee_profile',
        user: req.user,
        message: res.locals.message
      });
  } else {
      res.redirect('/login')
  }
})


app.get("/user", (req, res) => {
  if(req.isAuthenticated() && (req.user.username == 'admin')){
    res.render('user', {
      title: 'user',
      user: req.user,
      message: res.locals.message
    });
  } else if(req.isAuthenticated() && (req.user.username !== 'admin')) {
    res.send('<h2>User Name : [' +req.user.username + '] is not allowed to access User Section!</h2>');
    
  } else{
    res.redirect('/login');
  }
});

var user_name;


app.get("/user_info", (req, res) => {
  if(req.isAuthenticated() && (req.user.username == 'admin')){

    var data = url.parse(req.url, true);
    data = data.query;
    user_name = data.username;
    console.log(user_name);

    res.render('user_info', {
      title: 'user_info',
      user: req.user,
      message: res.locals.message
    });
  } else if(req.isAuthenticated() && (req.user.username !== 'admin')) {
    res.send('<h2>User Name : [' +req.user.username + '] is not allowed to access User Section!</h2>');
    
  } else{
    res.redirect('/login');
  }
});


app.get("/add_user", (req, res) => {
  if(req.isAuthenticated() && (req.user.username == 'admin')){
    res.render('add_user', {
      title: 'add_user',
      user: req.user,
      message: res.locals.message
    });
  } else if(req.isAuthenticated() && (req.user.username !== 'admin')) {
    res.send('<h2>User Name : [' +req.user.username + '] is not allowed to access Add User!</h2>');
    
  } else{
    res.redirect('/login');
  }
});


var project_id;
var client_id;

app.get('/view_project', (req, res) => {
  if (req.isAuthenticated() && (req.user.username !== 'admin')) {
    var access = new Array();
    access.push(req.user.access1);
    access.push(req.user.access2);
    access.push(req.user.access3);
    access.push(req.user.access4);
    access.push(req.user.access5);
    
    

    var bool = access.includes("project");
    if(bool == true){
      console.log('Project is true');

      var data = url.parse(req.url, true);
      data = data.query;
      project_id = data.project_id;
      client_id = data.client_id;
      console.log(project_id)

      res.render('view_project', {
          title: 'view_project',
          user: req.user,
          message: res.locals.message
      }); 
     } else{ 
          res.send('<h2>User Name : [' +req.user.username + '] is not allowed to Project Section!</h2>');
       }
  } else if(req.isAuthenticated() && (req.user.username == 'admin')){

      var data = url.parse(req.url, true);
      data = data.query;
      project_id = data.project_id;
      client_id = data.client_id;
      console.log(project_id)

      res.render('view_project', {
        title: 'view_project',
        user: req.user,
        message: res.locals.message
      });
  } else {
      res.redirect('/login')
  }
})



app.get("/bin", (req, res) => {
  if (req.isAuthenticated()) {
    res.render('bin', {
        title: 'bin',
        user: req.user,
        message: res.locals.message
    })
  } else {
      res.redirect('/login')
  }
})


app.get("/edit-account", (req, res) => {
  if (req.isAuthenticated()) {
    res.render('edit-account', {
        title: 'edit-account',
        user: req.user,
        message: res.locals.message
    })
  } else {
      res.redirect('/login')
  }
})


app.get("/system_history", (req, res) => {
  if(req.isAuthenticated() && (req.user.username == 'admin')){
    res.render('system_history', {
      title: 'system_history',
      user: req.user,
      message: res.locals.message
    });
  } else if(req.isAuthenticated() && (req.user.username !== 'admin')) {
    res.send('<h2>User Name : [' +req.user.username + '] is not allowed to access System History Section!</h2>');
    
  } else{
    res.redirect('/login');
  }
});


app.get('/quatation', (req, res) => {
  if (req.isAuthenticated() && (req.user.username !== 'admin')) {
    var access = new Array();
    access.push(req.user.access1);
    access.push(req.user.access2);
    access.push(req.user.access3);
    access.push(req.user.access4);
    access.push(req.user.access5);
    
    var bool = access.includes("quotation");
    if(bool == true){
      console.log('Quotation is true');
      res.render('quatation', {
          title: 'quatation',
          user: req.user,
          message: res.locals.message
      }); 
     } else{ 
          res.send('<h2>User Name : [' +req.user.username + '] is not allowed to access Quotation Section!</h2>');
       }
  } else if(req.isAuthenticated() && (req.user.username == 'admin')){
      res.render('quatation', {
        title: 'quatation',
        user: req.user,
        message: res.locals.message
      });
  } else {
      res.redirect('/login')
  }
})


app.get('/add_quatation', (req, res) => {
  if (req.isAuthenticated() && (req.user.username !== 'admin')) {
    var access = new Array();
    access.push(req.user.access1);
    access.push(req.user.access2);
    access.push(req.user.access3);
    access.push(req.user.access4);
    access.push(req.user.access5);
    
    var bool = access.includes("quotation");
    if(bool == true){
      console.log('Quotation is true');
      res.render('add_quatation', {
          title: 'add_quatation',
          user: req.user,
          message: res.locals.message
      }); 
     } else{ 
          res.send('<h2>User Name : [' +req.user.username + '] is not allowed to access Quotation Section!</h2>');
       }
  } else if(req.isAuthenticated() && (req.user.username == 'admin')){
      res.render('add_quatation', {
        title: 'add_quatation',
        user: req.user,
        message: res.locals.message
      });
  } else {
      res.redirect('/login')
  }
})


app.get('/corporate-quatation', (req, res) => {
  if (req.isAuthenticated() && (req.user.username !== 'admin')) {
    var access = new Array();
    access.push(req.user.access1);
    access.push(req.user.access2);
    access.push(req.user.access3);
    access.push(req.user.access4);
    access.push(req.user.access5);
    
    var bool = access.includes("quotation");
    if(bool == true){
      console.log('Quotation is true');
      res.render('corporate-quatation', {
          title: 'corporate-quatation',
          user: req.user,
          message: res.locals.message
      }); 
     } else{ 
          res.send('<h2>User Name : [' +req.user.username + '] is not allowed to access Quotation Section!</h2>');
       }
  } else if(req.isAuthenticated() && (req.user.username == 'admin')){
      res.render('corporate-quatation', {
        title: 'corporate-quatation',
        user: req.user,
        message: res.locals.message
      });
  } else {
      res.redirect('/login')
  }
})


app.get('/housing-quatation', (req, res) => {
  if (req.isAuthenticated() && (req.user.username !== 'admin')) {
    var access = new Array();
    access.push(req.user.access1);
    access.push(req.user.access2);
    access.push(req.user.access3);
    access.push(req.user.access4);
    access.push(req.user.access5);
    
    var bool = access.includes("quotation");
    if(bool == true){
      console.log('Quotation is true');
      res.render('housing-quatation', {
          title: 'housing-quatation',
          user: req.user,
          message: res.locals.message
      }); 
     } else{ 
          res.send('<h2>User Name : [' +req.user.username + '] is not allowed to access Quotation Section!</h2>');
       }
  } else if(req.isAuthenticated() && (req.user.username == 'admin')){
      res.render('housing-quatation', {
        title: 'housing-quatation',
        user: req.user,
        message: res.locals.message
      });
  } else {
      res.redirect('/login')
  }
})


var quatation_id;

app.get('/housing-quatation-view', (req, res) => {
  if (req.isAuthenticated() && (req.user.username !== 'admin')) {
    var access = new Array();
    access.push(req.user.access1);
    access.push(req.user.access2);
    access.push(req.user.access3);
    access.push(req.user.access4);
    access.push(req.user.access5);
    
    var bool = access.includes("quotation");
    if(bool == true){
      console.log('Quotation is true');

      var data = url.parse(req.url, true);
      data = data.query;
      quatation_id = data.quatation_id;
      console.log(quatation_id);

      res.render('housing-quatation-view', {
          title: 'housing-quatation-view',
          user: req.user,
          message: res.locals.message
      }); 
     } else{ 
          res.send('<h2>User Name : [' +req.user.username + '] is not allowed to access Quotation Section!</h2>');
       }
  } else if(req.isAuthenticated() && (req.user.username == 'admin')){

      var data = url.parse(req.url, true);
      data = data.query;
      quatation_id = data.quatation_id;
      console.log(quatation_id);

      res.render('housing-quatation-view', {
        title: 'housing-quatation-view',
        user: req.user,
        message: res.locals.message
      });
  } else {
      res.redirect('/login')
  }
})


app.get('/corporate-quatation-view', (req, res) => {
  if (req.isAuthenticated() && (req.user.username !== 'admin')) {
    var access = new Array();
    access.push(req.user.access1);
    access.push(req.user.access2);
    access.push(req.user.access3);
    access.push(req.user.access4);
    access.push(req.user.access5);
    
    var bool = access.includes("quotation");
    if(bool == true){
      console.log('Quotation is true');

      var data = url.parse(req.url, true);
      data = data.query;
      quatation_id = data.quatation_id;
      console.log(quatation_id);

      res.render('corporate-quatation-view', {
          title: 'corporate-quatation-view',
          user: req.user,
          message: res.locals.message
      }); 
     } else{ 
          res.send('<h2>User Name : [' +req.user.username + '] is not allowed to access Quotation Section!</h2>');
       }
  } else if(req.isAuthenticated() && (req.user.username == 'admin')){

      var data = url.parse(req.url, true);
      data = data.query;
      quatation_id = data.quatation_id;
      console.log(quatation_id);

      res.render('corporate-quatation-view', {
        title: 'corporate-quatation-view',
        user: req.user,
        message: res.locals.message
      });
  } else {
      res.redirect('/login')
  }
})


app.get('/finance', (req, res) => {
  if (req.isAuthenticated() && (req.user.username !== 'admin')) {
    var access = new Array();
    access.push(req.user.access1);
    access.push(req.user.access2);
    access.push(req.user.access3);
    access.push(req.user.access4);
    access.push(req.user.access5);
    
    var bool = access.includes("finance");
    if(bool == true){
      console.log('Finance is true');
      res.render('finance', {
          title: 'finance',
          user: req.user,
          message: res.locals.message
      }); 
     } else{ 
          res.send('<h2>User Name : [' +req.user.username + '] is not allowed to access finance Section!</h2>');
       }
  } else if(req.isAuthenticated() && (req.user.username == 'admin')){
      res.render('finance', {
        title: 'finance',
        user: req.user,
        message: res.locals.message
      });
  } else {
      res.redirect('/login')
  }
})


app.get('/acc_sum', (req, res) => {
  if (req.isAuthenticated() && (req.user.username !== 'admin')) {
    var access = new Array();
    access.push(req.user.access1);
    access.push(req.user.access2);
    access.push(req.user.access3);
    access.push(req.user.access4);
    access.push(req.user.access5);
    
    var bool = access.includes("total_account_summary");
    if(bool == true){
      console.log('Total Account Summary is true');
      res.render('acc_sum', {
          title: 'acc_sum',
          user: req.user,
          message: res.locals.message
      }); 
     } else{ 
          res.send('<h2>User Name : [' +req.user.username + '] is not allowed to access Total Account Summary Section!</h2>');
       }
  } else if(req.isAuthenticated() && (req.user.username == 'admin')){
      res.render('acc_sum', {
        title: 'acc_sum',
        user: req.user,
        message: res.locals.message
      });
  } else {
      res.redirect('/login')
  }
})


app.get('/acc_sum_2', (req, res) => {
  if (req.isAuthenticated() && (req.user.username !== 'admin')) {
    var access = new Array();
    access.push(req.user.access1);
    access.push(req.user.access2);
    access.push(req.user.access3);
    access.push(req.user.access4);
    access.push(req.user.access5);
    
    var bool = access.includes("total_account_summary");
    if(bool == true){
      console.log('Total Account Summary is true');
      res.render('acc_sum_2', {
          title: 'acc_sum_2',
          user: req.user,
          message: res.locals.message
      }); 
     } else{ 
          res.send('<h2>User Name : [' +req.user.username + '] is not allowed to access Total Account Summary Section!</h2>');
       }
  } else if(req.isAuthenticated() && (req.user.username == 'admin')){
      res.render('acc_sum_2', {
        title: 'acc_sum_2',
        user: req.user,
        message: res.locals.message
      });
  } else {
      res.redirect('/login')
  }
})


app.get('/acc_sum_3', (req, res) => {
  if (req.isAuthenticated() && (req.user.username !== 'admin')) {
    var access = new Array();
    access.push(req.user.access1);
    access.push(req.user.access2);
    access.push(req.user.access3);
    access.push(req.user.access4);
    access.push(req.user.access5);
    
    var bool = access.includes("total_account_summary");
    if(bool == true){
      console.log('Total Account Summary is true');
      res.render('acc_sum_3', {
          title: 'acc_sum_3',
          user: req.user,
          message: res.locals.message
      }); 
     } else{ 
          res.send('<h2>User Name : [' +req.user.username + '] is not allowed to access Total Account Summary Section!</h2>');
       }
  } else if(req.isAuthenticated() && (req.user.username == 'admin')){
      res.render('acc_sum_3', {
        title: 'acc_sum_3',
        user: req.user,
        message: res.locals.message
      });
  } else {
      res.redirect('/login')
  }
})


app.get("/profit_loss", (req, res) => {
  if(req.isAuthenticated() && (req.user.username == 'admin')){
    res.render('profit_loss', {
      title: 'profit_loss',
      user: req.user,
      message: res.locals.message
    });
  } else if(req.isAuthenticated() && (req.user.username !== 'admin')) {
    res.send('<h2>User Name : [' +req.user.username + '] is not allowed to access Profit/Loss Section!</h2>');
    
  } else{
    res.redirect('/login');
  }
});


//--------------------------APIs--------------------------------//

app.post("/addClient", async (req, res) => {
  let { name, phone, email, aadhaar, address } = req.body;
console.log(name, phone, email, aadhaar, address);

let errors = [];

if (!name || !phone || !email || !aadhaar || !address) {
  errors.push({ message: "Please enter all fields" });
}

console.log(errors);
if (errors.length > 0) {
  res.redirect("/add_client");
} else{
  // Validation passed
  
        pool.query(
          `INSERT INTO client (client_name, client_phone, client_email, client_aadhaar, client_address)
              VALUES ($1, $2, $3, $4, $5)`,
          [name, phone, email, aadhaar, address],
          (err, results) => {
            if (err) {
              throw err;
            }
            res.redirect("/add_client");
          }
        );
    }
});


app.get("/search_client/getdata", async (req, res) => {

  var data = url.parse(req.url, true);
  data = data.query;
  var name = data.name;
  var phone = data.phone;

  console.log(name, phone)

  name = "'%" + name + "%'";
  phone = "'%" + phone + "%'";
  pool.query(
   "select * from client where client_name like" + name +  "and  client_phone like" + phone,
  
     
  //    WHERE id = 1`,
  //  
    (err, results) => {
      if (err) {
        throw err;
      }
      let data = results.rows;

      console.log(data);
      
      res.send(data);
    }
  );
});



app.get("/client/remove", async (req, res) => {
  var data = url.parse(req.url, true);
  data = data.query;
  var id = data.id;
  
  
  pool.query(
    `delete from client where client_id = $1`,
    [id],
     
  //    WHERE id = 1`,
  //  
    (err, results) => {
      if (err) {
        throw err;
      }
      let data = results.rows;

      console.log(data);
      
      res.send();
    }
  );
});


app.post("/addEmployee", async (req, res) => {
  let { staff_ID, firstname, lastname, fatherName, phone, email, aadhaar, designation, joindate, address, totalSalary } = req.body;
console.log(staff_ID, firstname, lastname, fatherName, phone, email, aadhaar, designation, joindate, address, totalSalary);

let errors = [];

if (!staff_ID || !firstname || !lastname || !fatherName || !phone || !email || !aadhaar || !designation || !joindate || !address || !totalSalary) {
  errors.push({ message: "Please enter all fields" });
}

console.log(errors);
if (errors.length > 0) {
  res.redirect("/add_employee");
} else{
  // Validation passed
  
        pool.query(
          `INSERT INTO staff (staff_id, staff_fname, staff_lname, staff_fathername, staff_phone, staff_email, staff_aadhaar, staff_designation, staff_joindate, staff_address, staff_totalsalary)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [staff_ID, firstname, lastname, fatherName, phone, email, aadhaar, designation, joindate, address, totalSalary],
          (err, results) => {
            if (err) {
              throw err;
            }
            res.redirect("/add_employee");
          }
        );
    }
});



app.get("/search_staff/getdata", async (req, res) => {

  var data = url.parse(req.url, true);
  data = data.query;
  var staff_id = data.staff_id;
  var designation = data.staff_designation;

  console.log(staff_id, designation)

  staff_id = "'%" + staff_id + "%'";
  designation = "'%" + designation + "%'";
  pool.query(
   "select * from staff where staff_id like" + staff_id +  "and  staff_designation like" + designation,
  
     
  //    WHERE id = 1`,
  //  
    (err, results) => {
      if (err) {
        throw err;
      }
      let data = results.rows;

      console.log(data);
      
      res.send(data);
    }
  );
});


app.get("/staff/remove", async (req, res) => {
  var data = url.parse(req.url, true);
  data = data.query;
  var staff_id = data.staff_id;
  
  
  pool.query(
    `delete from staff where staff_id = $1`,
    [staff_id],
     
  //    WHERE id = 1`,
  //  
    (err, results) => {
      if (err) {
        throw err;
      }
      let data = results.rows;

      console.log(data);
      
      res.send();
    }
  );
});



//---------add data to view_project-> bill---------------//

app.get("/view_project/final_report/add_bill_data", async (req, res) => {

  //req.body = JSON.parse(JSON.stringify(req.body));
//
  //var item = new Array();
  //for (var key in req.body) {
  //  if (req.body.hasOwnProperty(key)) {
  //    item[key] = req.body[key];
  //    
  //  }
  //}
 //
//
  ////var sl_no = item.sl_no;
  //var desc = item.desc;
  //var hsn_sac = item.hsn_sac
  //var GST = item.GST;
  //var quantity = item.quantity;
  //var rate = item.rate;
  //var measurement = item.measurement;
  //var disc = item.disc;
  //var amount = item.amount;

  var data = url.parse(req.url, true);
  data = data.query;

  var desc = data.desc;
  var hsn_sac = data.hsn_sac;
  var GST = data.GST;
  var quantity = data.quantity;
  var measurement = data.measurement;
  var rate = data.rate;
  var disc = data.disc;
  var amount = data.amount;
  var gst_status;


//let { desc, hsn_sac, GST, quantity, measurement, rate, disc, amount } = req.body;

  
console.log(desc, hsn_sac, GST, quantity, measurement, rate, disc, amount);


let errors = [];

if ((!desc || !hsn_sac || !GST || !rate || !disc || !amount)||(!quantity && !measurement)) {
  errors.push({ message: "Please enter all fields" });
}

if(GST == "18"){
  gst_status = "gst"
}else{
  gst_status = "non_gst"
}

//for(i=0; i<desc.length; i++){
//  if(quantity[i] == undefined){
//    quantity[i] = 'N/A'
//  }
//
//  if(measurement[i] == undefined){
//    measurement[i] = 'N/A'
//  }
//}

console.log(errors);
if (errors.length > 0) {
  res.redirect("/view_project?project_id=" + project_id);
} else{
  // Validation passed
  var i = 0;
  var row_type = 'bill_data';
  //function recursion(){


        //pool.query(
        //  "insert into final_report (project_id, description, hsn_sac, gst, quantity, rate, measurement, disc, amount, row_type) values(" + "'" + project_id + "',"  + "'" + desc[i] + "'," + "'" + hsn_sac[i] + "'," + "'" + GST[i] + "'," + "'" + quantity[i] + "'," + "'"  + rate[i] + "'," + "'" + measurement[i] + "'," + "'" + disc[i] + "'," + amount[i] + ",'" + row_type + "')",
        //  (err, results) => {
        //    if (err) {
        //      throw err;
        //    }
//
        ////---------------------------
        //    i += 1;
        //    if(i < desc.length){
        //      recursion()
        //    }else{
        //      res.redirect("/view_project");
        //    }
        ////---------------------------    
        //  }
        //);

        pool.query(
          `insert into final_report (project_id, description, hsn_sac, gst, quantity, rate, measurement, disc, amount, row_type, gst_status) 
          values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, $11)`,
          [project_id, desc, hsn_sac, GST, quantity, rate, measurement, disc, amount, row_type, gst_status],

          (err, results) => {
            if (err) {
              throw err;
            }
            let data = results.rows;
      
            console.log(data);
            res.send();
            //res.redirect("/view_project?project_id=" + project_id);
          }
        );
      }

      //-------calling the recursion function---------//
      //recursion();
    //}
});


app.get("/view_project/final_report/billdata/getdata", async (req, res) => {
  console.log(project_id)

  pool.query(
   "select sl_no, description, hsn_sac, gst, quantity, rate, measurement, disc, amount from final_report where row_type = 'bill_data' and project_id = " + "'"+ project_id +"'" + "order by sl_no",
  
     
  //    WHERE id = 1`,
  //  
    (err, results) => {
      if (err) {
        throw err;
      }
      let data = results.rows;
      
      res.send(data);
    }
  );
});


app.get("/view_project/final_report/billdata/total_amount/getdata", async (req, res) => {

  pool.query(
   "select sum(Amount) as total_amount from final_report where row_type = 'bill_data' and project_id = " + "'"+ project_id +"'",
  
     
  //    WHERE id = 1`,
  //  
    (err, results) => {
      if (err) {
        throw err;
      }
      let data = results.rows;
      
      res.send(data);
    }
  );
});


//-------------------------------------------

app.post("/view_project/final_report/add_basic_requirements", async (req, res) => {


  //var data = url.parse(req.url, true);
  //data = data.query;
//
  //var client_details = data.client_details;
  //var ship_details = data.ship_details;
  //var invoice_number = data.invoice_number;
  //var invoice_date = data.invoice_date;
  //var delivery_note = data.delivery_note;
  //var mode_of_payment = data.mode_of_payment;
  //var ref_no_date = data.ref_no_date;
  //var other_ref = data.other_ref;
  //var buyer_order_no = data.buyer_order_no;
  //var order_date = data.order_date;
  //var dispatch_doc_no = data.dispatch_doc_no;
  //var delivery_note_date = data.delivery_note_date;
  //var dispatch_through = data.dispatch_through;
  //var destination = data.destination;
  //var terms_of_delivery = data.terms_of_delivery;



  let { client_details, ship_details, invoice_number, invoice_date, delivery_note, mode_of_payment, ref_no_date, other_ref, buyer_order_no, order_date, dispatch_doc_no, delivery_note_date, dispatch_through, destination, terms_of_delivery } = req.body;
console.log(client_details, ship_details, invoice_number, invoice_date, delivery_note, mode_of_payment, ref_no_date, other_ref, buyer_order_no, order_date, dispatch_doc_no, delivery_note_date, dispatch_through, destination, terms_of_delivery);

let errors = [];

if (!client_details || !ship_details || !invoice_number || !invoice_date || !delivery_note || !mode_of_payment || !ref_no_date || !other_ref || !buyer_order_no || !order_date || !dispatch_doc_no || !delivery_note_date || !dispatch_through || !destination || !terms_of_delivery) {
  errors.push({ message: "Please enter all fields" });
}

var row_type = 'description';
console.log(errors);
if (errors.length > 0) {
  res.redirect("/view_project?project_id=" + project_id);
} else{
  // Validation passed
  
        pool.query(
          `INSERT INTO final_report (client_details, ship_details, invoice_number, invoice_date, delivery_note, mode_of_payment, ref_no_date, other_reference, buyers_order_no, order_date, dispatch_doc_no, delivery_note_date, dispatched_through, destination, terms_of_delivery, row_type, project_id)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
          [client_details, ship_details, invoice_number, invoice_date, delivery_note, mode_of_payment, ref_no_date, other_ref, buyer_order_no, order_date, dispatch_doc_no, delivery_note_date, dispatch_through, destination, terms_of_delivery, row_type, project_id],
          (err, results) => {
            if (err) {
              throw err;
            }
            //res.send();
            res.redirect("/view_project?project_id=" + project_id);
          }
        );
    }
});


app.get("/view_project/final_report/description/getdata", async (req, res) => {

  pool.query(
   "select * from final_report where row_type =" + "'description'" + "and project_id = " + "'"+ project_id +"' order by sl_no desc",
  
     
  //    WHERE id = 1`,
  //  
    (err, results) => {
      if (err) {
        throw err;
      }
      let data = results.rows;
      
      res.send(data);
    }
  );
});

app.get("/view_project/final_report/hsn_sac/getdata", async (req, res) => {

  pool.query(
   "select sum(amount) as total, hsn_sac  from final_report where hsn_sac != 'null'" + "and project_id = " + "'"+ project_id +"'" + "and gst_status = 'gst'" + "group by hsn_sac",
  
     
  //    WHERE id = 1`,
  //  
    (err, results) => {
      if (err) {
        throw err;
      }
      let data = results.rows;
      
      res.send(data);
    }
  );
});


//----------------------add project------------------------//

app.post("/project/add_project", async (req, res) => {
  let { client_id, project_name, project_details } = req.body;
console.log(client_id, project_name, project_details);

//------------------date----------------------//
    
  
  // Date object initialized as per Indian (kolkata) timezone. Returns a datetime string
  let nz_date_string = new Date().toLocaleString("en-US", { timeZone: "Asia/Calcutta" });

  // Date object initialized from the above datetime string
  let date_nz = new Date(nz_date_string);

  // year as (YYYY) format
  let year = date_nz.getFullYear();

  // month as (MM) format
  let month = ("0" + (date_nz.getMonth() + 1)).slice(-2);

  // date as (DD) format
  let date = ("0" + date_nz.getDate()).slice(-2);

  // date as YYYY-MM-DD format
  let date_yyyy_mm_dd = year + "-" + month + "-" + date;

  // hours as (hh) format
  let hours = ("0" + date_nz.getHours()).slice(-2);

  // minutes as (mm) format
  let minutes = ("0" + date_nz.getMinutes()).slice(-2);

  // seconds as (ss) format
  let seconds = ("0" + date_nz.getSeconds()).slice(-2);

  // time as hh:mm:ss format
  let time_hh_mm_ss = hours + ":" + minutes + ":" + seconds;

var status = 'Ongoing';
var status_2 = 'active';

let errors = [];

if (!client_id || !project_name || !project_details) {
  errors.push({ message: "Please enter all fields" });
}

console.log(errors);
if (errors.length > 0) {
  res.redirect("/project");
} else{
  // Validation passed
  
        pool.query(
          `INSERT INTO project (client_id, project_name, project_Details, status, status_2)
              VALUES ($1, $2, $3, $4, $5)`,
          [client_id, project_name, project_details, status, status_2],
          (err, results) => {
            if (err) {
              throw err;
            }
            //res.redirect("/project");
            //-----------add to system history---------//

            var details = "Project created" ;
            var username  = req.user.username;
            var action_date = date_yyyy_mm_dd;
            var action_time = time_hh_mm_ss;


            pool.query(
              `INSERT INTO system_history (details, username, action_date, action_time)
              VALUES($1, $2, $3, $4)`,
              [details, username, action_date, action_time],
            
            
              (err, results) => {
                if (err) {
                  throw err;
                }
              
                res.redirect("/project");
                //res.send();
              }
            );
          }
        );
    }
});


app.get("/project/getdata", async (req, res) => {

  pool.query(

    //"select * from project order by project_id desc",

    `select project.project_id, project.project_name, project.project_details, project.status, client.client_name, client.client_id 
    FROM project
    INNER JOIN client 
    ON cast(client.client_id as varchar(200)) = project.client_id
    where project.status_2 = 'active'
    order by project_id desc`,
  
     
  //    WHERE id = 1`,
  //  
    (err, results) => {
      if (err) {
        throw err;
      }
      let data = results.rows;
      
      res.send(data);
    }
  );
});


app.get("/project/deactive", async (req, res) => {

  var data = url.parse(req.url, true);
  data = data.query;
  var project_id = data.project_id;

  console.log(project_id)

  pool.query(

    //"select * from project order by project_id desc",

    `update project set status = 'Completed'
     where project_id = $1`,
      [project_id],
     
  //    WHERE id = 1`,
  //  
    (err, results) => {
      if (err) {
        throw err;
      }
      
      
      res.send();
    }
  );
});

app.get("/project/active", async (req, res) => {

  var data = url.parse(req.url, true);
  data = data.query;
  var project_id = data.project_id;

  console.log(project_id)

  pool.query(

    //"select * from project order by project_id desc",

    `update project set status = 'Ongoing'
     where project_id = $1`,
      [project_id],
     
  //    WHERE id = 1`,
  //  
    (err, results) => {
      if (err) {
        throw err;
      }
      
      
      res.send();
    }
  );
});


app.get("/project/remove", async (req, res) => {

  var data = url.parse(req.url, true);
  data = data.query;
  var project_id = data.project_id;

  console.log(project_id)

  //------------------date----------------------//
    
  
  // Date object initialized as per Indian (kolkata) timezone. Returns a datetime string
  let nz_date_string = new Date().toLocaleString("en-US", { timeZone: "Asia/Calcutta" });

  // Date object initialized from the above datetime string
  let date_nz = new Date(nz_date_string);

  // year as (YYYY) format
  let year = date_nz.getFullYear();

  // month as (MM) format
  let month = ("0" + (date_nz.getMonth() + 1)).slice(-2);

  // date as (DD) format
  let date = ("0" + date_nz.getDate()).slice(-2);

  // date as YYYY-MM-DD format
  let date_yyyy_mm_dd = year + "-" + month + "-" + date;

  // hours as (hh) format
  let hours = ("0" + date_nz.getHours()).slice(-2);

  // minutes as (mm) format
  let minutes = ("0" + date_nz.getMinutes()).slice(-2);

  // seconds as (ss) format
  let seconds = ("0" + date_nz.getSeconds()).slice(-2);

  // time as hh:mm:ss format
  let time_hh_mm_ss = hours + ":" + minutes + ":" + seconds;

  pool.query(

    //"select * from project order by project_id desc",

    `update project set status_2 = 'deactive'
     where project_id = $1`,
      [project_id],
     
  //    WHERE id = 1`,
  //  
    (err, results) => {
      if (err) {
        throw err;
      }
      
      
      //res.send();
      //-----------add to system history---------//

      var details = "Project removed" ;
      var username  = req.user.username;
      var action_date = date_yyyy_mm_dd;
      var action_time = time_hh_mm_ss;


      pool.query(
        `INSERT INTO system_history (details, username, action_date, action_time)
        VALUES($1, $2, $3, $4)`,
        [details, username, action_date, action_time],
      
      
        (err, results) => {
          if (err) {
            throw err;
          }
        
          //res.redirect("/project");
          res.send();
        }
      );
    }
  );
});


app.get("/bin/project/getdata", async (req, res) => {

  pool.query(

    //"select * from project order by project_id desc",

    `select project.project_id, project.project_name, project.project_details, project.status, client.client_name, client.client_id 
    FROM project
    INNER JOIN client 
    ON cast(client.client_id as varchar(200)) = project.client_id
    where project.status_2 = 'deactive'
    order by project_id desc`,
  
     
  //    WHERE id = 1`,
  //  
    (err, results) => {
      if (err) {
        throw err;
      }
      let data = results.rows;
      
      res.send(data);
    }
  );
});


app.get("/project/restore", async (req, res) => {

  var data = url.parse(req.url, true);
  data = data.query;
  var project_id = data.project_id;

  console.log(project_id)

  //------------------date----------------------//
    
  
  // Date object initialized as per Indian (kolkata) timezone. Returns a datetime string
  let nz_date_string = new Date().toLocaleString("en-US", { timeZone: "Asia/Calcutta" });

  // Date object initialized from the above datetime string
  let date_nz = new Date(nz_date_string);

  // year as (YYYY) format
  let year = date_nz.getFullYear();

  // month as (MM) format
  let month = ("0" + (date_nz.getMonth() + 1)).slice(-2);

  // date as (DD) format
  let date = ("0" + date_nz.getDate()).slice(-2);

  // date as YYYY-MM-DD format
  let date_yyyy_mm_dd = year + "-" + month + "-" + date;

  // hours as (hh) format
  let hours = ("0" + date_nz.getHours()).slice(-2);

  // minutes as (mm) format
  let minutes = ("0" + date_nz.getMinutes()).slice(-2);

  // seconds as (ss) format
  let seconds = ("0" + date_nz.getSeconds()).slice(-2);

  // time as hh:mm:ss format
  let time_hh_mm_ss = hours + ":" + minutes + ":" + seconds;

  pool.query(

    //"select * from project order by project_id desc",

    `update project set status_2 = 'active'
     where project_id = $1`,
      [project_id],
     
  //    WHERE id = 1`,
  //  
    (err, results) => {
      if (err) {
        throw err;
      }
      
      
      //res.send();
      
//-----------add to system history---------//

var details = "Project restored" ;
var username  = req.user.username;
var action_date = date_yyyy_mm_dd;
var action_time = time_hh_mm_ss;


pool.query(
  `INSERT INTO system_history (details, username, action_date, action_time)
  VALUES($1, $2, $3, $4)`,
  [details, username, action_date, action_time],


  (err, results) => {
    if (err) {
      throw err;
    }
  
    //res.redirect("/project");
    res.send();
  }
);
    }
  );
});

app.get("/project/delete", async (req, res) => {

  var data = url.parse(req.url, true);
  data = data.query;
  var project_id = data.project_id;

  console.log(project_id)

  //------------------date----------------------//
    
  
  // Date object initialized as per Indian (kolkata) timezone. Returns a datetime string
  let nz_date_string = new Date().toLocaleString("en-US", { timeZone: "Asia/Calcutta" });

  // Date object initialized from the above datetime string
  let date_nz = new Date(nz_date_string);

  // year as (YYYY) format
  let year = date_nz.getFullYear();

  // month as (MM) format
  let month = ("0" + (date_nz.getMonth() + 1)).slice(-2);

  // date as (DD) format
  let date = ("0" + date_nz.getDate()).slice(-2);

  // date as YYYY-MM-DD format
  let date_yyyy_mm_dd = year + "-" + month + "-" + date;

  // hours as (hh) format
  let hours = ("0" + date_nz.getHours()).slice(-2);

  // minutes as (mm) format
  let minutes = ("0" + date_nz.getMinutes()).slice(-2);

  // seconds as (ss) format
  let seconds = ("0" + date_nz.getSeconds()).slice(-2);

  // time as hh:mm:ss format
  let time_hh_mm_ss = hours + ":" + minutes + ":" + seconds;

  pool.query(

    //"select * from project order by project_id desc",

    `delete from project
     where project_id = $1`,
      [project_id],
     
  //    WHERE id = 1`,
  //  
    (err, results) => {
      if (err) {
        throw err;
      }
      
      
      //res.send();
      //-----------add to system history---------//

      var details = "Project deleted" ;
      var username  = req.user.username;
      var action_date = date_yyyy_mm_dd;
      var action_time = time_hh_mm_ss;


      pool.query(
        `INSERT INTO system_history (details, username, action_date, action_time)
        VALUES($1, $2, $3, $4)`,
        [details, username, action_date, action_time],
      
      
        (err, results) => {
          if (err) {
            throw err;
          }
        
          //res.redirect("/project");
          res.send();
        }
      );
    }
  );
});

//---------------------------ritam-----------------------------------//

app.post("/addmaterial", async (req, res) => {
  let { client_id, metarials } = req.body;
console.log(client_id, metarials);

let errors = [];

if (!client_id || !metarials) {
  errors.push({ message: "Please enter all fields" });
}

console.log(errors);
if (errors.length > 0) {
  res.render("add_quatation", { errors, client_id, metarials });
} else{
  // Validation passed
  
        pool.query(
          `INSERT INTO specification_metarials (client_id, specification_metarials)
              VALUES ($1, $2)`,
          [client_id, metarials],
          (err, results) => {
            if (err) {
              throw err;
            }
            res.redirect("/add_quatation");
          }
        );
    }
});

app.post("/addtermsandconditions", async (req, res) => {
  let { client_id, terms } = req.body;
console.log(client_id, terms);

let errors = [];

if (!client_id || !terms) {
  errors.push({ message: "Please enter all fields" });
}

console.log(errors);
if (errors.length > 0) {
  res.render("add_quatation", { errors, client_id, terms });
} else{
  // Validation passed
  
        pool.query(
          `INSERT INTO terms (client_id, terms)
              VALUES ($1, $2)`,
          [client_id, terms],
          (err, results) => {
            if (err) {
              throw err;
            }
            res.redirect("/add_quatation");
          }
        );
    }
});

//--------------------------------------------------------------------------//





//-----------------------------housing quotation start------------------------------//

app.post("/housing/add", async (req, res) => {

  let { client_id, heading, specification_metarials, terms } = req.body;

  //req.body = JSON.parse(JSON.stringify(req.body));
//
  //var item = new Array();
  //for (var key in req.body) {
  //  if (req.body.hasOwnProperty(key)) {
  //    item[key] = req.body[key];
  //    
  //  }
  //}
 

  //var sl_no = item.sl_no;
  //var perticulars = item.perticulars;
  //var measurement = item.measurement;
  //var sq_ft = item.sq_ft;
  //var amount = item.amount;

   //------------------date----------------------//
    
  
  // Date object initialized as per Indian (kolkata) timezone. Returns a datetime string
  let nz_date_string = new Date().toLocaleString("en-US", { timeZone: "Asia/Calcutta" });

  // Date object initialized from the above datetime string
  let date_nz = new Date(nz_date_string);

  // year as (YYYY) format
  let year = date_nz.getFullYear();

  // month as (MM) format
  let month = ("0" + (date_nz.getMonth() + 1)).slice(-2);

  // date as (DD) format
  let date = ("0" + date_nz.getDate()).slice(-2);

  // date as YYYY-MM-DD format
  let date_yyyy_mm_dd = year + "-" + month + "-" + date;

  // hours as (hh) format
  let hours = ("0" + date_nz.getHours()).slice(-2);

  // minutes as (mm) format
  let minutes = ("0" + date_nz.getMinutes()).slice(-2);

  // seconds as (ss) format
  let seconds = ("0" + date_nz.getSeconds()).slice(-2);

  // time as hh:mm:ss format
  let time_hh_mm_ss = hours + ":" + minutes + ":" + seconds;


//console.log(client_id, heading, sl_no, perticulars, measurement, sq_ft, amount);
console.log(client_id, heading, specification_metarials, terms);

let errors = [];

//if (!client_id || !heading || !sl_no || !perticulars || !measurement || !sq_ft || !amount) {
//  errors.push({ message: "Please enter all fields" });
//}

if (!client_id || !heading || !specification_metarials || !terms) {
  errors.push({ message: "Please enter all fields" });
}

var status = 'active'

console.log(errors);
if (errors.length > 0) {
  res.redirect("/add_quatation");
} else{
  // Validation passed
    pool.query(
      `INSERT INTO housing_quatation (client_id, quatation_heading, specification_metarials, terms, status)
          VALUES ($1, $2, $3, $4, $5)`,
         // returning quatation_id`,
      [client_id, heading, specification_metarials, terms, status],
      (err, results) => {
        if (err) {
          throw err;
        }
        //res.redirect("/add_quatation");
        //var data = results.rows;
        //var quatation_id = "'" + data[0].quatation_id + "'";

        //var i = 0;

      //function recursion(){
  //
      //  pool.query(
      //    "INSERT INTO housing_quatation (sl_no, perticulars, measurement, sq_ft, amount, quatation_id) values(" + "'" + sl_no[i] + "'," + "'" + perticulars[i] + "'," + "'" + measurement[i] + "'," + "'"  + sq_ft[i] + "'," + "'" + amount[i] + "'," +  quatation_id + ")",
      //   
      //    (err, results) => {
      //      if (err) {
      //        throw err;
      //      }
      //      //res.redirect("/add_quatation");
      //      //---------------------------
      //          i += 1;
      //          if(i < sl_no.length){
      //            recursion()
      //          }else{
      //            res.redirect("/add_quatation");
      //          }
      //      //---------------------------    
      //    }
      //  );
      //}
      //-------------calling the func----------------//
        //recursion();
      //---------------------------------------------//
        //res.redirect("/add_quatation");
        //-----------add to system history---------//

        var details = "Housing quotation created" ;
        var username  = req.user.username;
        var action_date = date_yyyy_mm_dd;
        var action_time = time_hh_mm_ss;


        pool.query(
          `INSERT INTO system_history (details, username, action_date, action_time)
          VALUES($1, $2, $3, $4)`,
          [details, username, action_date, action_time],
        
        
          (err, results) => {
            if (err) {
              throw err;
            }
          
            res.redirect("/add_quatation");
            //res.send();
          }
        );
      }
    );

      
    }
});





app.post("/housing/add_items", async (req, res) => {

  let { heading } = req.body;

  req.body = JSON.parse(JSON.stringify(req.body));

  var item = new Array();
  for (var key in req.body) {
    if (req.body.hasOwnProperty(key)) {
      item[key] = req.body[key];
      
    }
  }
 

  //var sl_no = item.sl_no;
  var perticulars = item.perticulars;
  var measurement = item.measurement;
  var sq_ft = item.sq_ft;
  var rate_per_sq_ft = item.rate_per_sq_ft;
  var gst = item.gst;
  var amount = item.amount;


console.log(heading, perticulars, measurement, sq_ft, rate_per_sq_ft, gst, amount);

let errors = [];

if (!heading || !perticulars) {
  errors.push({ message: "Please enter all fields" });
}

console.log(errors);
if (errors.length > 0) {
  res.redirect("/housing-quatation-view?quatation_id=" + quatation_id);
} else{
  // Validation passed
  //var quatation_id = 9;
    pool.query(
      `INSERT INTO housing_quatation (heading, quatation_id)
          VALUES ($1, $2)`,
          //returning subgroup`,
      [heading, quatation_id],
      (err, results) => {
        if (err) {
          throw err;
        }
        //res.redirect("/add_quatation");
        //var data = results.rows;
        //var subgroup = "'" + data[0].subgroup + "'";

        var i = 0;

        var measurement_str = '';

      function recursion(){

        if(!measurement[i]){
          measurement_str = 0;
        }else{
          measurement_str = measurement[i];
          measurement_str = measurement_str.replace(/'/g, '_');
          measurement_str = measurement_str.replace(/"/g, '__');
          console.log(measurement_str);
        }
        if(!sq_ft[i]){
          sq_ft[i] = 0;
        }
        if(!rate_per_sq_ft[i]){
          rate_per_sq_ft[i] = 0;
        }
        if(!gst[i]){
          gst[i] = 0;
        }
        if(!amount[i]){
          amount[i] = 0;
        }

  
        pool.query(
          "INSERT INTO housing_quatation (sl_no, perticulars, measurement, sq_ft, rate_per_sq_ft, gst, amount, quatation_id) values(" + "'" + (i+1) + "'," + "'" + perticulars[i] + "'," + "'" + measurement_str + "'," + "'"  + sq_ft[i] + "'," + "'"  + rate_per_sq_ft[i] + "'," + "'"  + gst[i] + "'," + "'" + amount[i] + "'," +  quatation_id + ")",
         
          (err, results) => {
            if (err) {
              throw err;
            }
            //res.redirect("/add_quatation");
            //---------------------------
                i += 1;
                if(i < perticulars.length){
                  recursion()
                }else{
                  res.redirect("/housing-quatation-view?quatation_id=" + quatation_id);
                }
            //---------------------------    
          }
        );
      }
      //-------------calling the func----------------//
        recursion();
      //---------------------------------------------//
      }
    );

      
    }
});



app.get("/housing-quatation/getdata", async (req, res) => {

  pool.query(
   "select * from housing_quatation where quatation_id =" + "'" + quatation_id + "'" + "and quatation_heading is null order by id",
   //"order by quatation_id desc",
  
     
  //    WHERE id = 1`,
  //  
    (err, results) => {
      if (err) {
        throw err;
      }
      let data = results.rows;
      
      res.send(data);
    }
  );
});


app.get("/housing-quatation-list/getdata", async (req, res) => {

  pool.query(
   "select quatation_id, client_id, quatation_heading from  housing_quatation where quatation_heading is not null and status = 'active' group by quatation_id, client_id, quatation_heading order by quatation_id desc",
   //"order by quatation_id desc",
  
     
  //    WHERE id = 1`,
  //  
    (err, results) => {
      if (err) {
        throw err;
      }
      let data = results.rows;
      
      res.send(data);
    }
  );
});


app.get("/housing-quatation/spec_terms/getdata", async (req, res) => {

  pool.query(
    "select quatation_heading, specification_metarials, terms, client_id from  housing_quatation where quatation_heading is not null and quatation_id = " + quatation_id + "order by quatation_id desc",
   //"order by quatation_id desc",
  
     
  //    WHERE id = 1`,
  //  
    (err, results) => {
      if (err) {
        throw err;
      }
      let data = results.rows;

      client_id = data[0].client_id;
      
      res.send(data);
    }
  );
});

//------------------------------------------------------------------------//

app.get("/quatation/client_data/getdata", async (req, res) => {

  console.log(client_id)

  pool.query(
    "select * from client where client_id = " + client_id,
   //"order by quatation_id desc",
  
     
  //    WHERE id = 1`,
  //  
    (err, results) => {
      if (err) {
        throw err;
      }
      let data = results.rows;
      
      res.send(data);
    }
  );
});


//-----------------------------corporate quotation start-----------------------//



app.post("/corporate/add", async (req, res) => {

  let { client_id2, heading2, specification_metarials2, terms2 } = req.body;

  //req.body = JSON.parse(JSON.stringify(req.body));
//
  //var item = new Array();
  //for (var key in req.body) {
  //  if (req.body.hasOwnProperty(key)) {
  //    item[key] = req.body[key];
  //    
  //  }
  //}
 

  //var sl_no = item.sl_no;
  //var perticulars = item.perticulars;
  //var measurement = item.measurement;
  //var sq_ft = item.sq_ft;
  //var amount = item.amount;


//console.log(client_id, heading, sl_no, perticulars, measurement, sq_ft, amount);
console.log(client_id2, heading2, specification_metarials2, terms2);

//------------------date----------------------//
    
  
  // Date object initialized as per Indian (kolkata) timezone. Returns a datetime string
  let nz_date_string = new Date().toLocaleString("en-US", { timeZone: "Asia/Calcutta" });

  // Date object initialized from the above datetime string
  let date_nz = new Date(nz_date_string);

  // year as (YYYY) format
  let year = date_nz.getFullYear();

  // month as (MM) format
  let month = ("0" + (date_nz.getMonth() + 1)).slice(-2);

  // date as (DD) format
  let date = ("0" + date_nz.getDate()).slice(-2);

  // date as YYYY-MM-DD format
  let date_yyyy_mm_dd = year + "-" + month + "-" + date;

  // hours as (hh) format
  let hours = ("0" + date_nz.getHours()).slice(-2);

  // minutes as (mm) format
  let minutes = ("0" + date_nz.getMinutes()).slice(-2);

  // seconds as (ss) format
  let seconds = ("0" + date_nz.getSeconds()).slice(-2);

  // time as hh:mm:ss format
  let time_hh_mm_ss = hours + ":" + minutes + ":" + seconds;


let errors = [];

//if (!client_id || !heading || !sl_no || !perticulars || !measurement || !sq_ft || !amount) {
//  errors.push({ message: "Please enter all fields" });
//}

if (!client_id2 || !heading2 || !specification_metarials2 || !terms2) {
  errors.push({ message: "Please enter all fields" });
}

var status = 'active';

console.log(errors);
if (errors.length > 0) {
  res.redirect("/add_quatation");
} else{
  // Validation passed
    pool.query(
      `INSERT INTO corporate_quatation (client_id, quatation_heading, specification_metarials, terms, status)
          VALUES ($1, $2, $3, $4, $5)`,
         // returning quatation_id`,
      [client_id2, heading2, specification_metarials2, terms2, status],
      (err, results) => {
        if (err) {
          throw err;
        }
        //res.redirect("/add_quatation");
        //var data = results.rows;
        //var quatation_id = "'" + data[0].quatation_id + "'";

        //var i = 0;

      //function recursion(){
  //
      //  pool.query(
      //    "INSERT INTO housing_quatation (sl_no, perticulars, measurement, sq_ft, amount, quatation_id) values(" + "'" + sl_no[i] + "'," + "'" + perticulars[i] + "'," + "'" + measurement[i] + "'," + "'"  + sq_ft[i] + "'," + "'" + amount[i] + "'," +  quatation_id + ")",
      //   
      //    (err, results) => {
      //      if (err) {
      //        throw err;
      //      }
      //      //res.redirect("/add_quatation");
      //      //---------------------------
      //          i += 1;
      //          if(i < sl_no.length){
      //            recursion()
      //          }else{
      //            res.redirect("/add_quatation");
      //          }
      //      //---------------------------    
      //    }
      //  );
      //}
      //-------------calling the func----------------//
        //recursion();
      //---------------------------------------------//
        //res.redirect("/add_quatation");

        //-----------add to system history---------//

        var details = "Corporate quotation created" ;
        var username  = req.user.username;
        var action_date = date_yyyy_mm_dd;
        var action_time = time_hh_mm_ss;


        pool.query(
          `INSERT INTO system_history (details, username, action_date, action_time)
          VALUES($1, $2, $3, $4)`,
          [details, username, action_date, action_time],
        
        
          (err, results) => {
            if (err) {
              throw err;
            }
          
            res.redirect("/add_quatation");
            //res.send();
          }
        );
        
      }
    );

      
    }
});





app.post("/corporate/add_items", async (req, res) => {

  let { heading, sl_no, desc, unit, quantity, rate, amount } = req.body;

  
  console.log(heading, sl_no, desc, unit, quantity, rate, amount);

  let errors = [];

  //if (!heading || !desc || !unit || !quantity || !rate || !amount) {
  //  errors.push({ message: "Please enter all fields" });
  //}
  if (!heading || !desc || !sl_no) {
    errors.push({ message: "Please enter all fields" });
  }

  if(!unit){
    unit = 'na';
  }
  if(!quantity){
    quantity = 0;
  }
  if(!rate){
    rate = 0;
  }
  if(!amount){
    amount = 0;
  }

  console.log(errors);
  if (errors.length > 0) {
    res.redirect("/corporate-quatation-view?quatation_id=" + quatation_id);
  } else{
    
     
          pool.query(
            `INSERT INTO corporate_quatation (heading, quatation_id, sl_no, description, unit, quantity, rate, amount)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                //returning subgroup`,
            [heading, quatation_id, sl_no, desc, unit, quantity, rate, amount],
            (err, results) => {
              if (err) {
                throw err;
              }
            
              
              res.redirect("/corporate-quatation-view?quatation_id=" + quatation_id);
            
            }
          );
        
      
      
    }
});



app.get("/corporate-quatation/getdata", async (req, res) => {

  pool.query(
   "select * from corporate_quatation where quatation_id =" + "'" + quatation_id + "'" + "and quatation_heading is null order by id",
   //"order by quatation_id desc",
  
     
  //    WHERE id = 1`,
  //  
    (err, results) => {
      if (err) {
        throw err;
      }
      let data = results.rows;
      
      res.send(data);
    }
  );
});


app.get("/corporate-quatation-list/getdata", async (req, res) => {

  pool.query(
   "select quatation_id, client_id, quatation_heading from  corporate_quatation where quatation_heading is not null and status = 'active' group by quatation_id, client_id, quatation_heading order by quatation_id desc",
   //"order by quatation_id desc",
  
     
  //    WHERE id = 1`,
  //  
    (err, results) => {
      if (err) {
        throw err;
      }
      let data = results.rows;
      
      res.send(data);
    }
  );
});


app.get("/corporate-quatation/spec_terms/getdata", async (req, res) => {

  pool.query(
    "select quatation_heading, specification_metarials, terms, client_id from  corporate_quatation where quatation_heading is not null and quatation_id = " + quatation_id + "order by quatation_id desc",
   //"order by quatation_id desc",
  
     
  //    WHERE id = 1`,
  //  
    (err, results) => {
      if (err) {
        throw err;
      }
      let data = results.rows;

      client_id = data[0].client_id;
      
      res.send(data);
    }
  );
});



//---------------------pay by client-------------------------//

app.get("/pay_by_client/add", async (req, res) => {

  var data = url.parse(req.url, true);
  data = data.query;
  var amount = data.amount;
  //var benificiary_name = data.benificiary_name;
  var transaction_mode = data.transaction_mode;
  var cheque_number = data.cheque_number;
  var transaction_id = data.transaction_id;
  var purpose = data.purpose;

//let { amount, transaction_mode, cheque_number, transaction_id, purpose } = req.body;

//------------------date----------------------//
    
    // Date object initialized as per Indian (kolkata) timezone. Returns a datetime string
    let nz_date_string = new Date().toLocaleString("en-US", { timeZone: "Asia/Calcutta" });
  
    // Date object initialized from the above datetime string
    let date_nz = new Date(nz_date_string);
  
    // year as (YYYY) format
    let year = date_nz.getFullYear();
  
    // month as (MM) format
    let month = ("0" + (date_nz.getMonth() + 1)).slice(-2);
  
    // date as (DD) format
    let date = ("0" + date_nz.getDate()).slice(-2);
  
    // date as YYYY-MM-DD format
    let date_yyyy_mm_dd = year + "-" + month + "-" + date;
  
    // hours as (hh) format
    let hours = ("0" + date_nz.getHours()).slice(-2);
  
    // minutes as (mm) format
    let minutes = ("0" + date_nz.getMinutes()).slice(-2);
  
    // seconds as (ss) format
    let seconds = ("0" + date_nz.getSeconds()).slice(-2);
  
    // time as hh:mm:ss format
    let time_hh_mm_ss = hours + ":" + minutes + ":" + seconds;
  //--------------------------------------------------------------//

console.log(amount, transaction_mode, cheque_number, transaction_id, purpose, date_yyyy_mm_dd);

let errors = [];



if (!amount || !transaction_mode || !purpose) {
  errors.push({ message: "Please enter all fields" });
}

console.log(errors);
if (errors.length > 0) {
  res.redirect("/view_project?project_id=" + project_id + "&client_id=" + client_id);
} else{
  // Validation passed
    pool.query(
      `INSERT INTO pay_by_client (project_id, client_id, amount, transaction_mode, checque_no, transaction_id, Purpose, transaction_date)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
         // returning quatation_id`,
      [project_id, client_id, amount, transaction_mode, cheque_number, transaction_id, purpose, date_yyyy_mm_dd],
      (err, results) => {
        if (err) {
          throw err;
        }

        var amount_2 = 0;

        pool.query(
          `INSERT INTO daily_expenses (project_id, amount)
              VALUES ($1, $2)`,
             // returning quatation_id`,
          [project_id, amount_2],
          (err, results) => {
            if (err) {
              throw err;
            }

              var credit = new Number();
              var debit = new Number();
              var transaction_type = 'credit'
              
              credit = amount;
              pool.query(
                `INSERT INTO cashbook (project_id, credit, debit, transaction_type, transaction_method, cheque_number, transaction_id, purpose, transaction_date, transaction_time)
                  VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                  [project_id, credit, debit, transaction_type, transaction_mode, cheque_number, transaction_id, purpose, date_yyyy_mm_dd, time_hh_mm_ss],
                   // returning quatation_id`,
                
                (err, results) => {
                  if (err) {
                    throw err;
                  }
                  
                  
                  //res.redirect("/view_project?project_id=" + project_id + "&client_id=" + client_id);
                }
              );
            
            //res.redirect("/view_project?project_id=" + project_id + "&client_id=" + client_id);
          }
        );
        //-----------add to system history---------//

        var details = "Pay By Client" ;
        var username  = req.user.username;
        var action_date = date_yyyy_mm_dd;
        var action_time = time_hh_mm_ss; 

        pool.query(
          `INSERT INTO system_history (details, username, action_date, action_time)
          VALUES($1, $2, $3, $4)`,
          [details, username, action_date, action_time],
        
        
          (err, results) => {
            if (err) {
              throw err;
            }
          
            //res.redirect("/finance");
            res.redirect("/view_project?project_id=" + project_id + "&client_id=" + client_id);
          }
        );
        //res.redirect("/view_project?project_id=" + project_id + "&client_id=" + client_id);
      }
    );

      
    }
});


app.get("/pay_by_client/view/list", async (req, res) => {

  pool.query(
    `select * from pay_by_client where project_id = $1 and amount != 0 order by id desc`,
    [project_id],
   //"order by quatation_id desc",
  
     
  //    WHERE id = 1`,
  //  
    (err, results) => {
      if (err) {
        throw err;
      }
      let data = results.rows;
      
      res.send(data);
    }
  );
});

var pay_by_client_ID;

app.get("/pay_by_client/view/list/select", async (req, res) => {

  var data = url.parse(req.url, true);
  data = data.query;
  pay_by_client_ID = data.id;
 
  console.log(pay_by_client_ID)
      
  res.send();
    
});

app.get("/pay_by_client/view/getdata", async (req, res) => {

  pool.query(
    `select * from pay_by_client where id = $1 order by id desc`,
    [pay_by_client_ID],
   //"order by quatation_id desc",
  
     
  //    WHERE id = 1`,
  //  
    (err, results) => {
      if (err) {
        throw err;
      }
      let data = results.rows;
      
      res.send(data);
    }
  );
});


app.get("/pay_by_client/bill_no", async (req, res) => {

  pool.query(
    `insert into bill_no(client_id) values($1)
    returning id`,
    [client_id],
   //"order by quatation_id desc",
  
     
  //    WHERE id = 1`,
  //  
    (err, results) => {
      if (err) {
        throw err;
      }
      let data = results.rows;
      
      res.send(data);
    }
  );
});



//-----------------------Daily Expenses-------------------------//


app.get("/daily_expenses/add", async (req, res) => {
  var data = url.parse(req.url, true);
  data = data.query;
  var amount = data.amount;
  var benificiary_name = data.benificiary_name;
  var transaction_mode = data.transaction_mode;
  var cheque_number = data.cheque_number;
  var transaction_id = data.transaction_id;
  var purpose = data.purpose;

  //let { benificiary_name, amount, transaction_mode, cheque_number, transaction_id, purpose } = req.body;
  

  //------------------date----------------------//
    
    // Date object initialized as per Indian (kolkata) timezone. Returns a datetime string
    let nz_date_string = new Date().toLocaleString("en-US", { timeZone: "Asia/Calcutta" });
  
    // Date object initialized from the above datetime string
    let date_nz = new Date(nz_date_string);
  
    // year as (YYYY) format
    let year = date_nz.getFullYear();
  
    // month as (MM) format
    let month = ("0" + (date_nz.getMonth() + 1)).slice(-2);
  
    // date as (DD) format
    let date = ("0" + date_nz.getDate()).slice(-2);
  
    // date as YYYY-MM-DD format
    let date_yyyy_mm_dd = year + "-" + month + "-" + date;
  
    // hours as (hh) format
    let hours = ("0" + date_nz.getHours()).slice(-2);
  
    // minutes as (mm) format
    let minutes = ("0" + date_nz.getMinutes()).slice(-2);
  
    // seconds as (ss) format
    let seconds = ("0" + date_nz.getSeconds()).slice(-2);
  
    // time as hh:mm:ss format
    let time_hh_mm_ss = hours + ":" + minutes + ":" + seconds;
  //--------------------------------------------//
  
  
  console.log(benificiary_name, amount, transaction_mode, cheque_number, transaction_id, purpose);
  
  let errors = [];
  
  
  
  if (!benificiary_name || !amount || !transaction_mode || !purpose) {
    errors.push({ message: "Please enter all fields" });
  }
  
  console.log(errors);
  if (errors.length > 0) {
    res.redirect("/view_project?project_id=" + project_id + "&client_id=" + client_id);
  } else{
    // Validation passed
      pool.query(
        `INSERT INTO daily_expenses (project_id, client_id, benificiary_name, amount, transaction_mode, checque_no, transaction_id, Purpose, transaction_date)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
           // returning quatation_id`,
        [project_id, client_id, benificiary_name, amount, transaction_mode, cheque_number, transaction_id, purpose, date_yyyy_mm_dd],
        (err, results) => {
          if (err) {
            throw err;
          }

          var amount_2 = 0;

          pool.query(
            `INSERT INTO pay_by_client (project_id, amount)
                VALUES ($1, $2)`,
               // returning quatation_id`,
            [project_id, amount_2],
            (err, results) => {
              if (err) {
                throw err;
              }
              var credit = new Number();
              var debit = amount;
              var transaction_type = 'debit'

              //debit = amount;
              pool.query(
                `INSERT INTO cashbook (project_id, benificiary_name, credit, debit, transaction_type, transaction_method, cheque_number, transaction_id, purpose, transaction_date, transaction_time)
                  VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
                  [project_id, benificiary_name, credit, debit, transaction_type, transaction_mode, cheque_number, transaction_id, purpose, date_yyyy_mm_dd, time_hh_mm_ss],
                   // returning quatation_id`,
               
                (err, results) => {
                  if (err) {
                    throw err;
                  }
                  
                  //res.send()
                  //res.redirect("/view_project?project_id=" + project_id + "&client_id=" + client_id);
                }
              );
              
              
              //res.redirect("/view_project?project_id=" + project_id + "&client_id=" + client_id);
            }
          );
          //-----------add to system history---------//

        var details = "Add on daily expense" ;
        var username  = req.user.username;
        var action_date = date_yyyy_mm_dd;
        var action_time = time_hh_mm_ss; 

        pool.query(
          `INSERT INTO system_history (details, username, action_date, action_time)
          VALUES($1, $2, $3, $4)`,
          [details, username, action_date, action_time],
        
        
          (err, results) => {
            if (err) {
              throw err;
            }
          
            //res.redirect("/finance");
            res.send()
          }
        );
          //res.redirect("/view_project?project_id=" + project_id + "&client_id=" + client_id);
        }
      );
  
        
      }
  });
  
  
  app.get("/daily_expenses/view/list", async (req, res) => {
  
    pool.query(
      `select * from daily_expenses where project_id = $1 and amount != 0 order by id desc`,
      [project_id],
     //"order by quatation_id desc",
    
       
    //    WHERE id = 1`,
    //  
      (err, results) => {
        if (err) {
          throw err;
        }
        let data = results.rows;
        
        res.send(data);
      }
    );
  });
  
  var daily_expenses_ID;
  
  app.get("/daily_expenses/view/list/select", async (req, res) => {
  
    var data = url.parse(req.url, true);
    data = data.query;
    daily_expenses_ID = data.id;
   
    console.log(daily_expenses_ID)
        
    res.send();
      
  });
  
  app.get("/daily_expenses/view/getdata", async (req, res) => {
  
    pool.query(
      `select * from daily_expenses where id = $1 order by id desc`,
      [daily_expenses_ID],
     //"order by quatation_id desc",
    
       
    //    WHERE id = 1`,
    //  
      (err, results) => {
        if (err) {
          throw err;
        }
        let data = results.rows;
        
        res.send(data);
      }
    );
  });
  
  
  app.get("/daily_expenses/bill_no", async (req, res) => {
  
    pool.query(
      `insert into bill_no(client_id) values($1)
      returning id`,
      [client_id],
     //"order by quatation_id desc",
    
       
    //    WHERE id = 1`,
    //  
      (err, results) => {
        if (err) {
          throw err;
        }
        let data = results.rows;
        
        res.send(data);
      }
    );
  });



  //--------------------work report------------------//

  app.post("/project/work_report/add", async (req, res) => {

  let { date, work_done, pending_work, next_day_plan, days_required, days_left } = req.body;
  
    
  console.log(date, work_done, pending_work, next_day_plan, days_required, days_left);
  
  let errors = [];
  
  if (!date || !work_done || !pending_work || !next_day_plan || !days_required || !days_left) {
    errors.push({ message: "Please enter all fields" });
  }
  
  console.log(errors);
  if (errors.length > 0) {
    res.redirect("/view_project?project_id=" + project_id + "&client_id=" + client_id);
  } else{
    // Validation passed
    
  
      pool.query(
        `INSERT INTO corporate_quatation (heading, quatation_id, sl_no, description, unit, quantity, rate, amount)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            
        [heading, quatation_id, sl_no, desc, unit, quantity, rate, amount],
        (err, results) => {
          if (err) {
            throw err;
          }
          
          res.redirect("/view_project?project_id=" + project_id + "&client_id=" + client_id);
        
        }
      );
    }
  });



  //-----------------------finance------------------------//

  app.post("/finance/add", async (req, res) => {

    //------------------date----------------------//
    
    // Date object initialized as per Indian (kolkata) timezone. Returns a datetime string
    let nz_date_string = new Date().toLocaleString("en-US", { timeZone: "Asia/Calcutta" });
  
    // Date object initialized from the above datetime string
    let date_nz = new Date(nz_date_string);
  
    // year as (YYYY) format
    let year = date_nz.getFullYear();
  
    // month as (MM) format
    let month = ("0" + (date_nz.getMonth() + 1)).slice(-2);
  
    // date as (DD) format
    let date = ("0" + date_nz.getDate()).slice(-2);
  
    // date as YYYY-MM-DD format
    let date_yyyy_mm_dd = year + "-" + month + "-" + date;
  
    // hours as (hh) format
    let hours = ("0" + date_nz.getHours()).slice(-2);
  
    // minutes as (mm) format
    let minutes = ("0" + date_nz.getMinutes()).slice(-2);
  
    // seconds as (ss) format
    let seconds = ("0" + date_nz.getSeconds()).slice(-2);
  
    // time as hh:mm:ss format
    let time_hh_mm_ss = hours + ":" + minutes + ":" + seconds;
  
    var data = url.parse(req.url, true);
    data = data.query;
    
  
    //let { name, purpose, amount, mobile, payee } = req.body;
    //console.log(name, purpose, amount, mobile, payee);

    let { purpose, amount, mobile, payee } = req.body;
    console.log(purpose, amount, mobile, payee);
  
    let errors = [];
  
    if (!purpose || !amount || !mobile || !payee) {
      errors.push({ message: "Please enter all fields" });
    }
   
    if (errors.length > 0) {
      res.redirect("/finance");
      //res.render("student-profile", {
      //  message: "There may be some errors. Please try again."
      //});
    } else {
  
      pool.query(
        //`INSERT INTO finance (name, purpose, amount, mobile, payee, transaction_date)
        //  VALUES($1, $2, $3, $4, $5, $6)`,
        //[name, purpose, amount, mobile, payee, date_yyyy_mm_dd],

        `INSERT INTO finance (purpose, amount, mobile, payee, transaction_date)
          VALUES($1, $2, $3, $4, $5)`,
        [purpose, amount, mobile, payee, date_yyyy_mm_dd],
        (err, results) => {
          if (err) {
            console.log(err);
            throw err;
          }
          console.log(results.rows);
        //  //res.redirect("/finance");
        //  
  //
        //  //--------------------------
        //  var details = "Add Finance By: " + payee;
        //  var username  = req.user.username;
        //  var action_date = date_yyyy_mm_dd;
        //  var action_time = time_hh_mm_ss;
        //  //-----------add to system history---------//
  //
        //  pool.query(
        //    `INSERT INTO system_history (details, username, action_date, action_time)
        //    VALUES($1, $2, $3, $4)`,
        //    [details, username, action_date, action_time],
        //  
        //  
        //    (err, results) => {
        //      if (err) {
        //        throw err;
        //      }
        //    
        //      //res.redirect("/finance");
  //
        //      //--------------------------
          var project_id = 'Others'
          var debit = amount;
          var action_date = date_yyyy_mm_dd;
          var action_time = time_hh_mm_ss;
          var credit = new Number();
          var transaction_type = 'debit';
          var transaction_method = '';
        //  //-----------add to system history---------//
  //
          pool.query(
            `INSERT INTO cashbook (project_id, purpose, benificiary_name, credit, debit, transaction_type, transaction_method, transaction_date, transaction_time)
                  VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [project_id, purpose, payee, credit, debit,transaction_type, transaction_method, action_date, action_time],
          
          
            (err, results) => {
              if (err) {
                throw err;
              }
            
              res.redirect("/finance");
            
            }
          );
        //    
        //    }
        //  );
      //---------------------------
          //res.redirect("/finance");
        }
      );
    }
  });

  app.get("/finance/getdata", async (req, res) => {
    let { id } = req.body;
   
  
    let errors = [];
  
  
    pool.query(
      `SELECT * FROM finance
      order by id`,
      
  
      (err, results) => {
        if (err) {
          throw err;
        }
        let data = results.rows;
        
        res.send(data);
      }
    );
  });



  //----------------------cashbook------------------//

  app.get("/cashbook/project/getdata", async (req, res) => {

    pool.query(
  
      //"select * from project order by project_id desc",
  
      `select project.project_id, project.project_name, project.project_details, project.status, client.client_name, client.client_id 
      FROM project
      INNER JOIN client 
      ON cast(client.client_id as varchar(200)) = project.client_id
      where project.status_2 = 'active' and project.status = 'Ongoing'
      order by project_id desc`,
    
       
    //    WHERE id = 1`,
    //  
      (err, results) => {
        if (err) {
          throw err;
        }
        let data = results.rows;
        
        res.send(data);
      }
    );
  });

  app.get("/cashbook/getdata", async (req, res) => {
    var data = url.parse(req.url, true);
    data = data.query;
    var search_date = data.date;
  
    pool.query(
      //`SELECT * from cashbook
      //where transaction_date = $1
      //order by id desc`,
      `select cashbook.project_id, cashbook.benificiary_name, cashbook.credit, cashbook.debit, cashbook.transaction_type, cashbook.transaction_method, cashbook.cheque_number, cashbook.transaction_id, cashbook.purpose, cashbook.transaction_date, cashbook.transaction_time, 
       project.project_name
       FROM cashbook
       LEFT JOIN project 
       ON cashbook.project_id = cast(project.project_id as varchar(200))
       where transaction_date = $1
       order by cashbook.id desc`,
      [search_date],
        
      (err, results) => {
        if (err) {
          throw err;
        }
        let data = results.rows;
        
        res.send(data);
      }
    );
  });
  
  app.get("/cashbook/getdata2", async (req, res) => {
    var data = url.parse(req.url, true);
    data = data.query;
    var search_month = data.month;
    var search_year = data.year;
  
    //------------------year----------------------//
    
    // Date object initialized as per Indian (kolkata) timezone. Returns a datetime string
    ///let nz_date_string = new Date().toLocaleString("en-US", { timeZone: "Asia/Calcutta" });
  
    // Date object initialized from the above datetime string
    //let date_nz = new Date(nz_date_string);
  
    // year as (YYYY) format
    //let year = date_nz.getFullYear();
  
    var month_like = "%" + search_year + "_" + search_month  +"___%";

    
  
    pool.query(
      //`SELECT * from cashbook
      //where transaction_date like $1
      //order by id desc`,

      `select cashbook.project_id, cashbook.benificiary_name, cashbook.credit, cashbook.debit, cashbook.transaction_type, cashbook.transaction_method, cashbook.cheque_number, cashbook.transaction_id, cashbook.purpose, cashbook.transaction_date, cashbook.transaction_time, 
       project.project_name
       FROM cashbook
       LEFT JOIN project 
       ON cashbook.project_id = cast(project.project_id as varchar(200))
       where transaction_date like $1
       order by cashbook.id desc`,
      [month_like],
        
      (err, results) => {
        if (err) {
          throw err;
        }
        let data = results.rows;
        
        res.send(data);
      }
    );
  });


  app.get("/cashbook/getdata3", async (req, res) => {
    var data = url.parse(req.url, true);
    data = data.query;
    var project_id = data.project_id;
   
    
  
    pool.query(
      //`SELECT * from cashbook
      //where project_id like $1
      //order by id desc`,

      `select cashbook.project_id, cashbook.benificiary_name, cashbook.credit, cashbook.debit, cashbook.transaction_type, cashbook.transaction_method, cashbook.cheque_number, cashbook.transaction_id, cashbook.purpose, cashbook.transaction_date, cashbook.transaction_time, 
       project.project_name
       FROM cashbook
       LEFT JOIN project 
       ON cashbook.project_id = cast(project.project_id as varchar(200))
       where cashbook.project_id = $1
       order by cashbook.id desc`,
      [project_id],
        
      (err, results) => {
        if (err) {
          throw err;
        }
        let data = results.rows;
        
        res.send(data);
      }
    );
  });



  //-----------------------for acc_sum_2----------------------//

  app.get("/cashbook/getdata4", async (req, res) => {
    var data = url.parse(req.url, true);
    data = data.query;
    var search_date = data.date;
  
    pool.query(
      //`SELECT * from cashbook
      //where transaction_date = $1
      //order by id desc`,
      `select cashbook.project_id, cashbook.benificiary_name, cashbook.credit, cashbook.debit, cashbook.transaction_type, cashbook.transaction_method, cashbook.cheque_number, cashbook.transaction_id, cashbook.purpose, cashbook.transaction_date, cashbook.transaction_time, 
       project.project_name
       FROM cashbook
       LEFT JOIN project 
       ON cashbook.project_id = cast(project.project_id as varchar(200))
       where transaction_date = $1 and cashbook.project_id != 'Others'
       order by cashbook.id desc`,
      [search_date],
        
      (err, results) => {
        if (err) {
          throw err;
        }
        let data = results.rows;
        
        res.send(data);
      }
    );
  });


  app.get("/cashbook/getdata5", async (req, res) => {
    var data = url.parse(req.url, true);
    data = data.query;
    var search_month = data.month;
    var search_year = data.year;
  
    //------------------year----------------------//
    
    // Date object initialized as per Indian (kolkata) timezone. Returns a datetime string
    ///let nz_date_string = new Date().toLocaleString("en-US", { timeZone: "Asia/Calcutta" });
  
    // Date object initialized from the above datetime string
    //let date_nz = new Date(nz_date_string);
  
    // year as (YYYY) format
    //let year = date_nz.getFullYear();
  
    var month_like = "%" + search_year + "_" + search_month  +"___%";

    
  
    pool.query(
      //`SELECT * from cashbook
      //where transaction_date like $1
      //order by id desc`,

      `select cashbook.project_id, cashbook.benificiary_name, cashbook.credit, cashbook.debit, cashbook.transaction_type, cashbook.transaction_method, cashbook.cheque_number, cashbook.transaction_id, cashbook.purpose, cashbook.transaction_date, cashbook.transaction_time, 
       project.project_name
       FROM cashbook
       LEFT JOIN project 
       ON cashbook.project_id = cast(project.project_id as varchar(200))
       where transaction_date like $1 and cashbook.project_id != 'Others'
       order by cashbook.id desc`,
      [month_like],
        
      (err, results) => {
        if (err) {
          throw err;
        }
        let data = results.rows;
        
        res.send(data);
      }
    );
  });



  //----------------------------------------------------------//

  //-----------------------for acc_sum_3----------------------//


  app.get("/cashbook/getdata6", async (req, res) => {
    var data = url.parse(req.url, true);
    data = data.query;
    var search_date = data.date;
  
    pool.query(
      //`SELECT * from cashbook
      //where transaction_date = $1
      //order by id desc`,
      `select benificiary_name, credit, debit, transaction_type, transaction_method, cheque_number, transaction_id, purpose, transaction_date, transaction_time
       FROM cashbook
       
       
       where transaction_date = $1 and project_id = 'Others'
       order by id desc`,
      [search_date],
        
      (err, results) => {
        if (err) {
          throw err;
        }
        let data = results.rows;
        
        res.send(data);
      }
    );
  });


  app.get("/cashbook/getdata7", async (req, res) => {
    var data = url.parse(req.url, true);
    data = data.query;
    var search_month = data.month;
    var search_year = data.year;
  
    //------------------year----------------------//
    
    // Date object initialized as per Indian (kolkata) timezone. Returns a datetime string
    ///let nz_date_string = new Date().toLocaleString("en-US", { timeZone: "Asia/Calcutta" });
  
    // Date object initialized from the above datetime string
    //let date_nz = new Date(nz_date_string);
  
    // year as (YYYY) format
    //let year = date_nz.getFullYear();
  
    var month_like = "%" + search_year + "_" + search_month  +"___%";

    
  
    pool.query(
      //`SELECT * from cashbook
      //where transaction_date like $1
      //order by id desc`,

      `select benificiary_name, credit, debit, transaction_type, transaction_method, cheque_number, transaction_id, purpose, transaction_date, transaction_time
       FROM cashbook
      
      
       where transaction_date like $1 and project_id = 'Others'
       order by id desc`,
      [month_like],
        
      (err, results) => {
        if (err) {
          throw err;
        }
        let data = results.rows;
        
        res.send(data);
      }
    );
  });


  app.get("/cashbook/getdata8", async (req, res) => {
    var data = url.parse(req.url, true);
    data = data.query;
    var search_benificiary = data.search_benificiary;
    var search_benificiary_month = data.search_benificiary_month;
    var search_benificiary_year = data.search_benificiary_year;

    console.log(search_benificiary, search_benificiary_month, search_benificiary_year)
  
    //------------------year----------------------//
    
    // Date object initialized as per Indian (kolkata) timezone. Returns a datetime string
    let nz_date_string = new Date().toLocaleString("en-US", { timeZone: "Asia/Calcutta" });
  
    // Date object initialized from the above datetime string
    let date_nz = new Date(nz_date_string);
  
    // year as (YYYY) format
    let year = date_nz.getFullYear();
  
    var month_like = "%" + search_benificiary_year + "_" + search_benificiary_month  +"___%";

    
  
    pool.query(
      //`SELECT * from cashbook
      //where transaction_date like $1
      //order by id desc`,

      `select benificiary_name, credit, debit, transaction_type, transaction_method, cheque_number, transaction_id, purpose, transaction_date, transaction_time
       FROM cashbook
       
      
       where transaction_date like $1 and project_id = 'Others' and benificiary_name = $2
       order by id desc`,
      [month_like, search_benificiary],
        
      (err, results) => {
        if (err) {
          throw err;
        }
        let data = results.rows;
        
        res.send(data);
      }
    );
  });


  app.get("/non-project/benificiary_list/getdata", async (req, res) => {

    pool.query(
  
      //"select * from project order by project_id desc",
  
      `select distinct benificiary_name from cashbook
      where project_id = 'Others'`,
    
       
    //    WHERE id = 1`,
    //  
      (err, results) => {
        if (err) {
          throw err;
        }
        let data = results.rows;
        
        res.send(data);
      }
    );
  });


  //----------------------------------------------------------//


  app.post("/cashbook/add", async (req, res) => {

    //------------------date----------------------//
    
    // Date object initialized as per Indian (kolkata) timezone. Returns a datetime string
    let nz_date_string = new Date().toLocaleString("en-US", { timeZone: "Asia/Calcutta" });
  
    // Date object initialized from the above datetime string
    let date_nz = new Date(nz_date_string);
  
    // year as (YYYY) format
    let year = date_nz.getFullYear();
  
    // month as (MM) format
    let month = ("0" + (date_nz.getMonth() + 1)).slice(-2);
  
    // date as (DD) format
    let date = ("0" + date_nz.getDate()).slice(-2);
  
    // date as YYYY-MM-DD format
    let date_yyyy_mm_dd = year + "-" + month + "-" + date;
  
    // hours as (hh) format
    let hours = ("0" + date_nz.getHours()).slice(-2);
  
    // minutes as (mm) format
    let minutes = ("0" + date_nz.getMinutes()).slice(-2);
  
    // seconds as (ss) format
    let seconds = ("0" + date_nz.getSeconds()).slice(-2);
  
    // time as hh:mm:ss format
    let time_hh_mm_ss = hours + ":" + minutes + ":" + seconds;
  
    
    

    let { project_id, benificiary_name, amount, transaction_type, transaction_method, cheque_number, transaction_id, purpose } = req.body;
    console.log(project_id, benificiary_name, amount, transaction_type, transaction_method, cheque_number, transaction_id, purpose);
  
    let errors = [];
  
    if (!project_id || !amount || !transaction_method || !purpose || !benificiary_name || !transaction_type) {
      errors.push({ message: "Please enter all fields" });
    }
   
    if (errors.length > 0) {
      res.redirect("/acc_sum");
      //res.render("student-profile", {
      //  message: "There may be some errors. Please try again."
      //});
    } else {
          
          var debit = new Number;
          var credit = new Number
          var action_date = date_yyyy_mm_dd;
          var action_time = time_hh_mm_ss;

          if(transaction_type == 'debit'){
            debit = amount;
          }else{
            credit = amount;
            benificiary_name = '';
          }
          //-----------add to system history---------//
  
          pool.query(
            `INSERT INTO cashbook (project_id, benificiary_name, credit, debit, transaction_type, transaction_method, cheque_number, transaction_id, purpose, transaction_date, transaction_time)
                  VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [project_id, benificiary_name, credit, debit, transaction_type, transaction_method, cheque_number, transaction_id, purpose, action_date, action_time],
          
          
            (err, results) => {
              if (err) {
                throw err;
              }
            
              //res.redirect("/acc_sum");

              if((project_id !== 'Others') && (transaction_type == 'debit')){
 
                 
                      pool.query(
                        `INSERT INTO daily_expenses (project_id, benificiary_name, amount, transaction_mode, checque_no, transaction_id, Purpose, transaction_date)
                            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                           // returning quatation_id`,
                        [project_id, benificiary_name, amount, transaction_method, cheque_number, transaction_id, purpose, action_date],
                        (err, results) => {
                          if (err) {
                            throw err;
                          }

                          var amount_2 = 0;

                          pool.query(
                            `INSERT INTO daily_expenses (project_id, amount)
                                VALUES ($1, $2)`,
                               // returning quatation_id`,
                            [project_id, amount_2],
                            (err, results) => {
                              if (err) {
                                throw err;
                              }

                              //res.redirect("/view_project?project_id=" + project_id + "&client_id=" + client_id);
                              //res.redirect("/acc_sum");
                            }
                          );
                          //-----------add to system history---------//

                          var details = "Debited" ;
                          var username  = req.user.username;


                          pool.query(
                            `INSERT INTO system_history (details, username, action_date, action_time)
                            VALUES($1, $2, $3, $4)`,
                            [details, username, action_date, action_time],
                          
                          
                            (err, results) => {
                              if (err) {
                                throw err;
                              }
                            
                              //res.redirect("/finance");
                             res.redirect("/acc_sum");
                            }
                          );
                          
                        }
                      );  
              } else if((project_id !== 'Others') && (transaction_type == 'credit')){

                      pool.query(
                        `INSERT INTO pay_by_client (project_id, amount, transaction_mode, checque_no, transaction_id, Purpose, transaction_date)
                            VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                           // returning quatation_id`,
                        [project_id, amount, transaction_method, cheque_number, transaction_id, purpose, action_date],
                        (err, results) => {
                          if (err) {
                            throw err;
                          }

                          var amount_2 = 0;
                          pool.query(
                            `INSERT INTO pay_by_client (project_id, amount)
                                VALUES ($1, $2)`,
                               // returning quatation_id`,
                            [project_id, amount_2],
                            (err, results) => {
                              if (err) {
                                throw err;
                              }

                              //res.redirect("/view_project?project_id=" + project_id + "&client_id=" + client_id);
                              //res.redirect("/acc_sum");
                            }
                          );
                            //-----------add to system history---------//

                          var details = "Debited" ;
                          var username  = req.user.username;


                          pool.query(
                            `INSERT INTO system_history (details, username, action_date, action_time)
                            VALUES($1, $2, $3, $4)`,
                            [details, username, action_date, action_time],
                          
                          
                            (err, results) => {
                              if (err) {
                                throw err;
                              }
                            
                              //res.redirect("/finance");
                             res.redirect("/acc_sum");
                            }
                          );
                          //res.redirect("/acc_sum");
                        }
                      ); 

              } else{

                      pool.query(
                        `INSERT INTO finance (purpose, amount, payee, transaction_date)
                        VALUES($1, $2, $3, $4)`,
                        [purpose, amount, benificiary_name, action_date],
                      
                              (err, results) => {
                                if (err) {
                                  throw err;
                                }
                              
                                //res.redirect("/acc_sum");
                              }
                      );

                      //-----------add to system history---------//

                      var details = "Debited" ;
                      var username  = req.user.username;


                      pool.query(
                        `INSERT INTO system_history (details, username, action_date, action_time)
                        VALUES($1, $2, $3, $4)`,
                        [details, username, action_date, action_time],
                      
                      
                        (err, results) => {
                          if (err) {
                            throw err;
                          }
                        
                          //res.redirect("/finance");
                         res.redirect("/acc_sum");
                        }
                      );
                      
                }
            
            }
          );
       
    }
  });


  //------------------------------dashboard stats--------------------------//


  app.get('/dashboard/monthly/getdata', (req, res) => {
    //------------------date----------------------//
    
    // Date object initialized as per Indian (kolkata) timezone. Returns a datetime string
    let nz_date_string = new Date().toLocaleString("en-US", { timeZone: "Asia/Calcutta" });
  
    // Date object initialized from the above datetime string
    let date_nz = new Date(nz_date_string);
  
    // month as (MM) format
    let month = ("0" + (date_nz.getMonth() + 1)).slice(-2);
  
    var month_like = "%_____" + month  +"___%";
    
   
    
  
    var data = url.parse(req.url, true);
    data = data.query;
    var id = data.id;
    pool.query(
      `select sum(credit) as credit, sum(debit) as debit, (sum(credit)-sum(debit)) as earning from cashbook where transaction_date like $1`,
        [month_like],
        
     //    WHERE id = 1`,
     //  
       (err, results) => {
         if (err) {
           throw err;
         }
         let data = results.rows
         res.send(data);
         
         
       }
     );
  })


  app.get('/dashboard/yearly/getdata', (req, res) => {
    //------------------date----------------------//
    
    // Date object initialized as per Indian (kolkata) timezone. Returns a datetime string
    let nz_date_string = new Date().toLocaleString("en-US", { timeZone: "Asia/Calcutta" });
  
    // Date object initialized from the above datetime string
    let date_nz = new Date(nz_date_string);

    // year as (YYYY) format
    let year = date_nz.getFullYear();
  
    // month as (MM) format
    //let month = ("0" + (date_nz.getMonth() + 1)).slice(-2);

    // date as (DD) format
    //let date = ("0" + date_nz.getDate()).slice(-2);
  
    // date as YYYY-MM-DD format
    //let date_yyyy_mm_dd = year + "-" + month + "-" + date;
  
    //var month_like = "%_____" + month  +"___%";


    var year_like = "%" + year + "______%"

    
   
    
  
    var data = url.parse(req.url, true);
    data = data.query;
    var id = data.id;
    pool.query(
      `select sum(credit) as credit, sum(debit) as debit, (sum(credit)-sum(debit)) as earning from cashbook where transaction_date like $1`,
        [year_like],
        
     //    WHERE id = 1`,
     //  
       (err, results) => {
         if (err) {
           throw err;
         }
         let data = results.rows
         res.send(data);
         
         
       }
     );
  })


  app.get('/dashboard/daily/getdata', (req, res) => {
    //------------------date----------------------//
    
    // Date object initialized as per Indian (kolkata) timezone. Returns a datetime string
    let nz_date_string = new Date().toLocaleString("en-US", { timeZone: "Asia/Calcutta" });
  
    // Date object initialized from the above datetime string
    let date_nz = new Date(nz_date_string);

    // year as (YYYY) format
    let year = date_nz.getFullYear();
  
    // month as (MM) format
    //let month = ("0" + (date_nz.getMonth() + 1)).slice(-2);

    // date as (DD) format
    let date = ("0" + date_nz.getDate()).slice(-2);
  
    // date as YYYY-MM-DD format
    //let date_yyyy_mm_dd = year + "-" + month + "-" + date;
  
    //var month_like = "%_____" + month  +"___%";

    
    //var year_like = "%" + year + "______%"

    var day_like = "%________" + date

    
   
    
  
    var data = url.parse(req.url, true);
    data = data.query;
    var id = data.id;
    pool.query(
      `select sum(credit) as credit, sum(debit) as debit, (sum(credit)-sum(debit)) as earning from cashbook where transaction_date like $1`,
        [day_like],
        
     //    WHERE id = 1`,
     //  
       (err, results) => {
         if (err) {
           throw err;
         }
         let data = results.rows
         res.send(data);
         
         
       }
     );
  })
  //----------------------------------------------------------------------//

  //-------------------------project stats------------------------------//

  app.get("/project/statistics/getdata", async (req, res) => {

    pool.query(
  
      //"select * from project order by project_id desc",
  
      `select sum(credit) as credit, sum(debit) as debit, (sum(credit)-sum(debit)) as earning from cashbook where project_id = $1`,
      [project_id],
       
    //    WHERE id = 1`,
    //  
      (err, results) => {
        if (err) {
          throw err;
        }
        let data = results.rows;
        
        res.send(data);
      }
    );
  });


  //---------------------housing quotation remove------------------//

  
  app.get("/housing_quatation/remove", async (req, res) => {

    var data = url.parse(req.url, true);
    data = data.query;
    var quatation_id = data.quatation_id;


    //------------------date----------------------//
  
  // Date object initialized as per Indian (kolkata) timezone. Returns a datetime string
  let nz_date_string = new Date().toLocaleString("en-US", { timeZone: "Asia/Calcutta" });

  // Date object initialized from the above datetime string
  let date_nz = new Date(nz_date_string);

  // year as (YYYY) format
  let year = date_nz.getFullYear();

  // month as (MM) format
  let month = ("0" + (date_nz.getMonth() + 1)).slice(-2);

  // date as (DD) format
  let date = ("0" + date_nz.getDate()).slice(-2);

  // date as YYYY-MM-DD format
  let date_yyyy_mm_dd = year + "-" + month + "-" + date;

  // hours as (hh) format
  let hours = ("0" + date_nz.getHours()).slice(-2);

  // minutes as (mm) format
  let minutes = ("0" + date_nz.getMinutes()).slice(-2);

  // seconds as (ss) format
  let seconds = ("0" + date_nz.getSeconds()).slice(-2);

  // time as hh:mm:ss format
  let time_hh_mm_ss = hours + ":" + minutes + ":" + seconds;

    pool.query(
  
      //"select * from project order by project_id desc",
  
      `update housing_quatation
      set status = 'deactive'
      where quatation_id = $1`,
      [quatation_id],
       
    //    WHERE id = 1`,
    //  
      (err, results) => {
        if (err) {
          throw err;
        }
        //res.send();
        //-----------add to system history---------//

        var details = "Housing quotation removed" ;
        var username  = req.user.username;
        var action_date = date_yyyy_mm_dd;
        var action_time = time_hh_mm_ss;


        pool.query(
          `INSERT INTO system_history (details, username, action_date, action_time)
          VALUES($1, $2, $3, $4)`,
          [details, username, action_date, action_time],
        
        
          (err, results) => {
            if (err) {
              throw err;
            }
          
            //res.redirect("/finance");
            res.send();
          }
        );
      }
    );
  });



  //--------------------housing quotation in recycle bin-----------------------//

  app.get("/bin/housing-quatation-list/getdata", async (req, res) => {

    pool.query(
     "select quatation_id, client_id, quatation_heading from  housing_quatation where quatation_heading is not null and status = 'deactive' group by quatation_id, client_id, quatation_heading order by quatation_id desc",
     //"order by quatation_id desc",
    
       
    //    WHERE id = 1`,
    //  
      (err, results) => {
        if (err) {
          throw err;
        }
        let data = results.rows;
        
        res.send(data);
      }
    );
  });


  app.get("/housing_quatation/restore", async (req, res) => {

    var data = url.parse(req.url, true);
    data = data.query;
    var quatation_id = data.quatation_id;

    //------------------date----------------------//
  
  // Date object initialized as per Indian (kolkata) timezone. Returns a datetime string
  let nz_date_string = new Date().toLocaleString("en-US", { timeZone: "Asia/Calcutta" });

  // Date object initialized from the above datetime string
  let date_nz = new Date(nz_date_string);

  // year as (YYYY) format
  let year = date_nz.getFullYear();

  // month as (MM) format
  let month = ("0" + (date_nz.getMonth() + 1)).slice(-2);

  // date as (DD) format
  let date = ("0" + date_nz.getDate()).slice(-2);

  // date as YYYY-MM-DD format
  let date_yyyy_mm_dd = year + "-" + month + "-" + date;

  // hours as (hh) format
  let hours = ("0" + date_nz.getHours()).slice(-2);

  // minutes as (mm) format
  let minutes = ("0" + date_nz.getMinutes()).slice(-2);

  // seconds as (ss) format
  let seconds = ("0" + date_nz.getSeconds()).slice(-2);

  // time as hh:mm:ss format
  let time_hh_mm_ss = hours + ":" + minutes + ":" + seconds;

    pool.query(
  
      //"select * from project order by project_id desc",
  
      `update housing_quatation
      set status = 'active'
      where quatation_id = $1`,
      [quatation_id],
       
    //    WHERE id = 1`,
    //  
      (err, results) => {
        if (err) {
          throw err;
        }
      
        //res.send();
        //-----------add to system history---------//

        var details = "Housing quotation restored" ;
        var username  = req.user.username;
        var action_date = date_yyyy_mm_dd;
        var action_time = time_hh_mm_ss;


        pool.query(
          `INSERT INTO system_history (details, username, action_date, action_time)
          VALUES($1, $2, $3, $4)`,
          [details, username, action_date, action_time],
        
        
          (err, results) => {
            if (err) {
              throw err;
            }
          
            //res.redirect("/finance");
            res.send();
          }
        );
      }
    );
  });

  app.get("/housing_quatation/delete", async (req, res) => {

    var data = url.parse(req.url, true);
    data = data.query;
    var quatation_id = data.quatation_id;


    //------------------date----------------------//
    
  
  // Date object initialized as per Indian (kolkata) timezone. Returns a datetime string
  let nz_date_string = new Date().toLocaleString("en-US", { timeZone: "Asia/Calcutta" });

  // Date object initialized from the above datetime string
  let date_nz = new Date(nz_date_string);

  // year as (YYYY) format
  let year = date_nz.getFullYear();

  // month as (MM) format
  let month = ("0" + (date_nz.getMonth() + 1)).slice(-2);

  // date as (DD) format
  let date = ("0" + date_nz.getDate()).slice(-2);

  // date as YYYY-MM-DD format
  let date_yyyy_mm_dd = year + "-" + month + "-" + date;

  // hours as (hh) format
  let hours = ("0" + date_nz.getHours()).slice(-2);

  // minutes as (mm) format
  let minutes = ("0" + date_nz.getMinutes()).slice(-2);

  // seconds as (ss) format
  let seconds = ("0" + date_nz.getSeconds()).slice(-2);

  // time as hh:mm:ss format
  let time_hh_mm_ss = hours + ":" + minutes + ":" + seconds;

    pool.query(
  
      //"select * from project order by project_id desc",
  
      `delete from housing_quatation
      where quatation_id = $1`,
      [quatation_id],
       
    //    WHERE id = 1`,
    //  
      (err, results) => {
        if (err) {
          throw err;
        }
        
        //res.send();

        //-----------add to system history---------//

        var details = "Housing quotation deleted" ;
        var username  = req.user.username;
        var action_date = date_yyyy_mm_dd;
        var action_time = time_hh_mm_ss;


        pool.query(
          `INSERT INTO system_history (details, username, action_date, action_time)
          VALUES($1, $2, $3, $4)`,
          [details, username, action_date, action_time],
        
        
          (err, results) => {
            if (err) {
              throw err;
            }
          
            //res.redirect("/finance");
            res.send();
          }
        );
      }
    );
  });

  //------------------------------------------------------------------------//

  //---------------------corporate quotation remove------------------//

  
  app.get("/corporate_quatation/remove", async (req, res) => {

    var data = url.parse(req.url, true);
    data = data.query;
    var quatation_id = data.quatation_id;

    //------------------date----------------------//
  
  // Date object initialized as per Indian (kolkata) timezone. Returns a datetime string
  let nz_date_string = new Date().toLocaleString("en-US", { timeZone: "Asia/Calcutta" });

  // Date object initialized from the above datetime string
  let date_nz = new Date(nz_date_string);

  // year as (YYYY) format
  let year = date_nz.getFullYear();

  // month as (MM) format
  let month = ("0" + (date_nz.getMonth() + 1)).slice(-2);

  // date as (DD) format
  let date = ("0" + date_nz.getDate()).slice(-2);

  // date as YYYY-MM-DD format
  let date_yyyy_mm_dd = year + "-" + month + "-" + date;

  // hours as (hh) format
  let hours = ("0" + date_nz.getHours()).slice(-2);

  // minutes as (mm) format
  let minutes = ("0" + date_nz.getMinutes()).slice(-2);

  // seconds as (ss) format
  let seconds = ("0" + date_nz.getSeconds()).slice(-2);

  // time as hh:mm:ss format
  let time_hh_mm_ss = hours + ":" + minutes + ":" + seconds;

    pool.query(
  
      //"select * from project order by project_id desc",
  
      `update corporate_quatation
      set status = 'deactive'
      where quatation_id = $1`,
      [quatation_id],
       
    //    WHERE id = 1`,
    //  
      (err, results) => {
        if (err) {
          throw err;
        }
        
        //res.send();
        //-----------add to system history---------//

        var details = "Corporate quotation removed" ;
        var username  = req.user.username;
        var action_date = date_yyyy_mm_dd;
        var action_time = time_hh_mm_ss;


        pool.query(
          `INSERT INTO system_history (details, username, action_date, action_time)
          VALUES($1, $2, $3, $4)`,
          [details, username, action_date, action_time],
        
        
          (err, results) => {
            if (err) {
              throw err;
            }
          
            //res.redirect("/finance");
            res.send();
          }
        );
      }
    );
  });

  //---------------------------corporate quotation in recycle bin--------------------------//

  app.get("/bin/corporate-quatation-list/getdata", async (req, res) => {

    pool.query(
      "select quatation_id, client_id, quatation_heading from  corporate_quatation where quatation_heading is not null and status = 'deactive' group by quatation_id, client_id, quatation_heading order by quatation_id desc",
     //"order by quatation_id desc",
    
       
    //    WHERE id = 1`,
    //  
      (err, results) => {
        if (err) {
          throw err;
        }
        let data = results.rows;
        
        res.send(data);
      }
    );
  });


  app.get("/corporate_quatation/restore", async (req, res) => {

    var data = url.parse(req.url, true);
    data = data.query;
    var quatation_id = data.quatation_id;

    //------------------date----------------------//
  
  // Date object initialized as per Indian (kolkata) timezone. Returns a datetime string
  let nz_date_string = new Date().toLocaleString("en-US", { timeZone: "Asia/Calcutta" });

  // Date object initialized from the above datetime string
  let date_nz = new Date(nz_date_string);

  // year as (YYYY) format
  let year = date_nz.getFullYear();

  // month as (MM) format
  let month = ("0" + (date_nz.getMonth() + 1)).slice(-2);

  // date as (DD) format
  let date = ("0" + date_nz.getDate()).slice(-2);

  // date as YYYY-MM-DD format
  let date_yyyy_mm_dd = year + "-" + month + "-" + date;

  // hours as (hh) format
  let hours = ("0" + date_nz.getHours()).slice(-2);

  // minutes as (mm) format
  let minutes = ("0" + date_nz.getMinutes()).slice(-2);

  // seconds as (ss) format
  let seconds = ("0" + date_nz.getSeconds()).slice(-2);

  // time as hh:mm:ss format
  let time_hh_mm_ss = hours + ":" + minutes + ":" + seconds;

    pool.query(
  
      //"select * from project order by project_id desc",
  
      `update corporate_quatation
      set status = 'active'
      where quatation_id = $1`,
      [quatation_id],
       
    //    WHERE id = 1`,
    //  
      (err, results) => {
        if (err) {
          throw err;
        }
        
        //res.send();

        //-----------add to system history---------//

        var details = "Corporate quotation restored" ;
        var username  = req.user.username;
        var action_date = date_yyyy_mm_dd;
        var action_time = time_hh_mm_ss;


        pool.query(
          `INSERT INTO system_history (details, username, action_date, action_time)
          VALUES($1, $2, $3, $4)`,
          [details, username, action_date, action_time],
        
        
          (err, results) => {
            if (err) {
              throw err;
            }
          
            //res.redirect("/finance");
            res.send();
          }
        );
      }
    );
  });

  app.get("/corporate_quatation/delete", async (req, res) => {

    var data = url.parse(req.url, true);
    data = data.query;
    var quatation_id = data.quatation_id;

    //------------------date----------------------//
  
  // Date object initialized as per Indian (kolkata) timezone. Returns a datetime string
  let nz_date_string = new Date().toLocaleString("en-US", { timeZone: "Asia/Calcutta" });

  // Date object initialized from the above datetime string
  let date_nz = new Date(nz_date_string);

  // year as (YYYY) format
  let year = date_nz.getFullYear();

  // month as (MM) format
  let month = ("0" + (date_nz.getMonth() + 1)).slice(-2);

  // date as (DD) format
  let date = ("0" + date_nz.getDate()).slice(-2);

  // date as YYYY-MM-DD format
  let date_yyyy_mm_dd = year + "-" + month + "-" + date;

  // hours as (hh) format
  let hours = ("0" + date_nz.getHours()).slice(-2);

  // minutes as (mm) format
  let minutes = ("0" + date_nz.getMinutes()).slice(-2);

  // seconds as (ss) format
  let seconds = ("0" + date_nz.getSeconds()).slice(-2);

  // time as hh:mm:ss format
  let time_hh_mm_ss = hours + ":" + minutes + ":" + seconds;

    pool.query(
  
      //"select * from project order by project_id desc",
  
      `delete from corporate_quatation
      where quatation_id = $1`,
      [quatation_id],
       
    //    WHERE id = 1`,
    //  
      (err, results) => {
        if (err) {
          throw err;
        }
        
        //res.send();

        //-----------add to system history---------//

        var details = "Corporate quotation deleted" ;
        var username  = req.user.username;
        var action_date = date_yyyy_mm_dd;
        var action_time = time_hh_mm_ss;


        pool.query(
          `INSERT INTO system_history (details, username, action_date, action_time)
          VALUES($1, $2, $3, $4)`,
          [details, username, action_date, action_time],
        
        
          (err, results) => {
            if (err) {
              throw err;
            }
          
            //res.redirect("/finance");
            res.send();
          }
        );
      }
    );
  });


  //------------------------users-----------------------------//

 
app.get('/user/getdata', (req, res) => {
  
  pool.query(
    "select username, name, phone, email from users where username != 'admin'",
   
      
   //    WHERE id = 1`,
   //  
     (err, results) => {
       if (err) {
         throw err;
       }
       let data = results.rows;
       
       res.send(data);
     }
   );

})


//----------------remove users-----------------//


app.get("/user/remove", async (req, res) => {


// Date object initialized as per Indian (kolkata) timezone. Returns a datetime string
let nz_date_string = new Date().toLocaleString("en-US", { timeZone: "Asia/Calcutta" });

// Date object initialized from the above datetime string
let date_nz = new Date(nz_date_string);

// year as (YYYY) format
let year = date_nz.getFullYear();

// month as (MM) format
let month = ("0" + (date_nz.getMonth() + 1)).slice(-2);

// date as (DD) format
let date = ("0" + date_nz.getDate()).slice(-2);

// hours as (HH) format
let hours = ("0" + date_nz.getHours()).slice(-2);

// minutes as (mm) format
let minutes = ("0" + date_nz.getMinutes()).slice(-2);

// seconds as (ss) format
let seconds = ("0" + date_nz.getSeconds()).slice(-2);

// date as YYYY-MM-DD format
let date_yyyy_mm_dd = year + "-" + month + "-" + date;


// time as hh:mm:ss format
let time_hh_mm_ss = hours + ":" + minutes + ":" + seconds;


// date and time as YYYY-MM-DD hh:mm:ss format
let date_time = date + "-" + month + "-" + year + " " + hours + ":" + minutes + ":" + seconds;

var data = url.parse(req.url, true);
data = data.query;
var username = data.username;

pool.query(
`delete from users where username = $1
returning *`,
[username],
(err, results) => {
  if (err) {
    throw err;
  }
  res.redirect("/contact?id="+data.id);
  //let data = results.rows;
  //var name = data[0].name;
  // //--------------------------
  // var details = "Deleted User: " + name;
  // var username  = req.user.username;
  // var action_date = date_yyyy_mm_dd;
  // var action_time = time_hh_mm_ss;
  // //-----------add to system history---------//
//
  // pool.query(
  //   `INSERT INTO system_history (details, username, action_date, action_time)
  //   VALUES($1, $2, $3, $4)`,
  //   [details, username, action_date, action_time],
  // 
  // 
  //   (err, results) => {
  //     if (err) {
  //       throw err;
  //     }
  //   
  //     res.redirect("/contact?id="+data.id);
  //   
  //   }
  // );
   //---------------------------
}
);
});


//---------------------------------------------//


app.get("/user_info/getdata", async (req, res) => {

var username = user_name;
pool.query(
  `SELECT * FROM users
  WHERE username = ($1)`,
  [username],

   
//    WHERE id = 1`,
//  
  (err, results) => {
    if (err) {
      throw err;
    }
    let data = results.rows;
    
    res.send(data);
  }
);
});


app.get("/user_info/edit_parmission", async (req, res) => {

var str_username = "'" + user_name + "'";

var emails = req.query.emails;

var email_sql='';

for(i=1; i<= 5; i++){
  if(emails[i] !== undefined){
  email_sql +=  "access" + i + " = '" + emails[i] + "'";
  if(i<5){
    email_sql += ', ';
  } 
} else{
  email_sql +=  "access" + i + " = 'N/A'";
  if(i<5){
    email_sql += ', ';
  } 
}
}

pool.query(
                    
  "update users set " + email_sql + "where username = " + str_username + "",
  (err, results) => {
    if (err) {
      throw err;
    }
    //res.redirect("/student");
    //function function2() {
      // all the stuff you want to happen after that pause
      
      res.redirect('/user_info?username='+ user_name +'');
      
    //}
   
    //setTimeout(function2, 3000);
  }
);

console.log(email_sql);


});


//------------------system history getdata-------------------//

app.get("/system_history/getdata", async (req, res) => {

  //------------------date----------------------//
  
  // Date object initialized as per Indian (kolkata) timezone. Returns a datetime string
  let nz_date_string = new Date().toLocaleString("en-US", { timeZone: "Asia/Calcutta" });

  // Date object initialized from the above datetime string
  let date_nz = new Date(nz_date_string);

  // year as (YYYY) format
  let year = date_nz.getFullYear();

  // month as (MM) format
  let month = ("0" + (date_nz.getMonth() + 1)).slice(-2);

  // date as (DD) format
  let date = ("0" + date_nz.getDate()).slice(-2);

  // date as YYYY-MM-DD format
  let date_yyyy_mm_dd = year + "-" + month + "-" + date;

  

  let errors = [];
  pool.query(
    `SELECT * FROM system_history
    where action_date = $1
    order by id desc`,
    [date_yyyy_mm_dd],

    (err, results) => {
      if (err) {
        throw err;
      }
      let data = results.rows;
      
      res.send(data);
    }
  );
});



app.get("/bill_data/reset", async (req, res) => {


  //------------------date----------------------//

// Date object initialized as per Indian (kolkata) timezone. Returns a datetime string
let nz_date_string = new Date().toLocaleString("en-US", { timeZone: "Asia/Calcutta" });

// Date object initialized from the above datetime string
let date_nz = new Date(nz_date_string);

// year as (YYYY) format
let year = date_nz.getFullYear();

// month as (MM) format
let month = ("0" + (date_nz.getMonth() + 1)).slice(-2);

// date as (DD) format
let date = ("0" + date_nz.getDate()).slice(-2);

// date as YYYY-MM-DD format
let date_yyyy_mm_dd = year + "-" + month + "-" + date;

// hours as (hh) format
let hours = ("0" + date_nz.getHours()).slice(-2);

// minutes as (mm) format
let minutes = ("0" + date_nz.getMinutes()).slice(-2);

// seconds as (ss) format
let seconds = ("0" + date_nz.getSeconds()).slice(-2);

// time as hh:mm:ss format
let time_hh_mm_ss = hours + ":" + minutes + ":" + seconds;

  pool.query(

    //"select * from project order by project_id desc",

    `delete from final_report
    where project_id = $1`,
    [project_id],
     
  //    WHERE id = 1`,
  //  
    (err, results) => {
      if (err) {
        throw err;
      }
      
      //res.send();

      //-----------add to system history---------//

      var details = "Bill Data Reset" ;
      var username  = req.user.username;
      var action_date = date_yyyy_mm_dd;
      var action_time = time_hh_mm_ss;


      pool.query(
        `INSERT INTO system_history (details, username, action_date, action_time)
        VALUES($1, $2, $3, $4)`,
        [details, username, action_date, action_time],
      
      
        (err, results) => {
          if (err) {
            throw err;
          }
        
          //res.redirect("/finance");
          res.send();
        }
      );
    }
  );
});


app.get("/daily_expenses/revert", async (req, res) => {
  var data = url.parse(req.url, true);
  data = data.query;
  var id = data.id;
  
console.log(id)
  //let { benificiary_name, amount, transaction_mode, cheque_number, transaction_id, purpose } = req.body;
  

  //------------------date----------------------//
    
    // Date object initialized as per Indian (kolkata) timezone. Returns a datetime string
    let nz_date_string = new Date().toLocaleString("en-US", { timeZone: "Asia/Calcutta" });
  
    // Date object initialized from the above datetime string
    let date_nz = new Date(nz_date_string);
  
    // year as (YYYY) format
    let year = date_nz.getFullYear();
  
    // month as (MM) format
    let month = ("0" + (date_nz.getMonth() + 1)).slice(-2);
  
    // date as (DD) format
    let date = ("0" + date_nz.getDate()).slice(-2);
  
    // date as YYYY-MM-DD format
    let date_yyyy_mm_dd = year + "-" + month + "-" + date;
  
    // hours as (hh) format
    let hours = ("0" + date_nz.getHours()).slice(-2);
  
    // minutes as (mm) format
    let minutes = ("0" + date_nz.getMinutes()).slice(-2);
  
    // seconds as (ss) format
    let seconds = ("0" + date_nz.getSeconds()).slice(-2);
  
    // time as hh:mm:ss format
    let time_hh_mm_ss = hours + ":" + minutes + ":" + seconds;
  //--------------------------------------------//
  
  
  //console.log(benificiary_name, amount, transaction_mode, cheque_number, transaction_id, purpose);
  
  let errors = [];
  
  
  
  if (!id) {
    errors.push({ message: "Please enter all fields" });
  }
  
  console.log(errors);
  if (errors.length > 0) {
    res.redirect("/view_project?project_id=" + project_id + "&client_id=" + client_id);
  } else{
    // Validation passed
      pool.query(
        `delete from daily_expenses 
          where id = $1
          returning amount`,
           // returning quatation_id`,
        [id],
        (err, results) => {
          if (err) {
            throw err;
          }

          var data = results.rows;
          var amount = data[0].amount;
          

          
              var credit = new Number();
              var debit = new Number();

              credit = amount;
              var purpose = 'Payment Revertion'
             
              pool.query(
                `INSERT INTO cashbook (project_id, credit, debit, purpose, transaction_date, transaction_time)
                  VALUES($1, $2, $3, $4, $5, $6)`,
                  [project_id, credit, debit, purpose, date_yyyy_mm_dd, time_hh_mm_ss],
                   // returning quatation_id`,
               
                (err, results) => {
                  if (err) {
                    throw err;
                  }
                  
                  //res.send()
                  //res.redirect("/view_project?project_id=" + project_id + "&client_id=" + client_id);
                
              
              
              //res.redirect("/view_project?project_id=" + project_id + "&client_id=" + client_id);
            
          //-----------add to system history---------//

        var details = "Payment Reverted" ;
        var username  = req.user.username;
        var action_date = date_yyyy_mm_dd;
        var action_time = time_hh_mm_ss; 

        pool.query(
          `INSERT INTO system_history (details, username, action_date, action_time)
          VALUES($1, $2, $3, $4)`,
          [details, username, action_date, action_time],
        
        
          (err, results) => {
            if (err) {
              throw err;
            }
          
            //res.redirect("/finance");
            res.send()
          }
        );
          //res.redirect("/view_project?project_id=" + project_id + "&client_id=" + client_id);
        }
      );
    }
    );
  
        
      }
  });


  app.get("/pay_by_client/revert", async (req, res) => {
    var data = url.parse(req.url, true);
    data = data.query;
    var id = data.id;
    
  console.log(id)
    //let { benificiary_name, amount, transaction_mode, cheque_number, transaction_id, purpose } = req.body;
    
  
    //------------------date----------------------//
      
      // Date object initialized as per Indian (kolkata) timezone. Returns a datetime string
      let nz_date_string = new Date().toLocaleString("en-US", { timeZone: "Asia/Calcutta" });
    
      // Date object initialized from the above datetime string
      let date_nz = new Date(nz_date_string);
    
      // year as (YYYY) format
      let year = date_nz.getFullYear();
    
      // month as (MM) format
      let month = ("0" + (date_nz.getMonth() + 1)).slice(-2);
    
      // date as (DD) format
      let date = ("0" + date_nz.getDate()).slice(-2);
    
      // date as YYYY-MM-DD format
      let date_yyyy_mm_dd = year + "-" + month + "-" + date;
    
      // hours as (hh) format
      let hours = ("0" + date_nz.getHours()).slice(-2);
    
      // minutes as (mm) format
      let minutes = ("0" + date_nz.getMinutes()).slice(-2);
    
      // seconds as (ss) format
      let seconds = ("0" + date_nz.getSeconds()).slice(-2);
    
      // time as hh:mm:ss format
      let time_hh_mm_ss = hours + ":" + minutes + ":" + seconds;
    //--------------------------------------------//
    
    
    //console.log(benificiary_name, amount, transaction_mode, cheque_number, transaction_id, purpose);
    
    let errors = [];
    
    
    
    if (!id) {
      errors.push({ message: "Please enter all fields" });
    }
    
    console.log(errors);
    if (errors.length > 0) {
      res.redirect("/view_project?project_id=" + project_id + "&client_id=" + client_id);
    } else{
      // Validation passed
        pool.query(
          `delete from pay_by_client 
            where id = $1
            returning amount`,
             // returning quatation_id`,
          [id],
          (err, results) => {
            if (err) {
              throw err;
            }
  
            var data = results.rows;
            var amount = data[0].amount;
            
  
            
                var credit = new Number();
                var debit = new Number();
  
                debit = amount;
                var purpose = 'Payment Revertion'
               
                pool.query(
                  `INSERT INTO cashbook (project_id, credit, debit, purpose, transaction_date, transaction_time)
                    VALUES($1, $2, $3, $4, $5, $6)`,
                    [project_id, credit, debit, purpose, date_yyyy_mm_dd, time_hh_mm_ss],
                     // returning quatation_id`,
                 
                  (err, results) => {
                    if (err) {
                      throw err;
                    }
                    
                    //res.send()
                    //res.redirect("/view_project?project_id=" + project_id + "&client_id=" + client_id);
                  
                
                
                //res.redirect("/view_project?project_id=" + project_id + "&client_id=" + client_id);
              
            //-----------add to system history---------//
  
          var details = "Payment Reverted" ;
          var username  = req.user.username;
          var action_date = date_yyyy_mm_dd;
          var action_time = time_hh_mm_ss; 
  
          pool.query(
            `INSERT INTO system_history (details, username, action_date, action_time)
            VALUES($1, $2, $3, $4)`,
            [details, username, action_date, action_time],
          
          
            (err, results) => {
              if (err) {
                throw err;
              }
            
              //res.redirect("/finance");
              res.send()
            }
          );
            //res.redirect("/view_project?project_id=" + project_id + "&client_id=" + client_id);
          }
        );
      }
      );
    
          
        }
    });
