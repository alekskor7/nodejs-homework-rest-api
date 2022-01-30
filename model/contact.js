const { Schema, model } = require('mongoose');
const Joi = require("joi");

const phoneRegexp = /^\+?3?8?(0\d{9})$/;

const contactSchema = Schema(
  {
    name: {
      type: String,
      required: [true, 'Set name for contact'],
    },
    email: {
      type: String,
      required: [true, 'Set email for contact'],
    },
    phone: {
      type: String,
      required: [true, 'Set phone for contact'],
      unique: true,
      match: phoneRegexp,
    },
    favorite: {
      type: Boolean,
      default: false,
    },
  },
  { versionKey: false, timestamps: true },
);

const schemaAdd = Joi.object({
  name: Joi.string().pattern(/^[a-z ,.'-]+$/i, 'name').required(),
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(phoneRegexp, 'numbers').required(),
  favorite: Joi.boolean(),
});

const schemaUpdate = Joi.object({
  name: Joi.string().pattern(/^[a-z ,.'-]+$/i, 'name'),
  email: Joi.string().email(),
  phone: Joi.string().pattern(phoneRegexp, 'numbers'),
  favorite: Joi.boolean(),
}).min(1);

const schemaUpdateFavorite = Joi.object({
  favorite: Joi.boolean().required(),
});

const Contact = model('contact', contactSchema);

module.exports = {
  Contact,
  schemas: {
    add: schemaAdd,
    update: schemaUpdate,
    favorite: schemaUpdateFavorite,
  },
}