const menuButton = document.querySelector('.menu-toggle');
const siteNav = document.querySelector('.site-nav');

function closeMenu() {
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Открыть меню');
  siteNav.classList.remove('is-open');
  document.body.classList.remove('menu-open');
}

menuButton.addEventListener('click', () => {
  const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!isOpen));
  menuButton.setAttribute('aria-label', isOpen ? 'Открыть меню' : 'Закрыть меню');
  siteNav.classList.toggle('is-open', !isOpen);
  document.body.classList.toggle('menu-open', !isOpen);
});

siteNav.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));

window.addEventListener('resize', () => {
  if (window.innerWidth > 880) closeMenu();
});

document.querySelectorAll('[data-direction]').forEach((link) => {
  link.addEventListener('click', () => {
    const direction = document.querySelector('#direction');
    direction.value = link.dataset.direction;
    direction.closest('.field').classList.remove('is-invalid');
  });
});

const form = document.querySelector('#lead-form');
const statusBox = document.querySelector('#form-status');

function setStatus(message, type) {
  statusBox.textContent = message;
  statusBox.className = `form-status is-visible is-${type}`;
}

let submitting = false;
let lastAcceptedAt = 0;
const requiredFields = [...form.querySelectorAll('[required]')];

function fieldIsValid(field) {
  const value = field.value.trim();
  if (!value || !field.checkValidity()) return false;
  if (field.id === 'phone') {
    const digits = value.replace(/\D/g, '');
    return /^[+\d\s().-]+$/.test(value) && digits.length >= 7 && digits.length <= 15;
  }
  return true;
}

function markField(field, valid) {
  field.closest('.field')?.classList.toggle('is-invalid', !valid);
  field.setAttribute('aria-invalid', String(!valid));
}

function validateForm() {
  requiredFields.forEach((field) => markField(field, fieldIsValid(field)));
  return requiredFields.every(fieldIsValid);
}

requiredFields.forEach((field) => {
  field.addEventListener('input', () => markField(field, fieldIsValid(field)));
  field.addEventListener('change', () => markField(field, fieldIsValid(field)));
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (submitting) return;
  statusBox.className = 'form-status';

  // Formspree also checks this honeypot on its servers.
  if (form.elements.namedItem('_gotcha')?.value.trim()) {
    setStatus('Не удалось отправить заявку. Свяжитесь с нами по электронной почте.', 'error');
    return;
  }
  if (!validateForm()) {
    setStatus('Проверьте обязательные поля и формат телефона.', 'error');
    requiredFields.find((field) => !fieldIsValid(field))?.focus();
    return;
  }
  if (Date.now() - lastAcceptedAt < 30000) {
    setStatus('Предыдущая заявка уже принята. Перед новой отправкой подождите 30 секунд.', 'error');
    return;
  }

  const formEndpoint = form.getAttribute('action')?.trim();
  if (!formEndpoint) {
    setStatus('Отправка временно недоступна. Напишите на tagangylyjowj@gmail.com.', 'error');
    return;
  }
  const submitButton = form.querySelector('button[type="submit"]');
  const defaultLabel = submitButton.textContent;
  // Snapshot the data; edits while a request is in flight must not be lost.
  const payload = new FormData(form);
  requiredFields.forEach((field) => payload.set(field.name, field.value.trim()));
  const originalValues = requiredFields.map((field) => field.value);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  submitting = true;
  form.setAttribute('aria-busy', 'true');
  submitButton.disabled = true;
  submitButton.textContent = 'Отправка…';
  setStatus('Отправляем заявку…', 'pending');

  try {
    const response = await fetch(formEndpoint, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: payload,
      signal: controller.signal
    });
    const data = await response.json().catch(() => null);
    if (response.status === 429) {
      setStatus('Слишком много запросов. Подождите и повторите попытку позже. Данные сохранены в форме.', 'error');
      return;
    }
    if (!response.ok || data?.ok === false || data?.errors?.length) {
      // Never render server text as HTML or claim success on a validation error.
      const serverErrors = Array.isArray(data?.errors) ? data.errors : [];
      serverErrors.forEach((error) => {
        const field = requiredFields.find((item) => item.name === error.field);
        if (field) markField(field, false);
      });
      const needsCaptcha = serverErrors.some((error) => /captcha/i.test(String(error.code) + ' ' + String(error.message)));
      setStatus(needsCaptcha
        ? 'Сервис требует проверку от спама. Напишите на tagangylyjowj@gmail.com. Данные сохранены в форме.'
        : 'Сервис не принял заявку. Проверьте данные или напишите на tagangylyjowj@gmail.com. Данные сохранены в форме.', 'error');
      return;
    }
    if (!data || data.ok !== true) {
      throw new Error('Unconfirmed response');
    }
    lastAcceptedAt = Date.now();
    if (requiredFields.every((field, index) => field.value === originalValues[index])) {
      form.reset();
      requiredFields.forEach((field) => markField(field, true));
    }
    setStatus('Заявка принята сервисом. Благодарим за обращение.', 'success');
  } catch (error) {
    setStatus('Подтверждение отправки не получено. Данные сохранены в форме. Заявка могла быть принята: перед повтором проверьте результат или свяжитесь с нами по адресу tagangylyjowj@gmail.com.', 'error');
  } finally {
    clearTimeout(timeout);
    submitting = false;
    form.setAttribute('aria-busy', 'false');
    submitButton.disabled = false;
    submitButton.textContent = defaultLabel;
  }
});

document.querySelector('#current-year').textContent = new Date().getFullYear();
