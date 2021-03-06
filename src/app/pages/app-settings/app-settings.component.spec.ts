import { FormSelectModule } from './../../components/form-select/form-select.module';
import {
	ComponentFixture,
	inject,
	TestBed,
	waitForAsync,
} from '@angular/core/testing';
import { AngularFireModule } from '@angular/fire';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { UserService } from 'src/app/services/user/user.service';
import { environment } from 'src/environments/environment';

import { TestingProviders } from './../../common/test-stubs/testing-providers';
import { CheckboxComponent } from './../../components/checkbox/checkbox.component';
import { FormFieldModule } from './../../components/form-field/form-field.module';
import { ThemesService } from './../../services/themes/themes.service';
import { AppSettingsComponent } from './app-settings.component';

describe('AppSettingsComponent', () => {
	let component: AppSettingsComponent;
	let fixture: ComponentFixture<AppSettingsComponent>;

	beforeEach(
		waitForAsync(() => {
			TestBed.configureTestingModule({
				declarations: [AppSettingsComponent, CheckboxComponent],
				imports: [
					AngularFireModule.initializeApp(environment.firebase),
					ReactiveFormsModule,
					FormsModule,
					NoopAnimationsModule,
					RouterTestingModule,
					FormSelectModule,
					FormFieldModule,
				],
				providers: [TestingProviders.UserService],
			}).compileComponents();
		})
	);

	beforeEach(() => {
		fixture = TestBed.createComponent(AppSettingsComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	describe('updateSettings', () => {
		it('should call service to update settings with form value', inject(
			[UserService],
			(user: UserService) => {
				const form = {
					value: 'aaa',
					patchValue: () => null,
				} as any;
				const spy = spyOn(user, 'updateSettings').and.returnValue(
					Promise.resolve()
				);

				component.form = form;
				component.updateSettings();

				expect(spy).toHaveBeenCalledWith(form.value);
			}
		));
	});

	describe('changeTheme', () => {
		it('should call service to change app theme', inject(
			[ThemesService],
			(themes: ThemesService) => {
				const spy = spyOn(themes, 'switchToByName');

				component.changeTheme('a' as any);

				expect(spy).toHaveBeenCalledWith('a' as any);
			}
		));
	});
});
