import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DemoComponent } from './demo/demo.component';

import { ShareModule } from 'app/share/share.module';

@NgModule({
  imports: [
    ShareModule,
    CommonModule
  ],
  declarations: [DemoComponent],
  exports: [DemoComponent]
})
export class HomeModule { }
