const app = require('./api');
const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Quotes API listening at http://localhost:${port}`);
});
