import { Component, OnInit, Input, Inject, ViewChild, ElementRef, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { PeerService } from 'app/core/peer.service';

@Component({
  selector: 'app-media',
  templateUrl: './media.component.html',
  styleUrls: ['./media.component.scss']
})
export class MediaComponent implements OnInit, OnDestroy {
  @Input() width: number;
  @Input() height: number;
  @Input() key: string;
  @Input() mediaType = 'video';
  @ViewChild('selfVideo', { static: false }) selfVideo: ElementRef;
  @ViewChild('otherVideo', { static: false }) otherVideo: ElementRef;
  @ViewChild('otherAudio', { static: false }) otherAudio: ElementRef;
  boxFull: boolean;
  private peer: RTCPeerConnection;

  constructor(
    private peerService: PeerService,
  ) { }

  ngOnInit() {
    if (!this.key) {
      throw new Error('there no key');
    }

    this.peer = this.peerService.getPeer(this.key);
    const render = this.mediaType === 'video' ? this.otherVideo.nativeElement : this.otherAudio.nativeElement;

    if (this.peer) {
      this.peer._render = render;
    } else {
      this.peer = this.peerService.setPeer(this.key, render);
    }
  }

  viewFull() {
    this.boxFull = true;
  }

  viewNormal() {
    this.selfVideo.nativeElement.srcObject = null;
    this.boxFull = false;
  }

  ngOnDestroy() {
    if (this.peer) {
      this.peer.close();
    }
  }
}
