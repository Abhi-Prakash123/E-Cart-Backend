const { User } = require("../models");
const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");

async function getUserById(id) {
    try {
        const userResult = await User.findOne({ _id: id });
        return userResult;
    } catch (error) {
        throw error;
    }
}

async function getUserByEmail(email) {
    try {
        return await User.findOne({ email });
    } catch (error) {
        throw error;
    }
}

async function createUser(user) {
    const { name, email, password } = user;
    const isMailTaken = await User.isEmailTaken(email);
    if (isMailTaken) throw new ApiError(httpStatus.OK, "Email already taken");
    // const hashedPassword = hashPassword(password)
    return await User.create({ name, email, password });
}

const getUserAddressById = async (id) => {
    const userAddress = await User.findOne({ _id: id }, { "address": 1, "email": 1 });
    if (userAddress === null) {
        throw ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Invalid user");
    }
    return userAddress;
};


const setAddress = async (user, newAddress) => {
    await User.updateOne({email:user.email},{"$set":{address: newAddress}})
    return await User.find({email:user.email}).address
};

module.exports = {
    getUserById,
    getUserByEmail,
    createUser,
    getUserAddressById,
    setAddress,
};
