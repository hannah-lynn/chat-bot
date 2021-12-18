import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { AppComponent } from './components/app/app.component';

import { ReactiveFormsModule } from '@angular/forms';
import { ConvertFile } from './helpers/convert-files';

@NgModule({
    bootstrap: [AppComponent],
    declarations: [AppComponent],
    entryComponents: [],
    imports: [BrowserModule, BrowserAnimationsModule, FontAwesomeModule, ReactiveFormsModule],
    providers: [ConvertFile]
})
export class AppModule {}
