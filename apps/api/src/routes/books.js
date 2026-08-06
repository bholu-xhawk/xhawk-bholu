const express = require('express');

const router = express.Router();

const books = [
  { id: 1, title: 'Pride and Prejudice', author: 'Jane Austen', year: 1813 },
  { id: 2, title: 'The Left Hand of Darkness', author: 'Ursula K. Le Guin', year: 1969 },
  { id: 3, title: 'Kindred', author: 'Octavia E. Butler', year: 1979 },
];

router.get('/books', (req, res) => {
  res.json(books);
});

module.exports = router;
