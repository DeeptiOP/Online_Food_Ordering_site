document.addEventListener('DOMContentLoaded', () => {
    const cartPage = document.getElementById('cart-page');
    const cartList = document.querySelector('.cart-list');
    const dataElement = document.getElementById('server-cart-data');
    if (!cartPage || !dataElement) return;

    let items;
    try {
        items = JSON.parse(dataElement.textContent || '[]');
        if (!Array.isArray(items)) throw new TypeError('Server cart data must be a list');
    } catch (error) {
        console.error('Unable to read cart data:', error);
        return;
    }

    const formatCurrency = amount => `₹${Number(amount).toFixed(2)}`;
    const writeStorage = () => {
        try {
            localStorage.setItem('cart', JSON.stringify(items));
        } catch (error) {
            console.error('Unable to save cart locally:', error);
        }
    };
    const updateCount = () => {
        const count = items.reduce((total, item) => total + item.quantity, 0);
        document.querySelectorAll('.cart-count').forEach(element => {
            element.textContent = count;
            element.hidden = count === 0;
            element.style.display = count > 0 ? 'flex' : 'none';
        });
    };
    const renderTotals = totals => {
        const subtotal = document.querySelector('.subtotal-value');
        const delivery = document.querySelector('.delivery-value');
        const total = document.querySelector('.total-value');
        if (subtotal) subtotal.textContent = formatCurrency(totals.subtotal);
        if (delivery) delivery.textContent = formatCurrency(totals.delivery_fee);
        if (total) total.textContent = formatCurrency(totals.total);

        const note = document.querySelector('.free-delivery-note');
        if (note) {
            note.textContent = totals.free_delivery_remaining > 0
                ? `Add ${formatCurrency(totals.free_delivery_remaining)} more for free delivery.`
                : 'Free delivery applied.';
        }
    };
    const syncCart = async (itemId, quantity, action = 'update') => {
        const response = await fetch('/cart/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: itemId, quantity, action })
        });
        const result = await response.json();
        if (!response.ok || result.status !== 'success') {
            throw new Error(result.message || 'Unable to update your cart');
        }

        items = result.cart;
        writeStorage();
        updateCount();
        renderTotals(result.totals);
        return result;
    };
    const showEmptyCart = () => {
        const container = document.querySelector('.cart-container');
        if (items.length === 0 && container) window.location.reload();
    };

    writeStorage();
    updateCount();

    if (!cartList) return;

    cartList.addEventListener('click', async event => {
        const button = event.target.closest('button');
        const row = button && button.closest('.cart-item');
        if (!button || !row) return;

        const item = items.find(entry => entry.id === row.dataset.id);
        if (!item) return;

        if (button.classList.contains('remove-item')) {
            button.disabled = true;
            try {
                await syncCart(item.id, item.quantity, 'remove');
                row.remove();
                showEmptyCart();
            } catch (error) {
                button.disabled = false;
                console.error('Unable to remove cart item:', error);
            }
            return;
        }

        if (!button.classList.contains('quantity-btn')) return;
        const nextQuantity = item.quantity + (button.classList.contains('plus') ? 1 : -1);
        if (nextQuantity < 1 || nextQuantity > 99) return;

        const input = row.querySelector('.quantity-input');
        button.disabled = true;
        try {
            await syncCart(item.id, nextQuantity);
            input.value = nextQuantity;
            row.querySelector('.item-total').textContent = formatCurrency(item.price * nextQuantity);
        } catch (error) {
            console.error('Unable to update cart quantity:', error);
        } finally {
            button.disabled = false;
        }
    });

    cartList.addEventListener('change', async event => {
        const input = event.target;
        if (!input.matches('.quantity-input')) return;

        const row = input.closest('.cart-item');
        const item = items.find(entry => entry.id === row.dataset.id);
        const quantity = Number(input.value);
        if (!item) return;
        if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
            input.value = item.quantity;
            return;
        }

        input.disabled = true;
        try {
            await syncCart(item.id, quantity);
            input.value = quantity;
            row.querySelector('.item-total').textContent = formatCurrency(item.price * quantity);
        } catch (error) {
            input.value = item.quantity;
            console.error('Unable to update cart quantity:', error);
        } finally {
            input.disabled = false;
        }
    });
});
