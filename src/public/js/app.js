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
        const currentCamera = myStream.getVideoTracks()[0];
        cameras.forEach(camera => {
            const option =  document.createElement("option");
            option.value = camera.deviceId;
            option.innerText = camera.label;
            if(currentCamera.label === camera.label){
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

async function initCall(){
    welcome.hidden = true;
    call.hidden = false;
    await getMedia();
    makeConnection();
}

async function handleWelcomeSubmit(event){
    event.preventDefault();
    const input = welcomeForm.querySelector("input");
    // web Socket들의 속도가 media를 가져오는 속도나 연결을 만드는 속도보다 빠르다. 
    // 그래서 getMedia 하고 makeConnection을 한다음에 이벤트를 emit해야 한다.
    await initCall();
    socket.emit("join_room", input.value);
    roomName = input.value;
    input.value = "";
}

welcomeForm.addEventListener("submit", handleWelcomeSubmit);

// Socket Code

// Peer A에서 돌아가는 코드
// 1. Peer A에서 offer를 만들고 setLocalDescription하고 Peer B로 offer를 보낸다.
socket.on("welcome", async () => {
    const offer = await myPeerConnection.createOffer();
    myPeerConnection.setLocalDescription(offer);
    console.log("sent offer")
    socket.emit("offer", offer, roomName);    
})

// 다른 브라우저인 Peer B에서 돌아가는 코드
// 3.Peer A에서 보낸 offer를 Peer B가 받아서 remoteDescription을 설정 후 answer를 보냄
socket.on("offer", async(offer) => {
    console.log("received the offer");
    myPeerConnection.setRemoteDescription(offer);
    const answer = await myPeerConnection.createAnswer();
    myPeerConnection.setLocalDescription(answer);
    socket.emit("answer", answer, roomName);    
    console.log("sent the answer");
})

// 5.Peer B에서 보낸 answer로 Peer A에서 remoteDescription을 가지게 되었다.
socket.on("answer", answer => {
    console.log("received the offer");
    myPeerConnection.setRemoteDescription(answer);
})

socket.on("ice", ice => {
    console.log("received candidate");
    myPeerConnection.addIceCandidate(ice);
})

// RTC Code


function makeConnection(){
    // Peer to Peer 연결 만들고
    myPeerConnection = new RTCPeerConnection();
    myPeerConnection.addEventListener("icecandidate", handleIce);
    myPeerConnection.addEventListener("addstream", handleAddStream);

    // track들을 개별적으로 추가해주는 함수
    // 양쪽 브라우저에서 카메라, 마이크 데이터 stream을 받아서 그것들을 연결 후 안에 집어 넣었다.
    myStream.getTracks()
    .forEach(track => myPeerConnection.addTrack(track, myStream));
}

// offer와 answer을 가지고, 그걸 받는걸 모두 끝냈을 때
// peer-to-peer 연결의 양쪽에서 icecandidate라는 이벤트를 실행하기 시작한다.
// icecandidate(Internet Connectivity Establishment(인터넷 연결 생성)candidate) 뜻?   
// IceCandidate는 webRTC에 필요한 프로토콜을 의미하는데 멀리 떨어진 장치와 소통할 수 있게 하기 위함이다. -> 브라우저가 서로 소통할 수 있게 해주는 방법
// 어떤 소통방법이 가장 좋을 것인지 제안할 때 사용
// 다수의 candidate(후보)들이 각각의 연결에서 제안되고 그들은 서로의 동의 하에 하나를 선택한다. 그리고 그것을 소통 방식에 사용한다.
// 그리고 candidate들을 다시 다른 브라우저로 보낸다.(왜냐 소통하는 방법들인 이 candidate들은 각자의 브라우저들에 의해 만들어지지만 다른 브라우저로 전송되지는 않으므로)
// Peer A , Peer B 서로서로 보내야 한다.


// ice를 받으면 그 icecandidate를 우리 서버로 보내겠다는 뜻
// Peer A와 Peer B 브라우저가 candidate들을 서로 주고 받는다는 뜻
function handleIce(data){
    console.log("sent candidate");
    socket.emit("ice", data.candidate, roomName);
}

function handleAddStream(data){
    const peerFace = document.getElementById("peerFace");
    peerFace.srcObject = data.stream;
}