import { Injectable, Injector } from '@angular/core';
import { DocumentReference } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { first, switchMap } from 'rxjs/operators';
import {
	between,
	orderBy,
	where,
} from 'src/app/services/collection-base/dynamic-queries/helpers';

import { Cacheable } from '../../common/cash/cashable';
import { CRUDMixins } from '../collection-base/collection-base';
import { CRUD } from '../collection-base/models';
import { ITransaction } from './../../common/models/transaction';
import { PeriodsService } from './../periods/periods.service';
import { TransactionsGroupsService } from './../transactions-groups/transactions-groups.service';

interface AttachedMethods extends CRUD<ITransaction> {}

@Injectable({
	providedIn: 'root',
})
export class TransactionsService extends CRUDMixins<AttachedMethods>() {
	constructor(
		private readonly _periods: PeriodsService,
		private readonly _groups: TransactionsGroupsService,
		private readonly injector: Injector
	) {
		super('transactions', injector);
	}

	/**
	 * Gets all transactions in current period.
	 */

	@Cacheable({
		tableName: 'currentTransactions',
	})
	getAllCurrent(): Observable<ITransaction[]> {
		return this._periods
			.getCurrent()
			.pipe(
				switchMap(period =>
					this.query(
						where('date', '>=', period.date.start),
						orderBy('date', 'desc')
					)
				)
			);
	}

	/**
	 * Returns transaction between two dates.
	 * @param startAt The earliest date
	 * @param endAt The latest date
	 */
	getBetween(startAt: Date, endAt: Date): Observable<ITransaction[]> {
		if (startAt > endAt)
			throw new Error('Start date cannot be later that end date.');

		return this.query(between('date', startAt, endAt), orderBy('date', 'desc'));
	}

	/**
	 * Saves transaction in the database.
	 * Automatically replaces transaction id in group field with actual data of the group.
	 * @param transaction Transaction object to save on the server
	 * @param populateLocally If true (default) - group field will be populated before data is sent to database, if false - cloud function will take care of this behavior.
	 */

	async add(
		transaction: ITransaction,
		populateLocally = true
	): Promise<DocumentReference<ITransaction>> {
		let data: ITransaction = transaction;
		if (populateLocally)
			data = await this.populateTransactionGroup(transaction);

		return super.add(data);
	}

	/**
	 * Updates a transaction in the database.
	 * @param id Id of the transaction
	 * @param transaction New transaction
	 * @param populateLocally If true (default) - group field will be populated before data is sent to database, if false - cloud function will take care of this.
	 */

	async update(
		id: string,
		transaction: ITransaction,
		populateLocally = true
	): Promise<void> {
		let data: ITransaction = transaction;
		if (populateLocally)
			data = await this.populateTransactionGroup(transaction);

		return super.update(id, data);
	}

	/**
	 * Replaces group property that contains id of an group with actual group data.
	 * @param transaction Transaction to populate.
	 */

	private async populateTransactionGroup(
		transaction: ITransaction
	): Promise<ITransaction> {
		const group = await this._groups
			.get((transaction.group as any) as string)
			.pipe(first())
			.toPromise();

		if (group) transaction.group = group;
		return transaction;
	}
}
