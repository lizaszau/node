const Product = require("../models/product")
const { validationResult } = require('express-validator')
const mongoose = require('mongoose')
const fileHelper = require('../utils/file')

const ITEMS_PER_PAGE = 3

exports.getAddProduct = (req, res, next) => {
    res.render('admin/edit-product', {
        pageTitle: 'Add Product',
        path: '/admin/add-product',
        edit: false,
        flashMessage: [],
        oldData: {
            title: '',
            price: '',
            description: ''
        },
        validationErrors: []
    })
}

exports.postAddProduct = (req, res, next) => {
    //const userId = req.user._id
    const title = req.body.title
    // const imageUrl = req.body.imageUrl
    const image = req.file
    const price = req.body.price
    const description = req.body.description
    const errors = validationResult(req)
   
    
    if (!image) {
        return res
            .status(422)
            .render('admin/edit-product', {
                path: '/add-product',
                pageTitle: 'Add Product',
                flashMessage: 'Attached file is not an image: JPG, JPEG, PNG',
                edit: false,
                oldData: {
                    title: title,
                    price: price,
                    description: description
                },
                validationErrors: []
            });
    } 

    // throw new Error('fzguhi')
    const imageUrl = image.path

    const product = new Product({
        //_id: new mongoose.Types.ObjectId('63f7e3af0db80aefc7023986'),
        title: title, 
        price: price, 
        description: description, 
        imageUrl: imageUrl,
        userId: req.session.user
    })

    if (!errors.isEmpty()) {
        return res
            .status(422)
            .render('admin/edit-product', {
                path: '/add-product',
                pageTitle: 'Add Product',
                flashMessage: errors.array()[0].msg,
                edit: false,
                oldData: {
                    title: title,
                    price: price,
                    description: description
                },
                validationErrors: errors.array()
            });
    }

    product
        .save()
        .then(result => {
            console.log('Product created!')
            res.redirect('/admin/products')
        })
        .catch(err => {
            const error = new Error(err)
            error.httpStatusCode = 500
            return next(error)
        })
}

exports.getAdminProducts = (req, res, next) => {
    const page = +req.query.page || 1
    let totalItems

    Product
        .find({userId: req.user._id})
        .count()
        .then(totalProducts => {
            totalItems = totalProducts 
            return Product
                .find({userId: req.user._id})
                // .select('title price imageUrl description -_id')
                .populate('userId', 'name email')
                .skip((page - 1) * ITEMS_PER_PAGE)
                .limit(ITEMS_PER_PAGE)
        })
        .then(data => {
            res.render('admin/product-list', {
                prods: data, 
                pageTitle: 'Admin Products',
                path: '/admin/products',
                totalItems: totalItems,
                lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
                currentPage: page,
                hasNextPage: ITEMS_PER_PAGE * page < totalItems,
                hasPreviousPage: page > 1,
                nextPage: page + 1,
                previousPage: page - 1
            })
        })
        .catch(err => {
            const error = new Error(err)
            error.httpStatusCode = 500
            return next(error)
        })
}

exports.getEditProduct = (req, res, next) => {
    const productId = req.params.productId
    Product
        .findById(productId)
        .then(product => {
            if (!product) {
                return res.redirect('/admin/products')
            }
            res.render('admin/edit-product', {
                product: product, 
                pageTitle: 'Edit Product',
                path: '/admin/products',
                edit: true,
                flashMessage: [],
                productId: productId,
                oldData: {
                    title: product.title,
                    price: product.price,
                    description: product.description
                },
                validationErrors: []
            })
        })
        .catch(err => {
            const error = new Error(err)
            error.httpStatusCode = 500
            return next(error)
        })
}

exports.postEditProduct = (req, res, next) => {
    const errors = validationResult(req)
    const id = req.body.productId
    // const userId = req.user._id
    const title = req.body.title
    const image = req.file
    const price = req.body.price
    const description = req.body.description

    if (!errors.isEmpty()) {
        return res
            .status(422)
            .render('admin/edit-product', {
                path: '/edit-product',
                pageTitle: 'Edit Product',
                flashMessage: errors.array()[0].msg,
                edit: true,
                productId: id,
                oldData: {
                    title: title,
                    price: price,
                    description: description
                },
                validationErrors: errors.array()
            });
    }

    Product
    .findById(id)
    .then(product => {
        if (!product || product.userId.toString() !== req.user._id.toString()) {
            return res.redirect('/admin/products')
        }

        product.title = title
        product.price = price
        product.description = description
        if (image) {
            fileHelper.deleteFile(product.imageUrl)
            product.imageUrl = image.path
        }
        return product.save()
            .then(result => {
                res.redirect('/admin/products')
            })
    })
    .catch(err => {
        const error = new Error(err)
        error.httpStatusCode = 500
        return next(error)
    })
}

exports.deleteProduct = (req, res, next) => {
    let productId = req.params.productId

    Product.findById(productId)
        .then(product => {
            if (!product) {
                const error = new Error('Product not found!')
                error.httpStatusCode = 500
                return next(error)
            }

            fileHelper.deleteFile(product.imageUrl)

            return Product
                //.findByIdAndRemove(productId)
                .deleteOne({_id: productId, userId: req.user})
        })
        .then(result => {
            res.status(200).json({
                success: true,
                data: productId
            })
        })
        .catch(err => {
            res.status(500).json({
                success: false,
                errors: ['Deleting products failed!']
            })
        })
}