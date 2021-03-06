import {
	AfterViewInit,
	Component,
	ElementRef,
	OnInit,
	Renderer2,
	RendererStyleFlags2,
	ViewChild,
} from '@angular/core';

import { NavbarLink } from './../../common/models/navbarButton';
import { Pages } from './../../common/routing/routesUrls';
import { MainNavService } from './../../services/main-nav/main-nav.service';
import { UserService } from './../../services/user/user.service';

@Component({
	selector: 'main-nav',
	templateUrl: './main-nav.component.html',
	styleUrls: ['./main-nav.component.scss'],
})
export class MainNavComponent implements AfterViewInit, OnInit {
	constructor(
		private readonly _user: UserService,
		private readonly _renderer: Renderer2,
		private readonly _mainNav: MainNavService
	) {}

	@ViewChild('programmableLink', { read: ElementRef })
	programmableButton: ElementRef<HTMLButtonElement>;

	Pages = Pages;
	isLoggedIn$ = this._user.isLoggedIn$;
	private readonly defaultButton: NavbarLink = {
		iconUnicode: '\\f0fe',
		description: 'Dodaj transakcję',
		route: Pages.AddTransaction,
	};
	button: NavbarLink = {
		iconUnicode: '\\f0fe',
		description: 'Dodaj transakcję',
		route: Pages.AddTransaction,
	};

	changeButton(newButton: NavbarLink) {
		this.button = newButton;
	}

	restoreDefaultButton() {
		this.button = this.defaultButton;
	}

	ngAfterViewInit() {
		this._renderer.setStyle(
			this.programmableButton.nativeElement,
			'--icon',
			`'${this.button.iconUnicode}'`,
			RendererStyleFlags2.DashCase
		);
	}

	ngOnInit() {
		this._mainNav.changeButtonBroadcaster$.subscribe(
			this.changeButton.bind(this)
		);
		this._mainNav.resetButtonBroadcaster$.subscribe(
			this.restoreDefaultButton.bind(this)
		);
	}
}
