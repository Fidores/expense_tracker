import {
	ComponentPortal,
	ComponentType,
	DomPortalOutlet,
} from '@angular/cdk/portal';
import { DOCUMENT } from '@angular/common';
import {
	ApplicationRef,
	ComponentFactoryResolver,
	ComponentRef,
	Inject,
	Injectable,
	Injector,
	RendererFactory2,
} from '@angular/core';
import { Subject } from 'rxjs';

import { OVERLAY_SERVICE } from '../../common/models/overlay';
import { OverlayComponent } from './../../components/overlay/overlay.component';

@Injectable({
	providedIn: 'root',
})
export class OverlayService {
	constructor(
		private readonly _componentResolver: ComponentFactoryResolver,
		private readonly _injector: Injector,
		private readonly _appRef: ApplicationRef,

		@Inject(DOCUMENT)
		private readonly _docRef: Document,

		readonly _rendererFactory: RendererFactory2
	) {}

	/**
	 * Allows listening for clicks on overlay.
	 */
	public onClick$ = new Subject<MouseEvent>();
	private _isOpened = false;
	private readonly _portalHost = new DomPortalOutlet(
		this._docRef.body,
		this._componentResolver,
		this._appRef,
		this._injector
	);
	private readonly _overlayComponentPortal = new ComponentPortal(
		OverlayComponent,
		null,
		this._createInjectorForOverlayComponent()
	);

	/**
	 * Opens overlay. You can pass a class of a component that will be created and inserted
	 * into the overlay view. Also you can pass your own injector that will be used
	 * during component creating.
	 *
	 * Overlay can be opened only once, if you'll try to
	 * open it while another instance is already opened nothing will happen, and
	 * method will return null.
	 *
	 * @param Component Component class to create and insert into overlay
	 * @param injector Injector that will be used to create passed Component
	 * @returns ComponentRef of the created component
	 */
	open<T>(
		Component?: ComponentType<T>,
		injector?: Injector
	): ComponentRef<T> | null {
		if (this._isOpened) return null;
		this._isOpened = true;

		const component = this._portalHost.attach(this._overlayComponentPortal);

		if (Component)
			return component.instance.insertComponent(Component, injector);
	}

	/**
	 * Closes currently opened overlay and destroys all components within.
	 */
	close() {
		if (!this._isOpened) return null;

		this._portalHost.detach();
		this._isOpened = false;
	}

	/** Indicates whether the overlay is opened or closed. */
	get isOpened(): boolean {
		return this._isOpened;
	}

	private _createInjectorForOverlayComponent() {
		return Injector.create({
			parent: this._injector,
			providers: [{ provide: OVERLAY_SERVICE, useValue: this }],
		});
	}
}
