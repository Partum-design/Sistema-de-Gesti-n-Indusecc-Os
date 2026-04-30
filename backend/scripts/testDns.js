const dns = require('dns');
const mongoose = require('mongoose');
require('dotenv').config();

const uri = process.env.MONGODB_URI;
console.log('URI:', uri);

dns.resolveSrv('_mongodb._tcp.cluster0.yaaaozy.mongodb.net', (err, addresses) => {
  console.log('SRV err:', err);
  console.log('SRV res:', addresses);

  if (!err && addresses) {
    console.log('Intentando conectar con Mongoose...');
    mongoose.connect(uri)
      .then(() => {
        console.log('Conexión a MongoDB exitosa.');
        return mongoose.disconnect();
      })
      .catch((connectErr) => {
        console.error('Error Mongoose:', connectErr);
      });
  }
});