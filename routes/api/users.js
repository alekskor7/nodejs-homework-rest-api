const express = require("express");
const createError = require("http-errors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");
const fs = require("fs").promises;
const gravatar = require("gravatar");
const { sendMail } = require("../../helpers");
const { uuid } = require("uuidv4");

const { authenticate } = require("../../middlewares");
const { upload } = require("../../middlewares");
const { resizeAvatar } = require("../../middlewares");

const { User, schemas } = require("../../model/user");

const router = express.Router();

const { SECRET_KEY } = process.env;

// SIGN UP
router.post("/signup", async (req, res, next) => {
  try {
    const { error } = schemas.register.validate(req.body);
    if (error) {
      //   eslint-disable-next-line new-cap
      throw new createError(400, error.message);
    } else {
      const { email, password } = req.body;
      let { subscription } = req.body;
      if (!subscription) {
        subscription = "starter";
      }

      const user = await User.findOne({ email });
      if (user) {
        // eslint-disable-next-line new-cap
        throw new createError(409, "Email in use");
      }
      const salt = await bcrypt.genSalt(10);
      const hashPassword = await bcrypt.hash(password, salt);
      const avatarURL = gravatar.url(email);
      const verificationToken = uuid();
      const result = await User.create({
        email,
        password: hashPassword,
        verificationToken,
        avatarURL,
        subscription,
      });

      console.log(result);
      const mail = {
        to: email,
        subject: "Подтверждение email",
        html: `<a target="_blank" href="http://localhost:3000/api/users/verify/${verificationToken}"> Нажмите чтобы подтвердить свой email</a>`,
      };
      await sendMail(mail);
      res.status(201).json({
        user: {
          email,
          avatarURL,
          subscription,
        },
      });
    }
  } catch (error) {
    next(error);
  }
});

// VERIFICATION EMAIL
router.get("/verify/:verificationToken", async (req, res, next) => {
  try {
    const { verificationToken } = req.params;
    const user = await User.findOne({ verificationToken });
    if (!user) {
      // eslint-disable-next-line new-cap
      throw new createError(404, "User not Found");
    }
    await User.findByIdAndUpdate(user._id, {
      verify: true,
      verificationToken: "",
    });

    res.status(200).json({
      message: "Verification successful",
    });
  } catch (error) {
    next(error);
  }
});

// REPEAT VERIFICATION EMAIL
router.post("/verify", async (req, res, next) => {
  try {
    const { error } = schemas.verify.validate(req.body);

    if (error) {
      // eslint-disable-next-line new-cap
      throw new createError(400, "missing required field email");
    }
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (user.verify) {
      // eslint-disable-next-line new-cap
      throw new createError(400, "Verification has already been passed");
    }
    const mail = {
      to: email,
      subject: "Подтверждение email",
      html: `<a target="_blank" href='http://localhost:3000/api/users/verify/${user.verificationToken}'> Нажмите чтобы подтвердить свой email</a>`,
    };
    await sendMail(mail);

    res.status(200).json({
      message: "Verification email sent",
    });
  } catch (error) {
    next(error);
  }
});

// LOG IN
router.post("/login", async (req, res, next) => {
  try {
    const { error } = schemas.login.validate(req.body);
    if (error) {
      // eslint-disable-next-line new-cap
      throw new createError(400, error.message);
    } else {
      const { email, password } = req.body;
      const user = await User.findOne({ email });

      if (!user) {
        // eslint-disable-next-line new-cap
        throw new createError(401, "Email or password is wrong");
      }

      if (!user.verify) {
        // eslint-disable-next-line new-cap
        throw new createError(401, "Email not verify");
      }

      const compareResult = await bcrypt.compare(password, user.password);
      if (!compareResult) {
        // eslint-disable-next-line new-cap
        throw new createError(401, "Email or password is wrong");
      }

      const payload = {
        id: user._id,
      };
      const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "1h" });
      await User.findByIdAndUpdate(user._id, { token });

      const { subscription } = user;

      res.status(200).json({
        token,
        user: {
          email,
          subscription,
        },
      });
    }
  } catch (error) {
    next(error);
  }
});

// CURRENT USER

router.get("/current", authenticate, async (req, res, next) => {
  res.json({
    email: req.user.email,
    subscription: req.user.subscription,
  });
});

// LOG OUT

router.get("/logout", authenticate, async (req, res, next) => {
  const { _id } = req.user;
  await User.findByIdAndUpdate(_id, { token: "" });
  res.status(204).send();
});

const avatarsDir = path.join(__dirname, "../../", "public", "avatars");

router.patch(
  "/avatars",
  authenticate,
  upload.single("avatar"),
  async (req, res, next) => {
    const { _id } = req.user;
    const { path: tempUpload, filename } = req.file;
    try {
      const [extention] = filename.split(".").reverse();
      const newFileName = `${_id}.${extention}`;
      const resultUpload = path.join(avatarsDir, newFileName);
      await fs.rename(tempUpload, resultUpload);
      const avatarURL = path.join("avatars", newFileName);
      await User.findByIdAndUpdate(_id, { avatarURL });
      await resizeAvatar(resultUpload);
      res.json({
        avatarURL,
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
