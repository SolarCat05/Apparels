import 'dotenv/config'
//console.log(process.env.SECRET_KEY);
import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import fse from "fs-extra";
import session from "express-session";
import passport from "passport";
import passportLocalMongoose from "passport-local-mongoose";

const app = express();
const port= 3000;
const imgPath = "H:\\Web development practice 2\\Ecommerce-Website\\public\\images\\shacket.JPG";

main().catch(err => console.log(err));

async function main(){
    await mongoose.connect('mongodb://127.0.0.1/EcomDB');
    //mongoose.set("useCreateIndex",true);
    console.log("Connected to MongoDB");

    app.use(session({
        secret:"This is our little secret",
        resave: true,
        saveUninitialized: true,
        cookie:{}
    }))
    
    app.use(passport.initialize());
    app.use(passport.session());
    

    //---------------USER SCHEMA--------------------------------------
    const UserSchema=new mongoose.Schema({
        username:{
            type:String,
            require:true},
        email :{
            type:String,
            require:true
        },
        accountType:{
            type: String,
            enum: ['Admin','User'],
            required : true 
        },
        password:{
            type:String,
            require:true
        }
    })

    UserSchema.plugin(passportLocalMongoose);

    const User=mongoose.model('User',UserSchema);

    passport.use(User.createStrategy());

    passport.serializeUser(User.serializeUser());
    passport.deserializeUser(User.deserializeUser());
//------------------PRODUCT SCHEMA----------------------------------------

    const ProductSchema=new mongoose.Schema({
        name:{
        type:String,
        require:true
        },
        image:{
           data:Buffer,
           contentType:String
        },
      
        price:{
            type:Number,
            require:true
        }
    })

    const Products=mongoose.model('Product',ProductSchema);

    const Book=new Products;
        Book.name="shacket";
        Book.image.data= fse.readFileSync(imgPath);
        Book.image.contentType='image/JPG';
        Book.price=3000;
    

   //Book.save();


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


app.use(express.static("public"));


app.get("/",(req,res)=>{
   const boo=req.isAuthenticated();
   console.log(boo);
   if(req.isAuthenticated()){
    const at= req.user.accountType;
    if(at==='Admin'){
        res.render("Admin.ejs",{userLoggedIn:true,user:req.user});
    }else{
    res.render("index.ejs",{userLoggedIn:true,user:req.user});
    }
   }
    else{
      res.redirect("/login");
    }
});

app.get("/login",(req,res)=>{
    res.render("login.ejs");
})

app.get("/register",(req,res)=>{
    res.render("register.ejs");
})

app.get("/view-users",(req,res)=>{
    User.find({}).then(function(users) {
        res.render("Admin.ejs",{viewUsers:true,users: users});
     })
     .catch((err)=>{
        console.log(err);
    })
});

app.get("/view-product",(req,res)=>{
    Products.find({}).then(function(products) {
        res.render("Admin.ejs",{viewProducts:true,products:products});
     })
     .catch((err)=>{
        console.log(err);
    })
    
})


app.post("/login",(req,res)=>{ 
    const uname=req.body.username;
    const pswd=req.body.password;
    

    const user = new User({
        username: uname,
        password: pswd
        });

    req.login(user, function(err){
        if(err){
            console.log(err);
        }
        else{
            passport.authenticate('local', { failureRedirect: '/login' }),
            res.redirect("/");         
        }
    })
/*
    User.findOne({username:uname}).then(function(foundUser){
        if(foundUser){
            if(foundUser.password===pswd){
                passport.authenticate('local', { failureRedirect: '/login', failureMessage: true }),
                res.redirect("/");
            }
        }
    })
    .catch((err)=>{
        console.log(err);
    });
*/  
   
})

app.post("/register",(req,res)=>{
    const uname=req.body.username;
    const pswd=req.body.password;
    const email=req.body.email;
    const actype=req.body.acType;
    
    User.findOne({username:uname}).then(function(foundUser){
        if(foundUser){
            console.log("Username already in use!");
        }
        else{
            const user = new User({
                username: uname,
                email:email,
                accountType:actype,
                password: pswd
                })
            
            user.save();        
        }
    })
    .catch((err)=>{
        console.log(err);
    })
    res.redirect("/");
   
})

app.get('/logout', function(req, res, next){
    req.logout(function(err) {
      if (err) { return next(err); }
      res.redirect('/');
    });
  });


app.listen(port,()=>{
    console.log(`Server is up at port ${port}`);
})

}