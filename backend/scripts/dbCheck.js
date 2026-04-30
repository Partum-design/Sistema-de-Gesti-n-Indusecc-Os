const mongoose = require('mongoose');
require('dotenv').config();

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error('ERROR: No se encontró MONGODB_URI en .env');
  process.exit(1);
}

const run = async () => {
  try {
    console.log('Conectando a MongoDB...');
    await mongoose.connect(uri);

    const db = mongoose.connection.db;
    const dbName = db.databaseName;
    console.log(`Conectado a la base de datos: ${dbName}`);

    const collections = await db.listCollections().toArray();
    console.log(`Colecciones encontradas: ${collections.length}`);
    collections.forEach((col) => {
      console.log(`- ${col.name}`);
    });

    if (collections.some((col) => col.name === 'users')) {
      const usersCount = await db.collection('users').countDocuments();
      const sampleUser = await db.collection('users').findOne({}, { projection: { password: 0 } });
      console.log(`\nColección 'users' existe. Documentos: ${usersCount}`);
      console.log('Ejemplo de documento (sin password):');
      console.log(sampleUser || 'No hay documentos en users');
    } else {
      console.log('\nNo se encontró la colección users. Aún no se ha guardado nada allí.');
    }

    await mongoose.disconnect();
    console.log('\nDesconectado correctamente.');
  } catch (error) {
    console.error('Error en la conexión a MongoDB:', error.message);
    if (error.name === 'MongoNetworkError') {
      console.error('Revisa tu MONGODB_URI, tu IP en el whitelist de Atlas y la conexión de red.');
    }
    process.exit(1);
  }
};

run();