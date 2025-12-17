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
    // Get extension from originalname, or fallback to mimetype
    let ext = path.extname(file.originalname);
    if (!ext && file.mimetype) {
      // Map mimetype to extension if originalname has no extension (e.g., "blob")
      const mimeToExt = {
        'image/jpeg': '.jpg',
        'image/jpg': '.jpg',
        'image/png': '.png',
        'image/gif': '.gif',
        'image/webp': '.webp'
      };
      ext = mimeToExt[file.mimetype] || '';
    }
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

// Multer configuration for email attachments
const emailAttachmentsStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const emailUploadsDir = path.join(process.cwd(), 'uploads', 'email-attachments');
    if (!fs.existsSync(emailUploadsDir)) {
      fs.mkdirSync(emailUploadsDir, { recursive: true });
    }
    cb(null, emailUploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'attachment-' + uniqueSuffix + ext);
  }
});

export const uploadEmailAttachments = multer({
  storage: emailAttachmentsStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB per file
    files: 5 // Max 5 attachments
  }
}).array('attachments', 5);

export const handleEmailAttachmentsUpload = (req, res, next) => {
  uploadEmailAttachments(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File is too large. Maximum size: 10 MB per file.'
        });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
          success: false,
          message: 'Too many files. Maximum: 5 attachments.'
        });
      }
      return res.status(400).json({
        success: false,
        message: `Upload error: ${err.message}`
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
    next();
  });
}; 