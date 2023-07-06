const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');
const User = require("../models/user");
const fs = require("fs/promises");
const path = require("path");
const gravatar = require("gravatar");
const Jimp = require("jimp");
const {nanoid} = require("nanoid");

const { userRegisretSchema,
    HttpError,
    RANDOM_KEY,
    sendEmail, 
    userEmailSchema} = require("../utils/index");


const BASE_URL = `http://localhost:3000`;
const avatarsDir = path.resolve("public", "avatars");




const signup = async (req, res, next) => {

    try {
        const { error } = userRegisretSchema.validate(req.body);

        if (error) {
            throw HttpError(400, "Missing required field")
        }

        const { email, password } = req.body;
        const user = await User.findOne({ email });    
        
        const avatarURL = gravatar.url(email);
        const verificationToken = nanoid();
   
        if (user) { 
           throw HttpError(409, "Email in use")
        }

        const hashPassword = await bcrypt.hash(password, 10);
        const newUser = await User.create({
            ...req.body,
            password: hashPassword,
            avatarURL,
            verificationToken
        });

        const verificationEmal = {
            to: email,
            subject: "Verify email",
            html: `<a target="_blank" 
            href="${BASE_URL}/api/auth/users/verify/${verificationToken}">
            Click verify link 
            </a>`
        };
          
        await sendEmail(verificationEmal);

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


const verify = async (req, res, next) => {
    
    try { 
        const { verificationToken } = req.params;
        const user = await User.findOne({ verificationToken });
         if (!user) {
             throw HttpError(404, 'User not found');
         }
        await User.findByIdAndUpdate(user._id, { verify: true, verificationToken: "" });

        res.status(200).json({ message: "Verification successful" });

    } catch (error) {
        next(error);
    }
}


const resendVerifyEmal = async (req, res, next) => {
    try {
        const { error } = userEmailSchema.validate(req.body);
        console.log(error);
        if (error) {
            throw HttpError(400, "Missing required field")
        }
        
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            throw HttpError(400, "Could not find such user");
        }

        if (user.verify) {
             throw HttpError(400, "Verification has already been passed");
        }
 

        const verificationEmal = {
            to: email,
            subject: "Verify email",
            html: `<a target="_blank" 
            href="${BASE_URL}/api/auth/users/verify/${user.verificationToken}">
            Click verify link 
            </a>`
        };

        await sendEmail(verificationEmal);
        res.status(200).json({message: "Verification email sent"})
    } catch (error) {
        next(error);
    }
    
};



const signin = async (req, res, next) => {

    try {
        const { error } = userRegisretSchema.validate(req.body);
        if (error) {
            throw HttpError(400, "Missing required field");
        }

        const { email, password } = req.body;
  
        const user = await User.findOne({ email });
        if (!user) {
            throw HttpError(401, "Email or password is wrong");
        }
        
        if (!user.verify) {
             throw HttpError(401,"Email not verified");
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
      throw HttpError(400, "Missing required file");
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
    verify,
    resendVerifyEmal,
    signin,
    getCurrent,
    logout,
    updateAvatar
};