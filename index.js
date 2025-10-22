// Helpers
const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => r.querySelectorAll(s);

// Mobile nav
const navToggle = $('.nav-toggle');
const navLinks = $('.nav-links');
if (navToggle) {
  navToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
  navLinks.addEventListener('click', e => { if (e.target.matches('.nav-link')) navLinks.classList.remove('open'); });
}

// Highlight active nav by page
function setActiveNav() {
  const page = document.body.dataset.page || 'home';
  $$('.nav-link').forEach(l => l.classList.toggle('active', l.dataset.page === page));
}
window.addEventListener('load', setActiveNav);

// Reveal on scroll
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('in'); revealObserver.unobserve(entry.target); }
  });
}, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });
$$('[data-animate]').forEach(el => revealObserver.observe(el));

// Tilt effect
$$('.tilt').forEach(card => {
  let rect;
  const onMove = (e) => {
    rect = rect || card.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const rx = (py - 0.5) * 8;
    const ry = (px - 0.5) * -8;
    card.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
  };
  const reset = () => card.style.transform = '';
  card.addEventListener('mousemove', onMove);
  card.addEventListener('mouseleave', reset);
});

// Order modal
const modal = $('#order-modal');
const orderForm = $('#order-form');
const orderServiceSelect = $('#order-service');

const openOrder = (service) => {
  if (orderServiceSelect) {
    const option = [...orderServiceSelect.options].find(o => o.text === service);
    orderServiceSelect.value = option ? option.text : 'General Inquiry';
  }
  if (orderForm) orderForm.reset(); // Reset inputs except select
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
};

const closeOrder = () => {
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  if (orderForm) {
    const selectedService = orderServiceSelect.value;
    orderForm.reset();
    orderServiceSelect.value = selectedService;
    const status = orderForm.querySelector('.form-status');
    if (status) status.textContent = '';
  }
};

// Open modal when any button with .order-open is clicked
$$('.order-open').forEach(btn => {
  btn.addEventListener('click', () => openOrder(btn.dataset.service || 'General Inquiry'));
});

// Close modal on backdrop or X click
modal.addEventListener('click', e => {
  if (e.target.closest('.modal-backdrop') || e.target.closest('.modal-close')) {
    closeOrder();
  }
});

// Lightbox (only on pages that have it)
const lightbox = $('#lightbox');
if (lightbox) {
  const lightboxImg = $('#lightbox-img');
  const lightboxCap = $('#lightbox-cap');
  $$('.work-card').forEach(card => {
    card.addEventListener('click', e => {
      e.preventDefault();
      const full = card.dataset.full || card.getAttribute('href');
      lightboxImg.src = full;
      lightboxImg.alt = card.querySelector('img')?.alt || 'Preview';
      lightboxCap.textContent = card.querySelector('.work-meta')?.textContent || '';
      lightbox.classList.add('open'); lightbox.setAttribute('aria-hidden', 'false');
    });
  });
  lightbox.addEventListener('click', e => {
    if (e.target.matches('.lightbox-backdrop') || e.target.matches('[data-close]')) {
      lightbox.classList.remove('open'); 
      lightbox.setAttribute('aria-hidden', 'true'); 
      lightboxImg.src = '';
    }
  });
}

// AJAX form submit
async function handleForm(form) {
  const endpoint = form.dataset.endpoint;
  const status = form.querySelector('.form-status');
  if (!endpoint || endpoint.includes('xxxxxxx')) {
    status && (status.textContent = 'Set your form endpoint first (Formspree or your API).', status.style.color = '#f5a8a8');
    return;
  }
  const data = new FormData(form);
  data.append('_subject', `New submission: ${form.id}`);
  data.append('_origin', location.href);
  data.append('_replyto', data.get('email') || '');
  try {
    const res = await fetch(endpoint, { method: 'POST', headers: { Accept: 'application/json' }, body: data });
    if (res.ok) {
      form.reset();
      status && (status.textContent = 'Thanks! I’ll get back to you shortly.', status.style.color = '#a8f5d1');
    } else {
      const j = await res.json().catch(() => ({}));
      status && (status.textContent = j?.error || 'Something went wrong. Try again.', status.style.color = '#f5a8a8');
    }
  } catch {
    status && (status.textContent = 'Network error. Please try again.', status.style.color = '#f5a8a8');
  }
}

orderForm?.addEventListener('submit', e => { e.preventDefault(); handleForm(orderForm); });
$('#contact-form')?.addEventListener('submit', e => { e.preventDefault(); handleForm(e.target); });
