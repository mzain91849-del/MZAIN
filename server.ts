import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  Category,
  Product,
  Coupon,
  StoreSettings,
  UserProfile,
  Order,
  OrderStatus,
  CartItemInput,
  CalculatedCartItem,
  CartCalculationResponse,
  OrderItemSnapshot,
} from './src/types';

interface StoredUser extends UserProfile {
  passwordHash: string;
  salt: string;
}

interface SessionRecord {
  token: string;
  userId: string;
  createdAt: string;
}

interface DatabaseSchema {
  categories: Category[];
  products: Product[];
  coupons: Coupon[];
  settings: StoreSettings;
  users: StoredUser[];
  sessions: SessionRecord[];
  orders: Order[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'store-db.json');

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function createInitialDb(): DatabaseSchema {
  const now = new Date().toISOString();
  const adminSalt = 'zain_admin_salt_v1';
  const customerSalt = 'zain_cust_salt_v1';

  const categories: Category[] = [
    { id: 'cat-burgers', name: 'Burgers', slug: 'burgers', description: 'Smashed beef and crispy fillet burgers on toasted brioche buns.', sortOrder: 1 },
    { id: 'cat-pizza', name: 'Pizza', slug: 'pizza', description: 'Stone-baked hand-stretched pizzas with rich mozzarella.', sortOrder: 2 },
    { id: 'cat-chicken', name: 'Fried Chicken', slug: 'fried-chicken', description: 'Golden pressure-fried chicken pieces and spicy wings.', sortOrder: 3 },
    { id: 'cat-sides', name: 'Fries & Sides', slug: 'fries-sides', description: 'Crinkle-cut fries, loaded cheese bowls, and savoury bites.', sortOrder: 4 },
    { id: 'cat-wraps', name: 'Sandwiches & Wraps', slug: 'sandwiches-wraps', description: 'Grilled tortilla wraps and toasted club sandwiches.', sortOrder: 5 },
    { id: 'cat-combos', name: 'Combo Deals', slug: 'combo-deals', description: 'Value meal bundles crafted for solo cravings and group feasts.', sortOrder: 6 },
    { id: 'cat-drinks', name: 'Drinks', slug: 'drinks', description: 'Chilled sodas,shakes, and sparkling refreshers.', sortOrder: 7 },
    { id: 'cat-desserts', name: 'Desserts', slug: 'desserts', description: 'Warm molten lava cakes and sweet finishes.', sortOrder: 8 },
  ];

  const products: Product[] = [
    {
      id: 'prod-double-smash',
      name: 'Zain Signature Double Smash Burger (Demo)',
      slug: 'zain-signature-double-smash-burger',
      categoryId: 'cat-burgers',
      categoryName: 'Burgers',
      description: 'Demo Menu Item: Two seared beef patties with double melted cheddar, house smoky burger sauce, caramelized onions, and dill pickles on a toasted brioche bun.',
      price: 1150,
      salePrice: 990,
      imageKey: 'smash_burger',
      isAvailable: true,
      trackStock: true,
      stockQuantity: 28,
      prepEstimateMinutes: 15,
      sizes: [
        { label: 'Double Patty (Standard)', priceDelta: 0 },
        { label: 'Triple Smash Stack', priceDelta: 320 },
      ],
      spiceLevels: ['Mild', 'Medium', 'Fiery Hot'],
      addons: [
        { id: 'add-cheese', name: 'Extra Cheddar Slice', price: 120 },
        { id: 'add-jalapenos', name: 'Pickled Jalapeños', price: 80 },
        { id: 'add-rings', name: '2x Crispy Onion Rings', price: 150 },
      ],
      isFeatured: true,
      isCombo: false,
      isDemoData: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'prod-zinger-crunch',
      name: 'Golden Crunch Fillet Burger (Demo)',
      slug: 'golden-crunch-fillet-burger',
      categoryId: 'cat-burgers',
      categoryName: 'Burgers',
      description: 'Demo Menu Item: Crispy seasoned whole chicken thigh fillet, shredded iceberg lettuce, ripe tomato slices, and creamy garlic pepper mayo in a sesame seed bun.',
      price: 850,
      salePrice: null,
      imageKey: 'crispy_chicken',
      isAvailable: true,
      trackStock: true,
      stockQuantity: 35,
      prepEstimateMinutes: 12,
      sizes: [
        { label: 'Single Fillet', priceDelta: 0 },
        { label: 'Mighty Double Fillet', priceDelta: 350 },
      ],
      spiceLevels: ['Regular', 'Spicy Zinger'],
      addons: [
        { id: 'add-cheese-2', name: 'Cheese Slice', price: 120 },
        { id: 'add-coleslaw', name: 'Creamy Coleslaw Scoop', price: 100 },
      ],
      isFeatured: true,
      isCombo: false,
      isDemoData: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'prod-pepperoni-pizza',
      name: 'Stone-Oven Beef Pepperoni Pizza (Demo)',
      slug: 'stone-oven-beef-pepperoni-pizza',
      categoryId: 'cat-pizza',
      categoryName: 'Pizza',
      description: 'Demo Menu Item: Hand-stretched artisan dough topped with crushed tomato sauce, whole-milk mozzarella, smoky beef pepperoni slices, and fresh basil.',
      price: 1450,
      salePrice: 1290,
      imageKey: 'woodfired_pizza',
      isAvailable: true,
      trackStock: true,
      stockQuantity: 18,
      prepEstimateMinutes: 20,
      sizes: [
        { label: '10-inch Medium', priceDelta: 0 },
        { label: '13-inch Large', priceDelta: 450 },
        { label: '16-inch Family XL', priceDelta: 850 },
      ],
      spiceLevels: ['Classic Mild', 'Chili Flake Kick'],
      addons: [
        { id: 'add-extra-mozz', name: 'Extra Mozzarella Crust', price: 250 },
        { id: 'add-olives', name: 'Black Olives & Mushrooms', price: 160 },
      ],
      isFeatured: true,
      isCombo: false,
      isDemoData: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'prod-loaded-fries',
      name: 'Cheddar Drenched Crinkle Fries (Demo)',
      slug: 'cheddar-drenched-crinkle-fries',
      categoryId: 'cat-sides',
      categoryName: 'Fries & Sides',
      description: 'Demo Menu Item: Golden crinkle-cut potatoes tossed in sea salt and herb seasoning, generously drizzled with warm aged cheddar cheese sauce.',
      price: 580,
      salePrice: null,
      imageKey: 'loaded_fries',
      isAvailable: true,
      trackStock: true,
      stockQuantity: 42,
      prepEstimateMinutes: 10,
      sizes: [
        { label: 'Regular Bowl', priceDelta: 0 },
        { label: 'Sharing Platter', priceDelta: 240 },
      ],
      spiceLevels: ['Mild Sea Salt', 'Peri-Peri Dusted'],
      addons: [
        { id: 'add-dip', name: 'Smoky Chipotle Dip', price: 90 },
        { id: 'add-chicken-bits', name: 'Crispy Chicken Bites Topping', price: 220 },
      ],
      isFeatured: true,
      isCombo: false,
      isDemoData: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'prod-crispy-bucket',
      name: '4-Piece Crispy Fried Chicken Basket (Demo)',
      slug: '4-piece-crispy-fried-chicken-basket',
      categoryId: 'cat-chicken',
      categoryName: 'Fried Chicken',
      description: 'Demo Menu Item: Four pieces of golden-fried bone-in chicken marinated in house spices, served with a warm dinner roll and garlic mayo dip.',
      price: 1120,
      salePrice: 980,
      imageKey: 'crispy_chicken',
      isAvailable: true,
      trackStock: true,
      stockQuantity: 20,
      prepEstimateMinutes: 18,
      sizes: [
        { label: '4 Pieces + 1 Dip', priceDelta: 0 },
        { label: '8 Pieces Family Bucket + 3 Dips', priceDelta: 890 },
      ],
      spiceLevels: ['Original Golden', 'Hot & Spicy'],
      addons: [
        { id: 'add-bun', name: 'Extra Brioche Roll', price: 80 },
        { id: 'add-garlic-dip', name: 'Extra Garlic Mayo Dip', price: 90 },
      ],
      isFeatured: false,
      isCombo: false,
      isDemoData: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'prod-chipotle-wrap',
      name: 'Smoky Chipotle Chicken Tortilla Wrap (Demo)',
      slug: 'smoky-chipotle-chicken-tortilla-wrap',
      categoryId: 'cat-wraps',
      categoryName: 'Sandwiches & Wraps',
      description: 'Demo Menu Item: Crispy chicken strips, cheddar cheese, crisp lettuce, roasted corn salsa, and smoky chipotle sauce wrapped in a grilled flour tortilla.',
      price: 690,
      salePrice: null,
      imageKey: 'crispy_chicken',
      isAvailable: true,
      trackStock: true,
      stockQuantity: 25,
      prepEstimateMinutes: 12,
      sizes: [
        { label: 'Single Wrap', priceDelta: 0 },
        { label: 'Wrap + Regular Fries & Drink', priceDelta: 340 },
      ],
      spiceLevels: ['Mild', 'Medium', 'Fiery Hot'],
      addons: [
        { id: 'add-wrap-cheese', name: 'Extra Melted Cheese', price: 110 },
      ],
      isFeatured: false,
      isCombo: false,
      isDemoData: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'prod-squad-combo',
      name: 'Zain Matchday Feast Combo (Demo)',
      slug: 'zain-matchday-feast-combo',
      categoryId: 'cat-combos',
      categoryName: 'Combo Deals',
      description: 'Demo Menu Item: 2 Signature Double Smash Burgers, 1 Medium 10-inch Pepperoni Pizza, 1 Sharing Cheddar Crinkle Fries, and 1.5L Chilled Drink.',
      price: 3450,
      salePrice: 2890,
      imageKey: 'hero_burger',
      isAvailable: true,
      trackStock: true,
      stockQuantity: 14,
      prepEstimateMinutes: 25,
      sizes: [
        { label: 'Standard Feast (Serves 3-4)', priceDelta: 0 },
        { label: 'Upgrade Pizza to 13-inch Large', priceDelta: 400 },
      ],
      spiceLevels: ['Mild Mix', 'Spicy Mix'],
      addons: [
        { id: 'add-dip-pack', name: 'Trio Dip Pack (Garlic, Chipotle, Honey Mustard)', price: 220 },
      ],
      isFeatured: true,
      isCombo: true,
      isDemoData: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'prod-solo-box',
      name: 'Solo Smash & Crunch Box (Demo)',
      slug: 'solo-smash-crunch-box',
      categoryId: 'cat-combos',
      categoryName: 'Combo Deals',
      description: 'Demo Menu Item: 1 Double Smash Burger, 1 Crispy Chicken Piece, Regular Crinkle Fries, and a 345ml Chilled Cola.',
      price: 1550,
      salePrice: 1350,
      imageKey: 'hero_burger',
      isAvailable: true,
      trackStock: true,
      stockQuantity: 22,
      prepEstimateMinutes: 15,
      sizes: [
        { label: 'Regular Box', priceDelta: 0 },
        { label: 'Upsize Fries & Drink', priceDelta: 180 },
      ],
      spiceLevels: ['Mild', 'Spicy'],
      addons: [
        { id: 'add-solo-cheese', name: 'Cheddar Sauce on Fries', price: 140 },
      ],
      isFeatured: true,
      isCombo: true,
      isDemoData: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'prod-craft-cola',
      name: 'Chilled Sparkling Cola & Lime (Demo)',
      slug: 'chilled-sparkling-cola-lime',
      categoryId: 'cat-drinks',
      categoryName: 'Drinks',
      description: 'Demo Menu Item: Ice-cold carbonated cola served with fresh lime wedge.',
      price: 220,
      salePrice: null,
      imageKey: 'loaded_fries',
      isAvailable: true,
      trackStock: true,
      stockQuantity: 60,
      prepEstimateMinutes: 3,
      sizes: [
        { label: '345ml Cup', priceDelta: 0 },
        { label: '500ml Large Cup', priceDelta: 80 },
        { label: '1.5L Family Bottle', priceDelta: 180 },
      ],
      spiceLevels: [],
      addons: [],
      isFeatured: false,
      isCombo: false,
      isDemoData: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'prod-lava-cake',
      name: 'Warm Belgian Chocolate Lava Cake (Demo)',
      slug: 'warm-belgian-chocolate-lava-cake',
      categoryId: 'cat-desserts',
      categoryName: 'Desserts',
      description: 'Demo Menu Item: Rich dark chocolate sponge cake with a warm molten fudge center.',
      price: 520,
      salePrice: null,
      imageKey: 'smash_burger',
      isAvailable: false, // Out-of-stock demo item to showcase out-of-stock handling
      trackStock: true,
      stockQuantity: 0,
      prepEstimateMinutes: 10,
      sizes: [{ label: 'Single Serving', priceDelta: 0 }],
      spiceLevels: [],
      addons: [],
      isFeatured: false,
      isCombo: false,
      isDemoData: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const coupons: Coupon[] = [
    {
      id: 'coup-zain15',
      code: 'ZAIN15',
      description: '15% off on orders of PKR 1,500 or above (Demo Promo)',
      discountType: 'percentage',
      discountValue: 15,
      minOrderAmount: 1500,
      maxUses: 100,
      usedCount: 12,
      validFrom: '2025-01-01T00:00:00.000Z',
      validUntil: '2028-12-31T23:59:59.000Z',
      isActive: true,
    },
    {
      id: 'coup-welcome200',
      code: 'WELCOME200',
      description: 'Flat PKR 200 off on orders of PKR 1,000 or above (Demo Promo)',
      discountType: 'fixed',
      discountValue: 200,
      minOrderAmount: 1000,
      maxUses: 50,
      usedCount: 5,
      validFrom: '2025-01-01T00:00:00.000Z',
      validUntil: '2028-12-31T23:59:59.000Z',
      isActive: true,
    },
  ];

  const settings: StoreSettings = {
    storeName: 'Zain Fast Food',
    tagline: 'Fresh. Hot. Delivered.',
    deliveryFee: 180,
    freeDeliveryThreshold: 2500,
    minOrderAmount: 600,
    phone: '+92 300 0000000 (Demo Support Line)',
    email: 'orders@zainfastfood.demo',
    address: 'Plot 14-B, Commercial Kitchen District, Lahore (Demo Address)',
    openingHours: 'Daily: 12:00 PM – 2:00 AM',
    deliveryCoverage: '35–45 mins within 8 km radius (Gulberg, DHA, Model Town, Johar Town — Demo Zones)',
    noticeBanner: 'Demo Store Environment: Sample prices in PKR. Free delivery on orders over PKR 2,500 · Use code ZAIN15 for 15% off.',
  };

  const users: StoredUser[] = [
    {
      id: 'user-admin-1',
      name: 'Zain Store Administrator',
      email: 'admin@zainfastfood.demo',
      phone: '0300-1112223',
      defaultAddress: 'Zain HQ, Plot 14-B, Lahore',
      role: 'admin',
      salt: adminSalt,
      passwordHash: hashPassword('Admin123!', adminSalt),
      createdAt: now,
    },
    {
      id: 'user-cust-1',
      name: 'Bilal Ahmed (Demo Customer)',
      email: 'customer@zainfastfood.demo',
      phone: '0321-4567890',
      defaultAddress: 'House 42, Street 7, Block K, Gulberg II, Lahore',
      role: 'customer',
      salt: customerSalt,
      passwordHash: hashPassword('Customer123!', customerSalt),
      createdAt: now,
    },
  ];

  const orders: Order[] = [
    {
      id: 'ord-demo-1041',
      orderNumber: 'ZFF-1041',
      userId: 'user-cust-1',
      customerName: 'Bilal Ahmed (Demo Customer)',
      customerPhone: '0321-4567890',
      customerEmail: 'customer@zainfastfood.demo',
      deliveryAddress: 'House 42, Street 7, Block K, Gulberg II, Lahore',
      postalCode: '54660',
      deliveryNotes: 'Please ring the main gate bell once.',
      paymentMethod: 'COD',
      items: [
        {
          productId: 'prod-double-smash',
          productName: 'Zain Signature Double Smash Burger (Demo)',
          unitPrice: 1110,
          quantity: 2,
          selectedSize: 'Double Patty (Standard)',
          selectedSpice: 'Medium',
          selectedAddons: [{ name: 'Extra Cheddar Slice', price: 120 }],
          lineTotal: 2220,
        },
        {
          productId: 'prod-loaded-fries',
          productName: 'Cheddar Drenched Crinkle Fries (Demo)',
          unitPrice: 580,
          quantity: 1,
          selectedSize: 'Regular Bowl',
          selectedSpice: 'Peri-Peri Dusted',
          selectedAddons: [],
          lineTotal: 580,
        },
      ],
      subtotal: 2800,
      discountAmount: 420,
      couponCode: 'ZAIN15',
      deliveryFee: 180,
      total: 2560,
      status: 'Out for Delivery',
      statusHistory: [
        { status: 'Pending', timestamp: new Date(Date.now() - 32 * 60000).toISOString(), note: 'Order placed via web storefront' },
        { status: 'Confirmed', timestamp: new Date(Date.now() - 28 * 60000).toISOString(), note: 'Kitchen accepted order' },
        { status: 'Preparing', timestamp: new Date(Date.now() - 22 * 60000).toISOString(), note: 'Grilling fresh patties' },
        { status: 'Ready for Dispatch', timestamp: new Date(Date.now() - 12 * 60000).toISOString(), note: 'Packed in thermal bag' },
        { status: 'Out for Delivery', timestamp: new Date(Date.now() - 8 * 60000).toISOString(), note: 'Rider dispatched to Gulberg II' },
      ],
      createdAt: new Date(Date.now() - 32 * 60000).toISOString(),
      updatedAt: new Date(Date.now() - 8 * 60000).toISOString(),
    },
    {
      id: 'ord-demo-1038',
      orderNumber: 'ZFF-1038',
      userId: 'user-cust-1',
      customerName: 'Bilal Ahmed (Demo Customer)',
      customerPhone: '0321-4567890',
      customerEmail: 'customer@zainfastfood.demo',
      deliveryAddress: 'House 42, Street 7, Block K, Gulberg II, Lahore',
      postalCode: '54660',
      deliveryNotes: '',
      paymentMethod: 'COD',
      items: [
        {
          productId: 'prod-solo-box',
          productName: 'Solo Smash & Crunch Box (Demo)',
          unitPrice: 1350,
          quantity: 1,
          selectedSize: 'Regular Box',
          selectedSpice: 'Spicy',
          selectedAddons: [],
          lineTotal: 1350,
        },
      ],
      subtotal: 1350,
      discountAmount: 200,
      couponCode: 'WELCOME200',
      deliveryFee: 180,
      total: 1330,
      status: 'Delivered',
      statusHistory: [
        { status: 'Pending', timestamp: new Date(Date.now() - 86400000).toISOString() },
        { status: 'Confirmed', timestamp: new Date(Date.now() - 86000000).toISOString() },
        { status: 'Delivered', timestamp: new Date(Date.now() - 84000000).toISOString(), note: 'Delivered and Cash on Delivery collected' },
      ],
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 84000000).toISOString(),
    },
  ];

  return {
    categories,
    products,
    coupons,
    settings,
    users,
    sessions: [],
    orders,
  };
}

function loadDb(): DatabaseSchema {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const initial = createInitialDb();
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<DatabaseSchema>;
    return {
      categories: Array.isArray(parsed.categories) ? parsed.categories : initial.categories,
      products: Array.isArray(parsed.products) ? parsed.products : initial.products,
      coupons: Array.isArray(parsed.coupons) ? parsed.coupons : initial.coupons,
      settings: parsed.settings ? { ...initial.settings, ...parsed.settings } : initial.settings,
      users: Array.isArray(parsed.users) ? parsed.users : initial.users,
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
      orders: Array.isArray(parsed.orders) ? parsed.orders : initial.orders,
    };
  } catch {
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }
}

function saveDb(db: DatabaseSchema): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
}

let db = loadDb();

function sanitizeUser(u: StoredUser): UserProfile {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    defaultAddress: u.defaultAddress,
    role: u.role,
    createdAt: u.createdAt,
  };
}

function getAuthenticatedUser(req: Request): StoredUser | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7).trim();
  if (!token) return null;
  const session = db.sessions.find((s) => s.token === token);
  if (!session) return null;
  return db.users.find((u) => u.id === session.userId) || null;
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  const user = getAuthenticatedUser(req);
  if (!user) {
    res.status(401).json({ error: 'Authentication required. Please sign in.' });
    return;
  }
  (req as Request & { user?: StoredUser }).user = user;
  next();
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== 'admin') {
    res.status(403).json({ error: 'Administrator privileges required for this action.' });
    return;
  }
  (req as Request & { user?: StoredUser }).user = user;
  next();
}

/**
 * Pure server-side price, option, add-on, coupon, and delivery fee calculator.
 * Never trusts client-submitted unit prices or totals.
 */
function calculateCartServerSide(
  rawItems: CartItemInput[],
  couponCode?: string | null
): CartCalculationResponse {
  const calculatedItems: CalculatedCartItem[] = [];
  let subtotal = 0;
  const allocatedStockByProduct: Record<string, number> = {};

  for (const item of rawItems || []) {
    const qty = Math.max(1, Math.min(99, Math.floor(Number(item.quantity) || 1)));
    const product = db.products.find((p) => p.id === item.productId);
    if (!product) continue;

    const effectiveBase =
      typeof product.salePrice === 'number' && product.salePrice > 0 && product.salePrice < product.price
        ? product.salePrice
        : product.price;

    // Resolve size delta from server product definition
    let sizeLabel: string | undefined = undefined;
    let sizeDelta = 0;
    if (product.sizes && product.sizes.length > 0) {
      const matchedSize =
        product.sizes.find((s) => s.label === item.selectedSize) || product.sizes[0];
      sizeLabel = matchedSize.label;
      sizeDelta = Number(matchedSize.priceDelta) || 0;
    }

    // Resolve spice level
    let spiceLevel: string | undefined = undefined;
    if (product.spiceLevels && product.spiceLevels.length > 0) {
      spiceLevel = product.spiceLevels.includes(item.selectedSpice || '')
        ? item.selectedSpice
        : product.spiceLevels[0];
    }

    // Resolve add-ons strictly from server product definition
    const selectedAddonIds = Array.isArray(item.selectedAddonIds) ? item.selectedAddonIds : [];
    const resolvedAddons = (product.addons || []).filter((a) => selectedAddonIds.includes(a.id));
    const addonsTotal = resolvedAddons.reduce((sum, a) => sum + (Number(a.price) || 0), 0);

    const finalUnitPrice = effectiveBase + sizeDelta + addonsTotal;
    const alreadyAllocated = allocatedStockByProduct[product.id] || 0;
    const remainingStock = product.trackStock
      ? Math.max(0, product.stockQuantity - alreadyAllocated)
      : 99;
    const isAvailable =
      product.isAvailable && (!product.trackStock || remainingStock >= qty);

    if (isAvailable && product.trackStock) {
      allocatedStockByProduct[product.id] = alreadyAllocated + qty;
    }

    const lineTotal = isAvailable ? finalUnitPrice * qty : 0;

    if (isAvailable) {
      subtotal += lineTotal;
    }

    calculatedItems.push({
      cartItemId: item.cartItemId || `${product.id}-${sizeLabel || 'std'}`,
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      imageKey: product.imageKey,
      baseUnitPrice: effectiveBase,
      sizeLabel,
      sizeDelta,
      spiceLevel,
      addons: resolvedAddons,
      addonsTotal,
      finalUnitPrice,
      quantity: qty,
      lineTotal,
      isAvailable,
      maxAvailableStock: product.trackStock ? Math.max(qty, remainingStock) : 99,
    });
  }

  let discountAmount = 0;
  let appliedCoupon: { code: string; description: string } | null = null;
  let couponError: string | null = null;

  const trimmedCode = (couponCode || '').trim().toUpperCase();
  if (trimmedCode && subtotal > 0) {
    const coupon = db.coupons.find((c) => c.code.toUpperCase() === trimmedCode);
    const nowTime = Date.now();
    if (!coupon || !coupon.isActive) {
      couponError = `Coupon "${trimmedCode}" is invalid or inactive.`;
    } else if (nowTime < new Date(coupon.validFrom).getTime() || nowTime > new Date(coupon.validUntil).getTime()) {
      couponError = `Coupon "${trimmedCode}" has expired.`;
    } else if (coupon.usedCount >= coupon.maxUses) {
      couponError = `Coupon "${trimmedCode}" has reached its usage limit.`;
    } else if (subtotal < coupon.minOrderAmount) {
      couponError = `Coupon "${trimmedCode}" requires a minimum subtotal of PKR ${coupon.minOrderAmount.toLocaleString()}.`;
    } else {
      if (coupon.discountType === 'percentage') {
        discountAmount = Math.round((subtotal * coupon.discountValue) / 100);
      } else {
        discountAmount = Math.min(subtotal, Math.round(coupon.discountValue));
      }
      appliedCoupon = {
        code: coupon.code,
        description: coupon.description,
      };
    }
  }

  const afterDiscount = Math.max(0, subtotal - discountAmount);
  const deliveryFee =
    subtotal === 0
      ? 0
      : afterDiscount >= db.settings.freeDeliveryThreshold
      ? 0
      : db.settings.deliveryFee;

  const total = subtotal === 0 ? 0 : afterDiscount + deliveryFee;
  const meetsMinOrder = subtotal >= db.settings.minOrderAmount;
  const amountNeededForMinOrder = Math.max(0, db.settings.minOrderAmount - subtotal);
  const amountNeededForFreeDelivery = Math.max(0, db.settings.freeDeliveryThreshold - afterDiscount);

  return {
    items: calculatedItems,
    subtotal,
    discountAmount,
    appliedCoupon,
    couponError,
    deliveryFee,
    total,
    minOrderAmount: db.settings.minOrderAmount,
    meetsMinOrder,
    amountNeededForMinOrder,
    amountNeededForFreeDelivery,
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '15mb' }));

  // --- PUBLIC STOREFRONT API ---
  app.get('/api/bootstrap', (req: Request, res: Response) => {
    const user = getAuthenticatedUser(req);
    const sortedCategories = [...db.categories].sort((a, b) => a.sortOrder - b.sortOrder);
    const activeCoupons = db.coupons
      .filter((c) => c.isActive && c.usedCount < c.maxUses)
      .map((c) => ({
        code: c.code,
        description: c.description,
        minOrderAmount: c.minOrderAmount,
        discountType: c.discountType,
        discountValue: c.discountValue,
      }));

    res.json({
      categories: sortedCategories,
      products: db.products,
      settings: db.settings,
      activeCoupons,
      user: user ? sanitizeUser(user) : null,
    });
  });

  // --- AUTHENTICATION API ---
  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { email, password } = req.body || {};
    if (!email || !password) {
      res.status(400).json({ error: 'Please provide both email and password.' });
      return;
    }
    const normalizedEmail = String(email).trim().toLowerCase();
    const user = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }
    const computedHash = hashPassword(String(password), user.salt);
    if (computedHash !== user.passwordHash) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const token = crypto.randomBytes(32).toString('hex');
    db.sessions.push({
      token,
      userId: user.id,
      createdAt: new Date().toISOString(),
    });
    saveDb(db);

    res.json({
      token,
      user: sanitizeUser(user),
    });
  });

  app.post('/api/auth/register', (req: Request, res: Response) => {
    const { name, email, phone, defaultAddress, password } = req.body || {};
    if (!name || !email || !phone || !password) {
      res.status(400).json({ error: 'Name, email, phone number, and password are required.' });
      return;
    }
    if (String(password).length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      return;
    }
    const normalizedEmail = String(email).trim().toLowerCase();
    if (db.users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const newUser: StoredUser = {
      id: `user-${Date.now()}`,
      name: String(name).trim(),
      email: normalizedEmail,
      phone: String(phone).trim(),
      defaultAddress: String(defaultAddress || '').trim(),
      role: 'customer',
      salt,
      passwordHash: hashPassword(String(password), salt),
      createdAt: new Date().toISOString(),
    };

    const token = crypto.randomBytes(32).toString('hex');
    db.users.push(newUser);
    db.sessions.push({
      token,
      userId: newUser.id,
      createdAt: new Date().toISOString(),
    });
    saveDb(db);

    res.status(201).json({
      token,
      user: sanitizeUser(newUser),
    });
  });

  app.post('/api/auth/logout', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7).trim();
      db.sessions = db.sessions.filter((s) => s.token !== token);
      saveDb(db);
    }
    res.json({ ok: true });
  });

  // --- SERVER-SIDE CART & COUPON CALCULATION ---
  app.post('/api/cart/calculate', (req: Request, res: Response) => {
    const { items, couponCode } = req.body || {};
    const result = calculateCartServerSide(Array.isArray(items) ? items : [], couponCode);
    res.json(result);
  });

  // --- ORDER CREATION & CUSTOMER ORDER HISTORY ---
  app.post('/api/orders', (req: Request, res: Response) => {
    const user = getAuthenticatedUser(req);
    const {
      items,
      couponCode,
      customerName,
      customerPhone,
      customerEmail,
      deliveryAddress,
      postalCode,
      deliveryNotes,
    } = req.body || {};

    if (!customerName || String(customerName).trim().length < 2) {
      res.status(400).json({ error: 'Please enter a valid customer full name.' });
      return;
    }
    const cleanPhone = String(customerPhone || '').trim();
    if (cleanPhone.length < 8) {
      res.status(400).json({ error: 'Please provide a valid active phone number for delivery verification.' });
      return;
    }
    const cleanAddress = String(deliveryAddress || '').trim();
    if (cleanAddress.length < 10) {
      res.status(400).json({ error: 'Please provide a complete street address and area for delivery.' });
      return;
    }
    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'Your cart is empty.' });
      return;
    }

    // Re-calculate all totals strictly on the server
    const calc = calculateCartServerSide(items, couponCode);

    // Reject if any item in cart is unavailable or out of stock
    const unavailableItem = calc.items.find((i) => !i.isAvailable);
    if (unavailableItem) {
      res.status(400).json({
        error: `"${unavailableItem.productName}" is currently unavailable or does not have enough stock for your requested quantity.`,
      });
      return;
    }

    if (calc.items.length === 0 || calc.subtotal <= 0) {
      res.status(400).json({ error: 'No valid available items found in your order.' });
      return;
    }

    // Reject if coupon code was provided by customer but failed server validation
    if (couponCode && String(couponCode).trim() !== '' && calc.couponError) {
      res.status(400).json({ error: calc.couponError });
      return;
    }

    if (!calc.meetsMinOrder) {
      res.status(400).json({
        error: `Minimum order subtotal is PKR ${db.settings.minOrderAmount.toLocaleString()}. Please add PKR ${calc.amountNeededForMinOrder.toLocaleString()} more to place your order.`,
      });
      return;
    }

    // Create immutable order item snapshots & decrement inventory stock
    const snapshots: OrderItemSnapshot[] = calc.items.map((ci) => {
      const product = db.products.find((p) => p.id === ci.productId);
      if (product && product.trackStock) {
        product.stockQuantity = Math.max(0, product.stockQuantity - ci.quantity);
        if (product.stockQuantity === 0) {
          product.isAvailable = false;
        }
        product.updatedAt = new Date().toISOString();
      }
      return {
        productId: ci.productId,
        productName: ci.productName,
        unitPrice: ci.finalUnitPrice,
        quantity: ci.quantity,
        selectedSize: ci.sizeLabel,
        selectedSpice: ci.spiceLevel,
        selectedAddons: ci.addons.map((a) => ({ name: a.name, price: a.price })),
        lineTotal: ci.lineTotal,
      };
    });

    if (calc.appliedCoupon) {
      const matchedCoupon = db.coupons.find(
        (c) => c.code.toUpperCase() === calc.appliedCoupon?.code.toUpperCase()
      );
      if (matchedCoupon) {
        matchedCoupon.usedCount += 1;
      }
    }

    const now = new Date().toISOString();
    const nextSequence = 1042 + db.orders.length;
    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber: `ZFF-${nextSequence}`,
      userId: user ? user.id : null,
      customerName: String(customerName).trim(),
      customerPhone: cleanPhone,
      customerEmail: String(customerEmail || user?.email || '').trim(),
      deliveryAddress: cleanAddress,
      postalCode: String(postalCode || '').trim(),
      deliveryNotes: String(deliveryNotes || '').trim(),
      paymentMethod: 'COD',
      items: snapshots,
      subtotal: calc.subtotal,
      discountAmount: calc.discountAmount,
      couponCode: calc.appliedCoupon ? calc.appliedCoupon.code : null,
      deliveryFee: calc.deliveryFee,
      total: calc.total,
      status: 'Pending',
      statusHistory: [
        {
          status: 'Pending',
          timestamp: now,
          note: 'Order received and awaiting kitchen confirmation.',
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    db.orders.unshift(newOrder);
    saveDb(db);

    res.status(201).json({ order: newOrder });
  });

  // Strict ownership check: signed-in customer sees only their own orders
  app.get('/api/orders/my', requireAuth, (req: Request, res: Response) => {
    const user = (req as Request & { user: StoredUser }).user;
    const myOrders = db.orders.filter((o) => o.userId === user.id);
    res.json({ orders: myOrders });
  });

  // Track a specific order by Order Number + Phone verification (or owning customer / admin)
  app.get('/api/orders/lookup/:orderNumber', (req: Request, res: Response) => {
    const user = getAuthenticatedUser(req);
    const orderNum = String(req.params.orderNumber || '').trim().toUpperCase();
    const phoneQuery = String(req.query.phone || '').replace(/\D/g, '');
    const order = db.orders.find((o) => o.orderNumber.toUpperCase() === orderNum);

    if (!order) {
      res.status(404).json({ error: 'Order not found. Please check your order number.' });
      return;
    }

    // Access control: allow if Admin, or if owning logged-in customer, or if matching last 7 digits of phone
    const isOwner = user && (user.role === 'admin' || order.userId === user.id);
    const orderDigits = order.customerPhone.replace(/\D/g, '');
    const phoneMatches =
      phoneQuery.length >= 6 &&
      orderDigits.endsWith(phoneQuery.slice(-6));

    if (!isOwner && !phoneMatches) {
      res.status(403).json({
        error: 'To protect customer privacy, please sign in to the owning account or enter the phone number used on this order.',
      });
      return;
    }

    res.json({ order });
  });

  // --- PROTECTED ADMIN API ---
  app.get('/api/admin/dashboard', requireAdmin, (_req: Request, res: Response) => {
    const totalOrders = db.orders.length;
    const pendingOrders = db.orders.filter((o) => o.status === 'Pending').length;
    const activeOrders = db.orders.filter((o) =>
      ['Confirmed', 'Preparing', 'Ready for Dispatch', 'Out for Delivery'].includes(o.status)
    ).length;
    const deliveredRevenue = db.orders
      .filter((o) => o.status !== 'Cancelled')
      .reduce((sum, o) => sum + o.total, 0);
    const outOfStockCount = db.products.filter(
      (p) => !p.isAvailable || (p.trackStock && p.stockQuantity <= 0)
    ).length;
    const lowStockCount = db.products.filter(
      (p) => p.trackStock && p.stockQuantity > 0 && p.stockQuantity <= 5
    ).length;

    const customers = db.users.map((u) => {
      const userOrders = db.orders.filter(
        (o) =>
          o.userId === u.id ||
          (o.customerEmail && o.customerEmail.toLowerCase() === u.email.toLowerCase())
      );
      const validOrders = userOrders.filter((o) => o.status !== 'Cancelled');
      const totalSpent = validOrders.reduce((sum, o) => sum + o.total, 0);
      return {
        ...sanitizeUser(u),
        orderCount: userOrders.length,
        totalSpent,
      };
    });

    res.json({
      metrics: {
        totalOrders,
        pendingOrders,
        activeOrders,
        deliveredRevenue,
        outOfStockCount,
        lowStockCount,
      },
      orders: db.orders,
      products: db.products,
      categories: [...db.categories].sort((a, b) => a.sortOrder - b.sortOrder),
      coupons: db.coupons,
      settings: db.settings,
      customers,
    });
  });

  // Admin: Update Order Status
  app.patch('/api/admin/orders/:id/status', requireAdmin, (req: Request, res: Response) => {
    const { status, note } = req.body || {};
    const validStatuses: OrderStatus[] = [
      'Pending',
      'Confirmed',
      'Preparing',
      'Ready for Dispatch',
      'Out for Delivery',
      'Delivered',
      'Cancelled',
    ];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: 'Invalid order status.' });
      return;
    }
    const order = db.orders.find((o) => o.id === req.params.id);
    if (!order) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }
    const now = new Date().toISOString();
    order.status = status;
    order.updatedAt = now;
    order.statusHistory.push({
      status,
      timestamp: now,
      note: note ? String(note).trim() : undefined,
    });
    saveDb(db);
    res.json({ order });
  });

  // Admin: Create / Update / Delete Products
  app.post('/api/admin/products', requireAdmin, (req: Request, res: Response) => {
    const body = req.body || {};
    if (!body.name || !body.categoryId || Number(body.price) <= 0) {
      res.status(400).json({ error: 'Product name, category, and a valid positive price in PKR are required.' });
      return;
    }
    const category = db.categories.find((c) => c.id === body.categoryId);
    if (!category) {
      res.status(400).json({ error: 'Selected category does not exist.' });
      return;
    }
    const now = new Date().toISOString();
    const slug = String(body.name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      name: String(body.name).trim(),
      slug: `${slug}-${Date.now().toString().slice(-4)}`,
      categoryId: category.id,
      categoryName: category.name,
      description: String(body.description || '').trim(),
      price: Math.round(Number(body.price)),
      salePrice: body.salePrice ? Math.round(Number(body.salePrice)) : null,
      imageKey: String(body.imageKey || 'smash_burger'),
      isAvailable: Boolean(body.isAvailable ?? true),
      trackStock: Boolean(body.trackStock ?? true),
      stockQuantity: Math.max(0, Math.floor(Number(body.stockQuantity ?? 20))),
      prepEstimateMinutes: Math.max(1, Math.floor(Number(body.prepEstimateMinutes ?? 15))),
      sizes: Array.isArray(body.sizes) && body.sizes.length > 0
        ? body.sizes
        : [{ label: 'Regular', priceDelta: 0 }],
      spiceLevels: Array.isArray(body.spiceLevels) ? body.spiceLevels : [],
      addons: Array.isArray(body.addons) ? body.addons : [],
      isFeatured: Boolean(body.isFeatured ?? false),
      isCombo: Boolean(body.isCombo ?? category.slug === 'combo-deals'),
      isDemoData: Boolean(body.isDemoData ?? true),
      createdAt: now,
      updatedAt: now,
    };

    db.products.unshift(newProduct);
    saveDb(db);
    res.status(201).json({ product: newProduct });
  });

  app.put('/api/admin/products/:id', requireAdmin, (req: Request, res: Response) => {
    const product = db.products.find((p) => p.id === req.params.id);
    if (!product) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }
    const body = req.body || {};
    const category = db.categories.find((c) => c.id === (body.categoryId || product.categoryId));

    if (body.name !== undefined) product.name = String(body.name).trim();
    if (category) {
      product.categoryId = category.id;
      product.categoryName = category.name;
    }
    if (body.description !== undefined) product.description = String(body.description).trim();
    if (body.price !== undefined && Number(body.price) > 0) {
      product.price = Math.round(Number(body.price));
    }
    if (body.salePrice !== undefined) {
      product.salePrice = body.salePrice && Number(body.salePrice) > 0 ? Math.round(Number(body.salePrice)) : null;
    }
    if (body.imageKey !== undefined) product.imageKey = String(body.imageKey);
    if (body.isAvailable !== undefined) product.isAvailable = Boolean(body.isAvailable);
    if (body.trackStock !== undefined) product.trackStock = Boolean(body.trackStock);
    if (body.stockQuantity !== undefined) {
      product.stockQuantity = Math.max(0, Math.floor(Number(body.stockQuantity)));
    }
    if (body.prepEstimateMinutes !== undefined) {
      product.prepEstimateMinutes = Math.max(1, Math.floor(Number(body.prepEstimateMinutes)));
    }
    if (Array.isArray(body.sizes)) product.sizes = body.sizes;
    if (Array.isArray(body.spiceLevels)) product.spiceLevels = body.spiceLevels;
    if (Array.isArray(body.addons)) product.addons = body.addons;
    if (body.isFeatured !== undefined) product.isFeatured = Boolean(body.isFeatured);
    if (body.isCombo !== undefined) product.isCombo = Boolean(body.isCombo);
    if (body.isDemoData !== undefined) product.isDemoData = Boolean(body.isDemoData);

    product.updatedAt = new Date().toISOString();
    saveDb(db);
    res.json({ product });
  });

  app.delete('/api/admin/products/:id', requireAdmin, (req: Request, res: Response) => {
    const idx = db.products.findIndex((p) => p.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }
    db.products.splice(idx, 1);
    saveDb(db);
    res.json({ ok: true });
  });

  // Admin: Categories CRUD
  app.post('/api/admin/categories', requireAdmin, (req: Request, res: Response) => {
    const { name, description, sortOrder } = req.body || {};
    if (!name || String(name).trim().length < 2) {
      res.status(400).json({ error: 'Category name is required.' });
      return;
    }
    const slug = String(name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const newCat: Category = {
      id: `cat-${Date.now()}`,
      name: String(name).trim(),
      slug,
      description: String(description || '').trim(),
      sortOrder: Number(sortOrder) || db.categories.length + 1,
    };
    db.categories.push(newCat);
    saveDb(db);
    res.status(201).json({ category: newCat });
  });

  app.put('/api/admin/categories/:id', requireAdmin, (req: Request, res: Response) => {
    const cat = db.categories.find((c) => c.id === req.params.id);
    if (!cat) {
      res.status(404).json({ error: 'Category not found.' });
      return;
    }
    const { name, description, sortOrder } = req.body || {};
    if (name !== undefined && String(name).trim().length >= 2) {
      cat.name = String(name).trim();
      cat.slug = cat.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      // Sync categoryName on products in this category
      db.products.forEach((p) => {
        if (p.categoryId === cat.id) {
          p.categoryName = cat.name;
        }
      });
    }
    if (description !== undefined) cat.description = String(description).trim();
    if (sortOrder !== undefined && Number(sortOrder) > 0) {
      cat.sortOrder = Math.round(Number(sortOrder));
    }
    saveDb(db);
    res.json({ category: cat });
  });

  app.post('/api/admin/inventory/restock-low', requireAdmin, (_req: Request, res: Response) => {
    let updatedCount = 0;
    const now = new Date().toISOString();
    db.products.forEach((p) => {
      if (!p.isAvailable || (p.trackStock && p.stockQuantity <= 10)) {
        p.stockQuantity = Math.max(p.stockQuantity, 25);
        p.isAvailable = true;
        p.updatedAt = now;
        updatedCount += 1;
      }
    });
    saveDb(db);
    res.json({ ok: true, updatedCount });
  });

  app.delete('/api/admin/categories/:id', requireAdmin, (req: Request, res: Response) => {
    const hasProducts = db.products.some((p) => p.categoryId === req.params.id);
    if (hasProducts) {
      res.status(400).json({ error: 'Cannot delete a category that still has products assigned to it.' });
      return;
    }
    db.categories = db.categories.filter((c) => c.id !== req.params.id);
    saveDb(db);
    res.json({ ok: true });
  });

  // Admin: Coupons CRUD
  app.post('/api/admin/coupons', requireAdmin, (req: Request, res: Response) => {
    const body = req.body || {};
    const code = String(body.code || '').trim().toUpperCase();
    if (!code || Number(body.discountValue) <= 0) {
      res.status(400).json({ error: 'Valid coupon code and positive discount value are required.' });
      return;
    }
    if (db.coupons.some((c) => c.code.toUpperCase() === code)) {
      res.status(409).json({ error: 'A coupon with this code already exists.' });
      return;
    }
    const newCoupon: Coupon = {
      id: `coup-${Date.now()}`,
      code,
      description: String(body.description || `${code} Promotional Discount`).trim(),
      discountType: body.discountType === 'fixed' ? 'fixed' : 'percentage',
      discountValue: Math.round(Number(body.discountValue)),
      minOrderAmount: Math.max(0, Math.round(Number(body.minOrderAmount || 0))),
      maxUses: Math.max(1, Math.round(Number(body.maxUses || 100))),
      usedCount: 0,
      validFrom: body.validFrom || new Date().toISOString(),
      validUntil: body.validUntil || new Date(Date.now() + 90 * 86400000).toISOString(),
      isActive: Boolean(body.isActive ?? true),
    };
    db.coupons.unshift(newCoupon);
    saveDb(db);
    res.status(201).json({ coupon: newCoupon });
  });

  app.patch('/api/admin/coupons/:id', requireAdmin, (req: Request, res: Response) => {
    const coupon = db.coupons.find((c) => c.id === req.params.id);
    if (!coupon) {
      res.status(404).json({ error: 'Coupon not found.' });
      return;
    }
    if (req.body.isActive !== undefined) {
      coupon.isActive = Boolean(req.body.isActive);
    }
    saveDb(db);
    res.json({ coupon });
  });

  app.delete('/api/admin/coupons/:id', requireAdmin, (req: Request, res: Response) => {
    db.coupons = db.coupons.filter((c) => c.id !== req.params.id);
    saveDb(db);
    res.json({ ok: true });
  });

  // Admin: Store Settings update
  app.put('/api/admin/settings', requireAdmin, (req: Request, res: Response) => {
    const body = req.body || {};
    db.settings = {
      ...db.settings,
      storeName: String(body.storeName ?? db.settings.storeName).trim(),
      tagline: String(body.tagline ?? db.settings.tagline).trim(),
      logoUrl: body.logoUrl !== undefined ? String(body.logoUrl).trim() : db.settings.logoUrl,
      deliveryFee: Math.max(0, Math.round(Number(body.deliveryFee ?? db.settings.deliveryFee))),
      freeDeliveryThreshold: Math.max(
        0,
        Math.round(Number(body.freeDeliveryThreshold ?? db.settings.freeDeliveryThreshold))
      ),
      minOrderAmount: Math.max(0, Math.round(Number(body.minOrderAmount ?? db.settings.minOrderAmount))),
      phone: String(body.phone ?? db.settings.phone).trim(),
      email: String(body.email ?? db.settings.email).trim(),
      address: String(body.address ?? db.settings.address).trim(),
      openingHours: String(body.openingHours ?? db.settings.openingHours).trim(),
      deliveryCoverage: String(body.deliveryCoverage ?? db.settings.deliveryCoverage).trim(),
      noticeBanner: String(body.noticeBanner ?? db.settings.noticeBanner).trim(),
    };
    saveDb(db);
    res.json({ settings: db.settings });
  });

  // Global error handler for API routes so errors always return valid JSON
  app.use('/api', (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const message =
      err instanceof Error ? err.message : 'An unexpected server error occurred.';
    res.status(400).json({ error: message });
  });

  // Mount Vite middleware in development or static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.use((_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Zain Fast Food full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
