const socket = io(); 

const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute"); 
const cameraBtn = document.getElementById("camera");
const camerasSelect = document.getElementById("cameras");


const call = document.getElementById("call");

// call : 카메라 사용
call.hidden = true;

// stream은 비디오와 오디오가 결합된것
// stream의 멋진점 track이라는 것을 제공 (비디오 track, 오디오 track, 자막 track)하고 접근도 가능
let myStream;
let muted = false;
let cameraOff = false;
let roomName;
let myPeerConnection;

// async : 비동기 키워드
// async function()은 await 키워드가 비동기 코드를 호출할 수 있게 해주는 함수
// 이제 코드가 Promise를 반환
async function getCameras(){
    try{
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter(device => device.kind === "videoinput")
        const option =  document.createElement("option");
        const currentCamera = myStream.getVideoTracks()[0].label;
        console.log(currentCamera);
        cameras.forEach(camera => {
            option.value = camera.deviceId;
            option.innerText = camera.label;
            if(currentCamera === camera.label){
                option.selected = true;
            }
            camerasSelect.appendChild(option);
        })
    }catch(e){
        console.log(e);
    }
}

async function getMedia(deviceId) {
    const initialConstrains = {
        audio : true,
        video : { facingMode : "user"},
    };
    const cameraConstraints = {
        audio : true,
        video : { deviceId: { exact: deviceId }} // 꼭 내가 지정한 비디오를 사용할때 exact 사용
    }
    try {
        myStream = await navigator.mediaDevices.getUserMedia(
            deviceId ? cameraConstraints : initialConstrains
        );
        myFace.srcObject = myStream;
        if(!deviceId){
            await getCameras();
        }
    } catch(e) {
        console.log(e);
    }
}

// getMedia();

function handleMuteClick() {
    console.log(myStream.getAudioTracks())
    myStream
        .getAudioTracks()
        .forEach((track) => (track.enabled = !track.enabled));
    if(!muted){
        muteBtn.innerText = "Unmute";
        muted = true;
    } else {
        muteBtn.innerText = "Mute";
        muted = false;
    }
}
function handleCameraClick() {
    console.log(myStream.getVideoTracks())
    myStream
        .getVideoTracks()
        .forEach((track) => (track.enabled = !track.enabled));
    if(cameraOff){
        cameraBtn.innerText = "Turn Camera Off";
        cameraOff = false;
    }else{
        cameraBtn.innerText = "Turn Camera On";
        cameraOff = true;
    }
}

// getMedia fucntion에 사용하려는 특정 카메라 id를 전송
async function handleCameraChange(){
    await getMedia(camerasSelect.value);
}

muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraClick);
camerasSelect.addEventListener("input", handleCameraChange); // 두개 이상 있어야 감지

// webRTC web Real-Time Communication : 실시간 커뮤니케이션을 가능하게 해주는 기술, peer-to-peer 연결 가능
// 이때까지 chat한 방식 : A가 B에게 메시지를 서버에 보내는 경우 A는 서버에게 메시지를 보내고 서버는 A가 보낸 메시지를 B에게 보내준다. (서버에 비용이 많이든다.)
// peer-to-peer : A가 B에게 메시지를 보내는 경우 A의 영상과 오디오 텍스트가 서버로 가지 않는다. 즉 직접 B로 간다. (signaling을 하기위해 서버가 필요하긴(브라우저로 하여금 서버는 상대가 어디에 있는지 알게 하는 용도) 하지만 영상이나 오디오를 전송하기 위해 필요하진않다.)

// welcome Form (join a room)

const welcome = document.getElementById("welcome");
const welcomeForm = welcome.querySelector("form");

async function startMedia(){
    welcome.hidden = true;
    call.hidden = false;
    await getMedia();
    makeConnection();
}

function handleWelcomeSubmit(event){
    event.preventDefault();
    const input = welcomeForm.querySelector("input");
    socket.emit("join_room", input.value, startMedia);
    roomName = input.value;
    input.value = "";
}

welcomeForm.addEventListener("submit", handleWelcomeSubmit);

// Socket Code

socket.on("welcome", () => {
    console.log("someone joined")
})

// RTC Code
function makeConnection(){
    // Peer to Peer 연결 만들고
    myPeerConnection = new RTCPeerConnection();

    // 양쪽 브라우저에서 카메라, 마이크 데이터 stream을 받아서 그것들을 연결 안에 집어 넣었다.
    myStream.getTracks()
    .forEach((track) => myPeerConnection.addTrack(track, myStream));
}