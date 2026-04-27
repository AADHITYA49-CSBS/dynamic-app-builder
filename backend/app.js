const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

const configRoute = require('./routes/config');
app.use('/config', configRoute);

app.get('/', (req, res) => {
  res.send('Backend running ');
});

app.listen(5000, () => {
  console.log('Server running on port 5000');
});