import {
	AfterContentInit,
	ChangeDetectorRef,
	Component,
	ContentChild,
	ElementRef,
	HostListener,
	OnDestroy,
	OnInit,
	ViewChild,
} from '@angular/core';
import { merge, Subscription } from 'rxjs';

import { FormFieldControl } from './../form-field-control';

@Component({
	selector: 'form-field',
	templateUrl: './form-field.component.html',
	styleUrls: ['./form-field.component.scss'],
})
export class FormFieldComponent implements OnInit, AfterContentInit, OnDestroy {
	constructor(private readonly _changeDetector: ChangeDetectorRef) {}

	private readonly _subscriptions = new Subscription();

	@ContentChild(FormFieldControl) control: FormFieldControl;
	@HostListener('click', ['$event']) onClick($event: MouseEvent) {
		this.control.onContainerClick();
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
}