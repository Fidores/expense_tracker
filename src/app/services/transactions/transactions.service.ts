import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { map, switchMap, take, tap } from 'rxjs/operators';

import { ITransaction } from './../../common/models/transaction';
import { PeriodsService } from './../periods/periods.service';
import { TransactionsGroupsService } from './../transactions-groups/transactions-groups.service';
import { UserService } from './../user/user.service';

@Injectable({
	providedIn: 'root',
})
export class TransactionsService {
	constructor(
		private readonly _afStore: AngularFirestore,
		private readonly _user: UserService,
		private readonly _periods: PeriodsService,
		private readonly _groups: TransactionsGroupsService
	) {}

	/**
	 * Gets all transactions in current period of currently logged in user.
	 */

	getAllCurrent(): Observable<ITransaction[]> {
		return this._periods.getCurrent().pipe(
			switchMap(period =>
				this._afStore
					.doc(`users/${this._user.id}`)
					.collection<ITransaction>('transactions', ref =>
						ref.where('date', '>=', period.date.start).orderBy('date', 'desc')
					)
					.snapshotChanges()
					.pipe(
						map(transactions =>
							transactions.map(transaction => ({
								...transaction.payload.doc.data(),
								id: transaction.payload.doc.id,
							}))
						),
						map(transactions => this.normalizeTransactionsDate(transactions))
					)
			)
		);
	}

	/**
	 * Gets one transaction with given ID.
	 * @param id Id of a transaction
	 */

	get(id: string): Observable<ITransaction> {
		return this._afStore
			.doc<ITransaction>(`users/${this._user.id}/transactions/${id}`)
			.valueChanges()
			.pipe(
				map(transaction => this.normalizeTransactionsDate([transaction])[0])
			);
	}

	/**
	 * Saves transaction on the server.
	 * Automatically replaces transaction id in group field with actual data of the group.
	 * @param transaction Transaction object to save on the server
	 * @param populateLocally If true (default) - group field will be populated before data is sent to database, if false - cloud function will take care of this.
	 */

	async add(transaction: ITransaction, populateLocally = true) {
		let data: ITransaction = transaction;
		if (populateLocally) {
			data = await this.populateTransactionGroup(transaction);
		}

		return this._afStore
			.collection('users')
			.doc(this._user.id)
			.collection<ITransaction>('transactions')
			.add(data);
	}

	/**
	 * Updates a transaction in database
	 * @param id Id of the transaction
	 * @param transaction New data
	 * @param populateLocally If true (default) - group field will be populated before data is sent to database, if false - cloud function will take care of this.
	 */

	async update(id: string, transaction: ITransaction, populateLocally = true) {
		let data: ITransaction = transaction;
		if (populateLocally) {
			data = await this.populateTransactionGroup(transaction);
		}

		return this._afStore
			.doc(`users/${this._user.id}/transactions/${id}`)
			.update(data);
	}

	private normalizeTransactionsDate(
		transactions: ITransaction[]
	): ITransaction[] {
		return transactions.map(transaction => {
			transaction.date = (transaction.date as any).toDate();
			return transaction;
		});
	}

	private async populateTransactionGroup(transaction: ITransaction) {
		const group = await this._groups
			.get((transaction.group as any) as string)
			.pipe(take(1))
			.toPromise();

		transaction.group = group;
		return transaction;
	}
}
