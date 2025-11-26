// backend/generarHash.js
const bcrypt = require('bcryptjs');

const password = 'admin123';

// Generar un hash con 10 rondas de sal (el estándar)
bcrypt.hash(password, 10, (err, hash) => {
  if (err) {
    console.error('Error al generar el hash:', err);
    return;
  }
  console.log('Nuevo hash para "admin123":');
  console.log(hash);
});