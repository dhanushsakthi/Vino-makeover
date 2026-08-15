/**
 * VM_MAKEOVER - Shared Database Module (IndexedDB v2)
 * Handles data persistence for Categories, Images, Content, Services, Themes, Animations, WhatsApp, and Admin.
 */

const DB_NAME = 'VMBeautyCareDB';
const DB_VERSION = 2;

const STORE_IMAGES = 'images';
const STORE_CATEGORIES = 'categories';
const STORE_SERVICES = 'services';
const STORE_SETTINGS = 'settings';
const STORE_TESTIMONIALS = 'testimonials';

let dbInstance = null;

/**
 * Open or upgrade IndexedDB
 */
function openDB() {
  return new Promise((resolve, reject) => {
    if (dbInstance) { resolve(dbInstance); return; }
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = e.target.result;

      // Images store
      if (!db.objectStoreNames.contains(STORE_IMAGES)) {
        const store = db.createObjectStore(STORE_IMAGES, { keyPath: 'id', autoIncrement: true });
        store.createIndex('category', 'category', { unique: false });
        store.createIndex('categorySlug', 'categorySlug', { unique: false });
        store.createIndex('uploadedAt', 'uploadedAt', { unique: false });
      } else {
        const tx = e.target.transaction;
        const store = tx.objectStore(STORE_IMAGES);
        if (!store.indexNames.contains('categorySlug')) {
          store.createIndex('categorySlug', 'categorySlug', { unique: false });
        }
      }

      // Categories store
      if (!db.objectStoreNames.contains(STORE_CATEGORIES)) {
        const catStore = db.createObjectStore(STORE_CATEGORIES, { keyPath: 'id' });
        catStore.createIndex('slug', 'slug', { unique: true });
        catStore.createIndex('displayOrder', 'displayOrder', { unique: false });
      }

      // Services store
      if (!db.objectStoreNames.contains(STORE_SERVICES)) {
        const srvStore = db.createObjectStore(STORE_SERVICES, { keyPath: 'id' });
        srvStore.createIndex('displayOrder', 'displayOrder', { unique: false });
      }

      // Testimonials store
      if (!db.objectStoreNames.contains(STORE_TESTIMONIALS)) {
        db.createObjectStore(STORE_TESTIMONIALS, { keyPath: 'id' });
      }

      // Settings store
      if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
        db.createObjectStore(STORE_SETTINGS, { keyPath: 'key' });
      }
    };

    req.onsuccess = async (e) => {
      dbInstance = e.target.result;
      await initDefaults();
      resolve(dbInstance);
    };
    req.onerror = (e) => reject(e.target.error);
  });
}

/**
 * Initialize default CMS categories, services, and content if empty
 */
async function initDefaults() {
  try {
    const cats = await dbGetAllCategories();
    if (!cats || cats.length === 0) {
      const defaultCats = [
        { id: 'cat-1', name: 'Bridal Look', slug: 'bridal-look', description: 'Exquisite bridal makeover tailored for your special day.', thumbnail: 'Bridal look.jpg', visible: true, featured: true, displayOrder: 1, legacyCat: 'bridal' },
        { id: 'cat-2', name: 'Bridal Set', slug: 'bridal-set', description: 'Complete traditional & contemporary bridal packages.', thumbnail: 'bridal set1.jpg', visible: true, featured: true, displayOrder: 2, legacyCat: 'bridal' },
        { id: 'cat-3', name: 'Engagement Look', slug: 'engagement-look', description: 'Subtle elegance and glowing beauty for engagement ceremonies.', thumbnail: 'engagementlook.jpg', visible: true, featured: true, displayOrder: 3, legacyCat: 'bridal' },
        { id: 'cat-4', name: 'Flower Garland', slug: 'flower-garland', description: 'Fresh, fragrant, hand-crafted floral garlands.', thumbnail: 'Flowers Garland1.jpg', visible: true, featured: true, displayOrder: 4, legacyCat: 'garland' },
        { id: 'cat-5', name: 'Haldi Set', slug: 'haldi-set', description: 'Vibrant Haldi & Mehandi styling & henna art.', thumbnail: 'Heldi set.jpg', visible: true, featured: true, displayOrder: 5, legacyCat: 'mehandi' },
        { id: 'cat-6', name: 'Messy Hairstyle', slug: 'messy-hairstyle', description: 'Modern, chic messy buns & braided hair creations.', thumbnail: 'messy hairstyle.jpg', visible: true, featured: true, displayOrder: 6, legacyCat: 'hairstyle' },
        { id: 'cat-7', name: 'Mukurtham Hairdo', slug: 'mukurtham-hairdo', description: 'Traditional royal Mukurtham updos & floral accessories.', thumbnail: 'Mukurtham Harido1.jpg', visible: true, featured: true, displayOrder: 7, legacyCat: 'hairstyle' },
        { id: 'cat-8', name: 'Puberty Look', slug: 'puberty-look', description: 'Traditional grand styling for half-saree / puberty ceremonies.', thumbnail: 'pubertylook.jpg', visible: true, featured: true, displayOrder: 8, legacyCat: 'bridal' },
        { id: 'cat-9', name: 'Blouse (Aari) Design', slug: 'blouse-aari', description: 'Custom hand-stitched Aari embroidery blouse designs.', thumbnail: 'Blouse-Thumbnail-image.png', visible: true, featured: false, displayOrder: 9, legacyCat: 'blouse' },
        { id: 'cat-10', name: 'Certificates', slug: 'certificates', description: 'Government NSDC Certified credentials & honors.', thumbnail: 'certificate-thumb.jpg', visible: true, featured: false, displayOrder: 10, legacyCat: 'certificate' }
      ];

      for (const cat of defaultCats) {
        await dbSaveCategory(cat);
      }
    }

    // Ensure category thumbnails are updated to correct defaults if exist
    const cat9 = await dbGetSetting('cat-9');
    if (cat9 && cat9.thumbnail === 'bridal set7.jpg') {
      cat9.thumbnail = 'Blouse-Thumbnail-image.png';
      await dbSaveCategory(cat9);
    }
    const cat10 = await dbGetSetting('cat-10');
    if (cat10 && (!cat10.thumbnail || cat10.thumbnail === 'bridal set1.jpg')) {
      cat10.thumbnail = 'certificate-thumb.jpg';
      await dbSaveCategory(cat10);
    }

    // Default Section Background Images
    if (!(await dbGetSetting('bg_image_services'))) {
      await dbSetSetting('bg_image_services', 'common-background-image.png');
    }
    if (!(await dbGetSetting('bg_image_whyus'))) {
      await dbSetSetting('bg_image_whyus', 'Personalized Artistr-background image.png');
    }
    if (!(await dbGetSetting('bg_image_testimonials'))) {
      await dbSetSetting('bg_image_testimonials', 'Comment-section-background.png');
    }

    // Default Site Content
    const heroContent = await dbGetSetting('site_hero');
    if (!heroContent) {
      await dbSetSetting('site_hero', {
        eyebrow: '✦ Certified Makeup Artist • Nagapattinam ✦',
        title: 'Where Every Bride Becomes Her Most Beautiful Self',
        desc: 'Transforming your most cherished moments with artistry, elegance, and grace — bridal makeup, saree draping, hairstyling & beyond.',
        primaryCta: '✨ View Our Work',
        secondaryCta: 'Book via WhatsApp',
        bgImages: [
          'bridal set5.jpg',
          'Mukurtham Harido10.jpg',
          'Flowers Garland7.jpg',
          'bridal set2.jpg',
          'engagementlook.jpg'
        ]
      });
    }

    // Default WhatsApp Settings
    const waSettings = await dbGetSetting('whatsapp_config');
    if (!waSettings) {
      await dbSetSetting('whatsapp_config', {
        phone: '917010280939',
        secondaryPhone: '919626638464',
        defaultMessage: 'Hello VM Beauty Care! I am interested in your bridal makeover services and would love to know more about your packages, availability, and booking process. Thank you!',
        buttonText: 'Book via WhatsApp'
      });
    }

    // Default Location & Contact Info
    const contactInfo = await dbGetSetting('contact_info');
    if (!contactInfo) {
      await dbSetSetting('contact_info', {
        address: 'B/25, Tata Nagar, Akkaraipettai, Nagapattinam — 611 001',
        mapQuery: 'B/25, Tata Nagar, Akkaraipettai, Nagapattinam - 611001',
        mapsUrl: 'https://www.google.com/maps/search/?api=1&query=B/25,+Tata+Nagar,+Akkaraipettai,+Nagapattinam+-+611001',
        mapsEmbedUrl: 'https://maps.google.com/maps?q=B/25,+Tata+Nagar,+Akkaraipettai,+Nagapattinam+-+611001&t=&z=15&ie=UTF8&iwloc=&output=embed'
      });
    }

    // Default Theme Settings
    const themeConfig = await dbGetSetting('theme_config');
    if (!themeConfig) {
      await dbSetSetting('theme_config', {
        mode: 'light',
        primaryColor: '#7A1C3B',
        accentColor: '#D4AF37',
        bgColor: '#FDFBF7',
        textColor: '#2C2226'
      });
    }

    // Default Services
    const services = await dbGetAllServices();
    if (!services || services.length === 0) {
      const defaultServices = [
        { id: 'srv-1', title: 'Bridal Makeover', description: 'HD & Waterproof traditional and contemporary bridal makeup that remains radiant throughout your event.', icon: '💄', displayOrder: 1, bgImage: '01_bridal_makeover_background.png' },
        { id: 'srv-2', title: 'Mukurtham Hairdo', description: 'Traditional royal Mukurtham hairstyles, floral embellishments, chic messy buns, and braided extensions.', icon: '💇‍♀️', displayOrder: 2, bgImage: '02_mukurtham_hairdo_background.png' },
        { id: 'srv-3', title: 'Fresh Flower Garlands', description: 'Hand-crafted wedding garlands using fresh jasmine, roses, orchids, and traditional venue florals.', icon: '🌸', displayOrder: 3, bgImage: '03_fresh_flower_garlands_background.png' },
        { id: 'srv-4', title: 'Saree Pre-Pleating', description: 'Perfectly box-pleated & ironed sarees ready for effortless draping in under 5 minutes.', icon: '👘', displayOrder: 4, bgImage: '04_saree_pre_pleating_background.png' },
        { id: 'srv-5', title: 'Mehandi & Henna Art', description: 'Intricate, rich-staining bridal & Arabic henna designs for weddings, Haldi, and special occasions.', icon: '🖐️', displayOrder: 5, bgImage: '05_mehandi_henna_background.png' },
        { id: 'srv-6', title: 'Blouse (Aari) Design', description: 'Stunning custom hand-worked Aari embroidery blouse stitching with beads, thread, and stonework.', icon: '🧵', displayOrder: 6, bgImage: '06_blouse_aari_background.png' }
      ];
      for (const srv of defaultServices) {
        await dbSaveService(srv);
      }
    }

    // Default Why Choose Us Features
    const whyUs = await dbGetSetting('why_us_features');
    if (!whyUs) {
      await dbSetSetting('why_us_features', [
        { id: 'feat-1', icon: '🎖️', title: 'Government Certified', description: 'Nationally certified makeup artist trained under National Skill Development Corporation (NSDC) India.', bgImage: 'certificate-background.png' },
        { id: 'feat-2', icon: '💝', title: 'Personalized Artistry', description: 'Customized makeover tailored to your skin tone, outfit colors, and personal aesthetic style.', bgImage: 'Personalized Artistr-background image.png' },
        { id: 'feat-3', icon: '🏠', title: 'Home Service Available', description: 'Doorstep bridal service across Nagapattinam and neighboring districts for your comfort.', bgImage: 'Home Service Available-background.png' }
      ]);
    }

    // Default Testimonials
    const testimonials = await dbGetAllTestimonials();
    if (!testimonials || testimonials.length === 0) {
      const defaultTestimonials = [
        { id: 'test-1', name: 'Priya Lakshmi', role: 'Bridal Client', avatar: 'P', text: 'My wedding makeover was pure perfection! Vino gave me a glowing, flawless look that stayed fresh through 12 hours of ceremony. Highly recommended!', bgImage: 'Comment-section-background.png' },
        { id: 'test-2', name: 'Sowmiya Devi', role: 'Hairdo Client', avatar: 'S', text: 'The Mukurtham hairdo and flower garland were so beautiful. Every guest complemented the hairstyle. Thank you Vino for making my big day magical!', bgImage: 'Comment-section-background.png' },
        { id: 'test-3', name: 'Meena Krishnan', role: 'Saree Pre-Pleating', avatar: 'M', text: 'VM Pre-Pleating service saved so much time on my reception day. The pleats were crisp and folded so neatly. Excellent service!', bgImage: 'Comment-section-background.png' }
      ];
      for (const t of defaultTestimonials) {
        await dbSaveTestimonial(t);
      }
    }

  } catch (err) {
    console.warn('DB Defaults initialization notice:', err);
  }
}

/* ============================================================
   SERVICES CRUD
   ============================================================ */
async function dbGetAllServices() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_SERVICES, 'readonly');
    const store = tx.objectStore(STORE_SERVICES);
    const req = store.getAll();
    req.onsuccess = () => {
      const res = req.result || [];
      res.sort((a, b) => (a.displayOrder || 99) - (b.displayOrder || 99));
      resolve(res);
    };
    req.onerror = () => reject(req.error);
  });
}

async function dbSaveService(serviceData) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_SERVICES, 'readwrite');
    const store = tx.objectStore(STORE_SERVICES);
    if (!serviceData.id) {
      serviceData.id = 'srv-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
    }
    serviceData.updatedAt = Date.now();
    const req = store.put(serviceData);
    req.onsuccess = () => resolve(serviceData);
    req.onerror = () => reject(req.error);
  });
}

async function dbDeleteService(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_SERVICES, 'readwrite');
    const store = tx.objectStore(STORE_SERVICES);
    const req = store.delete(id);
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}

/* ============================================================
   TESTIMONIALS CRUD
   ============================================================ */
async function dbGetAllTestimonials() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_TESTIMONIALS, 'readonly');
    const store = tx.objectStore(STORE_TESTIMONIALS);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

async function dbSaveTestimonial(testimonialData) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_TESTIMONIALS, 'readwrite');
    const store = tx.objectStore(STORE_TESTIMONIALS);
    if (!testimonialData.id) {
      testimonialData.id = 'test-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
    }
    testimonialData.updatedAt = Date.now();
    const req = store.put(testimonialData);
    req.onsuccess = () => resolve(testimonialData);
    req.onerror = () => reject(req.error);
  });
}

async function dbDeleteTestimonial(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_TESTIMONIALS, 'readwrite');
    const store = tx.objectStore(STORE_TESTIMONIALS);
    const req = store.delete(id);
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}

/* ============================================================
   CATEGORIES CRUD
   ============================================================ */
async function dbGetAllCategories() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_CATEGORIES, 'readonly');
    const store = tx.objectStore(STORE_CATEGORIES);
    const req = store.getAll();
    req.onsuccess = () => {
      const res = req.result || [];
      res.sort((a, b) => (a.displayOrder || 99) - (b.displayOrder || 99));
      resolve(res);
    };
    req.onerror = () => reject(req.error);
  });
}

async function dbSaveCategory(categoryData) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_CATEGORIES, 'readwrite');
    const store = tx.objectStore(STORE_CATEGORIES);
    if (!categoryData.id) {
      categoryData.id = 'cat-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
    }
    if (!categoryData.slug) {
      categoryData.slug = categoryData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
    categoryData.updatedAt = Date.now();
    const req = store.put(categoryData);
    req.onsuccess = () => resolve(categoryData);
    req.onerror = () => reject(req.error);
  });
}

async function dbDeleteCategory(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_CATEGORIES, 'readwrite');
    const store = tx.objectStore(STORE_CATEGORIES);
    const req = store.delete(id);
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}

/* ============================================================
   IMAGES CRUD
   ============================================================ */
async function dbAddImage(category, dataURL, caption = '', filename = '', categorySlug = '') {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_IMAGES, 'readwrite');
    const store = tx.objectStore(STORE_IMAGES);
    const record = {
      category,
      categorySlug: categorySlug || category,
      dataURL,
      caption,
      filename,
      uploadedAt: Date.now()
    };
    const req = store.add(record);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function dbGetByCategory(category) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_IMAGES, 'readonly');
    const store = tx.objectStore(STORE_IMAGES);
    const index = store.index('category');
    const req = index.getAll(category);
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

async function dbGetByCategorySlug(slug) {
  const all = await dbGetAll();
  return all.filter(img => img.categorySlug === slug || img.category === slug);
}

async function dbGetAll() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_IMAGES, 'readonly');
    const store = tx.objectStore(STORE_IMAGES);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

async function dbDeleteImage(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_IMAGES, 'readwrite');
    const store = tx.objectStore(STORE_IMAGES);
    const req = store.delete(id);
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}

async function dbGetCounts() {
  const all = await dbGetAll();
  const counts = {};
  all.forEach(img => {
    const key = img.categorySlug || img.category;
    counts[key] = (counts[key] || 0) + 1;
  });
  return counts;
}

/* ============================================================
   SETTINGS & GENERAL KV CRUD
   ============================================================ */
async function dbSetSetting(key, value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_SETTINGS, 'readwrite');
    const store = tx.objectStore(STORE_SETTINGS);
    const req = store.put({ key, value });
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}

async function dbGetSetting(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_SETTINGS, 'readonly');
    const store = tx.objectStore(STORE_SETTINGS);
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result ? req.result.value : null);
    req.onerror = () => reject(req.error);
  });
}

// Export window global
window.VMDB = {
  openDB,
  initDefaults,
  dbGetAllCategories,
  dbSaveCategory,
  dbDeleteCategory,
  dbGetAllServices,
  dbSaveService,
  dbDeleteService,
  dbGetAllTestimonials,
  dbSaveTestimonial,
  dbDeleteTestimonial,
  dbAddImage,
  dbGetByCategory,
  dbGetByCategorySlug,
  dbGetAll,
  dbDeleteImage,
  dbGetCounts,
  dbSetSetting,
  dbGetSetting
};
