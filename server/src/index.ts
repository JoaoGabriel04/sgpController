import "dotenv/config";
import express from "express";
import cors from "cors";
import apiRouter from "./api/routes";

const PORT = process.env.PORT || 7000;
const app = express();

app.use(
  cors({
    origin: "https://sgpcontroller.netlify.app/",
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", apiRouter);

app.listen(PORT, ()=>{
  console.log(`Servidor rodando na porta ${PORT}!`)
})
