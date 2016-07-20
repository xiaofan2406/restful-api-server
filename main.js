const pm2 = require('pm2');

const MACHINE_NAME = 'hk1';
const {
  KEYMETRICS_PRIVATE_KEY,
  KEYMETRICS_PUBLIC_KEY,
  APP_NAME
} = require('./config/app-config');

// Set by Heroku or -1 to scale to max cpu core -1
const instances = process.env.WEB_CONCURRENCY || -1;
const maxMemory = process.env.WEB_MEMORY || 512;

pm2.connect(() => {
  pm2.start({
    script: './bin/www',
    name: APP_NAME,
    exec_mode: 'cluster',
    instances,
    max_memory_restart: `${maxMemory}M`,
    env: {
      NODE_ENV: 'production'
    },
    post_update: ['npm install']       // Commands to execute once we do a pull from Keymetrics
  }, () => {
    pm2.interact(KEYMETRICS_PRIVATE_KEY, KEYMETRICS_PUBLIC_KEY, MACHINE_NAME, () => {
      pm2.launchBus((err, bus) => {
        console.log('[PM2] Log streaming started');

        bus.on('log:out', packet => {
          console.log('[App:%s] %s', packet.process.name, packet.data);
        });

        bus.on('log:err', packet => {
          console.error('[App:%s][Err] %s', packet.process.name, packet.data);
        });
      });
    });
  });
});
