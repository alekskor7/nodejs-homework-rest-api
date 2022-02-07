const express = require("express");
const createError = require("http-errors");

const { Contact, schemas } = require("../../model/contact");
const { authenticate } = require("../../middlewares");

const router = express.Router();

router.get("/", authenticate, async (req, res, next) => {
  try {
    const { page = 1, limit = 2 } = req.query;
    const skip = (page - 1) * limit;
    const { _id } = req.user;
    const contacts = await Contact.find(
      { owner: _id },
      "-createdAt -updatedAt",
      { skip, limit: +limit }
    ).populate("owner", "email");
    res.json(contacts);
  } catch (error) {
    next(error);
  }
});

router.get("/:id", authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { _id } = req.user._id;
    const contact = await Contact.find({
      $and: [{ owner: _id }, { _id: id }],
    }).populate("owner", "email");
    if (!contact) {
      // eslint-disable-next-line new-cap
      throw new createError(404, "Not found");
    } else {
      res.json(contact);
    }
  } catch (error) {
    if (error.message.includes("Cast to ObjectId failed")) {
      error.status = 404;
    }
    next(error);
  }
});

router.post("/", authenticate, async (req, res, next) => {
  try {
    const { error } = schemas.add.validate(req.body);
    if (error) {
      // eslint-disable-next-line new-cap
      throw new createError(400, "missing required name field");
    }
    const data = { ...req.body, owner: req.user._id };
    const newContact = await Contact.create(data);
    res.status(201).json(newContact);
  } catch (error) {
    if (error.message.includes("validation failed")) {
      error.status = 400;
    }
    if (error.message.includes("duplicate key error collection")) {
      error.status = 400;
    }
    next(error);
  }
  console.log(req.body);
});

router.delete("/:id", authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const deletedContact = await Contact.findByIdAndDelete(id);
    if (!deletedContact) {
      // eslint-disable-next-line new-cap
      throw new createError(404, "Not found");
    }
    res.json({ message: "contact deleted" });
  } catch (error) {
    if (error.message.includes("Cast to ObjectId failed")) {
      error.status = 404;
    }
    next(error);
  }
});

router.put("/:id", authenticate, async (req, res, next) => {
  try {
    const { error } = schemas.update.validate(req.body);
    if (error) {
      // eslint-disable-next-line new-cap
      throw new createError(400, "missing required name field");
    }
    const { id } = req.params;
    const { _id } = req.user._id;

    const updatedContact = await Contact.findOneAndUpdate(
      {
        $and: [{ owner: _id }, { _id: id }],
      },
      req.body,
      {
        new: true,
      }
    ).populate("owner", "email");
    if (!updatedContact) {
      // eslint-disable-next-line new-cap
      throw new createError(404, "Not found");
    }
    res.json(updatedContact);
  } catch (error) {
    if (error.message.includes("Cast to ObjectId failed")) {
      error.status = 404;
    }
    next(error);
  }
});

router.patch("/:id/favorite", authenticate, async (req, res, next) => {
  try {
    const { error } = schemas.favorite.validate(req.body);
    if (error) {
      // eslint-disable-next-line new-cap
      throw new createError(400, "missing field favorite");
    }
    const { id } = req.params;
    const { _id } = req.user._id;
    const { page = 1, limit = 2 } = req.query;
    const skip = (page - 1) * limit;
    const updatedStatusContact = await Contact.findOneAndUpdate(
      {
        $and: [{ owner: _id }, { _id: id }],
      },
      req.body,
      {
        new: true,
      },
      { skip, limit: +limit }
    ).populate("owner", "email");
    if (!updatedStatusContact) {
      // eslint-disable-next-line new-cap
      throw new createError(404, "Not found");
    }
    res.json(updatedStatusContact);
  } catch (error) {
    if (error.message.includes("Cast to ObjectId failed")) {
      error.status = 404;
    }
    next(error);
  }
});

module.exports = router;
