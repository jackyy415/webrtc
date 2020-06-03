var mediaContraints = {
    video: true
}

let localStream;
let remoteStream;
let localPeerConnection;
let remotePeerConnection;

const offerOptions = {
    offerToReceiveVideo: 1,
};


async function start() {
    try {
        let userMediaStream = await navigator.mediaDevices.getUserMedia(mediaContraints);
        localStream = userMediaStream;

        let videoElem = document.getElementById('localVideo');
        videoElem.srcObject = userMediaStream;           
    } catch (e) {
        console.log("Cannot get user media stream");
    }
}


async function call() {
    console.log("CALL");
    localPeerConnection = new RTCPeerConnection(null);
    localPeerConnection.onicecandidate = async (evt) => {
        console.log("local onicecandidate");
        // console.log(evt);

        const peerConnection = event.target;
        const iceCandidate = event.candidate;
      
        if (iceCandidate) {
          const newIceCandidate = new RTCIceCandidate(iceCandidate);
          const otherPeer = getOtherPeer(peerConnection);
      
          let addIceCandidateResult = await otherPeer.addIceCandidate(newIceCandidate);
            
        }
    }

    localPeerConnection.onicegatheringstatechange = (evt) => {
        // console.log("local onicegatheringstatechange");
        // console.log(evt);
    }


    remotePeerConnection = new RTCPeerConnection(null);
    remotePeerConnection.onicecandidate = (evt) => {
        console.log("remote onicecandidate");
        console.log(evt);
    }
    remotePeerConnection.onicegatheringstatechange = (evt) => {
        // console.log("remote onicegatheringstatechange");
        // console.log(evt);
    }
    remotePeerConnection.ontrack = (evt) => {
        console.log("remote ontrack");
        console.log(evt);
        let remoteVideo = document.getElementById("remoteVideo");
        remoteVideo.srcObject = evt.streams[0];
        remoteStream = evt.stream;
    }



    localPeerConnection.addStream(localStream);
    let createOfferResult = await localPeerConnection.createOffer(offerOptions);    
    let setLocalDescriptionResult = await localPeerConnection.setLocalDescription(createOfferResult);
    


    let setRemoteDescriptionResult = await remotePeerConnection.setRemoteDescription(createOfferResult);
    let createAnswerResult = await remotePeerConnection.createAnswer();
    remotePeerConnection.setLocalDescription(createAnswerResult);
    localPeerConnection.setRemoteDescription(createAnswerResult);


}


function getOtherPeer(peerConnection) {
    return (peerConnection === localPeerConnection) ?
        remotePeerConnection : localPeerConnection;
}

const socket = new WebSocket('ws://localhost:3000/socket.io/?EIO=3&transport=websocket');

// Connection opened
socket.addEventListener('open', function (event) {
    socket.send('Hello Server!');
}); 

// Listen for messages
socket.addEventListener('message', function (event) {
    console.log('Message from server ', event.data);
});