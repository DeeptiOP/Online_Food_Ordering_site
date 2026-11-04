from flask import Flask, request, render_template, redirect, url_for, session, flash
from flask_cors import CORS
import mysql.connector
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
import os
import json
import math
import time
from dotenv import load_dotenv

app = Flask(__name__)
CORS(app)

# Load environment variables
load_dotenv()

# Use environment variables with fallback for development
# Production (Render) should set SECRET_KEY via environment variables
app.secret_key = os.getenv('SECRET_KEY', 'dev-fallback-key-change-in-production')

# Database connection (use environment variables or DATABASE_URL)
def get_db_connection():
    """
    Connect to MySQL using either:
    1. DATABASE_URL (Railway format: mysql://user:password@host:port/database)
    2. Individual env vars: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT
    """
    database_url = os.getenv('DATABASE_URL')
    
    if database_url:
        # Parse DATABASE_URL (mysql://user:password@host:port/database)
        try:
            # Remove 'mysql://' prefix
            url = database_url.replace('mysql://', '')
            
            # Split credentials and host
            creds, host_db = url.split('@', 1)
            user, password = creds.split(':', 1)
            
            # Split host and database
            host_port, database = host_db.rsplit('/', 1)
            if ':' in host_port:
                host, port = host_port.rsplit(':', 1)
                port = int(port)
            else:
                host = host_port
                port = 3306
            
            db_config = {
                'host': host,
                'user': user,
                'password': password,
                'database': database,
                'port': port
            }
            print(f"[DB] Connecting via DATABASE_URL to {host}:{port}/{database}")
        except Exception as e:
            print(f"ERROR: Failed to parse DATABASE_URL: {e}")
            raise
    else:
        # Fall back to individual environment variables
        db_config = {
            'host': os.getenv('DB_HOST'),
            'user': os.getenv('DB_USER'),
            'password': os.getenv('DB_PASSWORD'),
            'database': os.getenv('DB_NAME'),
            'port': int(os.getenv('DB_PORT', '3306'))
        }
        # Warn if required DB variables are missing
        for key, val in db_config.items():
            if key != 'port' and not val:
                print(f"WARNING: {key.upper()} environment variable not set")
        print(f"[DB] Connecting via individual env vars to {db_config['host']}:{db_config['port']}/{db_config['database']}")
    
    # Try to connect with a small retry/backoff loop to handle transient startup delays
    attempts = 0
    max_attempts = int(os.getenv('DB_CONNECT_RETRIES', '5'))
    backoff = float(os.getenv('DB_CONNECT_BACKOFF', '1.0'))
    last_exc = None
    while attempts < max_attempts:
        try:
            # Use a short connection timeout to fail fast when unreachable
            return mysql.connector.connect(connect_timeout=5, **db_config)
        except Exception as e:
            last_exc = e
            attempts += 1
            print(f"[DB] Connection attempt {attempts}/{max_attempts} failed: {e}")
            time.sleep(backoff * attempts)

    # All attempts failed; raise the last exception to be handled by caller
    print(f"ERROR: Unable to establish DB connection after {max_attempts} attempts: {last_exc}")
    raise last_exc

# Attempt DB connection on startup; if it fails, app can still start
try:
    conn = get_db_connection()
except Exception as e:
    print(f"WARNING: Database connection failed on startup: {e}")
    print("App will start but database-dependent routes will fail until DB is available.")
    conn = None


def get_db_cursor(buffered=False):
    """Get a fresh database cursor, creating a new connection if needed."""
    global conn
    try:
        # Use existing connection if it's alive
        if conn is not None and getattr(conn, 'is_connected', lambda: True)():
            return conn.cursor(buffered=buffered)

        # Otherwise attempt to create a fresh connection
        conn = get_db_connection()
        return conn.cursor(buffered=buffered)
    except Exception as e:
        print(f"ERROR: Failed to get database cursor: {e}")
        raise


def normalize_cart_items(items):
    """Validate cart data before storing it in the signed session cookie."""
    if not isinstance(items, list) or len(items) > 100:
        raise ValueError('Cart must be a list of no more than 100 items')

    normalized = []
    for item in items:
        if not isinstance(item, dict):
            raise ValueError('Each cart item must be an object')

        item_id = item.get('id')
        name = item.get('name')
        image = item.get('image', '')
        raw_price = item.get('price')
        raw_quantity = item.get('quantity')
        if isinstance(raw_price, bool) or isinstance(raw_quantity, bool):
            raise ValueError('Cart item price and quantity must be valid numbers')
        if isinstance(raw_quantity, float) and not raw_quantity.is_integer():
            raise ValueError('Cart item quantity must be a whole number')
        if isinstance(raw_quantity, str) and not raw_quantity.strip().isdigit():
            raise ValueError('Cart item quantity must be a whole number')
        try:
            price = float(raw_price)
            quantity = int(raw_quantity)
        except (TypeError, ValueError):
            raise ValueError('Cart item price and quantity must be valid numbers')

        if not isinstance(item_id, str) or not item_id.strip() or len(item_id) > 100:
            raise ValueError('Cart item id is required')
        if not isinstance(name, str) or not name.strip() or len(name) > 255:
            raise ValueError('Cart item name is required')
        if not isinstance(image, str) or len(image) > 500:
            raise ValueError('Cart item image must be a valid string')
        if not math.isfinite(price) or price < 0:
            raise ValueError('Cart item price must be a non-negative number')
        if quantity < 1 or quantity > 99:
            raise ValueError('Cart item quantity must be between 1 and 99')

        normalized.append({
            'id': item_id.strip(),
            'name': name.strip(),
            'image': image,
            'price': price,
            'quantity': quantity,
            'category': str(item.get('category', ''))[:80],
            'spicy': bool(item.get('spicy', False))
        })

    return normalized


def cart_totals(items):
    subtotal = sum(item['price'] * item['quantity'] for item in items)
    delivery_fee = 0 if subtotal >= 30 else 2
    return {
        'subtotal': subtotal,
        'delivery_fee': delivery_fee,
        'total': subtotal + delivery_fee,
        'free_delivery_remaining': max(0, 30 - subtotal)
    }

# Load Cloudinary mapping if present (created by the upload script)
_CLOUD_MAP_PATH = os.path.join(os.path.dirname(__file__), 'static', 'cloudinary_map.json')
def _load_cloud_map():
    try:
        with open(_CLOUD_MAP_PATH, 'r', encoding='utf-8') as fh:
            return json.load(fh)
    except Exception:
        return {}

_CLOUD_MAP = _load_cloud_map()


@app.context_processor
def inject_helpers():
    def cloud_image(filename):
        if not filename:
            return ''
        # If already an URL, return as-is
        if isinstance(filename, str) and (filename.startswith('http://') or filename.startswith('https://')):
            return filename
        # Lookup in cloud map, otherwise fall back to static
        return _CLOUD_MAP.get(filename, url_for('static', filename=filename))

    return dict(cloud_image=cloud_image)


def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            flash('Please log in to access this page', 'warning')
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/login', methods=['GET', 'POST'])
def login():
    # redirect logged-in users to profile
    if 'user_id' in session:
        flash('You are already logged in', 'info')
        return redirect(url_for('profile'))

    if request.method == 'POST':
        try:
            username = request.form.get('username')
            password = request.form.get('password')

            cur = get_db_cursor()
            cur.execute("SELECT user_id, username, password FROM users WHERE username = %s", (username,))
            row = cur.fetchone()

            if row:
                user_id, uname, stored = row[0], row[1], row[2]
                # Try password hash verification first
                if check_password_hash(stored, password):
                    session['user_id'] = user_id
                    session['username'] = uname
                    flash('Logged in successfully', 'success')
                    return redirect(url_for('index'))
                else:
                    # Handle legacy plaintext password: if store equals provided password,
                    # upgrade to hashed password transparently and log user in.
                    if stored == password:
                        new_hash = generate_password_hash(password)
                        upd = get_db_cursor()
                        upd.execute("UPDATE users SET password = %s WHERE user_id = %s", (new_hash, user_id))
                        conn.commit()
                        session['user_id'] = user_id
                        session['username'] = uname
                        flash('Logged in and password upgraded to secure storage', 'success')
                        return redirect(url_for('index'))
                    flash('Invalid username or password', 'danger')
            else:
                flash('Invalid username or password', 'danger')
        except Exception as e:
            print(f"ERROR in login route: {e}")
            flash('Database error: unable to process login. Please try again later.', 'danger')

    return render_template('login.html')


@app.route('/register', methods=['GET', 'POST'])
def register():
    # Prevent logged-in users from registering again
    if 'user_id' in session:
        flash('You are already registered and logged in', 'info')
        return redirect(url_for('profile'))

    if request.method == 'POST':
        try:
            username = request.form.get('username')
            password = request.form.get('password')
            email = request.form.get('email')

            if not username or not password:
                flash('Username and password are required', 'warning')
                return render_template('register.html')

            cur = get_db_cursor()
            cur.execute("SELECT user_id FROM users WHERE username = %s OR email = %s", (username, email))
            if cur.fetchone():
                flash('Username or email already exists', 'warning')
                return render_template('register.html')

            hashed = generate_password_hash(password)
            ins = get_db_cursor()
            ins.execute("INSERT INTO users (username, password, email) VALUES (%s, %s, %s)", (username, hashed, email))
            conn.commit()
            flash('Registration successful. Please log in.', 'success')
            return redirect(url_for('login'))
        except Exception as e:
            print(f"ERROR in register route: {e}")
            flash('Database error: unable to process registration. Please try again later.', 'danger')
            return render_template('register.html')

    return render_template('register.html')

@app.route('/register_prompt')
def register_prompt():
    flash('Please register or log in to place an order', 'info')
    return redirect(url_for('register'))

@app.route('/veg_momo')
def veg_momo():
    return render_template('veg_momo.html')


@app.route('/menu')
def menu_page():
    # Render the full menu page (all momos)
    return render_template('all_momos.html')

@app.route('/cart', methods=['GET', 'POST'])
def cart():
    if 'cart_items' not in session:
        session['cart_items'] = []
    
    if request.method == 'POST':
        if request.is_json:
            try:
                cart_data = normalize_cart_items(request.get_json(silent=False))
                session['cart_items'] = cart_data
                session.modified = True
                
                return {
                    'status': 'success',
                    'cart': session['cart_items'],
                    'totals': cart_totals(cart_data)
                }
            except (TypeError, ValueError) as e:
                return {'status': 'error', 'message': str(e)}, 400
        else:
            # Handle form submission (traditional POST)
            try:
                item_id = request.form.get('item_id', '').strip()
                item_name = request.form.get('item_name', '').strip()
                item_image = request.form.get('item_image', '')
                quantity = int(request.form.get('quantity', '1'))
                price = float(request.form.get('item_price', ''))
                item = {
                    "id": item_id,
                    "name": item_name,
                    "image": item_image,
                    "price": price,
                    "quantity": quantity,
                    "category": request.form.get('category', ''),
                    "spicy": request.form.get('spicy', 'false').lower() == 'true'
                }
                item = normalize_cart_items([item])[0]
                
                # Check if item already in cart, update quantity if so
                found = False
                for cart_item in session['cart_items']:
                    if cart_item['id'] == item['id']:
                        updated_quantity = cart_item['quantity'] + item['quantity']
                        if updated_quantity > 99:
                            raise ValueError('Cart item quantity cannot exceed 99')
                        cart_item['quantity'] = updated_quantity
                        found = True
                        break
                if not found:
                    session['cart_items'].append(item)
                
                session.modified = True
                return redirect(url_for('cart'))
            except (TypeError, ValueError, KeyError) as e:
                flash(str(e), 'warning')
                return redirect(url_for('veg_momo'))
    
    # GET request - show cart page
    cart_items = session.get('cart_items', [])
    totals = cart_totals(cart_items)
    
    return render_template('cart.html', 
                         cart_items=cart_items,
                         **totals)

@app.route('/cart/update', methods=['POST'])
def update_cart_item():
    if request.is_json:
        try:
            data = request.get_json(silent=False)
            if not isinstance(data, dict):
                raise ValueError('Request body must be an object')
            item_id = data.get('id')
            if not isinstance(item_id, str) or not item_id:
                raise ValueError('Cart item id is required')
            action = data.get('action', 'update')
            if action not in ('update', 'remove'):
                raise ValueError('Unsupported cart action')

            items = session.get('cart_items', [])
            if not any(item['id'] == item_id for item in items):
                raise ValueError('Cart item was not found')
            if action == 'remove':
                items = [item for item in items if item['id'] != item_id]
            else:
                raw_quantity = data.get('quantity', 1)
                if isinstance(raw_quantity, bool):
                    raise ValueError('Cart item quantity must be a whole number')
                if isinstance(raw_quantity, float) and not raw_quantity.is_integer():
                    raise ValueError('Cart item quantity must be a whole number')
                if isinstance(raw_quantity, str) and not raw_quantity.strip().isdigit():
                    raise ValueError('Cart item quantity must be a whole number')
                try:
                    quantity = int(raw_quantity)
                except (TypeError, ValueError):
                    raise ValueError('Cart item quantity must be a whole number')
                if quantity < 1 or quantity > 99:
                    raise ValueError('Cart item quantity must be between 1 and 99')
                for item in items:
                    if item['id'] == item_id:
                        item['quantity'] = quantity
                        break
            
            session['cart_items'] = items
            session.modified = True
            return {
                'status': 'success',
                'cart': items,
                'totals': cart_totals(items)
            }
        except (TypeError, ValueError) as e:
            return {'status': 'error', 'message': str(e)}, 400
    return {'status': 'error', 'message': 'Invalid request'}, 400

@app.route('/cart/clear', methods=['POST'])
def clear_cart():
    if request.is_json:
        session.pop('cart_items', None)
        session.modified = True
        return {'status': 'success', 'cart': []}
    else:
        session.pop('cart_items', None)
        session.modified = True
        return redirect(url_for('cart'))


@app.route('/checkout', methods=['GET', 'POST'])
def checkout():
    # Check if user is registered/logged in before allowing checkout
    if 'user_id' not in session:
        flash('Please register or log in to place an order', 'warning')
        return redirect(url_for('register'))
    
    # Prepare cart and totals similar to cart view
    cart_items = session.get('cart_items', [])
    totals = cart_totals(cart_items)

    if not cart_items:
        flash('Your cart is empty. Add items before checking out.', 'warning')
        return redirect(url_for('cart'))

    if request.method == 'POST':
        name = request.form.get('name', '').strip()
        email = request.form.get('email', '').strip()
        address = request.form.get('address', '').strip()
        payment = request.form.get('payment', 'cod')

        if not name or not email or not address or payment not in ('cod', 'card'):
            flash('Enter your name, a valid email address, delivery address, and payment method.', 'warning')
            return render_template('checkout.html', cart_items=cart_items, **totals), 400

        order_data = {
            'name': name,
            'email': email,
            'address': address,
            'items': cart_items,
            'total': totals['total'],
            'payment': payment,
            'order_id': None
        }

        try:
            # ensure orders table exists
            curc = get_db_cursor()
            curc.execute('''
                CREATE TABLE IF NOT EXISTS orders (
                    order_id INT PRIMARY KEY AUTO_INCREMENT,
                    user_id INT NULL,
                    name VARCHAR(255),
                    email VARCHAR(255),
                    total DECIMAL(10,2),
                    address TEXT,
                    items TEXT,
                    payment VARCHAR(32),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            conn.commit()

            ins = get_db_cursor()
            items_json = json.dumps(cart_items, default=str)
            uid = session.get('user_id')
            ins.execute("INSERT INTO orders (user_id, name, email, total, address, items, payment) VALUES (%s,%s,%s,%s,%s,%s,%s)",
                        (uid, name, email, float(totals['total']), address, items_json, payment))
            conn.commit()
            order_id = ins.lastrowid
            order_data['order_id'] = order_id

            # Attempt to save address to users table for logged-in users
            if uid:
                try:
                    upd = get_db_cursor()
                    upd.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT")
                except Exception:
                    # Some MySQL versions don't support IF NOT EXISTS with ALTER ADD COLUMN; ignore
                    pass
                try:
                    upd2 = get_db_cursor()
                    upd2.execute("UPDATE users SET address = %s WHERE user_id = %s", (address, uid))
                    conn.commit()
                except Exception:
                    # ignore if column missing
                    pass

        except Exception as e:
            print('Order persistence failed:', e)
            flash('We could not save your order. Your cart is still available; please try again later.', 'danger')
            return render_template('checkout.html', cart_items=cart_items, **totals), 503

        # clear cart
        session.pop('cart_items', None)
        session.modified = True
        return render_template('order_success.html', order=order_data)

    return render_template('checkout.html', cart_items=cart_items, **totals)


@app.route('/logout')
def logout():
    session.pop('user_id', None)
    session.pop('username', None)
    flash('You have been logged out', 'info')
    return redirect(url_for('index'))


@app.route('/profile')
@login_required
def profile():
    cur = get_db_cursor()
    cur.execute("SELECT user_id, username, email, created_at FROM users WHERE user_id = %s", (session.get('user_id'),))
    row = cur.fetchone()
    user = None
    if row:
        user = {
            'user_id': row[0],
            'username': row[1],
            'email': row[2],
            'created_at': row[3]
        }
    # Attempt to load past orders from an `orders` table if present.
    orders = []
    try:
        cur2 = get_db_cursor(buffered=True)
        # expected orders table (order_id, user_id, total, address, items (JSON), created_at)
        cur2.execute("SELECT order_id, total, address, items, created_at FROM orders WHERE user_id = %s ORDER BY created_at DESC", (user['user_id'],))
        rows = cur2.fetchall()
        for r in rows:
            items = []
            try:
                items = json.loads(r[3]) if r[3] else []
            except Exception:
                # if items stored differently, keep raw
                items = r[3]
            orders.append({
                'order_id': r[0],
                'total': r[1],
                'address': r[2],
                'items': items,
                'created_at': r[4]
            })
    except Exception:
        # If the orders table doesn't exist or query fails, show empty list — avoid breaking the profile.
        orders = []

    # Load saved address from users table if present (non-breaking)
    saved_address = None
    try:
        cur3 = get_db_cursor()
        cur3.execute("SELECT address FROM users WHERE user_id = %s", (user['user_id'],))
        ar = cur3.fetchone()
        if ar:
            saved_address = ar[0]
    except Exception:
        saved_address = session.get('profile_address')

    return render_template('profile.html', user=user, orders=orders, saved_address=saved_address)


@app.route('/profile/address', methods=['POST'])
@login_required
def save_profile_address():
    # Collect common address fields and format into a single text block
    line1 = request.form.get('line1', '').strip()
    line2 = request.form.get('line2', '').strip()
    city = request.form.get('city', '').strip()
    state = request.form.get('state', '').strip()
    zipcode = request.form.get('zipcode', '').strip()
    phone = request.form.get('phone', '').strip()

    if not line1 or not city or not phone:
        flash('Please provide at least address line 1, city and phone number', 'warning')
        return redirect(url_for('profile'))

    address_text = f"{line1}" + (f"\n{line2}" if line2 else "") + f"\n{city}, {state} - {zipcode}\nPhone: {phone}"

    try:
        cur = get_db_cursor()
        cur.execute("UPDATE users SET address = %s WHERE user_id = %s", (address_text, session.get('user_id')))
        conn.commit()
        flash('Address saved to your profile', 'success')
    except Exception:
        # If the users table doesn't have an `address` column, fall back to session storage and notify the user
        session['profile_address'] = address_text
        session.modified = True
        flash('Address saved locally for this session. To persist permanently, add an `address` column to the `users` table.', 'warning')

    return redirect(url_for('profile'))


@app.route('/contact_submit', methods=['POST'])
def contact_submit():
    name = request.form.get('name', '').strip()
    email = request.form.get('email', '').strip()
    subject = request.form.get('subject', '').strip()
    message = request.form.get('message', '').strip()

    if not name or not email or not subject or not message:
        flash('All fields are required', 'warning')
        return redirect(url_for('index'))

    try:
        # Create contacts table if it doesn't exist
        curc = get_db_cursor()
        curc.execute('''
            CREATE TABLE IF NOT EXISTS contacts (
                contact_id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(255),
                email VARCHAR(255),
                subject VARCHAR(255),
                message TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        conn.commit()

        # Insert the contact message
        ins = get_db_cursor()
        ins.execute("INSERT INTO contacts (name, email, subject, message) VALUES (%s,%s,%s,%s)",
                    (name, email, subject, message))
        conn.commit()
        flash('Thank you for your message! We will get back to you soon.', 'success')
    except Exception as e:
        print('Contact form submission failed:', e)
        flash('An error occurred. Please try again.', 'danger')

    return redirect(url_for('index') + '#contact')


@app.route('/init-db', methods=['GET'])
def init_db():
    """
    Initialize database schema (create tables if they don't exist).
    Protected by INIT_DB environment variable (must be set to 'true').
    Usage: Set INIT_DB=true in environment and visit /init-db once.
    """
    init_enabled = os.getenv('INIT_DB', '').lower() == 'true'
    if not init_enabled:
        return {'error': 'Database initialization is disabled. Set INIT_DB=true to enable.'}, 403
    
    try:
        cur = get_db_cursor()
        
        # Create users table
        cur.execute('''
            CREATE TABLE IF NOT EXISTS users (
                user_id INT PRIMARY KEY AUTO_INCREMENT,
                username VARCHAR(80) NOT NULL UNIQUE,
                email VARCHAR(255) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Create contacts table
        cur.execute('''
            CREATE TABLE IF NOT EXISTS contacts (
                contact_id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(255),
                email VARCHAR(255),
                subject VARCHAR(255),
                message TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Create orders table
        cur.execute('''
            CREATE TABLE IF NOT EXISTS orders (
                order_id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT,
                items JSON,
                total DECIMAL(10, 2),
                status VARCHAR(50) DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(user_id)
            )
        ''')
        
        conn.commit()
        return {
            'status': 'success',
            'message': 'Database schema initialized. Tables created: users, contacts, orders'
        }, 200
    except Exception as e:
        print(f'ERROR in /init-db: {e}')
        return {'status': 'error', 'message': str(e)}, 500


if __name__ == '__main__':
    app.run(debug=True)