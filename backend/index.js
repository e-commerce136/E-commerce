//const port = 4000;
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const Product = require('./models/Product'); // Import Product model
const Users = require('./models/Users'); // Import Users model
const { log } = require('console');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary with your credentials
cloudinary.config({
  cloud_name: 'dvu1pchvc', // Replace with your Cloudinary cloud name
  api_key: '431421339498768',       // Replace with your Cloudinary API key
  api_secret: 'LgAvBvBDtxftRCcQwLTPydJIlM4'  // Replace with your Cloudinary API secret
});



app.use(express.json());
app.use(cors());

// Database Connection with MongoDB

mongoose.connect("mongodb+srv://MohamedAyman:721999%40Feb@cluster0.as2e1.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")

// API Creation

app.get("/", (req,res)=> {
    res.send("Express App is Running")
})

app.post('/addproduct', async (req,res) => {
    let products = await Product.find({});
    let id;
    if(products.length>0) {
        let last_product_array = products.slice(-1);
        let last_product = last_product_array[0];
        id = last_product.id+1;
    }
    else{
        id=1;
    }
    const product = new Product({
        id:id,
        name:req.body.name,
        image:req.body.image,
        category:req.body.category,
        new_price:req.body.new_price,
        old_price:req.body.old_price,
    });
    console.log(product);
    await product.save();
    console.log("Saved");
    res.json({
        success:true,
        name:req.body.name,
    })
})

// Creating API for deleting Products

app.post('/removeproduct', async (req,res)=> {
    await Product.findOneAndDelete({id:req.body.id});
    console.log("Removed");
    res.json({
        success:true,
        name:req.body.name
    })
})

// Creating API for getting all products
app.get('/allproducts', async (req,res) => {
    let products = await Product.find({});
    console.log("All products Fetched");
    res.send(products);
})

// creating endpoint for registering the user

app.post('/signup', async (req,res)=> {

    let check = await Users.findOne({email:req.body.email});
    if(check){
        return res.status(400).json({success:false,errors:"existing user found with same email address"})
    }
    let cart = {};
    for (let i = 0; i < 300; i++) {
        cart[i] = 0;
    }
    const user = new Users({
        name:req.body.username,
        email:req.body.email,
        password:req.body.password,
        cartData:cart,
    })

    await user.save();

    const data = {
        user:{
            id:user.id
        }
    }

    const token = jwt.sign(data, 'secret_ecom');
    res.json({success:true,token})
})

// creating endpoint for user login
app.post('/login', async (req,res)=> {
    let user = await Users.findOne({email:req.body.email});
    if (user) {
        const passCompare = req.body.password === user.password;
        if (passCompare) {
            const data = {
                user:{
                    id:user.id
                }
            }
            const token = jwt.sign(data,'secret_ecom');
            res.json({success:true,token});
        }
        else {
            res.json({success:false,errors:"Wrong Password"});
        }
    }
    else{
        res.json({success:false,errors:"Wrong Email ID"})
    }
})

// creating endpoint for newcollection data
app.get('/newcollections', async (req,res)=> {
    let products = await Product.find({});
    let newcollection = products.slice(1).slice(-8);
    console.log("NewCollection Fetched");
    res.send(newcollection);
})

//creating endpoint for popular in women section

app.get('/popularinwomen', async (req,res) => {
    let products = await Product.find({category:"women"});
    let popular_in_women = products.slice(0,6);
    console.log("Popular in Women Fetched");
    res.send(popular_in_women);
})

// creating middleware to fetch user

const fetchUser = async (req,res,next)=> {
    const token = req.header('auth-token');
    if (!token) {
        res.status(401).send({errors:"Please authenticate using valid token"})
    }
    else {
        try {
            const data = jwt.verify(token,'secret_ecom');
            req.user = data.user;
            next();
        } catch (error) {
            res.ststus(401).send({errors:"please authenticate using a valid token"})
        }
    }
}

// creating endpoint for adding products in cartData

app.post('/addtocart',fetchUser, async (req,res) =>{
    console.log("Added", req.body.itemId);
    let userData = await Users.findOne({_id:req.user.id});
    userData.cartData[req.body.itemId] +=1;
    await Users.findOneAndUpdate({_id:req.user.id},{cartData:userData.cartData});
    res.send("Added")
})

// creating endpoint to remove product from cartData

app.post('/removefromcart', fetchUser, async (req,res)=> {
    console.log("removed", req.body.itemId);
    let userData = await Users.findOne({_id:req.user.id});
    if(userData.cartData[req.body.itemId]>0)
    userData.cartData[req.body.itemId] -=1;
    await Users.findOneAndUpdate({_id:req.user.id},{cartData:userData.cartData});
    res.send("Removed")
})

// creating endpoint to get cartData

app.post('/getcart',fetchUser, async (req,res) =>{
    console.log("GetCart");
    let userData = await Users.findOne({_id:req.user.id});
    res.json(userData.cartData);
})



// Image Storage Engine

/* const storage = multer.diskStorage({
    destination: './upload/images',
    filename:(req,file,cb)=>{
        return cb(null,`${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`)
    }
}) */

//const upload = multer({storage:storage})

// Creating Upload Endpoint for images
//app.use('/images', express.static('upload/images'))

/* app.post("/upload",upload.single('product'),(req,res) => {
    res.json({
        success:1,
        image_url: `https://e-commercebackend-silk.vercel.app:${port}/images/${req.file.filename}`
    })
}) */
// Set up Multer for parsing form-data
const storage = multer.memoryStorage();  // Store images in memory
const upload = multer({ storage: storage });  // Use memory storage for Multer

// Image upload route
app.post('/upload', upload.single('product'), (req, res) => {
  if (!req.file) {
    return res.status(400).send({ error: 'No file uploaded.' });
  }

  // Upload the image to Cloudinary
  cloudinary.uploader.upload_stream(
    { folder: 'your-folder-name' },  // Optional: specify a folder to organize your images in Cloudinary
    (error, result) => {
      if (error) {
        return res.status(500).send({ error: 'Cloudinary upload failed.' });
      }

      // Send back the image URL in the response
      res.json({
        success: 1,
        image_url: result.secure_url  // URL of the uploaded image
      });
    }
  ).end(req.file.buffer);  // Use the buffer from Multer's memory storage
});

// Start your app
const port = 4000;
app.listen(port, () => {
  console.log(`Server running `);
});