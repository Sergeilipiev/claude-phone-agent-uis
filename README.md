# Claude Phone Agent с UIS АТС

Телефонный агент на базе Claude с интеграцией российской АТС UIS и полной поддержкой MCP серверов.

## Архитектура

```
UIS Webhook → Node.js Middleware → Claude API → MCP Servers → UIS API
```

## Возможности

- 🔥 **Полноценный Claude по телефону** - весь функционал Claude доступен через обычный звонок
- 🛠 **Полная поддержка MCP** - доступ ко всем MCP серверам (GitHub, Notion, Memory, Browser и др.)
- 📞 **Интеграция с UIS АТС** - использование российской виртуальной АТС
- 🎯 **Реальное время** - обработка разговора в режиме реального времени
- 🌐 **Webhook интеграция** - получение событий звонка через webhooks
- 🎤 **STT/TTS** - преобразование речи в текст и обратно
- 📊 **Аналитика** - полная статистика звонков через UIS

## Требования

- Node.js 18+
- Аккаунт UIS с API доступом
- Claude API ключ
- Настроенные MCP серверы
- STT/TTS сервисы (Google Cloud Speech, Yandex SpeechKit или др.)

## Установка

1. Клонируйте репозиторий:
```bash
git clone https://github.com/Sergeilipiev/claude-phone-agent-uis.git
cd claude-phone-agent-uis
```

2. Установите зависимости:
```bash
npm install
```

3. Скопируйте и настройте конфигурацию:
```bash
cp .env.example .env
```

4. Настройте переменные окружения в `.env`

5. Запустите сервер:
```bash
npm start
```

## Настройка UIS

1. В личном кабинете UIS перейдите в **Администратор → Аккаунт → Правила и настройки безопасности**
2. Добавьте IP вашего сервера в белый список API
3. Создайте webhook уведомление:
   - Перейдите в **Сервисы и статистика → Уведомления**
   - Добавьте новое уведомление
   - Выберите событие "Поднятие трубки"
   - Укажите URL вашего сервера: `https://your-server.com/webhook/uis`

## Конфигурация

Все настройки находятся в файле `.env`:

```env
# UIS API
UIS_API_TOKEN=your_token
UIS_API_URL=https://dataapi.uiscom.ru/v2.0
UIS_USER_ID=your_user_id

# Claude API
CLAUDE_API_KEY=your_claude_key
CLAUDE_MODEL=claude-3-opus-20240229

# MCP Configuration
MCP_CONFIG_PATH=/path/to/claude_desktop_config.json

# STT/TTS
STT_PROVIDER=google # или yandex
TTS_PROVIDER=google # или yandex
GOOGLE_CLOUD_CREDENTIALS=/path/to/credentials.json

# Server
PORT=3000
WEBHOOK_SECRET=your_webhook_secret
```

## API Endpoints

### Webhook для UIS
- `POST /webhook/uis` - Принимает уведомления от UIS о событиях звонка

### Управление звонками
- `POST /call/answer` - Ответить на звонок
- `POST /call/transfer` - Перевести звонок
- `POST /call/hangup` - Завершить звонок
- `GET /call/:id/recording` - Получить запись звонка

### Статистика
- `GET /stats/calls` - Статистика звонков
- `GET /stats/mcp` - Статистика использования MCP

## Архитектура проекта

```
├── src/
│   ├── controllers/      # Контроллеры для обработки запросов
│   ├── services/         # Бизнес-логика
│   │   ├── uis/         # Интеграция с UIS API
│   │   ├── claude/      # Интеграция с Claude API
│   │   ├── mcp/         # Работа с MCP серверами
│   │   ├── stt/         # Speech-to-Text
│   │   └── tts/         # Text-to-Speech
│   ├── middleware/       # Express middleware
│   ├── utils/           # Утилиты
│   └── app.js           # Основной файл приложения
├── config/              # Конфигурационные файлы
├── tests/               # Тесты
├── .env.example         # Пример конфигурации
├── package.json         # Зависимости
└── README.md           # Этот файл
```

## Примеры использования

### Базовый сценарий звонка

1. Пользователь звонит на номер UIS
2. UIS отправляет webhook на наш сервер
3. Сервер принимает звонок и начинает запись
4. Речь пользователя преобразуется в текст
5. Текст отправляется в Claude API с контекстом MCP
6. Claude генерирует ответ, используя доступные MCP инструменты
7. Ответ преобразуется в речь и передается пользователю
8. Процесс повторяется до завершения звонка

### Примеры команд через телефон

- "Создай задачу в Notion о встрече завтра в 15:00"
- "Найди в моих файлах отчет за прошлый месяц"
- "Отправь email Ивану с напоминанием о проекте"
- "Проверь мой календарь на следующую неделю"
- "Создай pull request с исправлениями в репозитории"

## Безопасность

- Все webhook запросы проверяются по секретному ключу
- API ключи хранятся в переменных окружения
- Поддержка IP whitelist для UIS API
- Логирование всех операций
- Шифрование записей разговоров

## Разработка

### Запуск в режиме разработки
```bash
npm run dev
```

### Запуск тестов
```bash
npm test
```

### Линтинг
```bash
npm run lint
```

## Развертывание

Рекомендуется использовать:
- PM2 для управления процессами
- Nginx как reverse proxy
- Let's Encrypt для SSL сертификатов
- Docker для контейнеризации

## Поддержка

Если у вас есть вопросы или предложения:
- Создайте issue в этом репозитории
- Отправьте pull request с улучшениями

## Лицензия

MIT

## Автор

Сергей Липьев
