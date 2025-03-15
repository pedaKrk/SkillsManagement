import multer from 'multer';
import path from 'path';
import fs from 'fs';


const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'profile-' + uniqueSuffix + ext);
  }
});

const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Nur Bilddateien sind erlaubt!'), false);
  }
};


export const uploadProfileImage = multer({
  storage: storage,
  limits: {
    fileSize: 20 * 1024 * 1024 // 20 MB 
  },
  fileFilter: imageFilter
}).single('profileImage');

export const handleProfileImageUpload = (req, res, next) => {
  uploadProfileImage(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          message: 'Die Datei ist zu groß. Maximale Größe: 20 MB.'
        });
      }
      return res.status(400).json({
        message: `Fehler beim Hochladen: ${err.message}`
      });
    } else if (err) {
      return res.status(400).json({
        message: err.message
      });
    }
    next();
  });
}; 