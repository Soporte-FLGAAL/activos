const app = require('./app');
const env = require('./config/env');
require('./jobs/documentMonitor');

app.listen(env.PORT, () => {
  console.log(`Servidor corriendo en puerto ${env.PORT} (${env.NODE_ENV})`);
});