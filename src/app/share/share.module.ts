import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { MediaComponent } from 'app/share/media/media.component';


@NgModule({
  imports: [
    FormsModule,
    CommonModule
  ],
  exports: [
    HttpClientModule,
    FormsModule,
    CommonModule,
    MediaComponent
  ],
  declarations: [MediaComponent]
})
export class ShareModule { }
