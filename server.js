const express = require('express');
const app = express();
const port = process.env.PORT || 8080;

let bodyParser = require('body-parser');

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

app.get('/test', (req, res) => {
  res.send('test connection successful');
});

app.post('/connection', (req, res) => {
  let challenge = req.body.challenge;
  res.json({'challenge': challenge});
});

app.listen(port, () => {
  console.log('listening on port ' + port.toString() + '...');
});