import http from "http";
import express from "express";
import { Server } from "socket.io";
import { instrument } from "@socket.io/admin-ui"

const app = express();
// pug 페이지 랜더링
app.set("view engine", "pug");
app.set("views", __dirname + "/views");

app.use("/public", express.static(__dirname + "/public"));

// Express로 할 일은 views를 설정해주고 render해주는 것
// 유일하게 사용할 route
// res.render 으로 home을 렌더
app.get("/", (req, res) => res.render("home"));
app.get("/*", (req, res) => res.redirect("/"));


const httpServer = http.createServer(app); // 먼저 내 http서버에 access /server-> httpServer 이름만 바꿈
const wsServer = new Server(httpServer, {
    cors: {
        origin: ["https://admin.socket.io"],
        credentials: true,
    },
}); // io -> wsServer 이름만 바꿈

instrument(wsServer, {
    auth: false
})

// public rooms를 주는 function
// sids와 rooms의 차이
// private rooms들은 sids와 rooms의 값이 같고 public rooms는 다르다.
function publicRooms(){
    // const sids = wsServer.sockets.adapter.sids;
    // const rooms = wsServer.sockets.adapter.rooms; 아래 코드와 동일
    // 아래코드는 위코드를 비구조화 할당 한것이다.
    // 비구조화 할당 장점 : 한번에 깊숙이 있는 값들을 출력할수 있다. (여기서는 sids와 rooms)
    const {
        sockets: {
            adapter: { sids, rooms}
        }
    } = wsServer;
    const publicRooms = [];
    rooms.forEach((_, key) => {
        if(sids.get(key) === undefined){
            publicRooms.push(key);
        }
    })
    return publicRooms;
}

// 방에 들어온 사람수 count
function countRoom(roomName){
    // if(wsServer.sockets.adapter.rooms.get(roomName)){
    //     return wsServer.sockets.adapter.rooms.get(roomName).size
    //     } else {
    //     return undefined;
    // } => 아래 코드와 동일
    return wsServer.sockets.adapter.rooms.get(roomName)?.size;
}

wsServer.on("connection", socket => {
    socket["nickname"] = "Anon";
    socket.onAny((event) => {
        // console.log(wsServer.sockets.adapter);
        // console.log(`Socket Event: ${event}`);
    })
    socket.on("enter_room", (roomName,done) => {
        socket.join(roomName.payload); // 방에 들어가기 위해서 join함수 쓰면됨
        done();
        socket.to(roomName.payload).emit("welcome" , socket.nickname, countRoom(roomName.payload)); // welcome 이벤트를 roomName에 있는 모든 사람들에게 emit
        wsServer.sockets.emit("room_change", publicRooms()); // 모든 메세지를 모든 socket에 보내줌
    });    
    socket.on("disconnecting" , () => {
        socket.rooms.forEach( room => socket.to(room).emit("bye", socket.nickname, countRoom(room) - 1))
    })
    socket.on("disconnect", () => {
        wsServer.sockets.emit("room_change", publicRooms());
    })
    socket.on("new_message", (msg, room, done) => {
        socket.to(room).emit("new_message", `${socket.nickname}: ${msg}`);
        done(); //done()이 백엔드에서 호출되면 프론트에서 코드 실행
    })
    socket.on("nickname" , nickname => socket["nickname"] = nickname)
    
})

const handleListen = () => console.log(`Listening on http://localhost:3000`);
httpServer.listen(3000, handleListen);
            
            
            
            
            