import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

// Define the Queue Item Type
interface QueueItem {
  id: string;
  number: number;
  name: string;
  registeredAt: number;
  calledAt?: number;
  completedAt?: number;
  status: 'waiting' | 'called' | 'completed' | 'skipped';
  remarks?: string;
}

// In-Memory Database
let queue: QueueItem[] = [];
let lastNumber = 100; // Let's start numbering at 101

// Client connections for SSE
let sseClients: express.Response[] = [];

// Helper to broadcast changes
function broadcastState() {
  const data = JSON.stringify({ queue, lastNumber });
  sseClients.forEach((client) => {
    try {
      client.write(`data: ${data}\n\n`);
    } catch (err) {
      console.error('Error broadcasting to client:', err);
    }
  });
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parsers
  app.use(express.json());

  // API Routes
  
  // 1. Get current queue state
  app.get('/api/queue', (req, res) => {
    res.json({ queue, lastNumber });
  });

  // 2. Real-time updates via Server-Sent Events (SSE)
  app.get('/api/queue/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Send immediate initial state
    res.write(`data: ${JSON.stringify({ queue, lastNumber })}\n\n`);

    // Add to active clients
    sseClients.push(res);

    // Remove client on connection close
    req.on('close', () => {
      sseClients = sseClients.filter((c) => c !== res);
    });
  });

  // 3. Register a new person (iPad)
  app.post('/api/queue', (req, res) => {
    const { name, remarks } = req.body;
    if (!name || typeof name !== 'string' || name.trim() === '') {
      res.status(400).json({ error: 'Name is required' });
      return;
    }

    lastNumber += 1;
    const newItem: QueueItem = {
      id: `${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      number: lastNumber,
      name: name.trim(),
      registeredAt: Date.now(),
      status: 'waiting',
      remarks: remarks ? String(remarks).trim() : undefined,
    };

    queue.push(newItem);
    broadcastState();
    res.status(201).json(newItem);
  });

  // 4. Update ticket status (PC)
  app.patch('/api/queue/:id', (req, res) => {
    const { id } = req.params;
    const { status, remarks } = req.body;

    const itemIndex = queue.findIndex((item) => item.id === id);
    if (itemIndex === -1) {
      res.status(404).json({ error: 'Queue item not found' });
      return;
    }

    const item = queue[itemIndex];
    if (status) {
      if (!['waiting', 'called', 'completed', 'skipped'].includes(status)) {
        res.status(400).json({ error: 'Invalid status' });
        return;
      }
      
      item.status = status as any;
      if (status === 'called') {
        item.calledAt = Date.now();
      } else if (status === 'completed') {
        item.completedAt = Date.now();
      }
    }

    if (remarks !== undefined) {
      item.remarks = remarks ? String(remarks).trim() : undefined;
    }

    queue[itemIndex] = item;
    broadcastState();
    res.json(item);
  });

  // 5. Reset queue (PC Action)
  app.post('/api/queue/reset', (req, res) => {
    queue = [];
    lastNumber = 100;
    broadcastState();
    res.json({ success: true, message: 'Queue reset successful' });
  });

  // 6. Bulk add or change queue items (for emergency operations)
  app.post('/api/queue/seed', (req, res) => {
    const { names } = req.body;
    if (Array.isArray(names)) {
      names.forEach((name) => {
        lastNumber += 1;
        queue.push({
          id: `${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          number: lastNumber,
          name: String(name).trim(),
          registeredAt: Date.now(),
          status: 'waiting',
        });
      });
      broadcastState();
      res.json({ success: true, queue });
    } else {
      res.status(400).json({ error: 'Invalid seed data' });
    }
  });

  // Serve Frontend
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Listen on PORT 3000 as mandated
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`WRO Queue server is running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
