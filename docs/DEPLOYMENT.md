# Развертывание Claude Phone Agent

## Предварительные требования

- VPS с Ubuntu 22.04 или выше
- Минимум 2 CPU, 4GB RAM
- Docker и Docker Compose
- Доменное имя с SSL сертификатом
- Открытые порты: 80, 443

## Шаг 1: Подготовка сервера

### 1.1 Обновление системы

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git nano htop
```

### 1.2 Установка Docker

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

### 1.3 Установка Docker Compose

```bash
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

## Шаг 2: Клонирование репозитория

```bash
cd /opt
sudo git clone https://github.com/Sergeilipiev/claude-phone-agent-uis.git
cd claude-phone-agent-uis
sudo chown -R $USER:$USER .
```

## Шаг 3: Настройка окружения

### 3.1 Создание .env файла

```bash
cp .env.example .env
nano .env
```

Отредактируйте все необходимые параметры.

### 3.2 Создание директорий

```bash
mkdir -p logs credentials ssl
```

### 3.3 Настройка nginx.conf

Отредактируйте `nginx.conf` и замените `your-domain.com` на ваш домен.

## Шаг 4: SSL сертификаты

### 4.1 Установка Certbot

```bash
sudo apt install -y certbot
```

### 4.2 Получение сертификата

```bash
sudo certbot certonly --standalone -d your-domain.com
```

### 4.3 Копирование сертификатов

```bash
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ssl/key.pem
sudo chmod 644 ssl/cert.pem
sudo chmod 600 ssl/key.pem
```

## Шаг 5: Загрузка сервисных аккаунтов

### 5.1 Google Cloud креденшалы

Если используете Google STT/TTS:

```bash
# Скопируйте ваш JSON ключ в credentials/
nano credentials/google-credentials.json
```

### 5.2 MCP конфигурация

Скопируйте ваш claude_desktop_config.json:

```bash
# На локальной машине
scp "/Users/admin/Library/Application Support/Claude/claude_desktop_config.json" user@your-server:/opt/claude-phone-agent-uis/credentials/
```

## Шаг 6: Запуск приложения

### 6.1 Сборка и запуск

```bash
docker-compose up -d --build
```

### 6.2 Проверка статуса

```bash
docker-compose ps
docker-compose logs -f app
```

### 6.3 Проверка health check

```bash
curl https://your-domain.com/health
```

## Шаг 7: Настройка автозапуска

### 7.1 Systemd сервис

Создайте файл `/etc/systemd/system/claude-phone-agent.service`:

```ini
[Unit]
Description=Claude Phone Agent
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/claude-phone-agent-uis
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
```

### 7.2 Активация сервиса

```bash
sudo systemctl enable claude-phone-agent
sudo systemctl start claude-phone-agent
```

## Шаг 8: Мониторинг

### 8.1 Логи

```bash
# Просмотр логов приложения
tail -f logs/app.log

# Docker логи
docker-compose logs -f
```

### 8.2 Метрики

Используйте API endpoints для мониторинга:

```bash
# Статистика звонков
curl https://your-domain.com/api/stats/calls

# Статистика MCP
curl https://your-domain.com/api/stats/mcp
```

## Шаг 9: Резервное копирование

### 9.1 Настройка бэкапов

Создайте скрипт `/opt/claude-phone-agent-uis/backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/backups/claude-phone-agent"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Бэкап базы данных
docker exec claude-postgres pg_dump -U claude claude_phone_agent > $BACKUP_DIR/db_$DATE.sql

# Бэкап логов
tar -czf $BACKUP_DIR/logs_$DATE.tar.gz /opt/claude-phone-agent-uis/logs/

# Удаление старых бэкапов (старше 30 дней)
find $BACKUP_DIR -type f -mtime +30 -delete
```

### 9.2 Cron задание

```bash
sudo crontab -e
# Добавьте:
0 3 * * * /opt/claude-phone-agent-uis/backup.sh
```

## Шаг 10: Обновление

### 10.1 Обновление кода

```bash
cd /opt/claude-phone-agent-uis
git pull
docker-compose up -d --build
```

### 10.2 Обновление SSL

Настройте автообновление:

```bash
sudo certbot renew --quiet
```

## Устранение неполадок

### Приложение не запускается

```bash
# Проверьте логи
docker-compose logs app

# Проверьте .env
grep -E '(API_KEY|TOKEN)' .env
```

### Ошибки связи с базой

```bash
# Проверьте доступность
docker exec -it claude-postgres psql -U claude -d claude_phone_agent
```

### Webhook не доходят

```bash
# Проверьте nginx
docker logs claude-nginx

# Проверьте фаервол
sudo ufw status
```

## Безопасность

### Firewall

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### Fail2ban

```bash
sudo apt install fail2ban
sudo systemctl enable fail2ban
```

### Ограничение доступа

В nginx.conf можно добавить:

```nginx
# Ограничение по IP
allow 1.2.3.4;  # UIS IP
deny all;
```
