'use strict';
console.log('admin.js v12 loaded');
console.log('ADMIN_PASSWORD from js =', ADMIN_PASSWORD);

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

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
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

function loadRecords() {
  adminError.textContent = '';
  setStatus('Загружаю записи...');

  fetch(DATA_URL + '?t=' + Date.now(), { cache: 'no-store' })
    .then(function (response) {
      if (!response.ok) {
        throw new Error('Не удалось загрузить experts.json');
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
  if (!DELETE_API_URL || DELETE_API_URL === 'ВСТАВЬ_СЮДА_URL_DELETE_ФУНКЦИИ') {
    adminError.textContent = 'Не вставлен URL delete-функции в admin.js';
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

  var formBody = new URLSearchParams();
  formBody.append('admin_password', ADMIN_PASSWORD);
  formBody.append('created_at', record.created_at || '');

fetch(DELETE_API_URL, {
  method: 'POST',
  body: formBody
})
    .then(function (response) {
      return response.text().then(function (text) {
        var data = {};
        try {
          data = text ? JSON.parse(text) : {};
        } catch (e) {
          data = {};
        }
        return { ok: response.ok, status: response.status, data: data };
      });
    })
    .then(function (result) {
      if (!result.ok || !result.data.ok) {
        throw new Error(result.data.error || ('Ошибка удаления. Код: ' + result.status));
      }

      recordsCache.splice(index, 1);
      renderRecords(recordsCache);
      setStatus('Запись удалена.');

      setTimeout(function () {
        loadRecords();
      }, 500);
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
  loadRecords();
});
