/* SystemJS module definition */
interface Window {
  LazyLoad: any;
  io: any;
  eruda: any;
  SIP: any;
}

interface RTCPeerConnection {
  _target: any;
  _render: HTMLVideoElement;
  _offerReady: boolean;
  _answerReady: boolean;
  _auth: string;
  // addTrack: Function;
}

interface RTCConfiguration {
  iceCandidatePoolSize?: number;
  // rtcpMuxPolicy?: string;
}

interface Navigator {
  // mediaDevices: any;
}