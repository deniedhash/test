const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const uploadDir = path.join(__dirname, 'uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

app.use(bodyParser.raw({ type: '*/*', limit: '10mb' })); // Increase the limit to accept larger file uploads

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/files', (req, res) => {
  fs.readdir(uploadDir, (err, files) => {
    if (err) {
      console.error('Error reading directory:', err);
      res.status(500).send('Error reading directory.');
    } else {
      res.send(files);
    }
  });
});

app.get('/download/:fileName', (req, res) => {
  const fileName = req.params.fileName;
  const filePath = path.join(uploadDir, fileName);

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      console.error('Error retrieving file:', err);
      res.status(404).send('File not found.');
    } else {
      res.download(filePath, fileName, (err) => {
        if (err) {
          console.error('Error downloading file:', err);
          res.status(500).send('Error downloading file.');
        }
      });
    }
  });
});

app.post('/upload', (req, res) => {
  const fileData = req.body;

  const originalFileName = req.headers['x-original-filename'];
  const fileName = Date.now().toString() + '_' + originalFileName;

  const filePath = path.join(uploadDir, fileName);

  fs.writeFile(filePath, fileData, (error) => {
    if (error) {
      console.error('Error saving file:', error);
      res.status(500).send('Error saving file.');
    } else {
      res.send('File uploaded successfully.');
    }
  });
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}. Access at https://localhost:3000`);
});