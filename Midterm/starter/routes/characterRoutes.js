import { Router } from 'express';
import { getCharacters, getCharacter } from '../services/starwars-service.js';

const router = Router();

router.get('/', (req, res) => {
  const search = (req.query.search || '').toLowerCase();
  const results = getCharacters(search);

  if (results.length === 0) {
    return res.status(404).json({ error: 'No character found' });
  }

  res.json(results);
});

router.get('/:id', (req, res) => {
  const character = getCharacter(req.params.id);

  if (!character) {
    return res.status(404).json({ error: 'Character not found' });
  }

  res.json(character);
});

export default router;
