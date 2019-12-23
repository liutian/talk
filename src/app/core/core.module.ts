import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

import { SocketService } from './socket.service';
import { StoreService } from './store.service';
import { PeerService } from './peer.service';


@NgModule({
  imports: [],
  providers: [
    SocketService,
    StoreService,
    PeerService],
  declarations: []
})
export class CoreModule { }
