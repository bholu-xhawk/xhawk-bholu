const express = require('express');

const router = express.Router();

const accordionItems = [
  {
    id: 'backend-driven-content',
    title: 'Backend-driven content',
    description: 'Accordion titles and descriptions are served by the Express API.',
  },
  {
    id: 'client-side-toggle',
    title: 'Client-side toggle state',
    description: 'React keeps track of which accordion panels are currently open.',
  },
  {
    id: 'public-demo-route',
    title: 'Public demo route',
    description: 'The accordion endpoint is public and does not require database access.',
  },
];

router.get('/accordion', (req, res) => {
  res.json(accordionItems);
});

module.exports = router;
