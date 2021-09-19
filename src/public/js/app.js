const socket = io(); // io는 자동적으로 back-end socket.iio와 연결해주는 function 
                     // 전에는 websocket이 있었는데 지금은 그냥 socketIO 의 socket
                     // SocketIO는 이미 room 기능이 있음

const welcome = document.getElementById("welcome");
const form = welcome.querySelector("form");
const room = document.getElementById("room");

room.hidden = true;

let roomName;

function addMessage(message){
    const ul = room.querySelector("ul");
    const li = document.createElement("li");
    li.innerText = message;
    ul.appendChild(li);
}

function handleMessageSubmit(event){
    event.preventDefault();
    const input = room.querySelector("#msg input");
    const value = input.value;
    socket.emit("new_message", input.value, roomName, () => {
        addMessage(`You: ${value}`);
    });
    input.value = "";
}

function handleNicknameSubmit(event){
    event.preventDefault();
    const input = room.querySelector("#name input"); //querySelector 항상 첫번째것만 가져옴
    socket.emit("nickname", input.value);
}

function showRoom(){
    welcome.hidden = true;
    room.hidden = false;
    const h3 = room.querySelector("h3");
    h3.innerText = `Room ${roomName}`;
    const msgForm = room.querySelector("#msg");
    const nameForm = room.querySelector("#name");
    msgForm.addEventListener("submit", handleMessageSubmit);
    nameForm.addEventListener("submit", handleNicknameSubmit);
}

function handleRoomSubmit(event){
    event.preventDefault();
    const input = form.querySelector("input");
    // 1. 특정한 event를 emit 
    // 2. 전송할때 아무거나 전송 가능 (object 포함)
    // emit 과 on은 같은 이름(같은 String) "enter_room"
    // 첫번째 argument(여기서는 JSON object로 보냄) : {payload : input.value}
    // 두번째 argument : function
    socket.emit("enter_room", { payload:input.value },showRoom); // object를 string으로 변환 시킬 필요 없이 사용가능
    roomName = input.value;
    input.value = "";
}

form.addEventListener("submit", handleRoomSubmit);

// 방안의 사람수 작성 : welcome과 byed에 반복되는 문장 있어서 만듬 
function textCount(newCount){
    const h3 = room.querySelector("h3");
    h3.innerText = `Room ${roomName} (${newCount})`;
}

socket.on("welcome", (user ,newCount) => {
    textCount(newCount)
    addMessage(`${user} arrived!`); 
})

socket.on("bye", (left ,newCount) => {
    textCount(newCount)
    addMessage(`${left} left ㅠㅠ`); 
})

socket.on("new_message", addMessage);
// (msg) => addMessage(msg) 랑 addMessage 똑같이 작동

socket.on("room_change", (rooms) => {
    const roomList = welcome.querySelector("ul");
    roomList.innerHTML = "";
    if(rooms.length === 0){
        return
    }
    rooms.forEach((room) => {
        const li = document.createElement("li");
        li.innerText = room;  
        roomList.append(li)
    });
});