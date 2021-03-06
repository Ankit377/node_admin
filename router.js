const express = require("express");
const router = express.Router();
const bodyParser = require('body-parser');
// const parse = require('querystring');
const mongoose = require("mongoose");
const models = require("./models");
// const fs = require("file-system");
// const multer = require("multer");
// const { count, info } = require("console");
const formidable = require("formidable");
// const multiparty = require("multiparty");
const url = require("url");
const util = require('util');


mongoose.connect("mongodb://localhost:27017/ekart_DB", { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false }).then(console.log("Connected!!"));

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));


router.post("/add-variation", (req, res) => {
    res.render("./views/Forms/form-elements.ejs", { "additionData": variationData });
});

router.post("/add-product", (req, res) => {
    res.send("Added!!");
});

router.post("/upload-slider-image", (req, res) => {
    var type = req.body.type;
    var imagePath;
    var form = new formidable.IncomingForm();
    form.parse(req);
    form.on("fileBegin", (name, file) => {
        file.path = __dirname + "/public/images/uploads/" + file.name;
        imagePath = "/public/images/uploads/" + file.name;
    });
    form.on("file", (name, file) => {
        console.log("Uploaded" + imagePath);
        var sliderImage = models.slider({
            type: type,
            type_id: "type_id",
            image: imagePath,
            date_added: Date.now(),
        });

        sliderImage.save((err, result) => {
            if (err) {
                console.log(err);
            }

            else {
                res.redirect("home-slider-images");
            }
        });
    });
});

router.post("/upload-offer-image", (req, res) => {
    var imagePath;
    var form = new formidable.IncomingForm();
    form.parse(req);
    form.on("fileBegin", (name, file) => {
        file.path = __dirname + "/public/images/uploads" + file.name;
        imagePath = "/public/images/uploads/" + file.name;
    });
    form.on("file", (name, file) => {
        console.log("uploaded" + imagePath);
        var offerImage = models.offer({
            image: imagePath,
            date_added: Date.now()
        });
        offerImage.save((err, result) => {
            if (err) {
                console.log(err);
            }

            else {
                res.redirect("new-offer-images");
            }
        });
    })
});

router.get("/delete-offer-image", (req, res) => {
    var urlParsed = url.parse(req.url, true);
    var urlQuery = urlParsed.query;
    var id = urlQuery.id;
    models.offer.findByIdAndRemove(id, (err, result) => {
        if (err) {
            console.log(err);
        }

        else {
            res.redirect("new-offer-images");
        }

    });
})

router.get("/promo-codes", (req, res) => {
    models.promoCode.find({}, (err, result) => {
        if (err) {
            console.log(err);
        }

        else {
            res.render("promo-codes", { data: result });
        }
    })
});

router.get("/featured-section", (req, res) => {
    models.section.find({}, (err, result) => {
        if (err) {
            console.log(err);
        }

        else {
            res.render("featured-section", { data: result });
        }
    })
});

router.get("/customers", (req, res) => {
    models.user.find({}, (err, result) => {
        if (err) {
            console.log(err);
        }

        else {
            res.render("customers/customers", { data: result });
        }
    });
});

router.get("/manage-customer-wallet", (req, res) => {
    res.render("customers/manage-customer-wallet");
});

router.post("/add-wallet", (req, res) => {
    var customerName = req.body.customer;
    var txnType = req.body.type;
    var amount = req.body.amount;
    var message = req.body.message;
    var newAmount;
    var oldAmount;
    models.user.findOne({ name: customerName }).select("balance -_id").exec((err, result) => {
        if (err) {
            console.log(err);
        }

        else {
            oldAmount = result.balance;
            console.log(oldAmount);
            if (txnType == "credit") {
                newAmount = (oldAmount - 0) + (amount - 0); //subtraction is done because js don't support addition
                models.user.updateOne({ name: customerName }, { $set: { balance: newAmount } }, (err, doc) => {
                    if (err) {
                        console.log(err);
                    }

                    else {
                        console.log(doc);
                    }
                });
            }

            else if (txnType == "debit") {
                newAmount = oldAmount - amount;
                models.user.updateOne({ name: customerName }, { $set: { balance: newAmount } }, (err, docu) => {
                    if (err) {
                        console.log(err);
                    }

                    else {
                        console.log(docu);
                    }
                });
            }
        }

        var transaction = models.walletTransaction({
            user_id: result.id,
            type: txnType,
            amount: amount,
            message: message,
            status: result.status,
            date_created: Date.now(),
            last_updated: Date.now(),
        });

        transaction.save((err, resul) => {
            if (err) {
                console.log(err);
            }

            else {
                res.redirect("manage-customer-wallet");
            }
        });

    });


});

router.post("/delete", (req, res) => {
    res.send("Deleted!!");
});

router.post("/add-promo-code", (req, res) => {
    var code = req.body.promocode;
    var message = req.body.message;
    var startDate = req.body.startdate;
    var endDate = req.body.enddate;
    var noOfUsers = req.body.noofusers;
    var minOrderAmount = req.body.minorderamt;
    var discount = req.body.discount;
    var discountType = req.body.discounttype;
    var maxDiscount = req.body.discount;
    var repeat = req.body.repeat;
    var repeat_code = 0;
    var status_code = 0;
    var status = req.body.status;
    var promoCodeID = 0;
    models.promoCode.find({}).sort({ _id: -1 }).limit(1).exec((err, result) => {
        if (err) {
            console.log(err);
        }

        else {
            promoCodeID = result.code_id + 1;
        }
    });

    if (repeat == "Allowed") {
        repeat_code = 1;
    }

    else if (repeat == "Not Allowed") {
        repeat_code = 0;
    }

    if (status == "Active") {
        status_code = 1;
    }

    else if (status == "Deactive") {
        status_code = 0;
    }

    var promoCode = models.promoCode({
        promo_code: code,
        message: message,
        start_date: startDate,
        end_date: endDate,
        no_of_users: noOfUsers,
        minimum_order_amount: minOrderAmount,
        discount: discount,
        discount_type: discountType,
        max_discount_amount: maxDiscount,
        repeat_usage: repeat_code,
        status: status_code,
        date_created: Date.now(),
        code_id: promoCodeID,
    });

    promoCode.save((err, result) => {
        if (err) {
            console.log(err);
        }

        else {
            res.redirect("promo-codes");
        }
    });
});

router.post("/add-featured-section", (req, res) => {
    var sectionTitle = req.body.title;
    var sectionDescription = req.body.description;
    var sectionStyle = req.body.style;
    var productIDS = req.body.productids;
    var featuredSection = models.section({
        title: sectionTitle,
        short_description: sectionDescription,
        style: sectionStyle,
        product_ids: productIDS,
        date_created: Date.now()
    });

    featuredSection.save((err, result) => {
        if (err) {
            console.log(err);
        }

        else {
            res.redirect("featured-section");
        }
    });
});

router.get("/new-offer-images", (req, res) => {
    models.offer.find({}, (err, result) => {
        if (err) {
            console.log(err);
        }

        else {
            res.render("app-images/new-offer-images", { data: result });
        }
    });
});

router.get("/payment-requests", (req, res) => {
    res.render("payment-requests");
});

router.get("/return-requests", (req, res) => {
    res.render("return-requests");
});

router.post("/add-delivery-boy", (req, res) => {
    var deliveryBoyName = req.body.name;
    var mobileNumber = req.body.mobile;
    var pass = req.body.password;
    var confirmPass = req.body.confirmpassword;
    var address = req.body.address;
    var bonus = req.body.bonus;
    if (pass != confirmPass) {
        res.send("passwords dont match!!");
    }

    else {

        var deliveryBoy = models.deliveryBoy({
            name: deliveryBoyName,
            mobile: mobileNumber,
            password: pass,
            address: address,
            bonus: bonus,
            balance: 0,
            status: 1,
            date_created: Date.now(),
            fcm_id: "FCM",
        });

        deliveryBoy.save((err, result) => {
            if (err) {
                console.log(err);
            }

            else {
                res.redirect("manage-delivery-boys");
            }
        });
    }
});

router.get("/manage-delivery-boys", (req, res) => {
    models.deliveryBoy.find({}, (err, result) => {
        if (err) {
            console.log(err);
        }

        else {
            res.render("delivery-boys/manage-delivery-boys", { data: result });
        }
    });
});

router.get("/delete-delivery-boy", (req, res) => {
    var urlParsed = url.parse(req.url, true);
    var urlQuery = urlParsed.query;
    var id = urlQuery.id;
    models.deliveryBoy.findByIdAndRemove(id, (err, result) => {
        if (err) {
            console.log(err);
        }

        else {
            res.redirect("manage-delivery-boys");
        }

    });
});

router.get("/fund-transfers", (req, res) => {
    res.render("delivery-boys/fund-transfer");
});

router.get("/send-notification", (req, res) => {
    res.render("send-notification");
});

router.post("/send-message", (req, res) => {
    var notificationType = req.body.type;
    var notificationTitle = req.body.title;
    var notificationMessage = req.body.message;
    var notification = models.notification({
        title: notificationTitle,
        message: notificationMessage,
        type: notificationType,
        type_id: "type ID",
        image: "image",
        date_sent: Date.now()
    });
    notification.save((err, result) => {
        if (err) {
            console.log(err);
        }

        else {
            res.redirect("/send-notification");
        }
    });
});

router.get("/transaction", (req, res) => {
    res.render("transaction");
});

router.get("/wallet-transactions", (req, res) => {
    models.walletTransaction.find({}, (err, result) => {
        if (err) {
            console.log(err);
        }

        else {
            res.render("wallet-transactions", { data: result });
        }
    });
});

router.get("/store-settings", (req, res) => {
    models.setting.find({}).sort({ _id: -1 }).limit(1).exec((err, result) => {
        if (err) {
            console.log(err);
        }

        else {
            res.render("settings", { data: result });
        }
    });
});

router.get("/payment-methods", (req, res) => {
    res.render("system/payment-methods");
});

router.get("/time-slots", (req, res) => {
    res.render("system/time-slots");
});

router.get("/notification-settings", (req, res) => {
    res.render("system/notification-settings");
});

router.get("/contact-us", (req, res) => {
    res.render("system/contact-us");
});

router.get("/privacy-policy", (req, res) => {
    res.render("system/privacy-policy");
});

router.get("/about-us", (req, res) => {
    res.render("system/about-us");
});

router.get("/cities", (req, res) => {
    res.render("locations/cities");
});

router.get("/areas", (req, res) => {
    res.render("locations/areas");
});

router.get("/add-cities", (req, res) => {
    res.render("locations/add-city");
});

router.get("/add-areas", (req, res) => {
    res.render("locations/add-area");
});

router.get("/categories", (req, res) => {
    var categories = models.category.find({}, (err, result) => {
        if (err) {
            console.log(err);
        }

        else {
            res.render("categories", { data: result });
        }
    });
});

router.get("/sub-categories", (req, res) => {
    var subCategories = models.subCategory.find({}, (err, result) => {
        if (err) {
            console.log(err);
        }

        else {
            res.render("sub-categories", { data: result });
        }
    });
});

router.get("/add-categories", (req, res) => {
    res.render("add-categories");
});

router.get("/add-sub-categories", (req, res) => {
    var categories = models.category.find({}, (err, result) => {
        if (err) {
            console.log(err);
        }

        else {
            res.render("add-sub-categories", { data: result });
        }
    })
});

router.get("/units", (req, res) => {
    var units = models.unit.find({}, (err, result) => {
        if (err) {
            console.log(err);
        }

        else {
            res.render("units", { data: result });
        }
    })
});

router.post("/update-settings", (req, res) => {
    var appName = req.body.appname;
    var supportNumber = req.body.supportnumber;
    var supportEmail = req.body.supportemail;
    var currentversion = req.body.currentversion;
    var minversion = req.body.minversion;
    var currency = req.body.currency;
    var gst = req.body.gst;
    var cgst = req.body.cgst;
    var sgst = req.body.sgst;
    var igst = req.body.igst;
    var deliverychargeamt = req.body.deliverychargeamt;
    var minfreedelivery = req.body.minfreedelivery;
    var timezone = req.body.timezone;
    var minreferamt = req.body.minreferamt;
    var referbonus = req.body.referbonus;
    var refermethod = req.body.refermethod;
    var maxreferamt = req.body.maxreferamt;
    var minwithdrawamt = req.body.minwithdrawamt;
    var maxreturndays = req.body.maxreturndays;
    var deliveryboybonus = req.body.deliveryboybonus;
    var fromemail = req.body.fromemail;
    var replyemail = req.body.replyemail;
    var setting = models.setting({
        app_name: appName,
        support_number: supportNumber,
        support_email: supportEmail,
        current_version: currentversion,
        min_version: minversion,
        currency: currency,
        gst: gst,
        cgst: cgst,
        sgst: sgst,
        igst: igst,
        delivery_charge: deliverychargeamt,
        min_free_delivery_amount: minfreedelivery,
        system_time_zone: timezone,
        refer_and_earn_enable: 0,
        min_refer_and_earn_amount: minreferamt,
        refer_and_earn_bonus: referbonus,
        refer_and_earn_method: refermethod,
        max_refer_and_earn_amount: maxreferamt,
        min_withdraw_amount: minwithdrawamt,
        max_days_to_return_item: maxreturndays,
        delivery_boy_bonus: deliveryboybonus,
        from_email: fromemail,
        reply_to_email: replyemail
    });
    setting.save(function (err, result) {
        if (err) {
            console.log(err);
        }

        else {
            res.redirect("store-settings");
        }
    });
});

router.post("/update-payment-methods", (req, res) => {
    res.send("payment method updated!!");
});

router.post("/add-time-slots", (req, res) => {
    res.send("time slot added!!");
});

router.post("/update-fcm-key", (req, res) => {
    res.send("fcm key updated");
});

router.post("/update-contact-info", (req, res) => {
    res.send("contact info updated");
});

router.post("/update-privacy-policy", (req, res) => {
    res.send("privacy policy updated");
});

router.post("/update-about-us", (req, res) => {
    res.send("about us");
});

router.post("/add-city", (req, res) => {
    res.send("city added!!");
});

router.post("/add-area", (req, res) => {
    res.send("area added!!");
});

router.post("/add-category", (req, res) => {
    var catName = req.body.categoryName;
    var catSubtitle = req.body.subtitle;
    var category = new models.category({ name: catName, image: "image", subtitle: catSubtitle });
    category.save(function (err, result) {
        if (err) {
            console.log(err);
        }
        else {
            res.redirect("add-categories");
            console.log(result);
        }
    });


});

router.post("/add-sub-category", (req, res) => {
    var mainCategory = req.body.mainCategory;
    var name = req.body.subName;
    var subtitle = req.body.subSubtitle;
    var image = "image";
    var subCategory = models.subCategory({ name: name, subtitle: subtitle, image: image, main_category: mainCategory });
    subCategory.save(function (err, result) {
        if (err) {
            console.log(err);
        }

        else {
            res.redirect("add-sub-categories");
        }
    });
});

router.post("/add-unit", (req, res) => {

    var unitName = req.body.name;
    var unitCode = req.body.code;
    var unit = models.unit({ "unit_id": 1, "name": unitName, "short_code": unitCode });
    unit.save(function (err, result) {
        if (err) {
            console.log(err);
        }

        else {
            res.redirect("units");
        }
    })
});

router.get("/", function (req, res) {
    res.render("Dashboard/dashboard");
});

router.get("/home-slider-images", function (req, res) {
    models.slider.find({}, (err, result) => {
        if (err) {
            console.log(err);
        }

        else {
            res.render("app-images/home-slider-images", { data: result });
        }
    })
});

router.get("/add-product", function (req, res) {
    var units = models.unit.find({}, (err, result) => {
        if (err) {
            console.log(err);
        }

        else {
            res.render("Products/add-product", { data: result });
        }
    })
});

router.get("/product-orders", function (req, res) {
    res.render("Products/product-orders");
});

router.get("/manage-product", function (req, res) {
    models.product.find({}, (err, result) => {
        if (err) {
            console.log(err);
        }

        else {
            res.render("Products/manage-product", { data: result });
        }
    });
});

router.get("/delete-slider-image", (req, res, next) => {
    var urlParsed = url.parse(req.url, true);
    var urlQuery = urlParsed.query;
    var id = urlQuery.id;
    models.slider.findByIdAndRemove(id, (err, result) => {
        if (err) {
            console.log(err);
        }

        else {
            res.redirect("home-slider-images");
        }

    });
});

router.get("/delete-category", (req, res) => {
    var urlParsed = url.parse(req.url, true);
    var urlQuery = urlParsed.query;
    var id = urlQuery.id;
    models.category.findByIdAndRemove(id, (err, result) => {
        if (err) {
            console.log(err);
        }

        else {
            res.redirect("categories");
        }

    });
});

router.get("/delete-sub-category", (req, res) => {
    var urlParsed = url.parse(req.url, true);
    var urlQuery = urlParsed.query;
    var id = urlQuery.id;
    models.subCategory.findByIdAndRemove(id, (err, result) => {
        if (err) {
            console.log(err);
        }

        else {
            res.redirect("sub-categories");
        }

    });
});

router.get("/delete-promo-code", (req, res) => {
    var urlParsed = url.parse(req.url, true);
    var urlQuery = urlParsed.query;
    var id = urlQuery.id;
    models.promoCode.findByIdAndRemove(id, (err, result) => {
        if (err) {
            console.log(err);
        }

        else {
            res.redirect("promo-codes");
        }

    });
});

router.get("/delete-featured-section", (req, res) => {
    var urlParsed = url.parse(req.url, true);
    var urlQuery = urlParsed.query;
    var id = urlQuery.id;
    models.section.findByIdAndRemove(id, (err, result) => {
        if (err) {
            console.log(err);
        }

        else {
            res.redirect("featured-section");
        }

    });
})

router.get("/edit-promo-code", (req, res) => {
    var urlParsed = url.parse(req.url, true);
    var urlQuery = urlParsed.query;
    var id = urlQuery.id;
    models.promoCode.findById(id, (err, result) => {
        if (err) {
            console.log(err);
        }

        else {
            res.render("edit-promo-code", { data: result });
        }
    })
});

router.post("/update-promo-code", (req, res) => { //some work pending in this part
    var urlParsed = url.parse(req.url, true);
    var urlQuery = urlParsed.query;
    var id = urlQuery.id;
    var promoCode = req.body.promocode;
    var message = req.body.message;
    var startDate = req.body.startdate;
    var endDate = req.body.enddate;
    var noOfUsers = req.body.noofusers;
    var minOrderAmt = req.body.minorderamt;
    var discount = req.body.discount;
    var discountType = req.body.discounttype;
    var maxDiscount = req.body.maxdiscount;
    var repeatUsage = req.body.repeat;
    var repeatUsageCode;
    var status = req.body.status;
    var statusCode;
    if (repeatUsage == "Allowed") {
        repeatUsageCode = 1;
    }

    else {
        repeatUsageCode = 0;
    }

    if (status == "Active") {
        statusCode = 1;
    }

    else {
        statusCode = 0;
    }

    var update = {
        promo_code: promoCode,
        message: message,
        start_date: startDate,
        end_date: endDate,
        no_of_users: noOfUsers,
        minimum_order_amount: minOrderAmt,
        discount: discount,
        discount_type: discountType,
        max_discount_amount: maxDiscount,
        repeat_usage: repeatUsageCode,
        status: statusCode
    };

    // models.promoCode.updateOne({ "_id": id }, { $set: update }, (err, result) => {
    //     if (err) {
    //         console.log(err);
    //     }

    //     else {
    //         // res.redirect("/promo-codes");
    //         console.log(result);
    //     }
    // })

    models.promoCode.findOneAndUpdate({ _id: id }, update, (err, result) => {
        if (err) {
            console.log(err);
        }

        else {
            console.log(result);
        }
    });
});

router.get("/orders", (req, res) => {
    models.order.find({}, (err, result) => {
        if (err) {
            console.log(err);
        }

        else {
            res.render("orders", { data: result });
        }
    });
});

router.get("/testorder", (req, res) => {
    var order = models.order({
        user_id: "U_007",
        delivery_boy_id: "D_007",
        mobile: "6375528478",
        total: 200,
        delivery_charge: 0,
        tax_amount: 40,
        tax_percentage: 20,
        wallet_balance: 500,
        discount: 0,
        promo_code: "",
        promo_discount: 0,
        final_total: 240,
        payment_method: "COD",
        address: "Address",
        latitude: "Latitude",
        longitude: "Longitude",
        delivery_time: "Time",
        status: "0",
        active_status: "Recived",
        date_added: Date.now()
    });

    order.save((err, result) => {
        if (err) {
            console.log(err);
        }

        else {
            console.log(result);
        }
    });
});

router.get("/testorderitem", (req, res) => {
    var item = models.orderItem({
        user_id: "Chirag Jangid",
        order_id: "5f56102a7d01fe1f51f5d990",
        item_name: "Item 3",
        product_variant_id: 32,
        quantity: 50,
        price: 10,
        discounted_price: 10,
        discount: 0,
        sub_total: 500,
        deliver_by: "Delivery Boy",
        status: "Recived",
        active_status: "Recived",
        date_added: Date.now()
    });

    item.save((err, result) => {
        if (err) {
            console.log(err);
        }

        else {
            res.send(result);
            console.log(result);
        }
    });
});

router.get("/view-order", (req, res) => {
    var urlParsed = url.parse(req.url, true);
    var urlQuery = urlParsed.query;
    var id = urlQuery.id;
    models.order.findById(id, (err, result) => {
        if (err) {
            console.log(err);
        }

        else {
            models.deliveryBoy.find({}, (err, result2) => {
                if (err) {
                    console.log(err);
                }

                else {
                    var information = {
                        deliveryBoys: result2,
                        order: result
                    };
                    res.render("order-details", { data: information });
                }
            });
        }
    });
});

router.post("/update-order", (req, res) => {
    var urlParsed = url.parse(req.url, true);
    var urlQuery = urlParsed.query;
    var id = urlQuery.id;
    var discount = req.body.discount;
    var deliverBy = req.body.deliver_by;
    var status = req.body.status;
    var totalPayable;
    var final_total;
    var update = {};
    models.order.findById(id, (err, result) => {
        if (err) {
            console.log(err);
        }

        else {
            if (discount != result.discount) {
                totalPayable = result.total + result.tax_amount;
                final_total = (totalPayable - 0) - (totalPayable * (discount / 100));
            }

            update = {
                delivery_boy_id: deliverBy,
                discount: discount,
                final_total: final_total,
                active_status: status
            };

            models.order.findByIdAndUpdate(id, update, (err, result) => {
                if (err) {
                    console.log(err);
                }

                else {
                    res.redirect("/orders");
                }
            });
        }
    });
});

router.get("/delete-order", (req, res) => {
    var urlParsed = url.parse(req.url, true);
    var urlQuery = urlParsed.query;
    var id = urlQuery.id;
    var urlParsed = url.parse(req.url, true);
    var urlQuery = urlParsed.query;
    var id = urlQuery.id;
    models.order.findByIdAndRemove(id, (err, result) => {
        if (err) {
            console.log(err);
        }

        else {
            res.redirect("orders");
        }
    });
});

router.get("/generate-invoice", (req, res) => {
    var urlParsed = url.parse(req.url, true);
    var urlQuery = urlParsed.query;
    var id = urlQuery.id;
    models.order.findById(id, (err, result) => {
        if (err) {
            console.log(err);
        }

        else {
            models.orderItem.find({ order_id: id }, (err, result2) => {
                var info = {
                    order: result,
                    items: result2
                };

                res.render("invoice", { data: info });
            });
        }
    });
});

router.post("/api-firebase/get-categories", (req, res) => {
    var urlParsed = url.parse(req.url, true);
    var urlQuery = urlParsed.query;
    var access_key = urlQuery.accesskey;
    var response = {
        "error": true,
        "data": null,
        "message": null
    };
    models.category.find().lean().exec((err, result) => {
        if (err) {
            console.log(err)
        }

        else {

            response.error = false;
            response.data = result;

            console.log(response);

        }

        res.send(response);
    });
});

router.post("/api-firebase/offer-images", (req, res) => {
    var urlParsed = url.parse(req.url, true);
    var urlQuery = urlParsed.query;
    var response = {
        "error": true,
        "data": null
    };

    models.offer.find({}, (err, result) => {
        if (err) {
            console.log(err);
        }

        else {
            response.error = false;
            response.data = result;
            console.log(response);
        }

        res.send(response);
    })
});

router.post("/api-firebase/sections", (req, res) => {
    var urlParsed = url.parse(req.url, true);
    var urlQuery = urlParsed.query;
    var getVal = urlQuery.getallsections;
    var productArray = [];
    var productObject;
    var variantsArray = [];
    var variantsObject;
    var sectionArray = [];
    var sectionObject;
    models.product.find({}, (err, productResult) => {
        if (err) {
            console.log(err);
        }

        else {
            
            for (let index = 0; index < productResult.length; index++) {
                models.productVariant.findOne({}, (err2, variantsResult) => {
                    if (err2) {
                        console.log(err2);
                    }

                    else {
                        if (variantsResult != null) {
                            for (let i = 0; i < variantsResult.length; i++) {
                                variantsObject = {
                                    "id": variantsResult[i].id,
                                    "product_id": variantsResult[i].product_id,
                                    "type": variantsResult[i].type,
                                    "measurment": variantsArray[i].measurment,
                                    "measurment_unit_id": variantsArray[i].measurment_unit_id,
                                    "price": variantsArray[i].price,
                                    "discounted_price": variantsArray[i].discounted_price,
                                    "serve_for": variantsArray[i].serve_for,
                                    "stock": variantsArray[i].stock,
                                    "stock_unit_id": variantsArray[i].stock_unit_id,
                                    "measurment_unit_name": variantsArray[i].measurment_unit_name,
                                    "stock_unit_name": variantsArray[i].stock_unit_name
                                };
                                variantsArray.push(variantsObject);
                            }
                        }
                    }
                });
                productObject = {
                    "id": productResult[index].id,
                    "name": productResult[index].name,
                    "slug": productResult[index].slug,
                    "category_id": productResult[index].category_id,
                    "sub_category_id": productResult[index].sub_category_id,
                    "indicator": productResult[index].indicator,
                    "image": productResult[index].image,
                    "other_images": productResult[index].other_images,
                    "description": productResult[index].description,
                    "status": productResult[index].status,
                    "date_added": productResult[index].date_added,
                    "variants": variantsArray
                };
                productArray.push(productObject);
            }
            
            models.section.find({}, (err3, sectionsResult) => {
                if (err3) {
                    console.log(err3);
                }

                else {
                    for (let j = 0; j < sectionsResult.length; j++) {
                        sectionObject = {
                            "id": sectionsResult[j].id,
                            "title": sectionsResult[j].title,
                            "short_desc": sectionsResult[j].short_description,
                            "product_ids": sectionsResult[j].product_ids,
                            "products": productArray
                        };
                        sectionArray.push(sectionObject);
                    }
                    res.send(sectionArray);
                }
            });

        }
    });
});

router.post("/api-firebase/order-process", (req, res) => {
    res.send("");
});

router.post("/api-firebase/slider-images", (req, res) => {
    var urlParsed = url.parse(req.url, true);
    var urlQuery = urlParsed.query;
    var getVal = urlQuery.getsliderimages;
    var response = {
        "error": true,
        "data": null
    };

    models.slider.find({}, (err, result) => {
        if (err) {
            console.log(err);
        }

        else {
            response.error = false;
            response.data = result;
            console.log(response);
        }

        res.send(response);
    })
});

router.post("/api-firebase/user-registration", (req, res) => {
    res.send("");
});

module.exports = router;

