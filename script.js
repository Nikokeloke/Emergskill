// Utilidad sencilla para añadir/remover clases con protección en navegadores antiguos
function qs(selector, scope) {
  return (scope || document).querySelector(selector);
}

function qsa(selector, scope) {
  return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
}

/* =========================
   Menú responsive y scroll
   ========================= */

function setupNavigation() {
  var navToggle = qs('.nav-toggle');
  var navLinks = qsa('.site-nav a');

  if (!navToggle) return;

  navToggle.addEventListener('click', function () {
    var isOpen = document.body.classList.toggle('nav-open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  navLinks.forEach(function (link) {
    link.addEventListener('click', function () {
      document.body.classList.remove('nav-open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

/* =========================
   Contador de plazas
   ========================= */

// Nueva clave para reiniciar el contador respetando estados anteriores
var COUNTER_STORAGE_KEY = 'emergskill-counter-v2';

function loadCounterState() {
  try {
    var stored = localStorage.getItem(COUNTER_STORAGE_KEY);
    if (stored) {
      var parsed = JSON.parse(stored);
      if (
        typeof parsed.tier1 === 'number' &&
        typeof parsed.tier2 === 'number' &&
        typeof parsed.total === 'number'
      ) {
        return parsed;
      }
    }
  } catch (e) {
    // Si localStorage no está disponible, se ignora y se usa estado por defecto
  }

  // Estado inicial: todas las plazas promocionales disponibles
  var tier1Initial = 50;
  var tier2Initial = 50;

  return {
    tier1: tier1Initial,
    tier2: tier2Initial,
    total: tier1Initial + tier2Initial,
  };
}

function saveCounterState(state) {
  try {
    localStorage.setItem(COUNTER_STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    // Ignorar errores de almacenamiento
  }
}

function updateCounterDOM(state) {
  var elTier1 = qs('#counter-tier1');
  var elTier2 = qs('#counter-tier2');
  var elTotal = qs('#counter-total');

  if (!elTier1 || !elTier2 || !elTotal) return;

  [elTier1, elTier2, elTotal].forEach(function (el) {
    el.classList.remove('pulse');
  });

  elTier1.textContent = state.tier1;
  elTier2.textContent = state.tier2;
  elTotal.textContent = state.total;

  // Pequeño efecto visual al cambiar
  requestAnimationFrame(function () {
    [elTier1, elTier2, elTotal].forEach(function (el) {
      el.classList.add('pulse');
    });
  });

  var ctaLabel = qs('#offer-cta-label');
  if (!ctaLabel) return;

  if (state.tier1 > 0) {
    ctaLabel.textContent = 'Asegurar matrícula gratis';
  } else if (state.tier2 > 0) {
    ctaLabel.textContent = 'Aprovechar descuento + kit';
  } else {
    ctaLabel.textContent = 'Entrar en lista prioritaria';
  }
}

function consumeSeat(state) {
  var updated = { tier1: state.tier1, tier2: state.tier2, total: state.total };

  if (updated.total <= 0) return updated;

  if (updated.tier1 > 0) {
    updated.tier1 -= 1;
  } else if (updated.tier2 > 0) {
    updated.tier2 -= 1;
  }

  updated.total = Math.max(0, updated.tier1 + updated.tier2);
  return updated;
}

function setupCounter() {
  var state = loadCounterState();
  updateCounterDOM(state);
  saveCounterState(state);

  var offerCta = qs('.js-offer-cta');
  if (offerCta) {
    offerCta.addEventListener('click', function () {
      state = consumeSeat(state);
      updateCounterDOM(state);
      saveCounterState(state);
      scrollToContact({
        clientType: offerCta.getAttribute('data-client-type') || 'Particular',
        appendMessage: 'Quiero aprovechar la promoción de lanzamiento.',
      });
    });
  }
}

/* =========================
   Scroll al contacto + cursos
   ========================= */

function scrollToContact(options) {
  var contactSection = qs('#contacto');
  var form = qs('#contact-form');
  if (!contactSection || !form) return;

  var type = options && options.clientType;
  var message = options && options.appendMessage;

  if (type) {
    var select = qs('#client-type');
    if (select) {
      select.value = type;
    }
  }

  if (message) {
    var textarea = qs('#message');
    if (textarea) {
      var current = textarea.value.trim();
      if (current) {
        textarea.value = current + '\n\n' + message;
      } else {
        textarea.value = message;
      }
    }
  }

  contactSection.scrollIntoView({ behavior: 'smooth' });
}

function setupCourseButtons() {
  var buttons = qsa('.course-reserve');
  var urgencyBanner = qs('#contact-urgency');

  buttons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var card = btn.closest('.course-card');
      if (!card) return;

      var name = card.getAttribute('data-course-name') || 'Curso EmergSkill';
      var tag = card.getAttribute('data-tag') || '';

      var clientType = btn.getAttribute('data-client-type') || 'Particular';
      var baseMessage = 'Quiero reservar plaza en "' + name + '" y recibir más información.';

      scrollToContact({
        clientType: clientType,
        appendMessage: baseMessage,
      });

      if (tag === 'ultimas' && urgencyBanner) {
        urgencyBanner.textContent =
          'Estás solicitando información de un curso con últimas plazas disponibles. Te recomendamos enviar el formulario cuanto antes.';
      } else if (urgencyBanner) {
        urgencyBanner.textContent = '';
      }
    });
  });

  var genericScrollButtons = qsa('.js-scroll-contact');
  genericScrollButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var type = btn.getAttribute('data-client-type') || 'Particular';
      var presetMessage = btn.getAttribute('data-message') || '';
      scrollToContact({
        clientType: type,
        appendMessage: presetMessage,
      });
    });
  });
}

/* =========================
   Validación de formulario
   ========================= */

function validateEmail(value) {
  var pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern.test(value);
}

function setupForm() {
  var form = qs('#contact-form');
  if (!form) return;

  var feedback = qs('#form-feedback');

  form.addEventListener('submit', function (event) {
    event.preventDefault();

    var fields = ['name', 'email', 'message'];
    var valid = true;

    fields.forEach(function (fieldName) {
      var field = qs('#' + fieldName);
      var row = field ? field.closest('.form-row') : null;
      var errorEl = qs('.field-error-message[data-for="' + fieldName + '"]');

      if (!field || !row || !errorEl) return;

      row.classList.remove('field-error');
      errorEl.textContent = '';

      var value = field.value.trim();
      if (!value) {
        row.classList.add('field-error');
        errorEl.textContent = 'Este campo es obligatorio.';
        valid = false;
        return;
      }

      if (fieldName === 'email' && !validateEmail(value)) {
        row.classList.add('field-error');
        errorEl.textContent = 'Introduce un email válido.';
        valid = false;
      }
    });

    if (!valid) {
      if (feedback) {
        feedback.textContent = 'Revisa los campos marcados en rojo.';
        feedback.classList.remove('form-feedback--success');
        feedback.classList.add('form-feedback--error');
      }
      return;
    }

    // Simulación de envío correcto
    if (feedback) {
      feedback.textContent = 'Hemos recibido tu solicitud. Te contactaremos en breve.';
      feedback.classList.remove('form-feedback--error');
      feedback.classList.add('form-feedback--success');
    }

    var nameField = qs('#name');
    var emailField = qs('#email');
    var phoneField = qs('#phone');

    if (nameField) nameField.value = '';
    if (emailField) emailField.value = '';
    if (phoneField) phoneField.value = '';
  });
}

/* =========================
   Animaciones de aparición
   ========================= */

function setupRevealAnimations() {
  if (!('IntersectionObserver' in window)) {
    qsa('.reveal').forEach(function (el) {
      el.classList.add('is-visible');
    });
    return;
  }

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.15,
    }
  );

  qsa('.reveal').forEach(function (el) {
    observer.observe(el);
  });
}

/* =========================
   Inicio
   ========================= */

document.addEventListener('DOMContentLoaded', function () {
  setupNavigation();
  setupCounter();
  setupCourseButtons();
  setupForm();
  setupRevealAnimations();
});

