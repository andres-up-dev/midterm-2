import express from 'express';
import characterRoutes from './routes/characterRoutes.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Serve the static frontend from ./public
app.use(express.static('public'));

app.use('/api', characterRoutes);

app.listen(PORT, async () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
