import { map } from 'rxjs/operators';
import { IUser } from './../../common/models/user';
import { IPeriod } from './../../common/models/period';
import { Observable } from 'rxjs';
import { UserService } from './../user/user.service';
import { AngularFirestore } from '@angular/fire/firestore';
import { Injectable } from '@angular/core';

@Injectable({
	providedIn: 'root',
})
export class PeriodsService {
	constructor(
		private readonly _afStore: AngularFirestore,
		private readonly _user: UserService
	) {}

	/** Gets currently active period  */

	getCurrent(): Observable<IPeriod> {
		return this._afStore
			.collection('users')
			.doc<IUser>(this._user.id)
			.collection<IPeriod>('periods', ref => ref.where('isClosed', '==', false))
			.valueChanges()
			.pipe(map(periods => periods[0]));
	}
}
