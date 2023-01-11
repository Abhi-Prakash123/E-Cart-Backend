const mongoose = require("mongoose");
// NOTE - "validator" external library and not the custom middleware at src/middlewares/validate.js
const validator = require("validator");
const config = require("../config/config");
const bcrypt = require("bcryptjs");

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      validate(value) {
        if (!value.match(/\d/) || !value.match(/[a-zA-Z]/)) {
          throw new Error(
            "Password must contain at least one letter and one number"
          );
        }
      },
    },
    walletMoney: {
      type: Number,
      required: true,
      default: config.default_wallet_money,
    },
    address: {
      type: String,
      default: config.default_address,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  var user = this;
  if (!user.isModified("password")) return next();
  // const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(user.password, 10);
  user.password = hashedPassword;
  next();
});

userSchema.statics.isEmailTaken = async function (email) {
  return (await this.findOne({ email: email }).count()) > 0 ? true : false;
};

userSchema.methods.isPasswordMatch = async function (password) {
  // if(password === this.password) return Promise.resolve(true)
  console.log(password," -- ",this.password)
  await bcrypt.compare(password, this.password, function(err, result) {
    if (err) { console.log("[ error ] ",err) }
    console.log("[ info ] ",result);
});
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.hasSetNonDefaultAddress = async function () {
  const user = this;
  return user.address !== config.default_address;
};

module.exports.User = mongoose.model("User", userSchema);
