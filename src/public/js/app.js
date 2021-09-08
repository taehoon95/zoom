const messageList = document.querySelector("ul");  
const messageForm = document.querySelector("form");

//app.js socket은 서버로의 연결
const socket = new WebSocket(`ws://${window.location.host}`);

socket.addEventListener("open", () => {
    console.log("Connected to Server ✅");
});

socket.addEventListener("message", (message) => {
    console.log("New message :", message.data);
}) 

socket.addEventListener("close",() => {
    console.log("Disconnected to Server ❌")
})


function handleSubmit(event){
    event.preventDefault();
    const input = messageForm.querySelector("input");
    socket.send(input.value); // 백엔드에 메세지 전송했고 다음으로 (-> 백엔드에서 메세지 받음 -> 같은 메세지를 다시 전송하고 싶음)
    input.value = "";
}

messageForm.addEventListener("submit",handleSubmit)
