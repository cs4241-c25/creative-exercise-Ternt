const express = require('express');
const app = express();
const port = 8080;
const url  = 'localhost'

app.use(express.static('dist'));
app.use(express.json());

app.use((req, res, next) => {
    const fullURL = `http://${req.hostname}${req.originalUrl}`
    console.log( `${req.method} ${fullURL}` );
    next();
});

app.listen(port, () => {
  console.log(`Server listening at ${url}:${port}`);
})

