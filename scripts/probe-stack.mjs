#!/usr/bin/env node
import net from 'node:net';
import http from 'node:http';
import fs from 'node:fs';

const sock = process.env.DOCKER_HOST?.replace('unix://', '')
  || '/Users/dariorivera/.lima/docker/sock/docker.sock';

function probePort(host, port) {
  return new Promise((resolve) => {
    const s = net.connect({ host, port }, () => {
      s.end();
      resolve({ host, port, ok: true });
    });
    s.on('error', (e) => resolve({ host, port, ok: false, error: e.message }));
    s.setTimeout(2000, () => {
      s.destroy();
      resolve({ host, port, ok: false, error: 'timeout' });
    });
  });
}

function dockerRequest(path, method = 'GET') {
  return new Promise((resolve) => {
    const req = http.request(
      {
        socketPath: sock,
        path,
        method,
        headers: { Host: 'localhost' },
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () =>
          resolve({ status: res.statusCode, body: data.slice(0, 2000) }),
        );
      },
    );
    req.on('error', (e) => resolve({ status: 0, error: e.message }));
    req.setTimeout(5000, () => {
      req.destroy();
      resolve({ status: 0, error: 'timeout' });
    });
    req.end();
  });
}

const ports = await Promise.all([
  probePort('127.0.0.1', 3306),
  probePort('127.0.0.1', 3307),
  probePort('127.0.0.1', 8080),
]);
console.log('PORTS', JSON.stringify(ports, null, 2));

console.log('DOCKER_SOCK', sock, fs.existsSync(sock) ? 'exists' : 'missing');
const containers = await dockerRequest('/containers/json?all=1');
console.log('DOCKER_LIST', JSON.stringify(containers).slice(0, 1500));
