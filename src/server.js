import http from "http";
import WebSocket from "ws";
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
// app.listen(3000, handleListen);

//ws와 http를 같이 사용
const server = http.createServer(app); //내 http서버에 access
const wss = new WebSocket.Server({ server }); //내 wss서버에 access

//백엔드에서 이벤트 socket이 frontend와 실시간으로 소통할 수 있다.
//server.js의 socket은 연결된 브라우저

//backend와 연결된 각 브라우저에 대해 작동
wss.on("connection", (socket) => {
    console.log("Connected to Browser ✅");

    //socket에서 event를 listen
    //브라우저 꺼졌을때
    socket.on("close", () => console.log("Disconnected to Server ❌"));

    //message 보내기
    socket.on("message", (message) => {
        console.log(message.toString("utf-8"));
    });

    //연결 되는 순간 socket으로 hello~ 라는 메세지를 보냄
    socket.send("hello!!!"); 
});

server.listen(3000, handleListen);





