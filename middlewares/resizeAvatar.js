const Jimp = require("jimp");

const resizeAvatar = (path) => {
  Jimp.read(path, (err, picture) => {
    if (err) throw err;
    picture
      .resize(250, 250) // resize
      .quality(60) // set JPEG quality
      .write(path); // save
  });
};

module.exports = resizeAvatar;
