import http from "http";
import express from "express";
import SocketIO from "socket.io";

const app = express();
app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (req, res) => res.render("home"));
app.get("/*", (req, res) => res.redirect("/"));


const httpServer = http.createServer(app); // 먼저 내 http서버에 access /server-> httpServer 이름만 바꿈
const wsServer = SocketIO(httpServer); 

wsServer.on("connection", socket => {
    socket.on("join_room", (roomName) => {
        socket.join(roomName);
        socket.to(roomName).emit("welcome");
    })

    // 2.Peer A에서 보낸 offer를 받음
    socket.on("offer", (offer, roomName) => {
        socket.to(roomName).emit("offer", offer);
    });

    // 4.answer를 받으면 방에 있는 모든 사람에게 알려야 한다.
    socket.on("answer", (answer, roomName) => {
        socket.to(roomName).emit("answer", answer);
    })

   
    socket.on("ice", (ice, roomName) => {
        socket.to(roomName).emit("ice", ice);
    })

});


const handleListen = () => console.log('Listening on http://localhost:3000')
httpServer.listen(3000, handleListen);

// 컴퓨터랑 폰이 같은 wifi에 있지 않으면 에러 생긴다.
// 그래서 STUN 서버를 사용한다.
// STUN 서버는 컴퓨터가 공용 IP주소를 찾게 해준다.   