import express, { Request, Response } from "express";
import multer from "multer";
import csvParser from "csv-parser";
import { Parser } from "json2csv";
import bodyParser from "body-parser";
import fs from "fs";
import path from "path";
import { Readable } from "stream";

// ✅ avval app ni yaratamiz
const app = express();

// ✅ keyin static fayllarni ulaymiz
app.use(express.static(path.join(__dirname, "public")));

const upload = multer({ dest: "uploads/" });

app.post("/uploads", upload.single("file"), (req, res) => {
  res.send("File received!");
});

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

// Qolgan logika...

const parseCSVFile = (filePath: string): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const results: any[] = [];
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on("data", (data) => results.push(data))
      .on("end", () => resolve(results))
      .on("error", (err) => reject(err));
  });
};

app.post(
  "/csv",
  upload.single("file"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      let data: any[] | null = null;

      if (req.file) {
        data = await parseCSVFile(req.file.path);
        fs.unlinkSync(req.file.path);
      } else if (req.body.data) {
        data =
          typeof req.body.data === "string"
            ? JSON.parse(req.body.data)
            : req.body.data;
      } else if (req.body.csv) {
        const csvText: string = req.body.csv;
        data = [];
        const readable = new Readable();
        readable.push(csvText);
        readable.push(null);

        await new Promise<void>((resolve, reject) => {
          readable
            .pipe(csvParser())
            .on("data", (row) => data!.push(row))
            .on("end", resolve)
            .on("error", reject);
        });
      }

      if (!data) {
        res.status(400).json({ error: "No valid input provided." });
        return;
      }

      const parser = new Parser();
      const csv = parser.parse(data);

      res.json({ csv, data });
    } catch (err) {
      console.error("Error:", err);
      res.status(500).json({ error: "Something went wrong." });
    }
  }
);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`CSV converter server running on port ${PORT}`);
});
