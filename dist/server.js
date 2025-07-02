"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const csv_parser_1 = __importDefault(require("csv-parser"));
const json2csv_1 = require("json2csv");
const body_parser_1 = __importDefault(require("body-parser"));
const fs_1 = __importDefault(require("fs"));
const stream_1 = require("stream");
const app = (0, express_1.default)();
const upload = (0, multer_1.default)({ dest: "uploads/" });
app.use(body_parser_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
const parseCSVFile = (filePath) => {
    return new Promise((resolve, reject) => {
        const results = [];
        fs_1.default.createReadStream(filePath)
            .pipe((0, csv_parser_1.default)())
            .on("data", (data) => results.push(data))
            .on("end", () => resolve(results))
            .on("error", (err) => reject(err));
    });
};
app.post("/csv", upload.single("file"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let data = null;
        if (req.file) {
            data = yield parseCSVFile(req.file.path);
            fs_1.default.unlinkSync(req.file.path);
        }
        else if (req.body.data) {
            if (typeof req.body.data === "string") {
                data = JSON.parse(req.body.data);
            }
            else {
                data = req.body.data;
            }
        }
        else if (req.body.csv) {
            const csvText = req.body.csv;
            data = [];
            const readable = new stream_1.Readable();
            readable.push(csvText);
            readable.push(null);
            yield new Promise((resolve, reject) => {
                readable
                    .pipe((0, csv_parser_1.default)())
                    .on("data", (row) => data.push(row))
                    .on("end", resolve)
                    .on("error", reject);
            });
        }
        if (!data) {
            res.status(400).json({ error: "No valid input provided." });
            return;
        }
        const parser = new json2csv_1.Parser();
        const csv = parser.parse(data);
        res.json({ csv, data });
    }
    catch (err) {
        console.error("Error:", err);
        res.status(500).json({ error: "Something went wrong." });
    }
}));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`CSV converter server running on port ${PORT}`);
});
