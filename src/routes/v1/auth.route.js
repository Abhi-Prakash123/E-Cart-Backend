const express = require("express");
const validate = require("../../middlewares/validate");
const authValidation = require("../../validations/auth.validation");
const authController = require("../../controllers/auth.controller");

const validatedAuthRegister = validate(authValidation.register)
const validatedAuthLogin = validate(authValidation.login)
const router = express.Router();

router.post('/register',validatedAuthRegister,authController.register)
router.post('/login',validatedAuthLogin,authController.login)

module.exports = router;