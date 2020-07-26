import { environment } from './../environments/environment';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AngularFireModule } from '@angular/fire';
import { AngularFirestoreModule } from '@angular/fire/firestore';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './pages/home/home.component';
import { SummaryCardComponent } from './components/summary-card/summary-card.component';

@NgModule({
	declarations: [AppComponent, HomeComponent, SummaryCardComponent],
	imports: [
		BrowserModule,
		AppRoutingModule,
		AngularFireModule.initializeApp(environment.firebase),
		AngularFirestoreModule,
	],
	providers: [],
	bootstrap: [AppComponent],
})
export class AppModule {}
