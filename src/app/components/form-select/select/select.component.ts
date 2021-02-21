import { first } from 'rxjs/operators';
import { OverlayService } from '../../../services/overlay/overlay.service';
import { transition, trigger, useAnimation } from '@angular/animations';
import {
	AfterContentInit,
	ChangeDetectorRef,
	Component,
	ContentChildren,
	Directive,
	ElementRef,
	EmbeddedViewRef,
	forwardRef,
	Injector,
	OnDestroy,
	OnInit,
	QueryList,
	Renderer2,
	TemplateRef,
	ViewChild,
} from '@angular/core';
import {
	ControlValueAccessor,
	NG_VALUE_ACCESSOR,
	NgControl,
} from '@angular/forms';
import { Subject, Subscription } from 'rxjs';

import { fadeIn, fadeOut } from '../../../animations';
import {
	FormFieldControl,
	IFormFieldRefs,
} from '../../form-field/form-field-control';
import { SelectOptionComponent } from '../select-option/select-option.component';

/** Option height in em unit. */
export const SELECT_OPTION_HEIGHT_EM = 2.625;

/** How many options are visible at once */
export const SELECT_OPTION_VISIBLE_COUNT = 4;

@Component({
	selector: 'app-select',
	templateUrl: './select.component.html',
	styleUrls: ['./select.component.scss'],
	providers: [
		{
			provide: NG_VALUE_ACCESSOR,
			useExisting: forwardRef(() => SelectComponent),
			multi: true,
		},
	],
	animations: [
		trigger('dropdownAnimation', [
			transition(':enter', useAnimation(fadeIn)),
			transition(':leave', useAnimation(fadeOut)),
		]),
	],
	host: {
		'(document:keydown)': '_dropdownKeyboardNavigation($event)',
	},
})
export class SelectComponent
	implements
		OnInit,
		FormFieldControl,
		ControlValueAccessor,
		AfterContentInit,
		OnDestroy {
	constructor(
		private readonly _injector: Injector,
		private readonly _changeDetector: ChangeDetectorRef,
		private readonly _overlay: OverlayService,
		private readonly _hostRef: ElementRef<HTMLElement>,
		private readonly _renderer: Renderer2
	) {}

	@ViewChild('selectDropdown') dropdownRef: TemplateRef<HTMLElement>;

	@ContentChildren(SelectOptionComponent)
	options: QueryList<SelectOptionComponent>;
	currentOption: SelectOptionComponent;

	private readonly _optionsSubscriptions = new Subscription();
	private _isOpened = false;
	private _currentlyFocusedOption: SelectOptionComponent;
	private _onChange: (value: string) => void;
	private _onTouched: () => void;
	private _isDisabled: boolean = false;
	private _initialValue: string = '';
	private _labelId: string = '';

	/** Id of the element that displays currently selected option. Mainly for aria attributes. */
	private _selectedOptionElID: string = `select-btn-${window[
		'uniqueNumber'
	]++}`;

	// ControlValueAccessor implementation
	writeValue(value: any): void {
		/*
			We can only select an option in AfterContentInit lifecycle hook.
			It would be too early to choose it here, so we store passed value in a variable
			and let ngAfterContentInit function handle this value later. 
		*/
		this._initialValue = value;
	}

	registerOnChange(fn: any): void {
		this._onChange = fn;
	}

	registerOnTouched(fn: any): void {
		this._onTouched = fn;
	}

	setDisabledState(isDisabled: boolean): void {
		this._isDisabled = isDisabled;
		this._changeDetector.markForCheck();
		if (isDisabled) this.close();
	}
	// ^^^ ControlValueAccessor implementation ^^^

	// FormFieldControl implementation
	get shouldLabelFloat(): boolean {
		return this._isOpened || this.currentOption.value !== '';
	}

	get isFocused(): boolean {
		return this._isOpened;
	}

	onStateChange = new Subject<void>();

	ngControl: NgControl;

	onContainerClick(): void {
		this.toggle();
	}

	registerFormFieldRefs(refs: IFormFieldRefs) {
		this._labelId = refs.label.id;
	}
	// ^^^ FormFieldControl implementation ^^^

	/** Opens select dropdown */
	open() {
		if (!this._isOpened && !this._isDisabled) {
			this._isOpened = true;
			this.focusOption(this.currentOption);
			const dropdownViewRef = this._overlay.open(this.dropdownRef, null, {
				transparent: true,
			}) as EmbeddedViewRef<HTMLElement>;

			this._positionDropdown(dropdownViewRef.rootNodes[0] as HTMLElement);
			this._scrollToCurrentOption(dropdownViewRef.rootNodes[0] as HTMLElement);

			this._overlay.onClick$.pipe(first()).subscribe(() => this.close());
			this.onStateChange.next();
		}
	}

	/** Closes select dropdown */
	close() {
		if (this._isOpened) {
			this._isOpened = false;
			this._currentlyFocusedOption.blur();
			this._overlay.close();
			this.onStateChange.next();
		}
	}

	/** Toggles select dropdown */
	toggle() {
		this._isOpened ? this.close() : this.open();
	}

	/**
	 * Moves focus onto the next option in desired direction based on the currently focused option.
	 * @param direction Direction of the movement
	 */
	moveFocus(direction: 'up' | 'down') {
		const directionModifier = direction === 'up' ? -1 : 1;
		const optionsArray = this.options.toArray();
		const currentOptionIndex: number = optionsArray.indexOf(
			this._currentlyFocusedOption
		);
		const nextOptionIndex: number = currentOptionIndex + 1 * directionModifier;
		const canMoveFocus: boolean =
			direction === 'up'
				? nextOptionIndex >= 0
				: nextOptionIndex < this.options.length;

		if (canMoveFocus) this.focusOption(optionsArray[nextOptionIndex]);
	}

	/**
	 * Focuses the option and scrolls it into the view.
	 * @param newFocusedOption Option to be marked as focused.
	 */
	focusOption(newFocusedOption: SelectOptionComponent) {
		if (this._currentlyFocusedOption) this._currentlyFocusedOption.blur();
		this._currentlyFocusedOption = newFocusedOption;
		this._currentlyFocusedOption.focus();
		this._currentlyFocusedOption.scrollIntoView();
	}

	/**
	 * Chooses an option.
	 * @param chosenOption Chosen option or its value.
	 */
	choose(chosenOption: SelectOptionComponent | string | number) {
		if (this.options.length === 0) return null;

		if (this.currentOption) {
			this.currentOption.unselect();
			this._onTouched();
		}

		if (chosenOption instanceof SelectOptionComponent) {
			this.currentOption = chosenOption;
		} else {
			const foundOption = this.options.find(
				option => option.value === chosenOption
			);

			if (!foundOption)
				throw new Error(
					`Option with given value (${chosenOption}) could not be found.`
				);

			this.currentOption = foundOption;
		}

		this.currentOption.select();
		this._onChange(this.currentOption.value);
		this.close();
	}

	ngOnInit(): void {
		this.ngControl = this._injector.get(NgControl);
	}

	ngOnDestroy() {
		this._optionsSubscriptions.unsubscribe();
	}

	ngAfterContentInit() {
		this._bindListenersToOptions();

		// If we got specific value from form control we use as first option.
		this.choose(this._initialValue || this._determineFirstOption());
	}

	/** Unique ID for the element that displays currently selected option. */
	get selectedOptionElID(): string {
		return this._selectedOptionElID;
	}

	/** Indicates if select dropdown is opened. */
	get isOpened(): boolean {
		return this._isOpened;
	}

	/** Id of the form field label. */
	get labelId(): string {
		return this._labelId;
	}

	/** Indicates if the select is disabled. */
	get isDisabled(): boolean {
		return this._isDisabled;
	}

	/**
	 * Determines which option should be displayed by default.
	 *
	 * Firstly an option without a value has the priority.
	 * If no such option is found then display the first option from all of them.
	 */
	private _determineFirstOption() {
		let placeholderOption = this.options.find(option => option.value === '');
		let option: SelectOptionComponent = placeholderOption || this.options.first;

		return option;
	}

	/**
	 * Called when user clicked an option.
	 * @param chosenOption Option that was chose by user.
	 */
	private _onOptionChoose(chosenOption: SelectOptionComponent) {
		this.choose(chosenOption);
	}

	/** Called when there is a change in an option. */
	private _onOptionChange() {
		this._bindListenersToOptions();
		this.onStateChange.next();
	}

	/** Binds methods to options. */
	private _bindListenersToOptions() {
		// Bind method to onChoose event.
		this.options.forEach(option =>
			this._optionsSubscriptions.add(
				option.onChoose.subscribe(this._onOptionChoose.bind(this))
			)
		);

		// Bind method to run every time there is a change in an option.
		this._optionsSubscriptions.add(
			this.options.changes.subscribe(this._onOptionChange.bind(this))
		);
	}

	/** Positions dropdown element */
	private _positionDropdown(dropdownElement: HTMLElement) {
		const hostPosition = this._hostRef.nativeElement.getBoundingClientRect();
		const offscreenInfo = this._fallsOffScreen(hostPosition);
		const offset = offscreenInfo.offscreenTop
			? offscreenInfo.offsetTop
			: -offscreenInfo.offsetBottom;

		[
			['width', `${hostPosition.width}px`],
			['top', `${hostPosition.top + offset}px`],
			['left', `${hostPosition.left}px`],
		].forEach(([style, value]) =>
			this._renderer.setStyle(dropdownElement, style, value)
		);
	}

	/** Scrolls currently chosen option into the view. */
	private _scrollToCurrentOption(dropdownElement: HTMLElement) {
		const currentOptionIndex = this.options
			.toArray()
			.findIndex(option => option === this.currentOption);

		dropdownElement.scrollBy(
			0,
			this._transformEmToPx(SELECT_OPTION_HEIGHT_EM) * currentOptionIndex
		);
	}

	/** Checks if dropdown falls off screen. */
	private _fallsOffScreen(hostRect: DOMRect) {
		const dropdownHeight: number =
			this._transformEmToPx(SELECT_OPTION_HEIGHT_EM) *
			SELECT_OPTION_VISIBLE_COUNT;
		const offscreenTop: boolean = hostRect.top < 0;
		const offscreenBottom: boolean =
			hostRect.top + dropdownHeight > window.outerHeight;

		return {
			offscreen: offscreenBottom || offscreenTop,
			offsetTop: offscreenTop ? Math.abs(hostRect.top) : 0,
			offsetBottom: offscreenBottom
				? Math.abs(hostRect.top + dropdownHeight - window.outerHeight)
				: 0,
			offscreenBottom,
			offscreenTop,
		};
	}

	/** Transforms css em unit to px based on host font-size value. */
	private _transformEmToPx(em: number): number {
		const fontSize = +getComputedStyle(this._hostRef.nativeElement)
			.getPropertyValue('font-size')
			.replace('px', '');

		return em * fontSize;
	}

	/** Used to navigate dropdown by keyboard, when dropdown is opened. */
	private _dropdownKeyboardNavigation($event: KeyboardEvent) {
		if (!this._isOpened) return;
		$event.preventDefault();
		const { key } = $event;

		switch (key) {
			case 'Escape':
				this.close();
				break;

			case 'ArrowDown':
				this.moveFocus('down');
				break;

			case 'ArrowUp':
				this.moveFocus('up');
				break;

			case 'Home':
				this.focusOption(this.options.first);
				break;

			case 'End':
				this.focusOption(this.options.last);
				break;

			case 'Enter':
				this.choose(this._currentlyFocusedOption);
				this.close();
				break;
		}
	}
}

/** Directive helps with selecting it in form field with ContentChild decorator */
@Directive({
	selector: 'app-select',
	providers: [
		{
			provide: FormFieldControl,
			useExisting: SelectComponent,
		},
	],
})
export class SelectComponentControlDirective {}
