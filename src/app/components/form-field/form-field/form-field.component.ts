import { FormFieldErrorsService } from './../form-field-errors.service';
import {
	AfterContentInit,
	ChangeDetectorRef,
	Component,
	ContentChild,
	HostListener,
	OnDestroy,
	OnInit,
} from '@angular/core';
import { merge, Subscription } from 'rxjs';

import { FormFieldControl } from './../form-field-control';
import { FormFieldLabelComponent } from './../form-field-label/form-field-label.component';

@Component({
	selector: 'form-field',
	templateUrl: './form-field.component.html',
	styleUrls: ['./form-field.component.scss'],
})
export class FormFieldComponent implements OnInit, AfterContentInit, OnDestroy {
	constructor(
		private readonly _changeDetector: ChangeDetectorRef,
		private readonly _errors: FormFieldErrorsService
	) {}

	private readonly _subscriptions = new Subscription();

	@ContentChild(FormFieldLabelComponent) label: FormFieldLabelComponent;
	@ContentChild(FormFieldControl) control: FormFieldControl;
	@HostListener('click') onClick() {
		if ('onContainerClick' in this.control) {
			this.control.onContainerClick();
		}
	}

	ngOnInit(): void {
		this._changeDetector.detach();
	}

	ngOnDestroy(): void {
		this._subscriptions.unsubscribe();
	}

	ngAfterContentInit() {
		this._subscriptions.add(
			merge(
				this.control.ngControl.statusChanges,
				this.control.onStateChange
			).subscribe(this._onChildStateChange.bind(this))
		);

		if ('registerFormFieldRefs' in this.control) {
			this.control.registerFormFieldRefs({
				label: this.label,
			});
		}

		this._changeDetector.detectChanges();
	}

	get shouldLabelFloat(): boolean {
		return this.control.shouldLabelFloat;
	}

	/** Should be called whenever change detection is required */
	private _onChildStateChange() {
		this._changeDetector.detectChanges();
	}

	get isValid() {
		return this.control.ngControl.valid;
	}

	get isInvalid() {
		return this.control.ngControl.invalid;
	}

	get isTouched() {
		return this.control.ngControl.touched;
	}

	get isDisabled() {
		return this.control.ngControl.disabled;
	}

	get errors(): string[] {
		return Object.keys(this.control.ngControl.errors).map(error =>
			this._errors.getMessage(error)
		);
	}
}
