const express = require('express');
const router = express.Router();
const {getUserById} = require('../controllers/user');
const {createProduct, getProductById, photo, getProduct, deleteProduct, updateProduct, getAllProducts, getAllUniqueCategories} = require('../controllers/product');
const {isSignedIn, isAuthenticated, isAdmin} = require('../controllers/auth');


// all params
router.param("userId",getUserById);
router.param("productId",getProductById);


// all of actual routes

//create route
router.post("/product/create/:userId",isSignedIn, isAuthenticated, isAdmin, createProduct);

//read routes
router.get("/product/:productId",getProduct);
router.get("/product/photo/:productId", photo);

//delete route
router.delete("/product/delete/:productId/:userId",isSignedIn, isAuthenticated, isAdmin, deleteProduct);

//update route
router.put("/product/update/:productId/:userId",isSignedIn, isAuthenticated, isAdmin, updateProduct);

//listing route
router.get("/product",getAllProducts);

router.get("/products/categories",getAllUniqueCategories);

module.exports = router;