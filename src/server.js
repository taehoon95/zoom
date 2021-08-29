import express from "express";

const app = express();
//pug 페이지 랜더링
app.set("view engine", "pug");
app.set("views", __dirname + "/views");

app.use("/public", express.static(__dirname + "/public"));

//Express로 할 일은 views를 설정해주고 render해주는 것
//유일하게 사용할 route
//res.render 으로 home을 렌더
app.get("/", (req, res) => res.render("home"));
app.get("/*", (req, res) => res.redirect("/"));

const handleListen = () => console.log(`Listening on http://localhost:3000`);
//포트 3000번
app.listen(3000, handleListen);




