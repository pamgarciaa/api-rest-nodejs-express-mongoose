import multer from "multer";

import fs from "fs-extra";

const uploadDir = "uploads";

fs.ensureDirSync(uploadDir);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },

  filename: function (req, file, cb) {
    const ext = file.originalname.split(".").pop();

    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);

    cb(null, `${file.fieldname}-${uniqueSuffix}.${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("image only"), false);
  }
};

const upload = multer({
  storage: storage, 

  fileFilter: fileFilter, 

  limits: {
    fileSize: 1024 * 1024 * 5,
  },
});

export default upload;
