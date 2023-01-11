const httpStatus = require("http-status");
const userService = require("./user.service");
const ApiError = require("../utils/ApiError");

const loginUserWithEmailAndPassword = async (email, password) => {
  const temp = await userService.getUserByEmail(email)
  if(temp){
    const isLoginAllowed = await temp.isPasswordMatch(password)

    if(isLoginAllowed === true) return temp
  }
  throw new ApiError(httpStatus.UNAUTHORIZED,"Incorrect email or password");
  
};

module.exports = {
  loginUserWithEmailAndPassword,
};
