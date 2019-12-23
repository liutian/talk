import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';

import { PeerService } from 'app/core/peer.service';
import { SocketService } from 'app/core/socket.service';

@Component({
  selector: 'app-demo',
  templateUrl: './demo.component.html',
  styleUrls: ['./demo.component.css']
})
export class DemoComponent implements OnInit {

  rtcMediaList = [];

  private offerConfirm: Subscription;
  constructor(
    private peerService: PeerService,
    private socketService: SocketService) { }

  ngOnInit() {
    const userid = Math.floor(Math.random() * 10000);
    const uuid = Math.floor(Math.random() * 10000);
    this.socketService.connect({
      serverUrl: 'https://192.168.177.144',
      namespace: '/oms4',
      connectPath: '/push',
      logicPath: '/push-logic',
      secret: '123456',
      userid: userid,
      uuid: uuid,
      option: { path: '/push/socket.io' }
    });

    this.socketService.subject.subscribe(msg1 => {
      if (msg1.type === 'connect') {
        this.socketService.joinRoom(['rtc-test']);
        this.peerService.init();

        this.socketService.subject.subscribe(msg => {
          if (msg.type === 'push' && msg.data.pushData
            && msg.data.pushData.from !== this.socketService.key
            && msg.data.pushData.type === 'preOffer') {
            const data = msg.data.pushData;
            this.rtcMediaList.push(data.from);
            this.socketService.push({
              room: 'user_' + this.socketService.parseUserId(data.from),
              pushData: {
                type: 'offerConfirm',
                from: this.socketService.key,
                auth: this.peerService.offerAuth,
                target: data.from
              }
            }).subscribe();

            if (this.peerService.getPeer(msg.data.pushData.from)) {
              console.log('createOffer again');
              this.peerService.createOffer(msg.data.pushData.from, this.peerService.getPeer(msg.data.pushData.from)._auth);
            }
          }
        });
      }
    });


  }

  shareMedia() {
    this.socketService.push({
      room: 'rtc-test',
      pushData: {
        type: 'preOffer',
        from: this.socketService.key
      }
    }).subscribe();

    this.peerService.getLocalMedia().then(stream => {
      if (this.offerConfirm) {
        this.offerConfirm.unsubscribe();
      } else {
        this.offerConfirm = this.socketService.subject.subscribe(msg => {
          if (msg.type === 'push' && msg.data.pushData
            && msg.data.pushData.type === 'offerConfirm'
            && msg.data.pushData.target === this.socketService.key) {
            let peer = this.peerService.getPeer(msg.data.pushData.from);
            if (!peer) {
              peer = this.peerService.setPeer(msg.data.pushData.from);

            }

            stream.getTracks().forEach(track => {
              peer.addTrack(track, stream);
            });

            if (!peer.localDescription.type || peer.localDescription.type === 'offer') {
              this.peerService.createOffer(msg.data.pushData.from, msg.data.pushData.auth);
            } else if (peer.localDescription.type === 'answer') {
              console.log('wait for createOffer');
              // this.peerService.createAnswer(msg.data.pushData.from, peer.remoteDescription);
            }

          }
        });
      }

    }).catch((e) => {
      alert('getLocalMedia fail : ' + e);
    });
  }



}
