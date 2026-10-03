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

function validateForm() {
  let isValid = true;

  form.querySelectorAll('[required]').forEach((field) => {
    const wrapper = field.closest('.field');
    const valid = field.value.trim() !== '';
    wrapper.classList.toggle('is-invalid', !valid);
    field.setAttribute('aria-invalid', String(!valid));
    if (!valid) isValid = false;
  });

  return isValid;
}

form.querySelectorAll('input, select, textarea').forEach((field) => {
  field.addEventListener('input', () => {
    if (field.value.trim()) {
      field.closest('.field').classList.remove('is-invalid');
      field.setAttribute('aria-invalid', 'false');
    }
  });
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  statusBox.className = 'form-status';

  if (!validateForm()) {
    setStatus('Проверьте обязательные поля формы.', 'error');
    form.querySelector('.is-invalid input, .is-invalid select, .is-invalid textarea')?.focus();
    return;
  }

  const webhookUrl = form.getAttribute('action')?.trim();

  if (!webhookUrl) {
    setStatus('Форма заполнена корректно. Для отправки заявки необходимо подключить webhook Make.com в атрибуте action.', 'info');
    return;
  }

  const submitButton = form.querySelector('button[type="submit"]');
  const defaultLabel = submitButton.textContent;
  submitButton.disabled = true;
  submitButton.textContent = 'Отправка…';

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      body: new FormData(form)
    });

    if (!response.ok) throw new Error('Request failed');

    form.reset();
    setStatus('Заявка отправлена. Благодарим за обращение.', 'success');
  } catch (error) {
    setStatus('Не удалось отправить заявку. Пожалуйста, повторите попытку позже.', 'error');
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = defaultLabel;
  }
});

document.querySelector('#current-year').textContent = new Date().getFullYear();
