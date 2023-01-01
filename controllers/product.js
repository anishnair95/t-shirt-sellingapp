const Product = require('../models/product');
const formidable = require("formidable");
const _ = require("lodash");
const fs = require("fs");

exports.getProductById = (req, res, next, id) => {
    Product.findById(id)
    .populate("category")
    .exec((err,product) => {
        if (err) {
            return res.status(400).json({
              error: "Product not found",
            });
          }
      
          req.product = product;
          next();
    })
}

exports.getProduct = (req,res) => {
   req.product.photo = undefined;
   return res.json(req.product);
}

//middleware
exports.photo = (req, res, next) => {
    if(req.product.photo.data){
        res.set("Content-Type", req.product.photo.contentType);
        return res.send(req.product.photo.data);
    }
    next();
}

exports.getAllProduct = (req,res) => {
    Product.find().exec((err, products) => {

        if(err){
            return res.status(400).json({
                error: "Not products found"
              }); 
        }

        return res.json(products);
    })
}

exports.createProduct = (req,res) => {
    //this create an object form
    //It accepts three parameters
    //1.error 2.fields 3.files
    let form = new formidable.IncomingForm();
    form.keepExtensions = true; //to keep extensions

    form.parse(req,(err, fields, file) => {
        if(err){
            return res.json({
                error: "Problem with image"
            })
        }

        //destructuring the fields
        const {name,description,price,category,stock} = fields;

        if(!name || !description || !price || !category || !stock){
            return res.status(400).json({
                error:"Please include all fields"
            });
        }

        let product = new Product(fields)

        //handle the file here
        if(file.photo){
            if(file.photo.size > 3000000){
                return res.status(400).json({
                    error: "File size too big!"
                })
            } 
            product.photo.data = fs.readFileSync(file.photo.path);
            product.photo.contentType = file.photo.type
        }
        
        //save to the DB
        product.save((err,product) => {
            if(err){
                return res.status(400).json({
                    error: "Saving tshirt in DB failed"
                  }); 
            }

            return res.json(product);
        })
    })

}

exports.deleteProduct = (req,res) => {
    
    const product = req.product;

    product.remove((err, deletedProduct) => {
        if(err){
            return res.status(400).json({
                error: "Failed to delete product"
            });
        }

        return res.json({
            message: `Successfully deleted the product`,
            deletedProduct
        })
    })
}

exports.updateProduct = (req,res) => {

    let form = new formidable.IncomingForm();
    form.keepExtensions = true; //to keep extensions

    form.parse(req,(err, fields, file) => {
        if(err){
            return res.json({
                error: "Problem with image"
            })
        }

    //updation code

    let product = req.product;
    //updating product object using lodash
    product = _.extend(product,fields);

    
    //handle the file here
    if(file.photo){
        if(file.photo.size > 3000000){
            return res.status(400).json({
                error: "File size too big!"
            })
        } 
        product.photo.data = fs.readFileSync(file.photo.path);
        product.photo.contentType = file.photo.type
    }


    product.save().exec((err,product) => {
        if(err){
            return res.status(400).json({
                error: "Updation of product failed"
            })
        }

        return res.json(product);
    })
        
    })

}


//products listing
exports.getAllProducts = (req, res) =>{
    //?-query parameter
    let limit = parseInt(req.query.limit) ? parseInt(req.query.limit) : 8;
    let sortBy = req.query.sortBy ? req.query.sortBy : "_id";

    Product.find()
    .select("-photo")
    .populate("category")
    .sort([[sortBy, "asc"]])
    .limit(limit)
    .exec((err,products) => {
        if(err){
            return res.status(400).json({
                error: "No product found"
            })
        }

        return res.json(products);

    })
}


//fetch distinct categories
exports.getAllUniqueCategories = (req,res) => {
    Product.distinct("category",{}, (err, category) => {
        if(err){
            return res.status(400).json({
                error: "No category found"
            })
        }

        return res.json(category);
    })
}

//in this we will perform many operation
exports.updateStock = (req,res,next) => {
  let myOperations =  req.body.order.products.map(prod => {
      return {
         updateOne: {
             filter: {_id: prod._id},
             //$inc - operator increments a field by specified value
             //format key:value-by which to increment
             update: {$inc: {stock: -prod.count, sold: +prod.count}}
         }
      }
  })  

  Product.bulkWrite(myOperations, {}, (err,prodcts) => {
      if(err){
          return res.status(400).json({
              error: "Bulk operation failed"
          })
      }

      next();
  })

}