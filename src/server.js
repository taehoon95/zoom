import http from "http";
import WebSocket from "ws";
import express from "express";
import { Socket } from "dgram";

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

// fake database : 누군가 서버에 연결하면, 그 connection을 여기에 넣는다.
const sockets = [];

//backend와 연결된 각 브라우저에 대해 작동 (연결이 되면 알려주는 부분) , 연결될때 마다 작동(다른 브라우저에서) 
wss.on("connection", (socket) => {
    sockets.push(socket); // 연결 될때 마다 sockets 배열에 저장 -> 이렇게 하면 받은 메세지를 다른 모든 socket에 전달 가능
    console.log("Connected to Browser ✅");

    //socket에서 event를 listen
    //브라우저 꺼졌을때
    socket.on("close", () => console.log("Disconnected to Server ❌"));

    //message 보내기
    socket.on("message", (message) => {
        //socket.send(message.toString()); // message.toString() 안해주면 /blob값으로 들어간다.
        sockets.forEach((aSocket) => aSocket.send(message.toString())); // 연결된 브라우저로 모두 보내기 가능
    });

});

server.listen(3000, handleListen);





