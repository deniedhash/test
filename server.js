const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const uploadDir = path.join(__dirname, 'uploads');
const totalSpace = 1000000000; // Total storage space in bytes

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

var originalFileName;
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    originalFileName = req.headers['x-original-filename'];
    const uniqueSuffix = Date.now() + '_' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    cb(null, uniqueSuffix + originalFileName);
  }
});

const upload = multer({ storage,
  limits: {
    fileSize: 1000 * 1024 * 1024, // 10MB in bytes
  } });

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

app.post('/upload', upload.single('file'), (req, res) => {
  res.send('File uploaded successfully.');
});

app.delete('/delete/:fileName', (req, res) => {
  const fileName = req.params.fileName;
  const filePath = path.join(uploadDir, fileName);

  fs.unlink(filePath, (err) => {
    if (err) {
      console.error('Error deleting file:', err);
      res.status(500).send('Error deleting file.');
    } else {
      res.json('File deleted successfully.');
    }
  });
});

app.get('/storage', (req, res) => {
  const usedSpace = getTotalUsedSpace(uploadDir);
  const remainingSpace = totalSpace - usedSpace;
  res.send(remainingSpace.toString());
});

async function getTotalUsedSpace(dirPath) {
  let totalSize = 0;

  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);

    if (stat.isFile()) {
      totalSize += stat.size;
    } else if (stat.isDirectory()) {
      totalSize += getTotalUsedSpace(filePath);
    }
  });

  return totalSize;
}

const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}. Access at http://localhost/${port}`);
});
