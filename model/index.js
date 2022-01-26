const fs = require('fs').promises;
const path = require('path');
const { uuid } = require('uuidv4');

const contactsPath = path.join(__dirname, 'contacts.json');

const listContacts = async () => {
  try {
    const data = await fs.readFile(contactsPath, 'utf8');
    const contacts = JSON.parse(data);
    return contacts;
  } catch (error) {
    console.error(error.message);
  }
};

const getContactById = async (contactId) => {
  try {
    const contactsList = await listContacts();
    const contact = contactsList.find(contact => contact.id === contactId);
    return contact;
  } catch (error) {
    console.error(error.message);
  }
};

const removeContact = async (contactId) => {
  try {
    const contactsList = await listContacts();
    const contactIndex = contactsList.findIndex(contact => contact.id === contactId);

    const updatedContacts = contactsList.filter(contact => contact.id !== contactId);
    await fs.writeFile(contactsPath, JSON.stringify(updatedContacts, null, 2));
    return contactsList[contactIndex];
  } catch (error) {
    console.error(error.message);
  }
};

const addContact = async (name, email, phone) => {
  try {
    const contacts = await listContacts();
    const newContact = {id: uuid(), name, email, phone }
    contacts.push(newContact)
    await fs.writeFile(contactsPath, JSON.stringify(contacts, null, 2),)
    return newContact;
  } catch (error) {
      console.error(error.message);
  }
};

const updateContact = async (id, name, email, phone) => {
  try {
    const contacts = await listContacts();
    const contactIndex = contacts.findIndex(contact => contact.id === id)
    if (contactIndex === -1) {
      return null
    }
    contacts[contactIndex] = { id, name, email, phone }
    await fs.writeFile(contactsPath, JSON.stringify(contacts, null, 2))
    return contacts[contactIndex]
    
  } catch (error) {
    console.error(error.message)
  }
}

module.exports = {
  listContacts,
  getContactById,
  removeContact,
  addContact,
  updateContact,
}
