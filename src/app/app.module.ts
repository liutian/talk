import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { CoreModule } from 'app/core/core.module';
import { AppComponent } from './app.component';
import { HomeModule } from 'app/home/home.module';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    HomeModule,
    CoreModule,
    BrowserModule
  ],
  providers: [
    { provide: 'peerConfig', useValue: {} },
    { provide: 'mediaConfig', useValue: {} }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
