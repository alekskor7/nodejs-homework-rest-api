const express = require('express');
const createError = require("http-errors");

const { Contact, schemas } = require('../../model/contact');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const contacts = await Contact.find({}, "-createdAt -updatedAt");
    res.json(contacts);
  } catch (error) {
    next(error);
  }
})

router.get('/:id', async (req, res, next) => {
  const { id } = req.params;
  try {
    const contact = await Contact.findById({ _id: id }, "-createdAt -updatedAt");
    if (!contact) {
      // eslint-disable-next-line new-cap
      throw new createError(404, "Not found");
    } else {res.json(contact);}
    
  } catch (error) {
    if (error.message.includes("Cast to ObjectId failed")) {
      error.status = 404;
    }
    next(error);
  }
})

router.post('/', async (req, res, next) => {
  try {
    const { error } = schemas.add.validate(req.body);
    if (error) {
      // eslint-disable-next-line new-cap
      throw new createError(400, "missing required name field");
    } else {
      const newContact = await Contact.create( req.body );
      res.status(201).json(newContact);
      }
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
})

router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const deletedContact = await Contact.findByIdAndDelete(id);
    if (!deletedContact) {
      // eslint-disable-next-line new-cap
      throw new createError(404, "Not found");
    }
    res.json({ message: 'contact deleted' });
  } catch (error) {
    if (error.message.includes("Cast to ObjectId failed")) {
      error.status = 404;
    }
    next(error);
  }
})

router.put('/:id', async (req, res, next) => {
  try {
    const { error } = schemas.update.validate(req.body);
    if (error) {
      // eslint-disable-next-line new-cap
      throw new createError(400, "missing required name field");
    }
    const { id } = req.params;
    const updatedContact = await Contact.findByIdAndUpdate(id, req.body, {new: true});
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
})

router.patch('/:id/favorite', async (req, res, next) => {
  try {
    const { error } = schemas.favorite.validate(req.body);
    if (error) {
      // eslint-disable-next-line new-cap
      throw new createError(400, "missing field favorite");
    }
    const { id } = req.params;
    const updatedStatusContact = await Contact.findByIdAndUpdate(id, req.body, {new: true});
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
})

module.exports = router
