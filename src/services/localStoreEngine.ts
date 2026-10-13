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
} from '../types';

interface StoredLocalUser extends UserProfile {
  password: string;
}

interface LocalDbSchema {
  categories: Category[];
  products: Product[];
  coupons: Coupon[];
  settings: StoreSettings;
  users: StoredLocalUser[];
  sessions: { token: string; userId: string }[];
  orders: Order[];
}

const STORAGE_KEY = 'zain_store_db_v1';

function createSeedDb(): LocalDbSchema {
  const now = new Date().toISOString();

  const categories: Category[] = [
    { id: 'cat-burgers', name: 'Burgers', slug: 'burgers', description: 'Smashed beef and crispy fillet burgers on toasted brioche buns.', sortOrder: 1 },
    { id: 'cat-pizza', name: 'Pizza', slug: 'pizza', description: 'Stone-baked hand-stretched pizzas with rich mozzarella.', sortOrder: 2 },
    { id: 'cat-chicken', name: 'Fried Chicken', slug: 'fried-chicken', description: 'Golden pressure-fried chicken pieces and spicy wings.', sortOrder: 3 },
    { id: 'cat-sides', name: 'Fries & Sides', slug: 'fries-sides', description: 'Crinkle-cut fries, loaded cheese bowls, and savoury bites.', sortOrder: 4 },
    { id: 'cat-wraps', name: 'Sandwiches & Wraps', slug: 'sandwiches-wraps', description: 'Grilled tortilla wraps and toasted club sandwiches.', sortOrder: 5 },
    { id: 'cat-combos', name: 'Combo Deals', slug: 'combo-deals', description: 'Value meal bundles crafted for solo cravings and group feasts.', sortOrder: 6 },
    { id: 'cat-drinks', name: 'Drinks', slug: 'drinks', description: 'Chilled sodas, shakes, and sparkling refreshers.', sortOrder: 7 },
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
      isAvailable: false,
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

  const users: StoredLocalUser[] = [
    {
      id: 'user-admin-1',
      name: 'Zain Store Administrator',
      email: 'admin@zainfastfood.demo',
      phone: '0300-1112223',
      defaultAddress: 'Zain HQ, Plot 14-B, Lahore',
      role: 'admin',
      password: 'Admin123!',
      createdAt: now,
    },
    {
      id: 'user-cust-1',
      name: 'Bilal Ahmed (Demo Customer)',
      email: 'customer@zainfastfood.demo',
      phone: '0321-4567890',
      defaultAddress: 'House 42, Street 7, Block K, Gulberg II, Lahore',
      role: 'customer',
      password: 'Customer123!',
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

  return { categories, products, coupons, settings, users, sessions: [], orders };
}

function getDb(): LocalDbSchema {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seed = createSeedDb();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }
    const parsed = JSON.parse(raw);
    const seed = createSeedDb();
    return {
      categories: Array.isArray(parsed.categories) ? parsed.categories : seed.categories,
      products: Array.isArray(parsed.products) ? parsed.products : seed.products,
      coupons: Array.isArray(parsed.coupons) ? parsed.coupons : seed.coupons,
      settings: parsed.settings ? { ...seed.settings, ...parsed.settings } : seed.settings,
      users: Array.isArray(parsed.users) ? parsed.users : seed.users,
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
      orders: Array.isArray(parsed.orders) ? parsed.orders : seed.orders,
    };
  } catch {
    return createSeedDb();
  }
}

function saveDb(db: LocalDbSchema) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    // Ignore quota errors
  }
}

function sanitizeUser(u: StoredLocalUser): UserProfile {
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

function calculateCartLocal(
  db: LocalDbSchema,
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

    let sizeLabel: string | undefined = undefined;
    let sizeDelta = 0;
    if (product.sizes && product.sizes.length > 0) {
      const matchedSize =
        product.sizes.find((s) => s.label === item.selectedSize) || product.sizes[0];
      sizeLabel = matchedSize.label;
      sizeDelta = Number(matchedSize.priceDelta) || 0;
    }

    let spiceLevel: string | undefined = undefined;
    if (product.spiceLevels && product.spiceLevels.length > 0) {
      spiceLevel = product.spiceLevels.includes(item.selectedSpice || '')
        ? item.selectedSpice
        : product.spiceLevels[0];
    }

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
    if (isAvailable) subtotal += lineTotal;

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
    if (!coupon || !coupon.isActive) {
      couponError = `Coupon "${trimmedCode}" is invalid or inactive.`;
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
      appliedCoupon = { code: coupon.code, description: coupon.description };
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
    amountNeededForMinOrder: Math.max(0, db.settings.minOrderAmount - subtotal),
    amountNeededForFreeDelivery: Math.max(0, db.settings.freeDeliveryThreshold - afterDiscount),
  };
}

function makeJsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function handleLocalApiRequest(
  urlStr: string,
  init?: RequestInit
): Promise<Response> {
  const db = getDb();
  const url = new URL(urlStr, window.location.origin);
  const path = url.pathname;
  const method = (init?.method || 'GET').toUpperCase();

  let body: Record<string, any> = {};
  if (init?.body && typeof init.body === 'string') {
    try {
      body = JSON.parse(init.body);
    } catch {
      body = {};
    }
  }

  const authHeader =
    (init?.headers as Record<string, string>)?.Authorization ||
    (init?.headers as Record<string, string>)?.authorization ||
    '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  const session = db.sessions.find((s) => s.token === token);
  const currentUser = session
    ? db.users.find((u) => u.id === session.userId) || null
    : null;

  // GET /api/bootstrap
  if (path === '/api/bootstrap' && method === 'GET') {
    return makeJsonResponse({
      categories: [...db.categories].sort((a, b) => a.sortOrder - b.sortOrder),
      products: db.products,
      settings: db.settings,
      activeCoupons: db.coupons.filter((c) => c.isActive),
      user: currentUser ? sanitizeUser(currentUser) : null,
    });
  }

  // POST /api/auth/login
  if (path === '/api/auth/login' && method === 'POST') {
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    const user = db.users.find(
      (u) => u.email.toLowerCase() === email && u.password === password
    );
    if (!user) {
      return makeJsonResponse({ error: 'Invalid email or password.' }, 401);
    }
    const newToken = `local-tok-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    db.sessions.push({ token: newToken, userId: user.id });
    saveDb(db);
    return makeJsonResponse({ token: newToken, user: sanitizeUser(user) });
  }

  // POST /api/auth/register
  if (path === '/api/auth/register' && method === 'POST') {
    const email = String(body.email || '').trim().toLowerCase();
    if (db.users.some((u) => u.email.toLowerCase() === email)) {
      return makeJsonResponse({ error: 'An account with this email already exists.' }, 409);
    }
    const newUser: StoredLocalUser = {
      id: `user-${Date.now()}`,
      name: String(body.name || 'Customer').trim(),
      email,
      phone: String(body.phone || '').trim(),
      defaultAddress: String(body.defaultAddress || '').trim(),
      role: 'customer',
      password: String(body.password || ''),
      createdAt: new Date().toISOString(),
    };
    const newToken = `local-tok-${Date.now()}`;
    db.users.push(newUser);
    db.sessions.push({ token: newToken, userId: newUser.id });
    saveDb(db);
    return makeJsonResponse({ token: newToken, user: sanitizeUser(newUser) }, 201);
  }

  // POST /api/auth/logout
  if (path === '/api/auth/logout' && method === 'POST') {
    db.sessions = db.sessions.filter((s) => s.token !== token);
    saveDb(db);
    return makeJsonResponse({ ok: true });
  }

  // POST /api/cart/calculate
  if (path === '/api/cart/calculate' && method === 'POST') {
    const calc = calculateCartLocal(db, body.items || [], body.couponCode);
    return makeJsonResponse(calc);
  }

  // POST /api/orders
  if (path === '/api/orders' && method === 'POST') {
    const calc = calculateCartLocal(db, body.items || [], body.couponCode);
    if (calc.items.length === 0 || !calc.meetsMinOrder) {
      return makeJsonResponse({ error: 'Order does not meet minimum requirements.' }, 400);
    }
    const snapshots: OrderItemSnapshot[] = calc.items.map((ci) => {
      const p = db.products.find((prod) => prod.id === ci.productId);
      if (p && p.trackStock) {
        p.stockQuantity = Math.max(0, p.stockQuantity - ci.quantity);
        if (p.stockQuantity === 0) p.isAvailable = false;
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
    const now = new Date().toISOString();
    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber: `ZFF-${1042 + db.orders.length}`,
      userId: currentUser ? currentUser.id : null,
      customerName: String(body.customerName || '').trim(),
      customerPhone: String(body.customerPhone || '').trim(),
      customerEmail: String(body.customerEmail || '').trim(),
      deliveryAddress: String(body.deliveryAddress || '').trim(),
      postalCode: String(body.postalCode || '').trim(),
      deliveryNotes: String(body.deliveryNotes || '').trim(),
      paymentMethod: 'COD',
      items: snapshots,
      subtotal: calc.subtotal,
      discountAmount: calc.discountAmount,
      couponCode: calc.appliedCoupon ? calc.appliedCoupon.code : null,
      deliveryFee: calc.deliveryFee,
      total: calc.total,
      status: 'Pending',
      statusHistory: [{ status: 'Pending', timestamp: now, note: 'Order placed' }],
      createdAt: now,
      updatedAt: now,
    };
    db.orders.unshift(newOrder);
    saveDb(db);
    return makeJsonResponse({ order: newOrder }, 201);
  }

  // GET /api/orders/my
  if (path === '/api/orders/my' && method === 'GET') {
    const myOrders = currentUser
      ? db.orders.filter((o) => o.userId === currentUser.id)
      : [];
    return makeJsonResponse({ orders: myOrders });
  }

  // GET /api/orders/lookup/:orderNumber
  if (path.startsWith('/api/orders/lookup/') && method === 'GET') {
    const orderNum = decodeURIComponent(path.replace('/api/orders/lookup/', '')).toUpperCase();
    const order = db.orders.find((o) => o.orderNumber.toUpperCase() === orderNum);
    if (!order) return makeJsonResponse({ error: 'Order not found.' }, 404);
    return makeJsonResponse({ order });
  }

  // GET /api/admin/dashboard
  if (path === '/api/admin/dashboard' && method === 'GET') {
    const validOrders = db.orders.filter((o) => o.status !== 'Cancelled');
    const deliveredRevenue = validOrders.reduce((s, o) => s + o.total, 0);
    const itemMap: Record<string, { name: string; quantitySold: number; revenue: number }> = {};
    for (const o of validOrders) {
      for (const it of o.items) {
        if (!itemMap[it.productId]) {
          itemMap[it.productId] = { name: it.productName, quantitySold: 0, revenue: 0 };
        }
        itemMap[it.productId].quantitySold += it.quantity;
        itemMap[it.productId].revenue += it.lineTotal;
      }
    }
    const topSellingItems = Object.values(itemMap)
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, 5);

    const categoryBreakdown = db.categories.map((cat) => {
      const catProds = db.products.filter((p) => p.categoryId === cat.id);
      const ids = new Set(catProds.map((p) => p.id));
      let unitsSold = 0;
      let revenue = 0;
      for (const o of validOrders) {
        for (const it of o.items) {
          if (ids.has(it.productId)) {
            unitsSold += it.quantity;
            revenue += it.lineTotal;
          }
        }
      }
      return {
        categoryId: cat.id,
        categoryName: cat.name,
        productCount: catProds.length,
        unitsSold,
        revenue,
      };
    });

    const customers = db.users.map((u) => {
      const uOrders = db.orders.filter((o) => o.userId === u.id && o.status !== 'Cancelled');
      return {
        ...sanitizeUser(u),
        orderCount: uOrders.length,
        totalSpent: uOrders.reduce((s, o) => s + o.total, 0),
      };
    });

    return makeJsonResponse({
      metrics: {
        totalOrders: db.orders.length,
        pendingOrders: db.orders.filter((o) => o.status === 'Pending').length,
        activeOrders: db.orders.filter((o) =>
          ['Confirmed', 'Preparing', 'Ready for Dispatch', 'Out for Delivery'].includes(o.status)
        ).length,
        completedOrders: db.orders.filter((o) => o.status === 'Delivered').length,
        cancelledOrders: db.orders.filter((o) => o.status === 'Cancelled').length,
        deliveredRevenue,
        averageOrderValue: validOrders.length > 0 ? Math.round(deliveredRevenue / validOrders.length) : 0,
        outOfStockCount: db.products.filter((p) => !p.isAvailable || p.stockQuantity <= 0).length,
        lowStockCount: db.products.filter((p) => p.stockQuantity > 0 && p.stockQuantity <= 5).length,
        totalCustomers: db.users.filter((u) => u.role === 'customer').length,
      },
      topSellingItems,
      categoryBreakdown,
      customers,
      orders: db.orders,
      products: db.products,
      categories: [...db.categories].sort((a, b) => a.sortOrder - b.sortOrder),
      coupons: db.coupons,
      settings: db.settings,
    });
  }

  // PATCH /api/admin/orders/:id/status
  if (path.startsWith('/api/admin/orders/') && path.endsWith('/status') && method === 'PATCH') {
    const id = path.replace('/api/admin/orders/', '').replace('/status', '');
    const order = db.orders.find((o) => o.id === id);
    if (!order) return makeJsonResponse({ error: 'Order not found' }, 404);
    const now = new Date().toISOString();
    order.status = body.status as OrderStatus;
    order.updatedAt = now;
    order.statusHistory.push({ status: order.status, timestamp: now, note: body.note });
    saveDb(db);
    return makeJsonResponse({ order });
  }

  // POST /api/admin/products
  if (path === '/api/admin/products' && method === 'POST') {
    const cat = db.categories.find((c) => c.id === body.categoryId) || db.categories[0];
    const now = new Date().toISOString();
    const newProd: Product = {
      id: `prod-${Date.now()}`,
      name: String(body.name || 'New Item').trim(),
      slug: `item-${Date.now()}`,
      categoryId: cat.id,
      categoryName: cat.name,
      description: String(body.description || '').trim(),
      price: Number(body.price) || 500,
      salePrice: body.salePrice ? Number(body.salePrice) : null,
      imageKey: String(body.imageKey || 'smash_burger'),
      isAvailable: Boolean(body.isAvailable ?? true),
      trackStock: Boolean(body.trackStock ?? true),
      stockQuantity: Number(body.stockQuantity ?? 20),
      prepEstimateMinutes: Number(body.prepEstimateMinutes ?? 15),
      sizes: Array.isArray(body.sizes) ? body.sizes : [{ label: 'Regular', priceDelta: 0 }],
      spiceLevels: Array.isArray(body.spiceLevels) ? body.spiceLevels : [],
      addons: Array.isArray(body.addons) ? body.addons : [],
      isFeatured: Boolean(body.isFeatured),
      isCombo: Boolean(body.isCombo),
      isDemoData: true,
      createdAt: now,
      updatedAt: now,
    };
    db.products.unshift(newProd);
    saveDb(db);
    return makeJsonResponse({ product: newProd }, 201);
  }

  // PUT / DELETE /api/admin/products/:id
  if (path.startsWith('/api/admin/products/')) {
    const id = path.replace('/api/admin/products/', '');
    if (method === 'DELETE') {
      db.products = db.products.filter((p) => p.id !== id);
      saveDb(db);
      return makeJsonResponse({ ok: true });
    }
    if (method === 'PUT') {
      const prod = db.products.find((p) => p.id === id);
      if (!prod) return makeJsonResponse({ error: 'Not found' }, 404);
      Object.assign(prod, body, { updatedAt: new Date().toISOString() });
      const cat = db.categories.find((c) => c.id === prod.categoryId);
      if (cat) prod.categoryName = cat.name;
      saveDb(db);
      return makeJsonResponse({ product: prod });
    }
  }

  // POST / PUT / DELETE /api/admin/categories
  if (path === '/api/admin/categories' && method === 'POST') {
    const newCat: Category = {
      id: `cat-${Date.now()}`,
      name: String(body.name || '').trim(),
      slug: `cat-${Date.now()}`,
      description: String(body.description || '').trim(),
      sortOrder: Number(body.sortOrder) || db.categories.length + 1,
    };
    db.categories.push(newCat);
    saveDb(db);
    return makeJsonResponse({ category: newCat }, 201);
  }

  if (path.startsWith('/api/admin/categories/')) {
    const id = path.replace('/api/admin/categories/', '');
    if (method === 'DELETE') {
      db.categories = db.categories.filter((c) => c.id !== id);
      saveDb(db);
      return makeJsonResponse({ ok: true });
    }
    if (method === 'PUT') {
      const cat = db.categories.find((c) => c.id === id);
      if (cat) Object.assign(cat, body);
      saveDb(db);
      return makeJsonResponse({ category: cat });
    }
  }

  // POST / PATCH / DELETE /api/admin/coupons
  if (path === '/api/admin/coupons' && method === 'POST') {
    const newCoupon: Coupon = {
      id: `coup-${Date.now()}`,
      code: String(body.code || '').toUpperCase(),
      description: String(body.description || ''),
      discountType: body.discountType === 'fixed' ? 'fixed' : 'percentage',
      discountValue: Number(body.discountValue) || 10,
      minOrderAmount: Number(body.minOrderAmount) || 0,
      maxUses: Number(body.maxUses) || 100,
      usedCount: 0,
      validFrom: new Date().toISOString(),
      validUntil: new Date(Date.now() + 90 * 86400000).toISOString(),
      isActive: true,
    };
    db.coupons.unshift(newCoupon);
    saveDb(db);
    return makeJsonResponse({ coupon: newCoupon }, 201);
  }

  if (path.startsWith('/api/admin/coupons/')) {
    const id = path.replace('/api/admin/coupons/', '');
    if (method === 'DELETE') {
      db.coupons = db.coupons.filter((c) => c.id !== id);
      saveDb(db);
      return makeJsonResponse({ ok: true });
    }
    if (method === 'PATCH') {
      const coupon = db.coupons.find((c) => c.id === id);
      if (coupon) Object.assign(coupon, body);
      saveDb(db);
      return makeJsonResponse({ coupon });
    }
  }

  // PUT /api/admin/settings
  if (path === '/api/admin/settings' && method === 'PUT') {
    db.settings = { ...db.settings, ...body };
    saveDb(db);
    return makeJsonResponse({ settings: db.settings });
  }

  return makeJsonResponse({ ok: true });
}

export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const urlStr =
    typeof input === 'string'
      ? input
      : input instanceof URL
      ? input.toString()
      : input.url;

  const isApiCall = urlStr.startsWith('/api/') || urlStr.includes('/api/');
  if (!isApiCall) {
    return window.fetch(input, init);
  }

  try {
    const res = await window.fetch(input, init);
    const contentType = res.headers.get('content-type') || '';
    if (res.status === 404 || contentType.includes('text/html')) {
      return handleLocalApiRequest(urlStr, init);
    }
    return res;
  } catch {
    return handleLocalApiRequest(urlStr, init);
  }
}

/**
 * Safely attempts to patch window.fetch so that if the app is deployed
 * on static hosting (such as Netlify, Vercel static, or GitHub Pages) where
 * the Express `/api/*` server is not running, all `/api/*` calls automatically
 * execute against the persistent browser database without errors.
 * Never throws if window.fetch has only a getter.
 */
export function installStaticHostApiFallback() {
  try {
    const originalFetch = window.fetch.bind(window);
    const customFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const urlStr =
        typeof input === 'string'
          ? input
          : input instanceof URL
          ? input.toString()
          : input.url;

      const isApiCall = urlStr.startsWith('/api/') || urlStr.includes('/api/');
      if (!isApiCall) {
        return originalFetch(input, init);
      }

      try {
        const res = await originalFetch(input, init);
        const contentType = res.headers.get('content-type') || '';
        // On Netlify static hosting, missing /api/* routes return 404 or text/html
        if (res.status === 404 || contentType.includes('text/html')) {
          return handleLocalApiRequest(urlStr, init);
        }
        return res;
      } catch {
        return handleLocalApiRequest(urlStr, init);
      }
    };

    try {
      window.fetch = customFetch;
    } catch {
      try {
        Object.defineProperty(window, 'fetch', {
          value: customFetch,
          writable: true,
          configurable: true,
        });
      } catch {
        // Ignored: window.fetch is read-only in this sandbox environment
      }
    }
  } catch {
    // Ignored
  }
}

