/**
 * VM Beauty Care — Public Website JavaScript Engine (v2 CMS-Driven)
 * Features: Dynamic Category Strip, Category Click Filtering, URL Hash deep links,
 * Monochrome Image Effect, Upgraded Lightbox, Custom Theme & WhatsApp CMS config.
 */

/* ============================================================
   STATE & CONSTANTS
   ============================================================ */
let activeCategories = [];
let allGalleryImages = [];
let currentCategoryFilter = 'all';
let lightboxImages = [];
let lightboxIndex = 0;

/* Static fallback images map for initial rendering */
const STATIC_CATEGORY_IMAGES = {
  'bridal-look': [
    { src: 'Bridal look.jpg', caption: 'Bridal Look' },
    { src: 'bridal set1.jpg', caption: 'Bridal Set 1' },
    { src: 'bridal set2.jpg', caption: 'Bridal Set 2' },
    { src: 'bridal set3.jpg', caption: 'Bridal Set 3' },
    { src: 'engagementlook.jpg', caption: 'Engagement Look' }
  ],
  'bridal-set': [
    { src: 'bridal set1.jpg', caption: 'Bridal Set 1' },
    { src: 'bridal set2.jpg', caption: 'Bridal Set 2' },
    { src: 'bridal set3.jpg', caption: 'Bridal Set 3' },
    { src: 'bridal set4.jpg', caption: 'Bridal Set 4' },
    { src: 'bridal set5.jpg', caption: 'Bridal Set 5' },
    { src: 'bridal set6.jpg', caption: 'Bridal Set 6' },
    { src: 'bridal set7.jpg', caption: 'Bridal Set 7' }
  ],
  'engagement-look': [
    { src: 'engagementlook.jpg', caption: 'Engagement Look' }
  ],
  'flower-garland': [
    { src: 'Flowers Garland1.jpg', caption: 'Bridal Garland' },
    { src: 'Flowers Garland2.jpg', caption: 'Wedding Garland' },
    { src: 'Flowers Garland3.jpg', caption: 'Floral Design' },
    { src: 'Flowers Garland4.jpg', caption: 'Jasmine Garland' },
    { src: 'Flowers Garland5.jpg', caption: 'Ceremony Garland' },
    { src: 'Flowers Garland6.jpg', caption: 'Floral Crown' },
    { src: 'Flowers Garland7.jpg', caption: 'Rose Garland' }
  ],
  'haldi-set': [
    { src: 'Heldi set.jpg', caption: 'Bridal Mehandi & Haldi' }
  ],
  'messy-hairstyle': [
    { src: 'messy hairstyle.jpg', caption: 'Messy Hairstyle' }
  ],
  'mukurtham-hairdo': [
    { src: 'Mukurtham Harido1.jpg', caption: 'Mukurtham Hairdo 1' },
    { src: 'Mukurtham Harido2.jpg', caption: 'Mukurtham Hairdo 2' },
    { src: 'Mukurtham Harido3.jpg', caption: 'Mukurtham Hairdo 3' },
    { src: 'Mukurtham Harido4.jpg', caption: 'Mukurtham Hairdo 4' },
    { src: 'Mukurtham Harido5.jpg', caption: 'Mukurtham Hairdo 5' },
    { src: 'Mukurtham Harido6.jpg', caption: 'Mukurtham Hairdo 6' },
    { src: 'Mukurtham Harido7.jpg', caption: 'Mukurtham Hairdo 7' },
    { src: 'Mukurtham Harido8.jpg', caption: 'Mukurtham Hairdo 8' },
    { src: 'Mukurtham Harido9.jpg', caption: 'Mukurtham Hairdo 9' },
    { src: 'Mukurtham Harido10.jpg', caption: 'Royal Hairdo' }
  ],
  'puberty-look': [
    { src: 'pubertylook.jpg', caption: 'Puberty Ceremony Look' }
  ]
};

/* ============================================================
   INITIALIZATION
   ============================================================ */
document.addEventListener('DOMContentLoaded', async () => {
  initPreloader();
  initTheme();
  initNavbar();
  initHamburger();
  initHeroSlideshow();
  initScrollReveal();
  initScrollTop();
  initLightbox();

  await loadCMSContent();
  await loadCategoriesAndGallery();
  handleHashNavigation();

  window.addEventListener('hashchange', handleHashNavigation);
});

/* ============================================================
   PRELOADER
   ============================================================ */
function initPreloader() {
  window.addEventListener('load', () => {
    setTimeout(() => { document.getElementById('preloader')?.classList.add('done'); }, 600);
  });
  setTimeout(() => { document.getElementById('preloader')?.classList.add('done'); }, 2000);
}

/* ============================================================
   THEME SETUP
   ============================================================ */
function initTheme() {
  const saved = localStorage.getItem('vm_theme') || 'light';
  applyTheme(saved);

  document.getElementById('theme-toggle')?.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    showToast(next === 'dark' ? '🌙 Dark Mode Enabled' : '☀️ Light Mode Enabled');
  });
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('vm_theme', theme);
}

/* ============================================================
   NAVBAR & SCROLL SPY
   ============================================================ */
function initNavbar() {
  const header = document.getElementById('site-header');
  const links = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section[id]');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 60) header?.classList.add('scrolled');
    else header?.classList.remove('scrolled');

    let current = '';
    sections.forEach(s => {
      if (window.scrollY >= s.offsetTop - 150) current = s.id;
    });
    links.forEach(l => {
      l.classList.toggle('active', l.getAttribute('href') === `#${current}`);
    });
  });

  links.forEach(l => l.addEventListener('click', () => {
    document.getElementById('nav-links')?.classList.remove('open');
    document.getElementById('hamburger')?.classList.remove('open');
  }));
}

function initHamburger() {
  const btn = document.getElementById('hamburger');
  const nav = document.getElementById('nav-links');
  btn?.addEventListener('click', () => {
    btn.classList.toggle('open');
    nav?.classList.toggle('open');
  });
  document.addEventListener('click', (e) => {
    if (nav?.classList.contains('open') && !nav.contains(e.target) && !btn?.contains(e.target)) {
      nav.classList.remove('open');
      btn?.classList.remove('open');
    }
  });
}

/* ============================================================
   HERO SLIDESHOW & CAROUSEL
   ============================================================ */
let heroTimer = null;

function initHeroSlideshow() {
  if (heroTimer) clearInterval(heroTimer);

  const slidesContainer = document.getElementById('hero-slides');
  const dotsContainer = document.getElementById('hero-dots');
  if (!slidesContainer) return;

  const slides = slidesContainer.querySelectorAll('.hero-slide');
  const dots = dotsContainer ? dotsContainer.querySelectorAll('.hero-dot') : [];
  if (slides.length <= 1) return;

  let current = 0;

  function goToSlide(index) {
    slides.forEach((slide, i) => {
      slide.classList.toggle('active', i === index);
    });
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === index);
    });
    current = index;
  }

  dots.forEach((dot, index) => {
    dot.onclick = () => {
      goToSlide(index);
      resetTimer();
    };
  });

  function nextSlide() {
    const next = (current + 1) % slides.length;
    goToSlide(next);
  }

  function resetTimer() {
    if (heroTimer) clearInterval(heroTimer);
    heroTimer = setInterval(nextSlide, 4000);
  }

  resetTimer();
}

function renderDynamicHeroSlides(images) {
  const slidesContainer = document.getElementById('hero-slides');
  const dotsContainer = document.getElementById('hero-dots');
  if (!slidesContainer) return;

  slidesContainer.innerHTML = images.map((img, i) => `
    <img src="${img}" alt="Hero Slide ${i + 1}" class="hero-slide ${i === 0 ? 'active' : ''}" />
  `).join('');

  if (dotsContainer) {
    dotsContainer.innerHTML = images.map((_, i) => `
      <button class="hero-dot ${i === 0 ? 'active' : ''}" aria-label="Slide ${i + 1}"></button>
    `).join('');
  }

  // Re-initialize slider timer with new DOM elements
  initHeroSlideshow();
}

/* ============================================================
   DIGITAL VISITING CARD CONTROLLER
   ============================================================ */
let currentVCardConfig = {
  tamilCard: 'visiting-card-tamil.jpg',
  englishCard: 'visiting-card-english.jpg'
};

async function loadVisitingCardCMSData() {
  if (typeof VMDB === 'undefined') return;
  const config = await VMDB.dbGetSetting('visiting_card_config');
  if (config) {
    currentVCardConfig = config;
  }
}

function openVisitingCardModal(lang = 'english') {
  const modal = document.getElementById('vcard-modal');
  const backdrop = document.getElementById('vcard-modal-backdrop');
  if (!modal || !backdrop) return;

  modal.style.display = 'block';
  backdrop.classList.add('active');

  const englishDl = document.getElementById('vcard-download-english-btn');
  const tamilDl = document.getElementById('vcard-download-tamil-btn');
  if (englishDl) englishDl.href = currentVCardConfig.englishCard || 'visiting-card-english.jpg';
  if (tamilDl) tamilDl.href = currentVCardConfig.tamilCard || 'visiting-card-tamil.jpg';

  switchVCardTab(lang);
}

function closeVisitingCardModal() {
  const modal = document.getElementById('vcard-modal');
  const backdrop = document.getElementById('vcard-modal-backdrop');
  if (modal) modal.style.display = 'none';
  if (backdrop) backdrop.classList.remove('active');
}

function switchVCardTab(lang) {
  const imgEl = document.getElementById('vcard-modal-img');
  const tabEnglish = document.getElementById('vcard-tab-english');
  const tabTamil = document.getElementById('vcard-tab-tamil');

  if (lang === 'english') {
    if (imgEl) imgEl.src = currentVCardConfig.englishCard || 'visiting-card-english.jpg';
    if (tabEnglish) { tabEnglish.className = 'btn btn-primary'; }
    if (tabTamil) { tabTamil.className = 'btn btn-outline'; }
  } else {
    if (imgEl) imgEl.src = currentVCardConfig.tamilCard || 'visiting-card-tamil.jpg';
    if (tabEnglish) { tabEnglish.className = 'btn btn-outline'; }
    if (tabTamil) { tabTamil.className = 'btn btn-primary'; }
  }
}

/* ============================================================
   CMS CONTENT LOADING (Hero & WhatsApp)
   ============================================================ */
async function loadCMSContent() {
  if (typeof VMDB === 'undefined') return;

  try {
    await loadVisitingCardCMSData();
    // Site Hero Content
    const heroData = await VMDB.dbGetSetting('site_hero');
    if (heroData) {
      const titleEl = document.getElementById('hero-title');
      const descEl = document.getElementById('hero-desc');
      const eyebrowEl = document.getElementById('hero-eyebrow');
      const btn1El = document.getElementById('hero-primary-btn');
      const btn2El = document.getElementById('hero-sec-btn-text');

      if (titleEl && heroData.title) titleEl.innerHTML = heroData.title;
      if (descEl && heroData.desc) descEl.textContent = heroData.desc;
      if (eyebrowEl && heroData.eyebrow) eyebrowEl.textContent = heroData.eyebrow;
      if (btn1El && heroData.primaryBtnText) btn1El.textContent = heroData.primaryBtnText;
      if (btn2El && heroData.secondaryBtnText) btn2El.textContent = heroData.secondaryBtnText;

      // Stats
      if (heroData.stat1Num && document.getElementById('stat-num-1')) document.getElementById('stat-num-1').textContent = heroData.stat1Num;
      if (heroData.stat1Lbl && document.getElementById('stat-lbl-1')) document.getElementById('stat-lbl-1').textContent = heroData.stat1Lbl;
      if (heroData.stat2Num && document.getElementById('stat-num-2')) document.getElementById('stat-num-2').textContent = heroData.stat2Num;
      if (heroData.stat2Lbl && document.getElementById('stat-lbl-2')) document.getElementById('stat-lbl-2').textContent = heroData.stat2Lbl;
      if (heroData.stat3Num && document.getElementById('stat-num-3')) document.getElementById('stat-num-3').textContent = heroData.stat3Num;
      if (heroData.stat3Lbl && document.getElementById('stat-lbl-3')) document.getElementById('stat-lbl-3').textContent = heroData.stat3Lbl;
      if (heroData.stat4Num && document.getElementById('stat-num-4')) document.getElementById('stat-num-4').textContent = heroData.stat4Num;
      if (heroData.stat4Lbl && document.getElementById('stat-lbl-4')) document.getElementById('stat-lbl-4').textContent = heroData.stat4Lbl;

      // Dynamic Hero Background Slides
      if (heroData.bgImages && heroData.bgImages.length) {
        renderDynamicHeroSlides(heroData.bgImages);
      }
    }

    // WhatsApp Config
    const waData = await VMDB.dbGetSetting('whatsapp_config');
    if (waData) {
      updateWhatsAppLinks(waData.phone, waData.defaultMessage);
    }

    // Location & Map Config
    const contactData = await VMDB.dbGetSetting('contact_info');
    if (contactData) {
      const addrEl = document.getElementById('contact-address-text');
      const iframeEl = document.getElementById('contact-map-iframe');
      const mapLinkEl = document.getElementById('contact-map-link');

      if (addrEl && contactData.address) addrEl.textContent = contactData.address;
      if (iframeEl && contactData.mapsEmbedUrl) iframeEl.src = contactData.mapsEmbedUrl;
      if (mapLinkEl && contactData.mapsUrl) mapLinkEl.href = contactData.mapsUrl;
    }

    // Render Dynamic Sections
    await renderDynamicServices();
    await renderDynamicWhyUs();
    await renderDynamicTestimonials();

    // Apply Section Background Images
    await applySectionBgImages();
  } catch (err) {
    console.warn('CMS Content load info:', err);
  }
}

async function renderDynamicServices() {
  if (typeof VMDB === 'undefined') return;
  const container = document.getElementById('services-cards-grid');
  if (!container) return;
  const services = await VMDB.dbGetAllServices();
  if (!services || !services.length) return;
  const commonBg = await VMDB.dbGetSetting('bg_image_services');

  container.innerHTML = services.map(s => {
    const cardBg = s.bgImage || commonBg;
    const hasBg = !!cardBg;
    const bgStyle = hasBg 
      ? `style="background-image: linear-gradient(rgba(255, 255, 255, 0.42), rgba(255, 255, 255, 0.68)), url('${cardBg}'); background-size: cover; background-position: center;"`
      : '';
    return `
      <div class="why-card ${hasBg ? 'has-custom-bg' : ''}" ${bgStyle}>
        <div class="why-icon">${s.icon || '💄'}</div>
        <h3>${s.title}</h3>
        <p>${s.description}</p>
      </div>
    `;
  }).join('');
}

async function renderDynamicWhyUs() {
  if (typeof VMDB === 'undefined') return;
  const container = document.getElementById('whyus-cards-grid');
  if (!container) return;
  const features = (await VMDB.dbGetSetting('why_us_features')) || [];
  if (!features || !features.length) return;
  const commonBg = await VMDB.dbGetSetting('bg_image_whyus');

  container.innerHTML = features.map(f => {
    const cardBg = f.bgImage || commonBg;
    const hasBg = !!cardBg;
    const bgStyle = hasBg 
      ? `style="background-image: linear-gradient(rgba(255, 255, 255, 0.42), rgba(255, 255, 255, 0.68)), url('${cardBg}'); background-size: cover; background-position: center;"`
      : '';
    return `
      <div class="why-card ${hasBg ? 'has-custom-bg' : ''}" ${bgStyle}>
        <div class="why-icon">${f.icon || '🏆'}</div>
        <h3>${f.title}</h3>
        <p>${f.description}</p>
      </div>
    `;
  }).join('');
}

async function renderDynamicTestimonials() {
  if (typeof VMDB === 'undefined') return;
  const container = document.getElementById('testimonials-cards-grid');
  if (!container) return;
  const testimonials = await VMDB.dbGetAllTestimonials();
  if (!testimonials || !testimonials.length) return;
  const commonBg = await VMDB.dbGetSetting('bg_image_testimonials');

  container.innerHTML = testimonials.map(t => {
    const cardBg = t.bgImage || commonBg;
    const hasBg = !!cardBg;
    const bgStyle = hasBg 
      ? `style="background-image: linear-gradient(rgba(255, 255, 255, 0.42), rgba(255, 255, 255, 0.68)), url('${cardBg}'); background-size: cover; background-position: center;"`
      : '';
    return `
      <div class="testi-card ${hasBg ? 'has-custom-bg' : ''}" ${bgStyle}>
        <div class="testi-stars">★★★★★</div>
        <p class="testi-text">"${t.text}"</p>
        <div class="testi-author">
          <div class="testi-avatar">${t.avatar || t.name.charAt(0)}</div>
          <div><strong>${t.name}</strong><span>${t.role || 'Bridal Client'}</span></div>
        </div>
      </div>
    `;
  }).join('');
}

async function applySectionBgImages() {
  if (typeof VMDB === 'undefined') return;
  const sections = [
    { key: 'services', id: 'services' },
    { key: 'whyus', id: 'why-choose-us' },
    { key: 'testimonials', id: 'testimonials' }
  ];

  for (const s of sections) {
    const bgImg = await VMDB.dbGetSetting(`bg_image_${s.key}`);
    const secEl = document.getElementById(s.id);
    if (secEl) {
      if (bgImg) {
        secEl.style.backgroundImage = `linear-gradient(rgba(253, 251, 247, 0.88), rgba(253, 251, 247, 0.88)), url('${bgImg}')`;
        secEl.style.backgroundSize = 'cover';
        secEl.style.backgroundPosition = 'center';
      } else {
        secEl.style.backgroundImage = '';
      }
    }
  }
}

function updateWhatsAppLinks(phone = '917010280939', msg = '') {
  const encodedMsg = encodeURIComponent(msg || "Hello VM Beauty Care! I'm interested in your bridal makeover services.");
  const url = `https://wa.me/${phone}?text=${encodedMsg}`;

  document.querySelectorAll('a[href*="wa.me"]').forEach(a => {
    a.href = url;
  });
}

/* ============================================================
   CATEGORIES & DYNAMIC GALLERY REBUILD
   ============================================================ */
async function loadCategoriesAndGallery() {
  if (typeof VMDB === 'undefined') return;

  try {
    activeCategories = await VMDB.dbGetAllCategories();
  } catch (e) {
    activeCategories = [];
  }

  // Render "Our Work" Category Thumbnails Strip
  renderCategoryThumbnails();

  // Render Gallery Filter Pills
  renderGalleryFilterPills();

  // Render Dynamic Gallery Items
  await renderGalleryGrid();
}

/**
 * Render Circular Category Avatars (aaraagifts.com style) dynamically from CMS categories
 */
function renderCategoryThumbnails() {
  const container = document.getElementById('circle-categories-container');
  if (!container) return;

  container.innerHTML = '';

  const visibleCats = activeCategories.filter(c => c.visible !== false);
  if (!visibleCats.length) return;

  visibleCats.forEach(cat => {
    const item = document.createElement('div');
    item.className = 'circle-cat-item';
    item.setAttribute('data-slug', cat.slug);

    item.innerHTML = `
      <div class="circle-cat-img-wrap">
        <img src="${cat.thumbnail || 'bridal set1.jpg'}" alt="${cat.name}" loading="lazy" />
      </div>
      <div class="circle-cat-label">${cat.name}</div>
    `;

    item.addEventListener('click', () => {
      document.querySelectorAll('.circle-cat-item').forEach(el => el.classList.remove('active'));
      item.classList.add('active');

      selectCategoryFilter(cat.slug);
      window.location.hash = `work/${cat.slug}`;
      document.getElementById('gallery')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    container.appendChild(item);
  });
}

/**
 * Render Gallery Filter Buttons
 */
function renderGalleryFilterPills() {
  const filterWrap = document.getElementById('gallery-filters');
  if (!filterWrap) return;

  filterWrap.innerHTML = `<button class="gfilter active" data-filter="all" onclick="selectCategoryFilter('all')">All Work</button>`;

  activeCategories.filter(c => c.visible !== false).forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'gfilter';
    btn.setAttribute('data-filter', cat.slug);
    btn.textContent = cat.name;
    btn.addEventListener('click', () => {
      selectCategoryFilter(cat.slug);
      window.location.hash = `work/${cat.slug}`;
    });
    filterWrap.appendChild(btn);
  });
}

/**
 * Filter Gallery by Category Slug
 */
function selectCategoryFilter(slug) {
  currentCategoryFilter = slug;

  // Update active pill UI
  document.querySelectorAll('.gfilter').forEach(btn => {
    const btnSlug = btn.getAttribute('data-filter');
    btn.classList.toggle('active', btnSlug === slug);
  });

  // Filter gallery cards
  document.querySelectorAll('.masonry-item, .gallery-card').forEach(item => {
    const itemCat = item.getAttribute('data-cat') || item.getAttribute('data-slug');
    if (slug === 'all' || itemCat === slug || (itemCat && itemCat.includes(slug))) {
      item.style.display = 'block';
    } else {
      item.style.display = 'none';
    }
  });
}

/**
 * Render Masonry Gallery Grid combining static and IndexedDB images
 */
async function renderGalleryGrid() {
  const grid = document.getElementById('masonry-grid');
  if (!grid) return;

  grid.innerHTML = '';
  allGalleryImages = [];

  // 1. Gather static images
  Object.keys(STATIC_CATEGORY_IMAGES).forEach(slug => {
    STATIC_CATEGORY_IMAGES[slug].forEach(img => {
      allGalleryImages.push({
        src: img.src,
        caption: img.caption,
        slug: slug
      });
    });
  });

  // 2. Gather uploaded DB images
  try {
    const dbImgs = await VMDB.dbGetAll();
    dbImgs.forEach(img => {
      allGalleryImages.push({
        src: img.dataURL,
        caption: img.caption || 'Uploaded Gallery Image',
        slug: img.categorySlug || img.category
      });
    });
  } catch (e) {
    console.warn('DB images load info:', e);
  }

  // 3. Render gallery items
  allGalleryImages.forEach((img, idx) => {
    const item = document.createElement('div');
    item.className = 'masonry-item';
    item.setAttribute('data-cat', img.slug);
    item.setAttribute('data-index', idx);

    item.innerHTML = `
      <img src="${img.src}" alt="${img.caption}" loading="lazy" />
      <div class="card-overlay"><span>${img.caption}</span></div>
    `;

    // Click behavior: 1. Toggle Monochrome on double-click/shift click OR open Lightbox
    item.addEventListener('click', (e) => {
      if (e.shiftKey) {
        // Toggle Monochrome effect
        item.classList.toggle('monochrome');
        showToast(item.classList.contains('monochrome') ? '✦ Monochrome View Toggled' : '✨ Color View Restored');
      } else {
        openLightbox(idx);
      }
    });

    grid.appendChild(item);
  });
}

/**
 * Handle URL hash navigation (e.g. #work/bridal-look)
 */
function handleHashNavigation() {
  const hash = window.location.hash;
  if (hash && hash.startsWith('#work/')) {
    const slug = hash.replace('#work/', '');
    selectCategoryFilter(slug);
    setTimeout(() => {
      document.getElementById('gallery')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);
  }
}

/* ============================================================
   UPGRADED LIGHTBOX CONTROLLER
   ============================================================ */
function initLightbox() {
  const backdrop = document.getElementById('lightbox-backdrop');
  const closeBtn = document.getElementById('lightbox-close');
  const prevBtn = document.getElementById('lightbox-prev');
  const nextBtn = document.getElementById('lightbox-next');

  closeBtn?.addEventListener('click', closeLightbox);
  backdrop?.addEventListener('click', closeLightbox);

  prevBtn?.addEventListener('click', () => navigateLightbox(-1));
  nextBtn?.addEventListener('click', () => navigateLightbox(1));

  document.addEventListener('keydown', (e) => {
    const lb = document.getElementById('lightbox');
    if (!lb || !lb.classList.contains('active')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') navigateLightbox(-1);
    if (e.key === 'ArrowRight') navigateLightbox(1);
  });
}

function openLightbox(index) {
  if (!allGalleryImages.length) return;
  lightboxIndex = (index + allGalleryImages.length) % allGalleryImages.length;
  const current = allGalleryImages[lightboxIndex];

  const lb = document.getElementById('lightbox');
  const backdrop = document.getElementById('lightbox-backdrop');
  const lbImg = document.getElementById('lightbox-img');
  const lbCap = document.getElementById('lightbox-caption');

  if (!lb || !lbImg) return;

  lbImg.src = current.src;
  if (lbCap) {
    lbCap.innerHTML = `${current.caption} <br/><span style="font-size:0.8rem;opacity:0.6;">${lightboxIndex + 1} / ${allGalleryImages.length}</span>`;
  }

  lb.classList.add('active');
  backdrop?.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  document.getElementById('lightbox')?.classList.remove('active');
  document.getElementById('lightbox-backdrop')?.classList.remove('active');
  document.body.style.overflow = '';
}

function navigateLightbox(dir) {
  openLightbox(lightboxIndex + dir);
}

/* ============================================================
   SCROLL REVEAL & UTILITIES
   ============================================================ */
function initScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.why-card, .testi-card, .about-content, .about-image-wrap, .section-title').forEach(el => {
    el.classList.add('reveal');
    observer.observe(el);
  });
}

function initScrollTop() {
  const btn = document.getElementById('scroll-top');
  window.addEventListener('scroll', () => {
    if (btn) btn.classList.toggle('show', window.scrollY > 500);
  });
  btn?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

function showToast(msg) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    container.style.cssText = 'position:fixed;bottom:24px;left:24px;z-index:9999;display:flex;flex-direction:column;gap:8px;';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.style.cssText = 'background:var(--color-dark);color:#fff;padding:12px 20px;border-radius:30px;font-size:0.85rem;box-shadow:0 10px 20px rgba(0,0,0,0.2);animation:fadeIn 0.3s ease;';
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}
