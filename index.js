const express = require("express");
const bodyParser = require("body-parser")
const app = express();
app.set("view engine", "ejs");
app.set("views","./views");
app.use(express.static('public'));
app.listen(3000, ()=>console.log("Server is running at port 3000"));

// Cho phep server angular access vào node server
app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:4200'); // domain server angular
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
// parse application/json
app.use(bodyParser.json())

// mongoose
const mongoose = require('mongoose');
mongoose.set('useFindAndModify', false);
mongoose.connect('mongodb+srv://root:root@cluster0.zfu2x.mongodb.net/bookstore?retryWrites=true&w=majority', 
{useNewUrlParser: true, useUnifiedTopology: true}, function(err){
    if(err){
        console.log('Mongoose errors');
    }else {
        console.log('Mongoose connected OK');
    }
});

//multer
var multer  = require('multer');
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'public/upload')
    },
    filename: function (req, file, cb) {
      cb(null, Date.now()  + "-" + file.originalname)
    }
});  
var upload = multer({ 
    storage: storage,
    fileFilter: function (req, file, cb) {
        console.log(file);
        if(file.mimetype=="image/bmp" || 
        file.mimetype=="image/png" || 
        file.mimetype=="image/jpg" || 
        file.mimetype=="image/jpeg"){
            cb(null, true)
        }else{
            return cb(new Error('Only image are allowed!'))
        }
    }
}).single("fileImage");

const Category = require('./models/category');
const Book = require('./models/book');

// API for angular

app.post('/api/categories',(req, res)=>{
    Category.find((err, items)=>{
        if(err){
            res.json({status: 0});
        } else {
            res.json({status: 1, items: items});
        }
    })
})

// route for server page

app.get("/", (req, res)=>{
    res.render('home');
})

app.get("/cat", (req, res)=>{
    res.render('cat');
})

app.post("/cat", (req, res)=>{
    const category =  new Category({
        name: req.body.txtName,
        books_id: []
    });
    category.save()
    .then(result => {
        console.log(result);
        res.json({status: 1});
    })
    .catch(err => {
        console.log(err);
        res.json({status: 0});
    });
})

app.get("/book", (req, res)=>{
    Category.find((err, items)=>{
        if(err){
            res.send(err);
        } else {
            console.log(items);
            res.render('book', {categories: items});
        }
    });
    
})

app.post("/book", (req, res)=>{
    //upload image
    upload(req, res, function (err) {
        if (err instanceof multer.MulterError) {
          console.log("A Multer error occurred when uploading."); 
          res.json({status: 0, error: err});
        } else if (err) {
          console.log("An unknown error occurred when uploading." + err);
          res.json({status: 0});
        }else{
            console.log("Upload is okay");
            console.log(req.file); // Thông tin file đã upload
            //res.json({status: 1, file: req.file});
            //save book
            const book = new Book({
                name: req.body.txtName,
                image: req.file.filename,
                file: req.body.txtFile
            });

            book.save()
            .then(result => {
                console.log(result);
                //update books_id
                Category.findOneAndUpdate({
                    _id: req.body.category
                },{
                    $push: {books_id: book._id}
                },
                function(err){
                    if(err){
                        res.json({status: 0});
                    }
                });
                res.json({status: 1});
            })
            .catch(err => {
                console.log(err);
                res.json({status: 0});
            });
        }
    });
})


