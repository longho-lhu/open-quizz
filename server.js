const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { Server } = require('socket.io')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = parseInt(process.env.PORT || '3008', 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      
      if (req.method === 'POST' && parsedUrl.pathname === '/api/internal-socket') {
         let body = '';
         req.on('data', chunk => body += chunk.toString());
         req.on('end', () => {
             try {
                const data = JSON.parse(body);
                io.to(data.sessionId).emit('UPDATE', data.payload);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
             } catch (e) {
                res.writeHead(400);
                res.end('invalid json');
             }
         });
         return;
      }
      
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })

  const io = new Server(server, {
    cors: { origin: '*' }
  })

  io.on('connection', (socket) => {
    socket.on('join_session', (sessionId) => {
      socket.join(sessionId)
    })
  })

  server.once('error', (err) => {
    console.error(err)
    process.exit(1)
  })

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`)
  })
})
