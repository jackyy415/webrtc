var mediaContraints = {
    video: true
}

let localStream;
let remoteStream;
let localPeerConnection;
let remotePeerConnection;
let socket = io('https://192.168.6.173:3000');

let myUuid = uuidv4();

const offerOptions = {
    offerToReceiveVideo: 1,
};

var peerConnectionConfig = {
    'iceServers': [
      {'urls': 'stun:stun.stunprotocol.org:3478'},
      {'urls': 'stun:stun.l.google.com:19302'},
    ]
  };


async function start() {
    try {        
        let userMediaStream = await navigator.mediaDevices.getUserMedia(mediaContraints);
        localStream = userMediaStream;

        let videoElem = document.getElementById('localVideo');
        videoElem.srcObject = userMediaStream;    
        
        localPeerConnection = new RTCPeerConnection(peerConnectionConfig);
        localPeerConnection.onicecandidate = async (evt) => {
            // console.log("local onicecandidate");
            // console.log(evt);

            const peerConnection = event.target;
            const iceCandidate = event.candidate;
        
            if (iceCandidate) {
                // const newIceCandidate = new RTCIceCandidate(iceCandidate);
            //   const otherPeer = getOtherPeer(peerConnection);
        
            //   let addIceCandidateResult = await otherPeer.addIceCandidate(newIceCandidate);
                console.log("Send candidate");
                socket.emit("message", {type: 'candidate', payload: iceCandidate, uuid: myUuid});
            }
        }

        localPeerConnection.onicegatheringstatechange = (evt) => {
            // console.log("local onicegatheringstatechange");
            // console.log(evt);
        }

        localPeerConnection.ontrack = (evt) => {
            console.log("ontrack");
            console.log(evt);
            let remoteVideo = document.getElementById("remoteVideo");
            remoteVideo.srcObject = evt.streams[0];
            remoteStream = evt.stream;
            console.log(remoteVideo);
        } 

        localPeerConnection.addStream(localStream);
    } catch (e) {
        console.log("Cannot get user media stream");
        alert(e);
    }
}


async function call() {
    console.log("CALL");
    

    /*

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
*/


    
    let createOfferResult = await localPeerConnection.createOffer(offerOptions);    
    let setLocalDescriptionResult = await localPeerConnection.setLocalDescription(createOfferResult);
    socket.emit("message", {type: "offer", payload: createOfferResult, uuid: myUuid});


    /*
    let setRemoteDescriptionResult = await remotePeerConnection.setRemoteDescription(createOfferResult);
    let createAnswerResult = await remotePeerConnection.createAnswer();
    remotePeerConnection.setLocalDescription(createAnswerResult);
    localPeerConnection.setRemoteDescription(createAnswerResult);
    */


}



socket.on('connect', (obj) => {
    console.log("Connected");
    console.log(obj);
});

socket.on('message', async (obj) => {
    console.log("message");         
    console.log(obj);
    if (obj.uuid != null) {
        if (obj.uuid != myUuid) {
            if (obj.type == "offer") {
                console.log("Received offer");
                await localPeerConnection.setRemoteDescription(new RTCSessionDescription(obj.payload));
                let createAnswerResult = await localPeerConnection.createAnswer();
                await localPeerConnection.setLocalDescription(createAnswerResult);                         
                socket.emit("message", {type: "answer", payload: createAnswerResult, uuid: myUuid});
            } else if (obj.type == "answer") {
                console.log("Received answer");
                await localPeerConnection.setRemoteDescription(new RTCSessionDescription(obj.payload));
            } else if (obj.type == "candidate") {
                console.log("Received candidate");
                const newIceCandidate = new RTCIceCandidate(obj.payload);
                localPeerConnection.addIceCandidate(newIceCandidate);                
            }            
        } else {
            console.log("Ignore my own msg");
        }
    } else {
        console.log("Nth matched");
        console.log(obj);
    }    
});


socket.on('event', (data) => {
    console.log("Event");
    console.log(data);
});



socket.on('disconnect', () => {
    console.log("Disconnect");
});


function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}