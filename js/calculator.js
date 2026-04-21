// ========== КАЛЬКУЛЯТОР ПРОЦЕСУАЛЬНИХ СТРОКІВ ==========
// Автор: LexCalc
// Версія: 2.0 (з правильними посиланнями на статті)

// Фіксовані свята України
const FIXED_HOLIDAYS = [
  '01-01', // Новий рік
  '01-07', // Різдво Христове
  '03-08', // Міжнародний жіночий день
  '05-01', // День праці
  '05-09', // День перемоги
  '06-28', // День Конституції
  '08-24', // День Незалежності
  '10-14', // День захисників і захисниць
  '12-25', // Різдво (західне)
];

// Функція для отримання дати Великодня (алгоритм Гаусса)
function getEasterDate(year) {
  const a = year % 19;
  const b = year % 4;
  const c = year % 7;
  const d = (19 * a + 15) % 30;
  const e = (2 * b + 4 * c + 6 * d + 6) % 7;
  const day = d + e + 4;

  if (day <= 30) {
    return new Date(year, 3, day); // Квітень
  } else {
    return new Date(year, 4, day - 30); // Травень
  }
}

// Перевірка, чи є день святковим
function isHoliday(date) {
  const monthDay = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

  // Фіксовані свята
  if (FIXED_HOLIDAYS.includes(monthDay)) return true;

  // Великдень та понеділок після Великодня
  const year = date.getFullYear();
  const easter = getEasterDate(year);
  if (date.toDateString() === easter.toDateString()) return true;

  const easterMonday = new Date(easter);
  easterMonday.setDate(easter.getDate() + 1);
  if (date.toDateString() === easterMonday.toDateString()) return true;

  return false;
}

// Перевірка, чи є день вихідним (субота або неділя)
function isWeekend(date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

// ГОЛОВНА ФУНКЦІЯ: додає календарні дні, потім переносить дедлайн на робочий день
function calculateDeadline(startDate, calendarDays) {
  let deadline = new Date(startDate);
  deadline.setDate(deadline.getDate() + calendarDays);

  // Переносимо дедлайн, якщо він припав на вихідний або свято
  while (isWeekend(deadline) || isHoliday(deadline)) {
    deadline.setDate(deadline.getDate() + 1);
  }

  return deadline;
}

// Форматування дати для відображення (ДД.ММ.РРРР)
function formatDate(date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

// Форматування дати для збереження (РРРР-ММ-ДД)
function formatDateForStorage(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Різниця в днях між двома датами
function getDaysDifference(date1, date2) {
  const diffTime = date2 - date1;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Кількість днів залежно від типу процесу та документа
function getDocumentDays(processType, documentType) {
  const rules = {
    civil: { appeal: 30, cassation: 30, writ: 3 }, // ЦПК
    criminal: { appeal: 30, cassation: 30, writ: 3 }, // КПК
    admin: { appeal: 30, cassation: 30, writ: 3 }, // КАС
    economic: { appeal: 20, cassation: 30, writ: 3 }, // ГПК
  };
  return rules[processType]?.[documentType] || 30;
}

// Отримання назви типу процесу
function getProcessTypeName(processType) {
  const names = {
    civil: 'Цивільний',
    criminal: 'Кримінальний',
    admin: 'Адміністративний',
    economic: 'Господарський',
  };
  return names[processType] || processType;
}

// Отримання назви типу документа
function getDocumentTypeName(documentType) {
  const names = {
    appeal: 'Апеляційна скарга',
    cassation: 'Касаційна скарга',
    writ: 'Виконавчий лист',
  };
  return names[documentType] || documentType;
}

// ПРАВИЛЬНІ СТАТТІ ДЛЯ ПЕРЕНЕСЕННЯ СТРОКІВ (підтверджено)
function getArticleReference(processType) {
  const articles = {
    civil: 'ст. 124 ЦПК України',
    criminal: 'ст. 115 КПК України',
    admin: 'ст. 120 КАС України',
    economic: 'ст. 116 ГПК України',
  };
  return articles[processType] || 'відповідною статтею процесуального кодексу';
}

// Повідомлення (toast)
function showToast(message, isError = false) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.style.borderLeftColor = isError ? '#ef4444' : '#10b981';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ========== РОБОТА З ІСТОРІЄЮ ==========

function saveToHistory(calculation) {
  const history = getHistory();
  history.unshift(calculation);
  if (history.length > 50) history.pop();
  localStorage.setItem('lexcalc_history', JSON.stringify(history));
  showToast('✅ Розрахунок збережено в історію');
}

function getHistory() {
  const saved = localStorage.getItem('lexcalc_history');
  return saved ? JSON.parse(saved) : [];
}

function deleteHistoryItem(index) {
  const history = getHistory();
  history.splice(index, 1);
  localStorage.setItem('lexcalc_history', JSON.stringify(history));
  renderHistoryList();
  showToast('🗑️ Запис видалено');
}

function clearAllHistory() {
  localStorage.removeItem('lexcalc_history');
  renderHistoryList();
  showToast('🗑️ Всю історію очищено');
}

function renderHistoryList() {
  const historyList = document.getElementById('historyList');
  const history = getHistory();

  if (history.length === 0) {
    historyList.innerHTML =
      '<p class="empty-history">📭 Історія порожня. Збережіть перший розрахунок!</p>';
    return;
  }

  historyList.innerHTML = history
    .map(
      (item, index) => `
        <div class="history-item">
            <div class="history-item-info">
                <div class="history-item-date">📅 ${item.deadlineDate}</div>
                <div class="history-item-details">
                    ${item.processType} • ${item.documentType}<br>
                    Старт: ${item.startDate} • ${item.daysToAdd} днів
                </div>
            </div>
            <div class="history-item-actions">
                <button class="history-delete-btn" data-index="${index}" title="Видалити">🗑️</button>
            </div>
        </div>
    `,
    )
    .join('');

  document.querySelectorAll('.history-delete-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      const index = parseInt(btn.dataset.index);
      deleteHistoryItem(index);
    });
  });
}

function openHistoryModal() {
  renderHistoryList();
  document.getElementById('historyModal').style.display = 'flex';
}

function closeHistoryModal() {
  document.getElementById('historyModal').style.display = 'none';
}

// ========== ГОЛОВНА ФУНКЦІЯ ПРИ ЗАВАНТАЖЕННІ ==========

document.addEventListener('DOMContentLoaded', () => {
  // ТЕМНА ТЕМА
  const themeToggle = document.getElementById('themeToggle');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const savedTheme = localStorage.getItem('theme');

  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    document.body.classList.add('dark');
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      document.body.classList.toggle('dark');
      localStorage.setItem(
        'theme',
        document.body.classList.contains('dark') ? 'dark' : 'light',
      );
    });
  }

  // Воєнний стан підказка
  const martialLawCheck = document.getElementById('martialLaw');
  const martialLawHint = document.getElementById('martialLawHint');

  if (martialLawCheck && martialLawHint) {
    martialLawCheck.addEventListener('change', () => {
      martialLawHint.style.display = martialLawCheck.checked ? 'block' : 'none';
    });
  }

  // Елементи форми
  const form = document.getElementById('deadlineForm');
  const resultDiv = document.getElementById('result');
  const resultDateSpan = document.getElementById('resultDate');
  const daysLeftSpan = document.getElementById('daysLeft');
  const calculationNote = document.getElementById('calculationNote');
  const resetBtn = document.getElementById('resetBtn');
  const copyDateBtn = document.getElementById('copyDateBtn');
  const printBtn = document.getElementById('printBtn');
  const saveHistoryBtn = document.getElementById('saveHistoryBtn');
  const historyBtn = document.getElementById('historyBtn');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const clearHistoryBtn = document.getElementById('clearHistoryBtn');

  let lastCalculation = null;

  // ОБРОБКА ФОРМИ
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();

      const startDateInput = document.getElementById('startDate').value;
      const processType = document.getElementById('processType').value;
      const documentType = document.getElementById('documentType').value;
      const martialLaw = document.getElementById('martialLaw').checked;

      if (!startDateInput) {
        alert('Будь ласка, оберіть дату отримання рішення');
        return;
      }

      const startDate = new Date(startDateInput);
      const daysToAdd = getDocumentDays(processType, documentType);
      const articleRef = getArticleReference(processType);
      const processTypeName = getProcessTypeName(processType);
      const documentTypeName = getDocumentTypeName(documentType);

      const deadlineDate = calculateDeadline(startDate, daysToAdd);

      // Формуємо текст пояснення з правильним посиланням на статтю
      let calculationText = '';
      if (martialLaw) {
        calculationText = `⚠️ Увімкнено режим воєнного стану. Рекомендуємо перевірити актуальні роз'яснення щодо зупинення процесуальних строків.<br><br>`;
      }

      calculationText += `📅 ${processTypeName} процес: ${documentTypeName} має бути подана протягом ${daysToAdd} календарних днів з дня отримання рішення.<br><br>`;
      calculationText += `📌 Якщо останній день строку припадає на вихідний, святковий або інший неробочий день — строк закінчується в перший робочий день (${articleRef}).`;

      // Розрахунок кількості днів, що залишилися
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const daysLeft = getDaysDifference(today, deadlineDate);

      let daysLeftText = '';
      if (daysLeft < 0) {
        daysLeftText = `⚠️ Строк пропущено на ${Math.abs(daysLeft)} днів`;
      } else if (daysLeft === 0) {
        daysLeftText = `⚠️ Сьогодні останній день!`;
      } else {
        daysLeftText = `Залишилось ${daysLeft} днів`;
      }

      // Відображення результатів
      if (resultDateSpan) resultDateSpan.textContent = formatDate(deadlineDate);
      if (daysLeftSpan) daysLeftSpan.textContent = daysLeftText;
      if (calculationNote) calculationNote.innerHTML = calculationText;

      lastCalculation = {
        startDate: formatDate(startDate),
        deadlineDate: formatDate(deadlineDate),
        processType: processTypeName,
        documentType: documentTypeName,
        daysToAdd: daysToAdd,
        martialLaw: martialLaw,
        startDateRaw: startDateInput,
        deadlineDateRaw: formatDateForStorage(deadlineDate),
      };

      if (resultDiv) resultDiv.style.display = 'block';
      resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }

  // КОПІЮВАННЯ ДАТИ
  if (copyDateBtn) {
    copyDateBtn.addEventListener('click', () => {
      const dateText = resultDateSpan?.textContent || '';
      if (dateText) {
        navigator.clipboard
          .writeText(dateText)
          .then(() => {
            showToast('📋 Дату скопійовано: ' + dateText);
          })
          .catch(() => {
            showToast('❌ Не вдалося скопіювати', true);
          });
      }
    });
  }

  // ДРУК
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      const printContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>LexCalc - Результат розрахунку</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 2rem; }
                        h1 { color: #3b82f6; }
                        .result { margin-top: 2rem; padding: 1rem; border: 1px solid #ccc; border-radius: 8px; }
                        .date { font-size: 2rem; font-weight: bold; color: #2563eb; margin: 1rem 0; }
                    </style>
                </head>
                <body>
                    <h1>LexCalc — Калькулятор процесуальних строків</h1>
                    <p><strong>Дата розрахунку:</strong> ${new Date().toLocaleDateString('uk-UA')}</p>
                    <p><strong>Останній день подання:</strong></p>
                    <div class="date">${resultDateSpan?.textContent || ''}</div>
                    <p>${daysLeftSpan?.textContent || ''}</p>
                    <hr>
                    <p><small>${calculationNote?.innerHTML.replace(/<br>/g, ' ') || ''}</small></p>
                    <p><small>© LexCalc — безкоштовний інструмент для адвокатів</small></p>
                </body>
                </html>
            `;
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.print();
      }
    });
  }

  // ЗБЕРЕЖЕННЯ В ІСТОРІЮ
  if (saveHistoryBtn) {
    saveHistoryBtn.addEventListener('click', () => {
      if (lastCalculation) {
        saveToHistory(lastCalculation);
      } else {
        showToast('❌ Немає розрахунку для збереження', true);
      }
    });
  }

  // ВІДКРИТТЯ ІСТОРІЇ
  if (historyBtn) historyBtn.addEventListener('click', openHistoryModal);
  if (closeModalBtn) closeModalBtn.addEventListener('click', closeHistoryModal);

  window.addEventListener('click', e => {
    const modal = document.getElementById('historyModal');
    if (e.target === modal) closeHistoryModal();
  });

  // ОЧИЩЕННЯ ІСТОРІЇ
  if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener('click', () => {
      if (confirm('Очистити всю історію?')) clearAllHistory();
    });
  }

  // СКИДАННЯ ФОРМИ
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (form) form.reset();
      if (resultDiv) resultDiv.style.display = 'none';
      lastCalculation = null;
      const startDateInput = document.getElementById('startDate');
      if (startDateInput) startDateInput.value = '';
      if (startDateInput) startDateInput.focus();
    });
  }

  // Інпут дати — порожній за замовчуванням
  const startDateInput = document.getElementById('startDate');
  if (startDateInput) startDateInput.value = '';
});

// ========== ТЕСТОВІ ФУНКЦІЇ ДЛЯ КОНСОЛІ ==========

window.testDeadline = function (startDateStr, processType, documentType) {
  const start = new Date(startDateStr);
  const days = getDocumentDays(processType, documentType);
  const deadline = calculateDeadline(start, days);
  const article = getArticleReference(processType);
  console.log(
    `${formatDate(start)} + ${days} календарних днів = ${formatDate(deadline)}`,
  );
  console.log(`Правило перенесення: ${article}`);
  return formatDate(deadline);
};
