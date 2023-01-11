const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const { authService, userService, tokenService } = require("../services");

/**
 * Perform the following steps:
 * -  Call the userService to create a new user
 * -  Generate auth tokens for the user
 * -  Send back
 * --- "201 Created" status code
 * --- response in the given format
 *
*/
const register = catchAsync(async (req, res) => {
  // console.log(req.body)
  const data = await userService.createUser(req.body)
  const tokenData = await tokenService.generateAuthTokens(data)
  const payload = {
    user:data,
    tokens:tokenData
  }
  res.status(httpStatus.CREATED).send(payload)
});

/**
 * Perform the following steps:
 * -  Call the authservice to verify is password and email is valid
 * -  Generate auth tokens
 * -  Send back
 * --- "200 OK" status code
 * --- response in the given format
 *
 */
const login = catchAsync(async (req, res) => {
    console.log(req.body)
  const {email, password} = req.body
  const data = await authService.loginUserWithEmailAndPassword(email, password)
  const tokenData = await tokenService.generateAuthTokens(data)
  const payload = {
    user:data,
    tokens:tokenData
  }
  res.status(httpStatus.OK).send(payload)
});

module.exports = {
  register,
  login,
};
