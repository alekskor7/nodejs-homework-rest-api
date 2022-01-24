const express = require('express');
const router = express.Router();
const createError = require("http-errors");
const Joi = require('joi');

const contactsOperations = require('../../model/index');

const schemaUpdate = Joi.object({
  name: Joi.string().pattern(/^[a-z ,.'-]+$/i, 'name').required(),
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(/^\+?3?8?(0\d{9})$/, 'numbers').required(),
});

const contactShemaUpdate = Joi.object({
  name: Joi.string().pattern(/^[a-z ,.'-]+$/i, 'name'),
  email: Joi.string().email(),
  phone: Joi.string().pattern(/^\+?3?8?(0\d{9})$/, 'numbers'),
}).min(1);


router.get('/', async (req, res, next) => {
  try {
    const contacts = await contactsOperations.listContacts();
    res.json(contacts);
  } catch (error) {
    next(error);
  }
})

router.get('/:id', async (req, res, next) => {
  const { id } = req.params;
  try {
    const contact = await contactsOperations.getContactById(id);
    if (!contact) {
      // eslint-disable-next-line new-cap
      throw new createError(404, "Not found");
    } else {res.json(contact);}
    
  } catch (error) {
    next(error);
  }
})

router.post('/', async (req, res, next) => {
  try {
    const { error } = schemaUpdate.validate(req.body);
    if (error) {
      // eslint-disable-next-line new-cap
      throw new createError(400, "missing required name field");
    } else {
      const { name, email, phone } = req.params;
      const newContact = await contactsOperations.addContact( name, email, phone );
      res.status(201).json(newContact);
      }
  } catch (error) {
    next(error);
  }
  console.log(req.body);
})

router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const deletedContact = await contactsOperations.removeContact(id);
    if (!deletedContact) {
      // eslint-disable-next-line new-cap
      throw new createError(404, "Not found");
    }
    res.json({ message: 'contact deleted' });
  } catch (error) {
    next(error);
  }
})

router.put('/:id', async (req, res, next) => {
  try {
    const { error } = contactShemaUpdate.validate(req.body);
    if (error) {
      // eslint-disable-next-line new-cap
      throw new createError(400, "missing required name field");
    }
    const { id } = req.params;
    
    const updatedContact = await contactsOperations.updateContact(id, req.body);
    if (!updatedContact) {
      // eslint-disable-next-line new-cap
      throw new createError(404, "Not found");
    }
    res.json(updatedContact);
  } catch (error) {
    next(error);
  }
})

module.exports = router
