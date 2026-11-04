document.addEventListener('DOMContentLoaded', function () {
	// Mobile nav toggle
	const navToggle = document.getElementById('nav-toggle');
	const siteNav = document.getElementById('site-navigation');
	if (navToggle && siteNav) {
		navToggle.addEventListener('click', () => {
			const expanded = navToggle.getAttribute('aria-expanded') === 'true';
			const isOpen = !expanded;
			navToggle.setAttribute('aria-expanded', String(isOpen));
			navToggle.setAttribute('aria-label', isOpen ? 'Close navigation menu' : 'Open navigation menu');
			navToggle.title = isOpen ? 'Close navigation menu' : 'Open navigation menu';
			navToggle.innerHTML = `<span class="sr-only">${isOpen ? 'Close navigation menu' : 'Open navigation menu'}</span><i class="fas ${isOpen ? 'fa-times' : 'fa-bars'}" aria-hidden="true"></i>`;
			siteNav.classList.toggle('open', isOpen);
		});

		const closeNav = () => {
			navToggle.setAttribute('aria-expanded', 'false');
			navToggle.setAttribute('aria-label', 'Open navigation menu');
			navToggle.title = 'Open navigation menu';
			navToggle.innerHTML = '<span class="sr-only">Open navigation menu</span><i class="fas fa-bars" aria-hidden="true"></i>';
			siteNav.classList.remove('open');
		};

		siteNav.addEventListener('click', event => {
			if (event.target.closest('a')) closeNav();
		});
		document.addEventListener('click', event => {
			if (!siteNav.contains(event.target) && !navToggle.contains(event.target)) closeNav();
		});
		document.addEventListener('keydown', event => {
			if (event.key === 'Escape') closeNav();
		});
		window.addEventListener('resize', () => {
			if (window.innerWidth > 900) closeNav();
		});
	}

	// Enhanced menu filtering with multiple categories + cross-page behavior
	const chips = document.querySelectorAll('.chip');
	const items = document.querySelectorAll('.menu-item');
	const isMenuPage = window.location.pathname === '/menu' || window.location.pathname.endsWith('/menu');

	// store original chip labels so we can append counts
	chips.forEach(c => {
		c.dataset.label = c.textContent.trim();
	});

	function updateChipCounts() {
		chips.forEach(c => {
			const key = c.dataset.filter;
			let count = 0;
			items.forEach(it => {
				const types = (it.dataset.type || '').split(' ');
				if (key === 'all' || types.includes(key)) count += 1;
			});
			// render label + count
			const label = c.dataset.label || c.textContent.trim();
			c.innerHTML = `<span class="chip-label">${label}</span> <span class="chip-count">(${count})</span>`;
		});
	}

	function filterItems(filterValue) {
		items.forEach(item => {
			const types = (item.dataset.type || '').split(' ');
			const shouldShow = filterValue === 'all' || types.includes(filterValue);
			if (shouldShow) {
				item.style.opacity = '0';
				item.style.display = '';
				requestAnimationFrame(() => {
					item.style.opacity = '1';
					item.style.transform = 'translateY(0)';
				});
			} else {
				item.style.opacity = '0';
				item.style.transform = 'translateY(20px)';
				setTimeout(() => { item.style.display = 'none'; }, 300);
			}
		});
		updateChipCounts();
	}

	// If we're on the homepage (not /menu), clicking a chip should navigate to the full menu page with the filter applied.
	// On the /menu page chips support multi-select: each chip toggles active state and filtering is the OR of selected filters.
	chips.forEach(chip => {
		chip.addEventListener('click', (ev) => {
			ev.preventDefault();
			const filter = (chip.getAttribute('data-filter') || 'all').toLowerCase();

			if (!isMenuPage) {
				// redirect to full menu page with optional query param (single filter)
				const url = filter === 'all' ? '/menu' : `/menu?filter=${encodeURIComponent(filter)}`;
				window.location.href = url;
				return;
			}

			// On /menu: multi-select behavior
			if (filter === 'all') {
				// Clear all other selections and show all
				chips.forEach(c => c.classList.remove('active'));
				chip.classList.add('active');
				filterItems('all');
				const menuSection = document.getElementById('menu');
				if (menuSection) menuSection.scrollIntoView({ behavior: 'smooth' });
				return;
			}

			// Toggle this chip
			chip.classList.toggle('active');
			// If any non-all chip is active, remove 'all'
			const anySelected = Array.from(chips).some(c => c.classList.contains('active') && c.dataset.filter !== 'all');
			if (anySelected) {
				document.querySelectorAll('.chip[data-filter="all"]').forEach(a => a.classList.remove('active'));
			} else {
				// If nothing selected, re-select 'all'
				const allChip = document.querySelector('.chip[data-filter="all"]');
				if (allChip) allChip.classList.add('active');
			}

			// Compute selected filters
			const selectedFilters = Array.from(chips)
				.filter(c => c.classList.contains('active') && c.dataset.filter !== 'all')
				.map(c => c.dataset.filter);

			if (selectedFilters.length === 0) {
				filterItems('all');
			} else {
				// Show items that match ANY of the selected filters (OR)
				items.forEach(item => {
					const types = (item.dataset.type || '').split(' ');
					const matched = selectedFilters.some(f => types.includes(f));
					if (matched) {
						item.style.display = '';
						item.style.opacity = '0';
						requestAnimationFrame(() => { item.style.opacity = '1'; item.style.transform = 'translateY(0)'; });
					} else {
						item.style.opacity = '0';
						item.style.transform = 'translateY(20px)';
						setTimeout(() => { item.style.display = 'none'; }, 250);
					}
				});
				updateChipCounts();
			}

			const menuSection = document.getElementById('menu');
			if (menuSection) menuSection.scrollIntoView({ behavior: 'smooth' });
		});
	});

	// If we're on /menu and a filter query param is present, apply it on load (supports comma-separated filters)
	if (isMenuPage) {
		const params = new URLSearchParams(window.location.search);
		const fparam = (params.get('filter') || '').toLowerCase();
		// Clear any active states first
		chips.forEach(c => c.classList.remove('active'));

		if (!fparam || fparam === 'all') {
			// show all
			const allChip = document.querySelector('.chip[data-filter="all"]');
			if (allChip) allChip.classList.add('active');
			filterItems('all');
		} else {
			const keys = fparam.split(',').map(s => s.trim()).filter(Boolean);
			// mark matching chips active
			keys.forEach(k => {
				const chip = document.querySelector(`.chip[data-filter="${k}"]`);
				if (chip) chip.classList.add('active');
			});

			// Apply OR-filtering based on selected chips
			const selectedFilters = Array.from(chips)
				.filter(c => c.classList.contains('active') && c.dataset.filter !== 'all')
				.map(c => c.dataset.filter);

			if (selectedFilters.length === 0) {
				filterItems('all');
			} else {
				items.forEach(item => {
					const types = (item.dataset.type || '').split(' ');
					const matched = selectedFilters.some(f => types.includes(f));
					if (matched) {
						item.style.display = '';
						item.style.opacity = '0';
						requestAnimationFrame(() => { item.style.opacity = '1'; item.style.transform = 'translateY(0)'; });
					} else {
						item.style.opacity = '0';
						item.style.transform = 'translateY(20px)';
						setTimeout(() => { item.style.display = 'none'; }, 250);
					}
				});
				updateChipCounts();
			}
		}
	} else {
		// not menu page: update counts based on items present (may be subset)
		updateChipCounts();
	}

	// Shopping cart functionality
	function readSavedCart() {
		try {
			const saved = JSON.parse(localStorage.getItem('cart') || '[]');
			return Array.isArray(saved) ? saved : [];
		} catch (error) {
			console.error('Unable to read the saved cart:', error);
			return [];
		}
	}

	const cart = {
		items: readSavedCart(),
		
		async addItem(id, name, price, image = '') {
			const previousItems = this.items.map(item => ({ ...item }));
			const existingItem = this.items.find(item => item.id === id);
			if (existingItem) {
				existingItem.quantity += 1;
			} else {
				this.items.push({ id, name, price, image, quantity: 1 });
			}
			try {
				await this.save();
			} catch (error) {
				this.items = previousItems;
				try {
					localStorage.setItem('cart', JSON.stringify(this.items));
				} catch (storageError) {
					console.error('Failed to restore the previous cart:', storageError);
				}
				throw error;
			}
			this.updateUI();
		},
		
		async save() {
			try {
				localStorage.setItem('cart', JSON.stringify(this.items));
			} catch (err) {
				throw new Error(`Failed to save cart locally: ${err.message}`);
			}
			
			// Sync with server
			const response = await fetch('/cart', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(this.items)
			});
			if (!response.ok) throw new Error('Failed to sync cart with the server');
		},
		
		updateUI() {
			// Show a quick feedback animation
			const notification = document.createElement('div');
			notification.className = 'cart-notification';
			notification.textContent = 'Added to cart!';
			document.body.appendChild(notification);
			
			setTimeout(() => {
				notification.remove();
			}, 2000);
			
			// Update cart count in header if it exists
			const cartCount = document.querySelector('.cart-count');
			if (cartCount) {
				const totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);
				cartCount.textContent = totalItems;
				cartCount.hidden = totalItems === 0;
				cartCount.style.display = totalItems > 0 ? 'flex' : 'none';
			}
		},

		getTotal() {
			return this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
		},

		updateQuantity(id, quantity) {
			const item = this.items.find(item => item.id === id);
			if (item) {
				if (quantity <= 0) {
					this.items = this.items.filter(item => item.id !== id);
				} else {
					item.quantity = quantity;
				}
				this.save();
				this.updateUI();
			}
		},

		removeItem(id) {
			this.items = this.items.filter(item => item.id !== id);
			this.save();
			this.updateUI();
		}
	};

	// Add click handlers for cart buttons — add item then redirect to cart page
	document.querySelectorAll('.btn-cart').forEach(button => {
		button.addEventListener('click', async (e) => {
			const item = e.target.closest('.menu-item');
			if (!item) return;
			const name = item.querySelector('h3')?.textContent?.trim();
			if (!name) return;
			const id = e.target.closest('.btn-cart').dataset.id;
			const price = parseFloat(e.target.closest('.btn-cart').dataset.price);
			const image = item.querySelector('img')?.getAttribute('src') || '';

			// await the add so localStorage/server sync completes before navigating
			try {
				await cart.addItem(id, name, price, image);
			} catch (err) {
				console.error('Failed to add item before redirect:', err);
				const notification = document.createElement('div');
				notification.className = 'cart-notification';
				notification.setAttribute('role', 'alert');
				notification.textContent = 'Could not save your cart. Please try again.';
				document.body.appendChild(notification);
				setTimeout(() => notification.remove(), 3000);
				return;
			}

			// Button click animation
			button.style.transform = 'scale(0.95)';
			setTimeout(() => { button.style.transform = ''; }, 100);

			// Navigate to cart page only when the button requests it (data-redirect="true" or class 'go-cart')
			const shouldRedirect = button.dataset.redirect === 'true' || button.classList.contains('go-cart');
			if (shouldRedirect) window.location.href = '/cart';
		});
	});

	// Theme toggle: persist the selected palette across pages.
	const themeToggle = document.getElementById('theme-toggle');
	const body = document.body;

	function applyTheme(name){
		const isDark = name === 'dark';
		if(isDark){
			body.classList.add('dark-theme');
		} else {
			body.classList.remove('dark-theme');
		}
		if(themeToggle) {
			themeToggle.setAttribute('aria-pressed', String(isDark));
			themeToggle.setAttribute('aria-label', isDark ? 'Switch to light theme' : 'Switch to dark theme');
			themeToggle.title = isDark ? 'Switch to light theme' : 'Switch to dark theme';
			themeToggle.innerHTML = `<span class="sr-only">${isDark ? 'Switch to light theme' : 'Switch to dark theme'}</span><i class="fas ${isDark ? 'fa-sun' : 'fa-moon'}" aria-hidden="true"></i>`;
		}
	}

	// Honor the saved choice; otherwise use the light theme.
	(function initTheme(){
		let stored = null;
		try {
			stored = localStorage.getItem('theme');
		} catch (error) {
			console.error('Unable to read the saved theme:', error);
		}
		if(stored === 'dark' || stored === 'light'){
			applyTheme(stored);
		} else {
			applyTheme('light');
		}
	})();

	if(themeToggle){
		themeToggle.addEventListener('click', ()=>{
			const isDark = body.classList.contains('dark-theme');
			const next = isDark ? 'light' : 'dark';
			applyTheme(next);
			try {
				localStorage.setItem('theme', next);
			} catch (error) {
				console.error('Unable to save the selected theme:', error);
			}
		});
	}
});
