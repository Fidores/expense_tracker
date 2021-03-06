import {
	ComponentFixture,
	inject,
	TestBed,
	waitForAsync,
} from '@angular/core/testing';
import { AngularFireModule } from '@angular/fire';
import { ReactiveFormsModule } from '@angular/forms';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { Pages } from 'src/app/common/routing/routesUrls';
import { TransactionsService } from 'src/app/services/transactions/transactions.service';
import { environment } from 'src/environments/environment';

import { TestingProviders } from './../../common/test-stubs/testing-providers';
import { LoaderComponent } from './../../components/loader/loader.component';
import { AddTransactionComponent } from './add-transaction.component';

describe('AddTransactionComponent', () => {
	let component: AddTransactionComponent;
	let fixture: ComponentFixture<AddTransactionComponent>;

	beforeEach(
		waitForAsync(() => {
			TestBed.configureTestingModule({
				declarations: [AddTransactionComponent, LoaderComponent],
				imports: [
					AngularFireModule.initializeApp(environment.firebase),
					RouterTestingModule,
					MatFormFieldModule,
					MatSelectModule,
					MatDatepickerModule,
					ReactiveFormsModule,
					MatNativeDateModule,
					MatInputModule,
					NoopAnimationsModule,
				],
				providers: [
					MatDatepickerModule,
					TestingProviders.TransactionsGroupsService,
					TestingProviders.PeriodsService,
				],
			}).compileComponents();
		})
	);

	beforeEach(() => {
		fixture = TestBed.createComponent(AddTransactionComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	describe('addTransaction', () => {
		it('should call service to add transaction with form value', inject(
			[TransactionsService],
			async (transactions: TransactionsService) => {
				const form = {
					value: 'aaa',
				} as any;
				const spy = spyOn(transactions, 'add').and.returnValue(
					Promise.resolve() as any
				);

				component.form = form;
				component.addTransaction();

				expect(spy).toHaveBeenCalledWith(form.value);
			}
		));

		it('should redirect user to the home page', inject(
			[Router, TransactionsService],
			async (router: Router, transactions: TransactionsService) => {
				spyOn(transactions, 'add').and.returnValue(Promise.resolve() as any);
				const spy = spyOn(router, 'navigateByUrl').and.returnValue(
					Promise.resolve(true)
				);

				await component.addTransaction();

				expect(spy).toHaveBeenCalledWith(Pages.Home);
			}
		));
	});
});
