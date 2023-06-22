const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');
const User = require("../models/user");
const fs = require("fs/promises");
const path = require("path");
const gravatar = require("gravatar");
const Jimp = require("jimp");
const { userRegisretSchema, HttpError, RANDOM_KEY } = require("../utils/index");

const avatarsDir = path.resolve("public", "avatars");




const signup = async (req, res, next) => {

    try {
        const { error } = userRegisretSchema.validate(req.body);

        if (error) {
            throw HttpError(400, "missing required field")
        }

        const { email, password } = req.body;
        const user = await User.findOne({ email });    
        
        const avatarURL = gravatar.url(email);

        if (user) { 
           throw HttpError(409, "Email in use")
        }

        const hashPassword = await bcrypt.hash(password, 10);
        const newUser = await User.create({
            ...req.body,
            password: hashPassword,
            avatarURL,
        });
        res.status(201).json({
            user: {
                email: newUser.email,
                subscription: "starter",
            }
        });
             
    } catch (error) {
        next(error);
    };
};
    

const signin = async (req, res, next) => { 
    try {
        const { error } = userRegisretSchema.validate(req.body);
        if (error) {
            throw HttpError(400, "missing required field");
        }

        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            throw HttpError(401, "Email or password is wrong");
        }
        
        const passwordCompare = await bcrypt.compare(password, user.password);

        if (!passwordCompare) {
            throw HttpError(401,"Email or password is wrong");
        }
        
        const { _id: id } = user; 
        const payload = {
            _id: user._id,     
        } 

        const token = jwt.sign(payload, RANDOM_KEY, { expiresIn: "23h" });
        await User.findByIdAndUpdate(id, { token });
         
        res.status(200).json({
            "token": token,
            user: {
                email: email,
                subscription: "starter",
            }
        });
         
     } catch (error) {
        next(error);   
     }
};


const getCurrent = async (req, res) => {
    const {email} = req.user;
    console.log(email);
    res.status(200).json({
        email,
        subscription: "starter",
    })
};


const logout = async (req, res) => {
    const { _id } = req.user;
    await User.findByIdAndUpdate(_id, { token: ""});

    res.status(202).json({ message: "logout success"});
};



const updateAvatar = async (req, res, next) => {
  try {
    const { _id } = req.user;
    if (!req.file) {
      throw HttpError(400, "missing required file");
    }

      const { path: oldPath, filename } = req.file;
      const newPath = path.join(avatarsDir, filename);


      const image = await Jimp.read(oldPath);
      image.resize(250, 250);
      await image.writeAsync(newPath);

      await fs.unlink(oldPath);
      const avatarURL = path.join("avatars", filename);

      await User.findByIdAndUpdate(_id, { avatarURL });

    res.status(200).json({
      avatarURL
    });
  } catch (error) {
    next(error);
  }
};





module.exports = {
    signup,
    signin,
    getCurrent,
    logout,
    updateAvatar
};