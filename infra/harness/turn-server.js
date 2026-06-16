// 纯 JS TURN 服务器（node-turn），用于在无 sudo/无 coturn 的主机上为 harness 提供中继。
// 跑在远端（10.0.0.30，入站开放）。两端 harness 都把它当 TURN，relayOnly 走中继，绕开直连 ICE。
const Turn = require('node-turn');
const IP = process.env.TURN_IP || '10.0.0.30';
const server = new Turn({
  authMech: 'long-term',
  credentials: { vcuser: 'vcpass' },
  realm: 'veilconnect',
  listeningPort: parseInt(process.env.TURN_PORT || '34800', 10),
  listeningIps: [IP],
  relayIps: [IP],
  minPort: 60000,
  maxPort: 61000,
  debugLevel: process.env.TURN_DEBUG || 'INFO'
});
server.start();
console.log(`[turn] node-turn up on ${IP}:${process.env.TURN_PORT || '34800'} relay 60000-61000`);
