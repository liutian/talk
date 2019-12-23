import { Injectable, Inject, Optional } from '@angular/core';

import { SocketService } from './socket.service';

@Injectable()
export class PeerService {
  // subject = new Subject<any>();
  offerAuth: string;
  private peers: { [propName: string]: RTCPeerConnection } = {};
  private localStream: MediaStream;
  private localStreamConfig: any;
  private peerDefaultConfig = {};
  private mediaDefaultConfig = {
    video: {
      width: 300,
      height: 400,
      frameRate: 21
    },
    audio: false
  };

  constructor(
    @Optional() private socketService: SocketService,
    @Inject('peerConfig') private peerConfig: any,
    @Inject('mediaConfig') private mediaConfig: any) {
    if (!socketService) {
      throw new Error('there no socketService ');
    }
    this.offerAuth = Number(Math.floor(Math.random() * 10000000)).toString(32);
  }

  init() {
    this.socketService.subject.subscribe((msg) => {
      if (msg.type !== 'push' || (msg.data.pushData && msg.data.pushData.target && msg.data.pushData.target !== this.socketService.key)) {
        return;
      }

      const pushData = msg.data.pushData;
      if (pushData.type === 'offer' && pushData.auth === this.offerAuth) {
        if (this.peers[pushData.from]) {
          this.createAnswer(pushData.from, pushData.data);
        } else {
          console.error('createAnswer but there no peer');
        }
      } else if (pushData.type === 'answer') {
        if (!this.peers[pushData.from]) {
          console.error('receive answer but there no peer');
          return;
        }

        const peer = this.getPeer(pushData.from);
        peer.setRemoteDescription(pushData.data).then(() => {
          console.log('setRemoteDescription success');
        }).catch((e) => {
          console.log('setRemoteDescription error');
        });
        peer._offerReady = false;
      } else if (pushData.type === 'icecandidate') {
        if (!this.peers[pushData.from]) {
          console.error('receive icecandidate but there no peer');
          return;
        }

        this.peers[pushData.from].addIceCandidate(pushData.data).then(() => {
          console.log('addIceCandidate success');
        }, (e) => {
          console.error('addIceCandidate error' + e);
        });
      }
    });
  }

  // 根据key 生成本地和对端直接的peer实例，key为对端标示
  setPeer(key, render?: HTMLVideoElement) {
    if (this.peers[key]) {
      this.peers[key].close();
    }

    const peer = this.initPeer(key, this.peerConfig);
    peer._render = render;
    this.peers[key] = peer;

    return this.peers[key];
  }

  getPeer(key, set?: boolean) {
    if (!this.peers[key] && set === true) {
      return this.setPeer(key);
    }

    return this.peers[key];
  }

  getLocalMedia(force?): Promise<MediaStream> {
    if (!this.localStream || force === true) {
      const localStreamConfig = Object.assign(this.mediaDefaultConfig, this.mediaConfig);
      return navigator.mediaDevices.getUserMedia(localStreamConfig).then((stream) => {
        this.localStreamConfig = localStreamConfig;
        return this.localStream = stream;
      }).catch(e => {
        if (e.name === 'ConstraintNotSatisfiedError') {
          alert('设备无法满足要求');
        } else if (e.name === 'PermissionDeniedError') {
          alert('用户禁止');
        }
        throw e;
      });
    }

    return Promise.resolve(this.localStream);
  }

  createOffer(key: string, auth?: string) {
    const peer = this.peers[key];
    if (peer._offerReady === true) {
      return;
    }
    peer._offerReady = true;
    peer._auth = auth;
    peer.createOffer().then((offer) => {
      peer.setLocalDescription(offer).then(() => {
        console.log('setLocalDescription success');
      }).catch((e) => {
        console.log('setLocalDescription error');
      });
      this.socketService.push({
        room: 'user_' + this.socketService.parseUserId(key),
        pushData: {
          type: 'offer',
          data: offer, // json
          target: key,
          from: this.socketService.key,
          auth: auth
        }
      }).subscribe();
    }).catch((error) => {
      console.error(`key: ${key} createOffer fail: ${error}`);
    });
  }

  createAnswer(key: string, offer) {
    const peer = this.peers[key];
    peer.setRemoteDescription(offer).then(() => {
      console.log('setRemoteDescription success');
    }).catch((e) => {
      console.log('setRemoteDescription error');
    });
    peer.createAnswer().then((answer) => {
      peer.setLocalDescription(answer).then(() => {
        console.log('setLocalDescription success');
      }).catch((e) => {
        console.log('setLocalDescription error');
      });
      this.socketService.push({
        room: 'user_' + this.socketService.parseUserId(key),
        pushData: {
          type: 'answer',
          data: answer,
          target: key,
          from: this.socketService.key
        }
      }).subscribe();
    }).catch((error) => {
      console.error(`key: ${key} createAnswer fail : ${error}`);
    });
  }

  private initPeer(key, config) {
    // 初始化peer实例
    const peer = new RTCPeerConnection(Object.assign(this.peerDefaultConfig, config));
    // 监听关闭事件
    peer.addEventListener('close', (e) => {
      if (this.peers[key] === peer) {
        delete this.peers[key];
      }
    });
    // 监听异常报错事件
    peer.addEventListener('error', (e) => {
      if (this.peers[key] === peer) {
        peer.close();
      }
    });
    // 监听地址探测事件
    peer.addEventListener('icecandidate', (e) => {
      if (!e.candidate) { // mark
        return;
      }
      // 将探测信息发送到对端
      this.socketService.push({
        room: 'user_' + this.socketService.parseUserId(key),
        pushData: {
          type: 'icecandidate',
          data: e.candidate,
          from: this.socketService.key,
          target: key
        }
      }).subscribe();
    });
    // 监听地址变化事件
    peer.addEventListener('negotiationneeded', (e) => {
      console.log('negotiationneeded');
      // if (!peer.localDescription.sdp || peer.localDescription.type === 'offer') {
      //   this.createOffer(key);
      // } else if (peer.localDescription.type === 'answer') {
      //   this.createAnswer(key, peer.remoteDescription);
      // }
    });
    // 监听对端音视频变化
    peer.addEventListener('track', (e: any) => {
      if (!peer._render) {
        console.error('there no render');
        return;
      }

      peer._render.srcObject = e.streams[0];
    });

    return peer;
  }
}
