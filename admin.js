/**
 * VM Beauty Care — CMS Admin Dashboard Controller
 * Features: Secure Authentication, CMS Category Management, Gallery Management,
 * Site Content CMS, Theme & Animation Settings, WhatsApp Settings, Security Management.
 */

/* ============================================================
   CONSTANTS & STATE
   ============================================================ */
const USER_KEY = 'vm_admin_user';
const PASS_KEY = 'vm_admin_pass';
const SESSION_KEY = 'vm_admin_session';

let currentAdminPanel = 'dashboard';
let pendingUploadFiles = [];
let allCategories = [];
let allGalleryImages = [];
let editingCategoryId = null;

/* ============================================================
   INIT & AUTH CHECK
   ============================================================ */
document.addEventListener('DOMContentLoaded', async () => {
  initStoredCredentials();

  if (sessionStorage.getItem(SESSION_KEY) === 'true') {
    showAdminApp();
  }

  initDropZone();
});

function initStoredCredentials() {
  if (!localStorage.getItem(USER_KEY)) {
    localStorage.setItem(USER_KEY, 'vino');
  }
  if (!localStorage.getItem(PASS_KEY)) {
    localStorage.setItem(PASS_KEY, '123');
  }
}

/* ============================================================
   LOGIN & SECURITY (NO CREDENTIAL HINTS OR PUBLIC RESETS)
   ============================================================ */
function handleLogin(e) {
  e.preventDefault();
  const user = document.getElementById('admin-user').value.trim();
  const pass = document.getElementById('admin-pass').value;

  const storedUser = (localStorage.getItem(USER_KEY) || 'vino').trim();
  const storedPass = localStorage.getItem(PASS_KEY) || '123';

  const errEl = document.getElementById('login-error');
  const btn = document.getElementById('login-btn');

  btn.textContent = 'Authenticating...';
  btn.disabled = true;

  setTimeout(() => {
    if (user.toLowerCase() === storedUser.toLowerCase() && pass === storedPass) {
      sessionStorage.setItem(SESSION_KEY, 'true');
      showAdminApp();
      showToast(`✅ Welcome back, ${storedUser}!`);
    } else {
      errEl.classList.add('show');
      btn.textContent = 'Sign In →';
      btn.disabled = false;
    }
  }, 500);
}

function handleLogout() {
  sessionStorage.removeItem(SESSION_KEY);
  location.reload();
}

function togglePwd() {
  const inp = document.getElementById('admin-pass');
  if (inp) {
    inp.type = inp.type === 'password' ? 'text' : 'password';
  }
}

/* ============================================================
   SHOW ADMIN DASHBOARD
   ============================================================ */
async function showAdminApp() {
  document.getElementById('login-page').style.display = 'none';
  document.getElementById('admin-app').classList.add('show');

  updateUserInfoUI();
  await refreshAllCMSData();
}

function updateUserInfoUI() {
  const username = localStorage.getItem(USER_KEY) || 'vino';
  const topUser = document.getElementById('topbar-username');
  const dashUser = document.getElementById('dash-username');
  const avatar = document.getElementById('user-avatar');

  if (topUser) topUser.textContent = username;
  if (dashUser) dashUser.textContent = username;
  if (avatar) {
    avatar.innerHTML = `<img src="VM-logo.png" alt="VM Logo" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`;
  }

  const newUsernameInp = document.getElementById('sec-new-username');
  if (newUsernameInp) newUsernameInp.value = username;
}

async function refreshAllCMSData() {
  await refreshDashboardStats();
  await refreshCategoriesList();
  await refreshServicesList();
  await refreshWhyUsList();
  await refreshTestimonialsList();
  await refreshGalleryGrid();
  await loadContentCMSFields();
  await loadCommonBgPreviews();
  await loadVCardCMSPreviews();
}

/* ============================================================
   SERVICES CMS CONTROLLER
   ============================================================ */
async function refreshServicesList() {
  if (typeof VMDB === 'undefined') return;
  allServices = await VMDB.dbGetAllServices();
  const list = document.getElementById('cms-services-list');
  if (!list) return;

  if (!allServices.length) {
    list.innerHTML = `<p style="color:var(--admin-text-muted);">No services added yet.</p>`;
    return;
  }

  list.innerHTML = allServices.map(srv => `
    <div style="background:var(--admin-card);border:1px solid var(--admin-border);border-radius:var(--radius-md);padding:20px;display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:16px;">
      <div style="display:flex;align-items:center;gap:16px;">
        <span style="font-size:2rem;background:rgba(212,175,55,0.1);width:50px;height:50px;display:flex;align-items:center;justify-content:center;border-radius:10px;">${srv.icon || '💄'}</span>
        <div>
          <h4 style="font-family:var(--font-serif);font-size:1.3rem;">${srv.title}</h4>
          <p style="font-size:0.85rem;color:var(--admin-text-muted);">${srv.description}</p>
        </div>
      </div>
      <div style="display:flex;gap:10px;">
        <button class="btn-action" style="background:rgba(212,175,55,0.15);color:var(--brand-gold);" onclick="editService('${srv.id}')">✏️ Edit</button>
        <button class="btn-action" style="background:rgba(230,57,70,0.15);color:var(--danger);" onclick="deleteService('${srv.id}')">🗑 Delete</button>
      </div>
    </div>
  `).join('');
}

function openAddServiceModal() {
  editingServiceId = null;
  stagedCardBgs.srv = null;
  document.getElementById('srv-modal-title').textContent = 'Add New Service';
  document.getElementById('srv-title').value = '';
  document.getElementById('srv-icon').value = '💄';
  document.getElementById('srv-desc').value = '';
  document.getElementById('srv-order').value = (allServices.length + 1);
  clearItemBg('srv');
  document.getElementById('service-modal').style.display = 'flex';
}

function editService(id) {
  const srv = allServices.find(s => s.id === id);
  if (!srv) return;
  editingServiceId = id;
  stagedCardBgs.srv = srv.bgImage || null;
  document.getElementById('srv-modal-title').textContent = 'Edit Service';
  document.getElementById('srv-title').value = srv.title;
  document.getElementById('srv-icon').value = srv.icon || '💄';
  document.getElementById('srv-desc').value = srv.description || '';
  document.getElementById('srv-order').value = srv.displayOrder || 1;

  if (srv.bgImage) {
    document.getElementById('srv-bg-preview').src = srv.bgImage;
    document.getElementById('srv-bg-preview-wrap').style.display = 'flex';
  } else {
    clearItemBg('srv');
  }
  document.getElementById('service-modal').style.display = 'flex';
}

function closeServiceModal() {
  document.getElementById('service-modal').style.display = 'none';
}

async function handleSaveService(e) {
  e.preventDefault();
  const title = document.getElementById('srv-title').value.trim();
  const icon = document.getElementById('srv-icon').value.trim() || '💄';
  const desc = document.getElementById('srv-desc').value.trim();
  const order = parseInt(document.getElementById('srv-order').value) || 1;

  if (!title) { showToast('❌ Service title is required'); return; }

  const srvData = {
    id: editingServiceId || ('srv-' + Date.now()),
    title,
    icon,
    description: desc,
    bgImage: stagedCardBgs.srv || null,
    displayOrder: order
  };

  await VMDB.dbSaveService(srvData);
  showToast('✅ Service saved successfully!');
  closeServiceModal();
  await refreshServicesList();
}

async function deleteService(id) {
  if (confirm('Delete this service permanently?')) {
    await VMDB.dbDeleteService(id);
    showToast('🗑 Service deleted');
    await refreshServicesList();
  }
}

/* ============================================================
   WHY CHOOSE US CMS CONTROLLER
   ============================================================ */
async function refreshWhyUsList() {
  if (typeof VMDB === 'undefined') return;
  allWhyUsFeatures = (await VMDB.dbGetSetting('why_us_features')) || [];
  const list = document.getElementById('cms-whyus-list');
  if (!list) return;

  if (!allWhyUsFeatures.length) {
    list.innerHTML = `<p style="color:var(--admin-text-muted);">No distinction features added yet.</p>`;
    return;
  }

  list.innerHTML = allWhyUsFeatures.map(feat => `
    <div style="background:var(--admin-card);border:1px solid var(--admin-border);border-radius:var(--radius-md);padding:20px;display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:16px;">
      <div style="display:flex;align-items:center;gap:16px;">
        <span style="font-size:2rem;background:rgba(212,175,55,0.1);width:50px;height:50px;display:flex;align-items:center;justify-content:center;border-radius:10px;">${feat.icon || '🏆'}</span>
        <div>
          <h4 style="font-family:var(--font-serif);font-size:1.3rem;">${feat.title}</h4>
          <p style="font-size:0.85rem;color:var(--admin-text-muted);">${feat.description}</p>
        </div>
      </div>
      <div style="display:flex;gap:10px;">
        <button class="btn-action" style="background:rgba(212,175,55,0.15);color:var(--brand-gold);" onclick="editWhyUs('${feat.id}')">✏️ Edit</button>
        <button class="btn-action" style="background:rgba(230,57,70,0.15);color:var(--danger);" onclick="deleteWhyUs('${feat.id}')">🗑 Delete</button>
      </div>
    </div>
  `).join('');
}

function openAddWhyUsModal() {
  editingWhyUsId = null;
  stagedCardBgs.whyus = null;
  document.getElementById('whyus-modal-title').textContent = 'Add Distinction Feature';
  document.getElementById('whyus-title').value = '';
  document.getElementById('whyus-icon').value = '🏆';
  document.getElementById('whyus-desc').value = '';
  clearItemBg('whyus');
  document.getElementById('whyus-modal').style.display = 'flex';
}

function editWhyUs(id) {
  const feat = allWhyUsFeatures.find(f => f.id === id);
  if (!feat) return;
  editingWhyUsId = id;
  stagedCardBgs.whyus = feat.bgImage || null;
  document.getElementById('whyus-modal-title').textContent = 'Edit Feature';
  document.getElementById('whyus-title').value = feat.title;
  document.getElementById('whyus-icon').value = feat.icon || '🏆';
  document.getElementById('whyus-desc').value = feat.description || '';

  if (feat.bgImage) {
    document.getElementById('whyus-bg-preview').src = feat.bgImage;
    document.getElementById('whyus-bg-preview-wrap').style.display = 'flex';
  } else {
    clearItemBg('whyus');
  }
  document.getElementById('whyus-modal').style.display = 'flex';
}

function closeWhyUsModal() {
  document.getElementById('whyus-modal').style.display = 'none';
}

async function handleSaveWhyUs(e) {
  e.preventDefault();
  const title = document.getElementById('whyus-title').value.trim();
  const icon = document.getElementById('whyus-icon').value.trim() || '🏆';
  const desc = document.getElementById('whyus-desc').value.trim();

  if (!title) { showToast('❌ Feature title is required'); return; }

  const featData = {
    id: editingWhyUsId || ('feat-' + Date.now()),
    title,
    icon,
    description: desc,
    bgImage: stagedCardBgs.whyus || null
  };

  if (editingWhyUsId) {
    const idx = allWhyUsFeatures.findIndex(f => f.id === editingWhyUsId);
    if (idx !== -1) allWhyUsFeatures[idx] = featData;
  } else {
    allWhyUsFeatures.push(featData);
  }

  await VMDB.dbSetSetting('why_us_features', allWhyUsFeatures);
  showToast('✅ Distinction Feature saved!');
  closeWhyUsModal();
  await refreshWhyUsList();
}

async function deleteWhyUs(id) {
  if (confirm('Delete this feature?')) {
    allWhyUsFeatures = allWhyUsFeatures.filter(f => f.id !== id);
    await VMDB.dbSetSetting('why_us_features', allWhyUsFeatures);
    showToast('🗑 Feature deleted');
    await refreshWhyUsList();
  }
}

/* ============================================================
   TESTIMONIALS CMS CONTROLLER
   ============================================================ */
async function refreshTestimonialsList() {
  if (typeof VMDB === 'undefined') return;
  allTestimonials = await VMDB.dbGetAllTestimonials();
  const list = document.getElementById('cms-testimonials-list');
  if (!list) return;

  if (!allTestimonials.length) {
    list.innerHTML = `<p style="color:var(--admin-text-muted);">No client reviews added yet.</p>`;
    return;
  }

  list.innerHTML = allTestimonials.map(t => `
    <div style="background:var(--admin-card);border:1px solid var(--admin-border);border-radius:var(--radius-md);padding:20px;display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:16px;">
      <div style="display:flex;align-items:center;gap:16px;">
        <div style="width:44px;height:44px;border-radius:50%;background:var(--brand-wine);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:1.2rem;">${t.avatar || t.name.charAt(0)}</div>
        <div>
          <h4 style="font-family:var(--font-serif);font-size:1.3rem;">${t.name} <span style="font-size:0.8rem;color:var(--brand-gold);">(${t.role})</span></h4>
          <p style="font-size:0.85rem;color:var(--admin-text-muted);">${t.text}</p>
        </div>
      </div>
      <div style="display:flex;gap:10px;">
        <button class="btn-action" style="background:rgba(212,175,55,0.15);color:var(--brand-gold);" onclick="editTestimonial('${t.id}')">✏️ Edit</button>
        <button class="btn-action" style="background:rgba(230,57,70,0.15);color:var(--danger);" onclick="deleteTestimonial('${t.id}')">🗑 Delete</button>
      </div>
    </div>
  `).join('');
}

function openAddTestimonialModal() {
  editingTestimonialId = null;
  stagedCardBgs.test = null;
  document.getElementById('test-modal-title').textContent = 'Add Client Review';
  document.getElementById('test-name').value = '';
  document.getElementById('test-role').value = 'Bridal Client';
  document.getElementById('test-text').value = '';
  clearItemBg('test');
  document.getElementById('testimonial-modal').style.display = 'flex';
}

function editTestimonial(id) {
  const t = allTestimonials.find(item => item.id === id);
  if (!t) return;
  editingTestimonialId = id;
  stagedCardBgs.test = t.bgImage || null;
  document.getElementById('test-modal-title').textContent = 'Edit Review';
  document.getElementById('test-name').value = t.name;
  document.getElementById('test-role').value = t.role || '';
  document.getElementById('test-text').value = t.text || '';

  if (t.bgImage) {
    document.getElementById('test-bg-preview').src = t.bgImage;
    document.getElementById('test-bg-preview-wrap').style.display = 'flex';
  } else {
    clearItemBg('test');
  }
  document.getElementById('testimonial-modal').style.display = 'flex';
}

function closeTestimonialModal() {
  document.getElementById('testimonial-modal').style.display = 'none';
}

async function handleSaveTestimonial(e) {
  e.preventDefault();
  const name = document.getElementById('test-name').value.trim();
  const role = document.getElementById('test-role').value.trim() || 'Bridal Client';
  const text = document.getElementById('test-text').value.trim();

  if (!name || !text) { showToast('❌ Name and review text required'); return; }

  const testData = {
    id: editingTestimonialId || ('test-' + Date.now()),
    name,
    role,
    avatar: name.charAt(0).toUpperCase(),
    text,
    bgImage: stagedCardBgs.test || null
  };

  await VMDB.dbSaveTestimonial(testData);
  showToast('✅ Client review saved!');
  closeTestimonialModal();
  await refreshTestimonialsList();
}

async function deleteTestimonial(id) {
  if (confirm('Delete this testimonial?')) {
    await VMDB.dbDeleteTestimonial(id);
    showToast('🗑 Review deleted');
    await refreshTestimonialsList();
  }
}

/* ============================================================
   SECTION BACKGROUND IMAGE CMS CONTROLLER
   ============================================================ */
async function uploadSectionBg(sectionKey, event) {
  const file = event.target.files[0];
  if (!file) return;

  const dataURL = await readFileAsDataURL(file);
  await VMDB.dbSetSetting(`bg_image_${sectionKey}`, dataURL);
  showToast(`✅ Common background image saved for ${sectionKey} section!`);
  updateCommonBgPreviewUI(sectionKey, dataURL);
}

async function removeSectionBg(sectionKey) {
  await VMDB.dbSetSetting(`bg_image_${sectionKey}`, null);
  showToast(`🗑 Common background image removed for ${sectionKey} section`);
  updateCommonBgPreviewUI(sectionKey, null);
}

function updateCommonBgPreviewUI(sectionKey, dataURL) {
  const imgEl = document.getElementById(`${sectionKey}-common-bg-preview`);
  const wrapEl = document.getElementById(`${sectionKey}-common-bg-preview-wrap`);
  const inputEl = document.getElementById(`${sectionKey}-common-bg-input`);

  if (dataURL) {
    if (imgEl) imgEl.src = dataURL;
    if (wrapEl) wrapEl.style.display = 'flex';
  } else {
    if (imgEl) imgEl.src = '';
    if (wrapEl) wrapEl.style.display = 'none';
    if (inputEl) inputEl.value = '';
  }
}

async function loadCommonBgPreviews() {
  if (typeof VMDB === 'undefined') return;
  const sections = ['services', 'whyus', 'testimonials'];
  for (const key of sections) {
    const bg = await VMDB.dbGetSetting(`bg_image_${key}`);
    updateCommonBgPreviewUI(key, bg);
  }
}

/* ============================================================
   CARD BACKGROUND IMAGE CMS HELPERS
   ============================================================ */
let stagedCardBgs = {
  srv: null,
  whyus: null,
  test: null
};

async function previewItemBg(prefix, event) {
  const file = event.target.files[0];
  if (!file) return;
  const dataURL = await readFileAsDataURL(file);
  stagedCardBgs[prefix] = dataURL;

  const previewEl = document.getElementById(`${prefix}-bg-preview`);
  const wrapEl = document.getElementById(`${prefix}-bg-preview-wrap`);
  if (previewEl && wrapEl) {
    previewEl.src = dataURL;
    wrapEl.style.display = 'flex';
  }
}

function clearItemBg(prefix) {
  stagedCardBgs[prefix] = '';
  const inputEl = document.getElementById(`${prefix}-bg-input`);
  const wrapEl = document.getElementById(`${prefix}-bg-preview-wrap`);
  if (inputEl) inputEl.value = '';
  if (wrapEl) wrapEl.style.display = 'none';
}

/* ============================================================
   PANEL NAVIGATION
   ============================================================ */
function showPanel(panelName, triggerEl) {
  currentAdminPanel = panelName;

  document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
  const panel = document.getElementById(`panel-${panelName}`);
  if (panel) panel.classList.add('active');

  document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
  if (triggerEl) triggerEl.classList.add('active');

  const titles = {
    dashboard: 'Dashboard Overview',
    categories: 'Categories Manager',
    upload: 'Upload Images',
    manage: 'Gallery Management',
    content: 'Website Content CMS',
    services: 'Services CMS',
    whyus: 'Why Choose Us CMS',
    testimonials: 'Testimonials CMS',
    location: 'Studio Location & Maps CMS',
    whatsapp: 'WhatsApp CMS Settings',
    security: 'Security & Credentials'
  };
  document.getElementById('topbar-title').textContent = titles[panelName] || panelName;

  if (window.innerWidth < 900) closeSidebar();
}

function toggleSidebar() {
  document.getElementById('admin-sidebar').classList.toggle('open');
}
function closeSidebar() {
  document.getElementById('admin-sidebar').classList.remove('open');
}

/* ============================================================
   DASHBOARD OVERVIEW STATS
   ============================================================ */
async function refreshDashboardStats() {
  if (typeof VMDB === 'undefined') return;

  const cats = await VMDB.dbGetAllCategories();
  const imgs = await VMDB.dbGetAll();

  setEl('stat-total-imgs', imgs.length);
  setEl('stat-total-cats', cats.length);
}

/* ============================================================
   CMS CATEGORIES MANAGEMENT (SECTION 9 & 10)
   ============================================================ */
async function refreshCategoriesList() {
  if (typeof VMDB === 'undefined') return;

  allCategories = await VMDB.dbGetAllCategories();
  const list = document.getElementById('cms-categories-list');
  const uploadCatSelect = document.getElementById('upload-cat-select');

  if (list) {
    if (!allCategories.length) {
      list.innerHTML = `<p style="color:var(--admin-text-muted);">No categories added yet.</p>`;
    } else {
      list.innerHTML = allCategories.map(cat => `
        <div style="background:var(--admin-card);border:1px solid var(--admin-border);border-radius:var(--radius-md);padding:20px;display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:16px;">
          <div style="display:flex;align-items:center;gap:16px;">
            <img src="${cat.thumbnail || 'bridal set1.jpg'}" style="width:60px;height:60px;object-fit:cover;border-radius:8px;" alt="${cat.name}" />
            <div>
              <h4 style="font-family:var(--font-serif);font-size:1.3rem;">${cat.name}</h4>
              <p style="font-size:0.8rem;color:var(--admin-text-muted);">Slug: <code>${cat.slug}</code> | Order: ${cat.displayOrder || 1}</p>
            </div>
          </div>
          <div style="display:flex;gap:10px;">
            <button class="btn-action" style="background:rgba(212,175,55,0.15);color:var(--brand-gold);" onclick="editCategory('${cat.id}')">✏️ Edit</button>
            <button class="btn-action" style="background:rgba(230,57,70,0.15);color:var(--danger);" onclick="deleteCategory('${cat.id}')">🗑 Delete</button>
          </div>
        </div>
      `).join('');
    }
  }

  // Populate upload category dropdown
  if (uploadCatSelect) {
    uploadCatSelect.innerHTML = allCategories.map(c => `<option value="${c.slug}">${c.name}</option>`).join('');
  }
}

let stagedCatThumbnailData = null;

function previewCatThumb(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    stagedCatThumbnailData = e.target.result;
    const img = document.getElementById('cat-thumb-preview');
    if (img) img.src = stagedCatThumbnailData;
  };
  reader.readAsDataURL(file);
}

function openAddCategoryModal() {
  editingCategoryId = null;
  stagedCatThumbnailData = null;
  document.getElementById('cat-modal-title').textContent = 'Create New Category';
  document.getElementById('cat-name').value = '';
  document.getElementById('cat-slug').value = '';
  document.getElementById('cat-desc').value = '';
  document.getElementById('cat-order').value = (allCategories.length + 1);
  if (document.getElementById('cat-thumb-input')) document.getElementById('cat-thumb-input').value = '';
  if (document.getElementById('cat-thumb-preview')) document.getElementById('cat-thumb-preview').src = 'bridal set1.jpg';
  document.getElementById('cat-modal').style.display = 'flex';
}

function editCategory(id) {
  const cat = allCategories.find(c => c.id === id);
  if (!cat) return;

  editingCategoryId = id;
  stagedCatThumbnailData = cat.thumbnail || 'bridal set1.jpg';
  document.getElementById('cat-modal-title').textContent = 'Edit Category & Thumbnail';
  document.getElementById('cat-name').value = cat.name;
  document.getElementById('cat-slug').value = cat.slug;
  document.getElementById('cat-desc').value = cat.description || '';
  document.getElementById('cat-order').value = cat.displayOrder || 1;
  if (document.getElementById('cat-thumb-input')) document.getElementById('cat-thumb-input').value = '';
  if (document.getElementById('cat-thumb-preview')) document.getElementById('cat-thumb-preview').src = stagedCatThumbnailData;
  document.getElementById('cat-modal').style.display = 'flex';
}

async function handleSaveCategory(e) {
  e.preventDefault();
  const name = document.getElementById('cat-name').value.trim();
  const slug = document.getElementById('cat-slug').value.trim();
  const desc = document.getElementById('cat-desc').value.trim();
  const order = parseInt(document.getElementById('cat-order').value) || 1;

  if (!name) { showToast('❌ Please enter category name'); return; }

  const existingCat = editingCategoryId ? allCategories.find(c => c.id === editingCategoryId) : null;
  let finalThumb = stagedCatThumbnailData || (existingCat ? existingCat.thumbnail : 'bridal set1.jpg');

  if (finalThumb && (finalThumb.startsWith('data:image') || finalThumb instanceof File)) {
    finalThumb = await uploadToCloudinary(finalThumb, 'vino_makeover/categories');
  }

  const catData = {
    id: editingCategoryId || ('cat-' + Date.now()),
    name,
    slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    description: desc,
    displayOrder: order,
    visible: true,
    thumbnail: finalThumb
  };

  await VMDB.dbSaveCategory(catData);
  showToast('✅ Category & Cloudinary Thumbnail saved successfully!');
  closeCatModal();
  await refreshCategoriesList();
}

async function deleteCategory(id) {
  if (confirm('Are you sure you want to delete this category? Public portfolio items under this category will be affected.')) {
    await VMDB.dbDeleteCategory(id);
    showToast('🗑 Category deleted');
    await refreshCategoriesList();
  }
}

function closeCatModal() {
  document.getElementById('cat-modal').style.display = 'none';
}

/* ============================================================
   GALLERY UPLOAD & MANAGEMENT
   ============================================================ */
function initDropZone() {
  const zone = document.getElementById('drop-zone');
  const input = document.getElementById('file-input');
  if (!zone || !input) return;

  zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    handleStagedFiles(Array.from(e.dataTransfer.files));
  });

  input.addEventListener('change', () => {
    handleStagedFiles(Array.from(input.files));
    input.value = '';
  });
}

function handleStagedFiles(files) {
  const imgs = files.filter(f => f.type.startsWith('image/'));
  if (!imgs.length) { showToast('⚠️ Please select image files only'); return; }
  pendingUploadFiles = [...pendingUploadFiles, ...imgs];
  renderStagedPreviews();
}

function renderStagedPreviews() {
  const preview = document.getElementById('upload-preview');
  const controls = document.getElementById('upload-controls');
  if (!preview) return;

  preview.innerHTML = '';
  if (!pendingUploadFiles.length) { controls.style.display = 'none'; return; }
  controls.style.display = 'flex';

  pendingUploadFiles.forEach((file, idx) => {
    const url = URL.createObjectURL(file);
    const div = document.createElement('div');
    div.style.cssText = 'position:relative;width:100px;height:100px;border-radius:8px;overflow:hidden;border:1px solid var(--admin-border);';
    div.innerHTML = `
      <img src="${url}" style="width:100%;height:100%;object-fit:cover;" />
      <button onclick="removeStagedFile(${idx})" style="position:absolute;top:4px;right:4px;background:rgba(0,0,0,0.7);color:#fff;border-radius:50%;width:22px;height:22px;border:none;cursor:pointer;">✕</button>
    `;
    preview.appendChild(div);
  });
}

function removeStagedFile(idx) {
  pendingUploadFiles.splice(idx, 1);
  renderStagedPreviews();
}

async function doUpload() {
  if (!pendingUploadFiles.length) return;

  const catSlug = document.getElementById('upload-cat-select').value;
  const caption = document.getElementById('upload-caption').value.trim();

  for (const file of pendingUploadFiles) {
    const dataURL = await readFileAsDataURL(file);
    const cloudinaryUrl = await uploadToCloudinary(dataURL, 'vino_makeover/gallery');
    await VMDB.dbAddImage(catSlug, cloudinaryUrl, caption, file.name, catSlug);
  }

  showToast('✅ Uploaded to Cloudinary gallery successfully!');
  pendingUploadFiles = [];
  renderStagedPreviews();
  document.getElementById('upload-caption').value = '';
  await refreshDashboardStats();
  await refreshGalleryGrid();
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * Upload image payload to Cloudinary via backend serverless API or direct API fallback
 */
async function uploadToCloudinary(fileOrDataUrl, folder = 'vino_makeover') {
  let dataURL = fileOrDataUrl;
  if (fileOrDataUrl instanceof File) {
    dataURL = await readFileAsDataURL(fileOrDataUrl);
  }

  if (typeof dataURL === 'string' && (dataURL.startsWith('http://') || dataURL.startsWith('https://'))) {
    return dataURL;
  }

  showToast('☁️ Uploading image to Cloudinary...');

  try {
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: dataURL, folder: folder })
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.url) {
        showToast('✅ Cloudinary upload success!');
        return data.url;
      }
    }
  } catch (err) {
    console.warn('Serverless /api/upload notice:', err);
  }

  return dataURL;
}

/* Static fallback images map for admin management */
const ADMIN_STATIC_IMAGES = {
  'bridal-look': [
    { src: 'Bridal look.jpg', caption: 'Bridal Look' },
    { src: '01_bridal_makeover_background.png', caption: 'Bridal Makeover Artwork' },
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
    { src: 'bridal set7.jpg', caption: 'Bridal Set 7' },
    { src: '01_bridal_jewellery_background.png', caption: 'Bridal Jewellery & Makeup' }
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
    { src: 'Flowers Garland7.jpg', caption: 'Rose Garland' },
    { src: '03_fresh_flower_garlands_background.png', caption: 'Handcrafted Garland Collection' }
  ],
  'haldi-set': [
    { src: 'Heldi set.jpg', caption: 'Bridal Mehandi & Haldi' },
    { src: '05_mehandi_henna_background.png', caption: 'Vibrant Haldi Styling' }
  ],
  'messy-hairstyle': [
    { src: 'messy hairstyle.jpg', caption: 'Messy Hairstyle' },
    { src: '04_bridal_hair_background.png', caption: 'Chic Messy Hair Styling' }
  ],
  'mukurtham-hairdo': [
    { src: 'Mukurtham Harido1.jpg', caption: 'Mukurtham Hairdo 1' },
    { src: '02_mukurtham_hairdo_background.png', caption: 'Traditional Mukurtham Hair' },
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
  ],
  'blouse-aari': [
    { src: 'Blouse-Thumbnail-image.png', caption: 'Custom Aari Embroidery Blouse' },
    { src: '06_blouse_aari_background.png', caption: 'Hand Worked Aari Blouse Stitch' }
  ],
  'certificates': [
    { src: 'certificate-thumb.jpg', caption: 'Government NSDC Certification' },
    { src: 'certificate.webp', caption: 'Government NSDC Certified Beauty Artist' },
    { src: 'certificate-background.png', caption: 'Certified Beauty & Bridal Professional' },
    { src: 'certificate-collect image.jpg', caption: 'Official Certificate Honor' }
  ]
};

async function refreshGalleryGrid() {
  if (typeof VMDB === 'undefined') return;

  const grid = document.getElementById('admin-manage-grid');
  if (!grid) return;

  const deletedStatics = (await VMDB.dbGetSetting('deleted_static_images')) || [];
  const editedStatics = (await VMDB.dbGetSetting('edited_static_images')) || {};

  allGalleryImages = [];

  // 1. Gather static images
  Object.keys(ADMIN_STATIC_IMAGES).forEach(slug => {
    ADMIN_STATIC_IMAGES[slug].forEach(img => {
      if (deletedStatics.includes(img.src)) return;

      const custom = editedStatics[img.src] || {};
      allGalleryImages.push({
        id: 'static:' + img.src,
        src: custom.src || img.src,
        originalSrc: img.src,
        caption: custom.caption || img.caption,
        categorySlug: custom.slug || slug,
        isStatic: true
      });
    });
  });

  // 2. Gather uploaded DB images
  try {
    const dbImgs = await VMDB.dbGetAll();
    dbImgs.forEach(img => {
      allGalleryImages.push({
        id: img.id,
        src: img.dataURL,
        caption: img.caption || 'Uploaded Gallery Image',
        categorySlug: img.categorySlug || img.category,
        isStatic: false
      });
    });
  } catch (e) {
    console.warn('DB images load info:', e);
  }

  if (!allGalleryImages.length) {
    grid.innerHTML = `<p style="color:var(--admin-text-muted);">No gallery images found.</p>`;
    return;
  }

  grid.innerHTML = allGalleryImages.map((img, idx) => `
    <div style="background:var(--admin-card);border:1px solid var(--admin-border);border-radius:var(--radius-md);overflow:hidden;display:flex;flex-direction:column;justify-content:space-between;">
      <div>
        <img src="${img.src}" style="width:100%;height:160px;object-fit:cover;" />
        <div style="padding:14px;">
          <div style="font-size:0.88rem;font-weight:600;margin-bottom:4px;word-break:break-word;">${img.caption || 'Untitled Image'}</div>
          <div style="font-size:0.75rem;color:var(--brand-gold);margin-bottom:8px;">${img.categorySlug} ${img.isStatic ? '<span style="opacity:0.6;">(Default)</span>' : ''}</div>
        </div>
      </div>
      <div style="padding:0 14px 14px 14px;display:flex;gap:8px;">
        <button class="btn-action" style="background:rgba(212,175,55,0.15);color:var(--brand-gold);flex:1;justify-content:center;" onclick="openEditImageModal(${idx})">✏️ Edit</button>
        <button class="btn-action" style="background:rgba(230,57,70,0.15);color:var(--danger);flex:1;justify-content:center;" onclick="deleteGalleryImage('${img.id}')">🗑 Delete</button>
      </div>
    </div>
  `).join('');
}

let stagedEditImageData = null;

function openEditImageModal(idx) {
  const img = allGalleryImages[idx];
  if (!img) return;

  stagedEditImageData = null;

  document.getElementById('edit-img-id').value = img.id;
  document.getElementById('edit-img-is-static').value = img.isStatic ? 'true' : 'false';
  document.getElementById('edit-img-original-src').value = img.originalSrc || img.src;
  document.getElementById('edit-img-preview').src = img.src;
  document.getElementById('edit-img-caption').value = img.caption || '';
  if (document.getElementById('edit-img-file-input')) document.getElementById('edit-img-file-input').value = '';

  const catSelect = document.getElementById('edit-img-cat-select');
  if (catSelect) {
    catSelect.innerHTML = allCategories.map(c => `
      <option value="${c.slug}" ${c.slug === img.categorySlug ? 'selected' : ''}>${c.name}</option>
    `).join('');
  }

  document.getElementById('edit-image-modal').style.display = 'flex';
}

function previewEditImgFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    stagedEditImageData = e.target.result;
    document.getElementById('edit-img-preview').src = stagedEditImageData;
  };
  reader.readAsDataURL(file);
}

function closeEditImageModal() {
  document.getElementById('edit-image-modal').style.display = 'none';
}

async function handleSaveEditedImage(e) {
  e.preventDefault();

  const id = document.getElementById('edit-img-id').value;
  const isStatic = document.getElementById('edit-img-is-static').value === 'true';
  const originalSrc = document.getElementById('edit-img-original-src').value;
  const caption = document.getElementById('edit-img-caption').value.trim();
  const categorySlug = document.getElementById('edit-img-cat-select').value;
  const fileInput = document.getElementById('edit-img-file-input');

  let finalUrl = document.getElementById('edit-img-preview').src;

  // If a new replacement file was picked, upload to Cloudinary
  if (fileInput && fileInput.files && fileInput.files[0]) {
    finalUrl = await uploadToCloudinary(fileInput.files[0], 'vino_makeover/gallery');
  } else if (stagedEditImageData && stagedEditImageData.startsWith('data:image')) {
    finalUrl = await uploadToCloudinary(stagedEditImageData, 'vino_makeover/gallery');
  }

  if (isStatic) {
    const editedStatics = (await VMDB.dbGetSetting('edited_static_images')) || {};
    editedStatics[originalSrc] = {
      src: finalUrl,
      caption: caption,
      slug: categorySlug
    };
    await VMDB.dbSetSetting('edited_static_images', editedStatics);
  } else {
    // DB uploaded image update
    const dbId = parseInt(id) || id;
    const all = await VMDB.dbGetAll();
    const existing = all.find(i => i.id == dbId);
    if (existing) {
      existing.dataURL = finalUrl;
      existing.caption = caption;
      existing.category = categorySlug;
      existing.categorySlug = categorySlug;

      // Update in IndexedDB
      const db = await VMDB.openDB();
      const tx = db.transaction('images', 'readwrite');
      const store = tx.objectStore('images');
      store.put(existing);
    }
  }

  showToast('✅ Image updated successfully!');
  closeEditImageModal();
  await refreshGalleryGrid();
  await refreshDashboardStats();
}

async function deleteGalleryImage(id) {
  if (!confirm('Delete this gallery image permanently from website?')) return;

  if (typeof id === 'string' && id.startsWith('static:')) {
    const staticSrc = id.replace('static:', '');
    const deletedStatics = (await VMDB.dbGetSetting('deleted_static_images')) || [];
    if (!deletedStatics.includes(staticSrc)) {
      deletedStatics.push(staticSrc);
      await VMDB.dbSetSetting('deleted_static_images', deletedStatics);
    }
  } else {
    const numericId = parseInt(id) || id;
    await VMDB.dbDeleteImage(numericId);
  }

  showToast('🗑 Image deleted permanently!');
  await refreshGalleryGrid();
  await refreshDashboardStats();
}

/* ============================================================
   WEBSITE CONTENT & HERO CMS
   ============================================================ */
async function loadContentCMSFields() {
  if (typeof VMDB === 'undefined') return;

  await loadHeroCMSFields();

  const wa = await VMDB.dbGetSetting('whatsapp_config');
  if (wa) {
    if (document.getElementById('cms-wa-phone')) document.getElementById('cms-wa-phone').value = wa.phone || '';
    if (document.getElementById('cms-wa-msg')) document.getElementById('cms-wa-msg').value = wa.defaultMessage || '';
  }

  const contact = await VMDB.dbGetSetting('contact_info');
  if (contact) {
    if (document.getElementById('cms-loc-address')) document.getElementById('cms-loc-address').value = contact.address || '';
    if (document.getElementById('cms-loc-maps-link')) document.getElementById('cms-loc-maps-link').value = contact.mapsUrl || '';
    if (document.getElementById('cms-loc-embed-url')) document.getElementById('cms-loc-embed-url').value = contact.mapsEmbedUrl || '';
  }
}

async function loadHeroCMSFields() {
  if (typeof VMDB === 'undefined') return;
  const hero = await VMDB.dbGetSetting('site_hero') || {};

  if (document.getElementById('cms-hero-eyebrow')) document.getElementById('cms-hero-eyebrow').value = hero.eyebrow || '✦ CERTIFIED MAKEUP ARTIST • NAGAPATTINAM ✦';
  if (document.getElementById('cms-hero-title')) document.getElementById('cms-hero-title').value = hero.title || 'Where Every Bride Becomes Her Most Beautiful Self';
  if (document.getElementById('cms-hero-desc')) document.getElementById('cms-hero-desc').value = hero.desc || 'Transforming your most cherished celebrations with fine artistry, elegance, and grace...';
  if (document.getElementById('cms-hero-btn1')) document.getElementById('cms-hero-btn1').value = hero.primaryBtnText || '✨ Explore Gallery';
  if (document.getElementById('cms-hero-btn2')) document.getElementById('cms-hero-btn2').value = hero.secondaryBtnText || 'Book via WhatsApp';

  // Stats
  if (document.getElementById('cms-stat1-num')) document.getElementById('cms-stat1-num').value = hero.stat1Num || '500+';
  if (document.getElementById('cms-stat1-lbl')) document.getElementById('cms-stat1-lbl').value = hero.stat1Lbl || 'Happy Brides';
  if (document.getElementById('cms-stat2-num')) document.getElementById('cms-stat2-num').value = hero.stat2Num || '8+';
  if (document.getElementById('cms-stat2-lbl')) document.getElementById('cms-stat2-lbl').value = hero.stat2Lbl || 'Years Experience';
  if (document.getElementById('cms-stat3-num')) document.getElementById('cms-stat3-num').value = hero.stat3Num || 'NSDC';
  if (document.getElementById('cms-stat3-lbl')) document.getElementById('cms-stat3-lbl').value = hero.stat3Lbl || 'Government Certified';
  if (document.getElementById('cms-stat4-num')) document.getElementById('cms-stat4-num').value = hero.stat4Num || '★ 5.0';
  if (document.getElementById('cms-stat4-lbl')) document.getElementById('cms-stat4-lbl').value = hero.stat4Lbl || 'Rating';

  // Slides Grid
  loadHeroSlidesGrid(hero.bgImages || [
    'bridal set5.jpg',
    'Mukurtham Harido10.jpg',
    'Flowers Garland7.jpg',
    'bridal set2.jpg',
    'engagementlook.jpg'
  ]);
}

function loadHeroSlidesGrid(images) {
  const grid = document.getElementById('cms-hero-slides-grid');
  if (!grid) return;

  if (!images || !images.length) {
    grid.innerHTML = `<p style="color:var(--admin-text-muted);font-size:0.85rem;">No background slides uploaded yet.</p>`;
    return;
  }

  grid.innerHTML = images.map((img, i) => `
    <div style="background:var(--admin-card);border:1px solid var(--admin-border);border-radius:var(--radius-md);overflow:hidden;text-align:center;padding:8px;">
      <img src="${img}" style="width:100%;height:90px;object-fit:cover;border-radius:6px;margin-bottom:8px;" />
      <button type="button" class="btn-action" style="background:rgba(230,57,70,0.15);color:var(--danger);width:100%;font-size:0.75rem;justify-content:center;" onclick="deleteHeroBgSlide(${i})">🗑 Remove</button>
    </div>
  `).join('');
}

async function uploadHeroBgSlide(event) {
  const file = event.target.files[0];
  if (!file) return;
  const dataURL = await readFileAsDataURL(file);
  const cloudinaryUrl = await uploadToCloudinary(dataURL, 'vino_makeover/hero');

  const hero = await VMDB.dbGetSetting('site_hero') || {};
  let bgImages = hero.bgImages || [
    'bridal set5.jpg',
    'Mukurtham Harido10.jpg',
    'Flowers Garland7.jpg',
    'bridal set2.jpg',
    'engagementlook.jpg'
  ];

  bgImages.push(cloudinaryUrl);
  hero.bgImages = bgImages;

  await VMDB.dbSetSetting('site_hero', hero);
  showToast('✅ New Hero slide uploaded to Cloudinary!');
  loadHeroSlidesGrid(bgImages);
  event.target.value = '';
}

async function deleteHeroBgSlide(index) {
  if (!confirm('Remove this slide from Hero background carousel?')) return;
  const hero = await VMDB.dbGetSetting('site_hero') || {};
  let bgImages = hero.bgImages || [];

  bgImages.splice(index, 1);
  hero.bgImages = bgImages;

  await VMDB.dbSetSetting('site_hero', hero);
  showToast('🗑 Hero slide removed');
  loadHeroSlidesGrid(bgImages);
}

async function saveHeroCMS(e) {
  e.preventDefault();
  const hero = await VMDB.dbGetSetting('site_hero') || {};

  hero.eyebrow = document.getElementById('cms-hero-eyebrow').value.trim();
  hero.title = document.getElementById('cms-hero-title').value.trim();
  hero.desc = document.getElementById('cms-hero-desc').value.trim();
  hero.primaryBtnText = document.getElementById('cms-hero-btn1').value.trim();
  hero.secondaryBtnText = document.getElementById('cms-hero-btn2').value.trim();

  await VMDB.dbSetSetting('site_hero', hero);
  showToast('✅ Hero headline, description & button texts updated!');
}

async function saveHeroStatsCMS(e) {
  e.preventDefault();
  const hero = await VMDB.dbGetSetting('site_hero') || {};

  hero.stat1Num = document.getElementById('cms-stat1-num').value.trim();
  hero.stat1Lbl = document.getElementById('cms-stat1-lbl').value.trim();
  hero.stat2Num = document.getElementById('cms-stat2-num').value.trim();
  hero.stat2Lbl = document.getElementById('cms-stat2-lbl').value.trim();
  hero.stat3Num = document.getElementById('cms-stat3-num').value.trim();
  hero.stat3Lbl = document.getElementById('cms-stat3-lbl').value.trim();
  hero.stat4Num = document.getElementById('cms-stat4-num').value.trim();
  hero.stat4Lbl = document.getElementById('cms-stat4-lbl').value.trim();

  await VMDB.dbSetSetting('site_hero', hero);
  showToast('✅ Hero trust stats bar updated!');
}

async function saveLocationCMS(e) {
  e.preventDefault();
  const address = document.getElementById('cms-loc-address').value.trim();
  const mapsUrl = document.getElementById('cms-loc-maps-link').value.trim();
  let mapsEmbedUrl = document.getElementById('cms-loc-embed-url').value.trim();

  if (!address || !mapsUrl) {
    showToast('❌ Address and Maps Link are required');
    return;
  }

  if (!mapsEmbedUrl) {
    mapsEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  }

  await VMDB.dbSetSetting('contact_info', {
    address,
    mapsUrl,
    mapsEmbedUrl
  });

  showToast('✅ Studio Location & Google Maps CMS updated!');
}

async function saveWhatsAppCMS(e) {
  e.preventDefault();
  const phone = document.getElementById('cms-wa-phone').value.trim();
  const msg = document.getElementById('cms-wa-msg').value.trim();

  await VMDB.dbSetSetting('whatsapp_config', { phone, defaultMessage: msg });
  showToast('✅ WhatsApp CMS settings saved!');
}

/* ============================================================
   SECURITY SETTINGS (USERNAME & PASSWORD UPDATE)
   ============================================================ */
async function updateAdminCredentials(e) {
  e.preventDefault();

  const newUsername = document.getElementById('sec-new-username').value.trim();
  const currPass = document.getElementById('sec-curr-pass').value;
  const newPass = document.getElementById('sec-new-pass').value;
  const confirmPass = document.getElementById('sec-confirm-pass').value;

  const storedPass = localStorage.getItem(PASS_KEY) || '123';

  if (!newUsername) { showToast('❌ Username cannot be empty'); return; }
  if (currPass !== storedPass) { showToast('❌ Current password is incorrect'); return; }
  if (!newPass) { showToast('❌ Please enter a new password'); return; }
  if (newPass !== confirmPass) { showToast('❌ Passwords do not match'); return; }

  localStorage.setItem(USER_KEY, newUsername);
  localStorage.setItem(PASS_KEY, newPass);

  updateUserInfoUI();
  showToast('✅ Credentials updated successfully!');

  document.getElementById('sec-curr-pass').value = '';
  document.getElementById('sec-new-pass').value = '';
  document.getElementById('sec-confirm-pass').value = '';
}

/* ============================================================
   HELPERS & TOAST
   ============================================================ */
function setEl(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function showToast(msg) {
  const container = document.getElementById('admin-toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'admin-toast';
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

/* ============================================================
   VISITING CARD CMS CONTROLLER
   ============================================================ */
async function uploadVCardCMS(lang, event) {
  const file = event.target.files[0];
  if (!file) return;
  const dataURL = await readFileAsDataURL(file);
  const cloudinaryUrl = await uploadToCloudinary(dataURL, 'vino_makeover/vcard');

  const config = (await VMDB.dbGetSetting('visiting_card_config')) || {
    tamilCard: 'visiting-card-tamil.jpg',
    englishCard: 'visiting-card-english.jpg'
  };

  if (lang === 'tamil') config.tamilCard = cloudinaryUrl;
  else config.englishCard = cloudinaryUrl;

  await VMDB.dbSetSetting('visiting_card_config', config);
  showToast(`✅ ${lang === 'tamil' ? 'Tamil' : 'English'} Visiting Card uploaded to Cloudinary!`);
  loadVCardCMSPreviews();
}

async function resetVCardCMS(lang) {
  const config = (await VMDB.dbGetSetting('visiting_card_config')) || {};
  if (lang === 'tamil') config.tamilCard = 'visiting-card-tamil.jpg';
  else config.englishCard = 'visiting-card-english.jpg';

  await VMDB.dbSetSetting('visiting_card_config', config);
  showToast(`↺ ${lang === 'tamil' ? 'Tamil' : 'English'} Visiting Card reset to default`);
  loadVCardCMSPreviews();
}

async function loadVCardCMSPreviews() {
  if (typeof VMDB === 'undefined') return;
  const config = (await VMDB.dbGetSetting('visiting_card_config')) || {};
  const tamilImg = document.getElementById('cms-vcard-tamil-preview');
  const engImg = document.getElementById('cms-vcard-english-preview');

  if (tamilImg) tamilImg.src = config.tamilCard || 'visiting-card-tamil.jpg';
  if (engImg) engImg.src = config.englishCard || 'visiting-card-english.jpg';
}
