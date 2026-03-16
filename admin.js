'use strict';

var ADMIN_PASSWORD = 'ADMIN2026';
var DATA_URL = './data/experts.json';
var DELETE_API_URL = 'https://functions.yandexcloud.net/d4epfrfrl5f9avgkm0h0';

var adminLoginBox = document.getElementById('adminLoginBox');
var adminPanel = document.getElementById('adminPanel');
var adminPassword = document.getElementById('adminPassword');
var adminLoginBtn = document.getElementById('adminLoginBtn');
var adminError = document.getElementById('adminError');
var adminStatus = document.getElementById('adminStatus');
var recordsList = document.getElementById('recordsList');
var recordsCount = document.getElementById('recordsCount');
var reloadRecordsBtn = document.getElementById('reloadRecordsBtn');
var emptyBox = document.getElementById('emptyBox');

var recordsCache = [];

function setStatus(text) {
  adminStatus.textContent = text || '';
}

function renderRecords(records) {
  recordsList.innerHTML = '';
  recordsCount.textContent = 'Записей: ' + records.length;

  if (!records.length) {
    emptyBox.classList.remove('hidden');
    return;
  }

  emptyBox.classList.add('hidden');

  records.forEach(function (record, index) {
    var card = document.createElement('article');
    card.className = 'record-card';

    var name = record.expert_name || 'Без имени';
    var role = record.role || '—';
    var profile = record.profile || '—';
    var binaryString = record.binary_string || '';
    var comment = record.comment || '—';
    var createdAt = record.created_at || '—';

    card.innerHTML = [
      '<div class="record-head">',
        '<div>',
          '<h3 class="record-name">' + escapeHtml(name) + '</h3>',
          '<div class="record-meta">',
            '<span class="record-chip">' + escapeHtml(role) + '</span>',
            '<span class="record-chip">' + escapeHtml(profile) + '</span>',
          '</div>',
        '</div>',
      '</div>',
      '<div class="record-grid">',
        '<div class="record-row"><strong>Бинарная строка</strong><code>' + escapeHtml(binaryString) + '</code></div>',
        '<div class="record-row"><strong>Комментарий</strong><span>' + escapeHtml(comment) + '</span></div>',
        '<div class="record-row"><strong>Дата добавления</strong><span>' + escapeHtml(createdAt) + '</span></div>',
      '</div>',
      '<div class="record-actions">',
        '<button class="danger-btn" type="button" data-index="' + index + '">Удалить</button>',
      '</div>'
    ].join('');

    recordsList.appendChild(card);
  });

  recordsList.querySelectorAll('.danger-btn').forEach(function (button) {
    button.addEventListener('click', function () {
      var index = Number(button.getAttribute('data-index'));
      deleteRecord(index, button);
    });
  });
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function loadRecords() {
  setStatus('Загружаю записи...');
  fetch(DATA_URL + '?t=' + Date.now(), { cache: 'no-store' })
    .then(function (response) {
      if (!response.ok) {
        throw new Error('Не удалось загрузить файл experts.json');
      }
      return response.json();
    })
    .then(function (data) {
      if (!Array.isArray(data)) {
        throw new Error('Файл experts.json имеет неверный формат');
      }
      recordsCache = data;
      renderRecords(recordsCache);
      setStatus('Записи загружены.');
    })
    .catch(function (error) {
      setStatus('');
      adminError.textContent = error.message;
    });
}

function deleteRecord(index, button) {
  if (!DELETE_API_URL || DELETE_API_URL === 'PASTE_DELETE_FUNCTION_URL_HERE') {
    adminError.textContent = 'Сначала нужно вставить адрес delete-функции в admin.js';
    return;
  }

  var record = recordsCache[index];
  if (!record) {
    adminError.textContent = 'Запись не найдена.';
    return;
  }

  button.disabled = true;
  adminError.textContent = '';
  setStatus('Удаляю запись...');

  fetch(DELETE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      admin_password: ADMIN_PASSWORD,
      binary_string: record.binary_string
    })
  })
    .then(function (response) {
      return response.json().then(function (data) {
        return { ok: response.ok, data: data };
      });
    })
    .then(function (result) {
      if (!result.ok || !result.data.ok) {
        throw new Error(result.data.error || 'Не удалось удалить запись');
      }

      recordsCache.splice(index, 1);
      renderRecords(recordsCache);
      setStatus('Запись удалена.');
    })
    .catch(function (error) {
      adminError.textContent = error.message;
      setStatus('');
      button.disabled = false;
    });
}

adminLoginBtn.addEventListener('click', function () {
  adminError.textContent = '';

  if (adminPassword.value.trim() !== ADMIN_PASSWORD) {
    adminError.textContent = 'Неверный пароль.';
    return;
  }

  adminLoginBox.classList.add('hidden');
  adminPanel.classList.remove('hidden');
  loadRecords();
});

reloadRecordsBtn.addEventListener('click', function () {
  adminError.textContent = '';
  loadRecords();
});
