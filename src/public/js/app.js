const messageList = document.querySelector("ul");  
const messageForm = document.querySelector("#message");
const nickForm = document.querySelector("#nick");

//app.js socket은 서버로의 연결
const socket = new WebSocket(`ws://${window.location.host}`);

function makeMessage(type, payload) {
    const msg = {
                    type: type,
                    payload: payload
                };
    return JSON.stringify(msg);
}

socket.addEventListener("open", () => {
    console.log("Connected to Server ✅");
});

socket.addEventListener("message", (message) => {
    // 메세지를 받으면 li 태그 생성 -> 생성된 li 태그 ul에 넣는다.
    const li = document.createElement("li");
    li.innerText = message.data;
    messageList.append(li);
}) 

socket.addEventListener("close",() => {
    console.log("Disconnected to Server ❌")
})

// 메세지 전송용
function handleSubmit(event){
    event.preventDefault();
    const input = messageForm.querySelector("input");
    socket.send(makeMessage("new_message", input.value)); // 백엔드에 메세지 전송했고 다음으로 (-> 백엔드에서 메세지 받음 -> 같은 메세지를 다시 전송하고 싶음)
    input.value = "";
}

// 닉네임용
function handleNickSubmit (event){
    event.preventDefault();
    const input = nickForm.querySelector("input");
    socket.send(makeMessage("nickname",input.value));
    input.value = "";
}

messageForm.addEventListener("submit",handleSubmit);
nickForm.addEventListener("submit", handleNickSubmit);