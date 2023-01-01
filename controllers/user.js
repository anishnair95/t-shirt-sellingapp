const User = require('../models/user');
const {Order,ProductCartSchema} = require('../models/order');

exports.getUserById = (req,res,next,id) =>{
    // in exec we get two things error and object
    User.findById(id).exec((err, user)=>{
        if(err || !user){
            return res.status(400).json({
                error: "No user was found"
            })
        }

        //storing object inside the req header
        req.profile = user
        next();
        
    })
}


exports.getUser = (req,res)=>{
    //TODO: get back here for password

    req.profile.salt = undefined
    req.profile.encry_password = undefined
    req.profile.createdAt = undefined
    req.profile.updatedAt = undefined
    return res.json(req.profile);
}


exports.updateUser = (req,res) =>{
    User.findByIdAndUpdate(
        //$set contain data to be updated
        {_id: req.profile._id},
        {$set: req.body},
        {new: true, useFindAndModify: false},
        (err,user) => {
            if(err || !user){
                return res.status(400).json({
                    error:'You are not authorized to update this information'
                })
            }

            user.salt = undefined
            user.encry_password = undefined
            user.createdAt = undefined
            user.updatedAt = undefined
            return res.json(user);
        }
        )
}
//populate - we have to pass two parameter
//first - model-connected by objid, second - the fields to bring in without comma
exports.userPurchaseList =(req,res) => {

    Order.find({user: req.profile._id})
    .populate("user","_id name")
    .exec((err,order)=>{
        if(err){
            return res.status(400).json({
                error: "No order in this account"
            })
        }

        return res.json(order);
    })
}

exports.pushOrderInPurchaseList = (req,res,next) => {
    let purchases = [];
    req.body.order.products.forEach((product) => {
        purchases.push({
            _id: product._id,
            name: product.name,
            description: product.description,
            category: product.category,
            quantity: product.quantity,
            amount: req.body.order.amount,
            transaction_id: req.body.order.transaction_id
        })
    })
    
    User.findOneAndUpdate(
        {_id: req.profile._id},
        {$push: {purchases: purchases}},
        {new: true}, //means from db it will send the updated object,
        (err,purchase) => {
            if(err){
                return res.status(400).json({
                    error: "Unable to save purchase list"
                })
            }
            next();  
        }
    )  
}
// exports.getAllUsers = (req,res) => {
//     User.find({}).exec((err,user)=>{

//         if(err || !user){
//             return res.status(400).json({
//                 error: 'ACCESS DENIED'
//             })
//         }

//         return res.json(user);
//     });
// }